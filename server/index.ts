import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Create a new Express application instance
const app = express();
// Add middleware to parse JSON request bodies (for API requests)
app.use(express.json());
// Add middleware to parse URL-encoded form data (for form submissions)
app.use(express.urlencoded({ extended: false }));

// Custom middleware for API request logging
app.use((req, res, next) => {
  // Record the start time to measure request duration
  const start = Date.now();
  const path = req.path;
  // Variable to store the response body for logging purposes
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Override the res.json method to capture the response body before sending
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    // Store the response body for logging
    capturedJsonResponse = bodyJson;
    // Call the original json method with the same arguments
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Set up a listener for when the response is finished
  res.on("finish", () => {
    // Calculate how long the request took to process
    const duration = Date.now() - start;
    // Only log API requests (paths starting with /api)
    if (path.startsWith("/api")) {
      // Create log line with method, path, status code, and duration
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // Add response body to log if it exists
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Truncate long log lines to keep logs readable
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      // Output the log line
      log(logLine);
    }
  });

  // Continue to the next middleware
  next();
});

// Immediately invoked async function to set up the server
(async () => {
  // Register all API routes and get the HTTP server instance
  const server = await registerRoutes(app);

  // Global error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Get error status code or default to 500
    const status = err.status || err.statusCode || 500;
    // Get error message or use default
    const message = err.message || "Internal Server Error";

    // Send error response to client
    res.status(status).json({ message });
    // Re-throw error for logging/debugging
    throw err;
  });

  // Development vs Production environment handling
  if (app.get("env") === "development") {
    // In development: Set up Vite dev server for hot module replacement
    await setupVite(app, server);
  } else {
    // In production: Serve static files from the dist directory
    serveStatic(app);
  }

  // Server configuration
  const port = 5000;
  // Start the server
  server.listen(
    {
      port,
      // Listen on all network interfaces
      host: "0.0.0.0",
      // Allow port reuse (useful for quick restarts)
      reusePort: true,
    },
    () => {
      // Log that the server is running
      log(`serving on port ${port}`);
    }
  );
})();
