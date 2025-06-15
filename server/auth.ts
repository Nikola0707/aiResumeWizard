import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
// Crypto functions for secure password handling
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
// Storage and type definitions
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import admin from "./firebase-admin";
import { sendSlackNotification } from "./slack-notifications";

// Extend Express User type to include my custom user properties
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Convert scrypt to promise-based for async/await usage
const scryptAsync = promisify(scrypt);

// Securely hash passwords using scrypt with a random salt
async function hashPassword(password: string) {
  // Generate a random 16-byte salt
  const salt = randomBytes(16).toString("hex");
  // Hash the password with the salt
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  // Return the hash and salt concatenated with a dot
  return `${buf.toString("hex")}.${salt}`;
}

// Compare a supplied password with a stored hash
async function comparePasswords(supplied: string, stored: string) {
  // Split the stored hash into hash and salt
  const [hashed, salt] = stored.split(".");
  // Convert stored hash to buffer
  const hashedBuf = Buffer.from(hashed, "hex");
  // Hash the supplied password with the same salt
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  // Compare hashes using timing-safe comparison
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Handle Firebase authentication for social login
async function handleFirebaseAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Firebase ID token is required" });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // Check if user exists in our database
    let user = await storage.getUserByUsername(uid);

    if (!user) {
      // Create new user if they don't exist
      // Generate a random 32-character password as social login users won't use it
      const randomPassword = randomBytes(16).toString("hex");
      const hashedPassword = await hashPassword(randomPassword);

      user = await storage.createUser({
        username: uid,
        password: hashedPassword,
        email: email || `${uid}@firebase.com`, // Email may not always be available
        name: name || "Firebase User",
      });

      // Notify about new user registration
      await sendSlackNotification(user);
    }

    // Log the user in
    req.login(user, (err) => {
      if (err) return next(err);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    });
  } catch (error) {
    console.error("Firebase authentication error:", error);
    return res.status(401).json({ message: "Invalid Firebase token" });
  }
}

// Main authentication setup function
export function setupAuth(app: Express) {
  // Get session secret from environment or use default
  const sessionSecret =
    process.env.SESSION_SECRET || "resume-builder-secret-key";

  // Configure session settings
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  };

  // Configure Express for proxy trust and session handling
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local authentication strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );

  // Configure user serialization/deserialization
  // Serialization converts user object to a simple ID for storage in the session
  // Deserialization retrieves the full user object from the database using that ID
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // User registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create new user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Notify about new registration
      await sendSlackNotification(user);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Log the user in after registration
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // User login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate(
      "local",
      (
        err: Error | null,
        user: SelectUser | false,
        info: { message: string }
      ) => {
        if (err) return next(err);
        if (!user)
          return res.status(401).json({ message: "Invalid credentials" });

        // Log the user in
        req.login(user, (err) => {
          if (err) return next(err);

          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      }
    )(req, res, next);
  });

  // Firebase authentication endpoint
  app.post("/api/auth/firebase", handleFirebaseAuth);

  // User logout endpoint
  app.post("/api/logout", (req, res, next) => {
    // Logout from passport
    req.logout(() => {
      // Destroy the session
      req.session.destroy((err) => {
        if (err) return next(err);

        // Clear session cookie with security settings
        res.clearCookie("connect.sid", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          domain:
            process.env.NODE_ENV === "production" ? undefined : "localhost",
        });

        // Set cache control headers to prevent caching
        // Set cache control headers to prevent browsers and proxies from caching the response
        res.set({
          // no-store: Don't store the response at all
          // no-cache: Must revalidate with server before using cached version
          // must-revalidate: Cache must check with server if cached version is still valid
          // proxy-revalidate: Same as must-revalidate but for shared caches/proxies
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          // Legacy HTTP/1.0 header for backward compatibility
          Pragma: "no-cache",
          // Sets expiration date to the past, forcing immediate expiration
          Expires: "0",
        });

        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Remove password from response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}