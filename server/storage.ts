import {
  type User,
  type InsertUser,
  type Resume,
  type InsertResume,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { usersCollection, resumesCollection } from "./firestore-db";
import { FieldValue } from "firebase-admin/firestore";

const MemoryStore = createMemoryStore(session);

// Define what operations our storage system must support
// This is like a contract that any storage implementation must follow
export interface IStorage {
  // User-related operations
  getUser(id: number): Promise<User | undefined>; // Get a user by their ID
  getUserByUsername(username: string): Promise<User | undefined>; // Find a user by their username
  createUser(user: InsertUser): Promise<User>; // Create a new user
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>; // Update user information

  // Resume-related operations
  getResume(id: number): Promise<Resume | undefined>; // Get a resume by its ID
  getResumesByUserId(userId: number): Promise<Resume[]>; // Get all resumes for a specific user
  createResume(resume: InsertResume): Promise<Resume>; // Create a new resume
  updateResume(
    id: number,
    resume: Partial<Resume>
  ): Promise<Resume | undefined>; // Update an existing resume
  deleteResume(id: number): Promise<boolean>; // Delete a resume
  incrementDownloads(id: number): Promise<boolean>; // Increase the download count for a resume
  updateAtsScore(id: number, score: number): Promise<boolean>; // Update the ATS score for a resume

  // Session store for keeping track of logged-in users
  sessionStore: session.Store;
}

// Implementation of storage using Google's Firestore database
export class FirestoreStorage implements IStorage {
  // Store for managing user sessions
  sessionStore: session.Store;
  // Counter for generating unique user IDs
  currentUserId: number = 1;
  // Counter for generating unique resume IDs
  currentResumeId: number = 1;

  constructor() {
    // Initialize session store with 6-hour cleanup interval
    // Periodically removes expired sessions to prevent memory leaks (every 6 hours)
    this.sessionStore = new MemoryStore({
      checkPeriod: 21600000, // 6 hours in milliseconds
    });
    // Set up the ID counters
    this.initCounters();
  }

  // Initialize the ID counters in Firestore
  private async initCounters() {
    try {
      // Get or create a document to store our counters
      const countersRef = usersCollection.doc("counters");
      const doc = await countersRef.get();
      if (!doc.exists) {
        // If no counters exist, create them with initial values
        await countersRef.set({
          userId: this.currentUserId,
          resumeId: this.currentResumeId,
        });
      } else {
        // If counters exist, load their values
        const data = doc.data();
        if (data) {
          this.currentUserId = data.userId || 1;
          this.currentResumeId = data.resumeId || 1;
        }
      }
    } catch (error) {
      console.error("Error initializing counters:", error);
      // If there's an error, continue with default values
    }
  }

  // Get the next available ID for users or resumes
  private async getNextId(counterName: "userId" | "resumeId"): Promise<number> {
    try {
      const countersRef = usersCollection.doc("counters");
      // Increment the appropriate counter
      const id =
        counterName === "userId"
          ? this.currentUserId++
          : this.currentResumeId++;

      // Update the counter in Firestore
      await countersRef.update({
        [counterName]: id + 1,
      });

      return id;
    } catch (error) {
      console.error(`Error getting next ${counterName}:`, error);
      // If there's an error, return the current value without updating Firestore
      return counterName === "userId"
        ? this.currentUserId++
        : this.currentResumeId++;
    }
  }

  // Convert a Firestore document to a User object
  private docToUser(doc: FirebaseFirestore.DocumentSnapshot): User | undefined {
    const data = doc.data();
    if (!data) return undefined;

    return {
      id: data.id,
      username: data.username,
      password: data.password,
      name: data.name,
      email: data.email,
      createdAt: data.createdAt?.toDate() || null,
    };
  }

  // Convert a Firestore document to a Resume object
  private docToResume(
    doc: FirebaseFirestore.DocumentSnapshot
  ): Resume | undefined {
    const data = doc.data();
    if (!data) return undefined;

    return {
      id: data.id,
      userId: data.userId,
      title: data.title,
      createdAt: data.createdAt?.toDate() || null,
      lastEdited: data.lastEdited?.toDate() || null,
      content: data.content,
      template: data.template,
      downloads: data.downloads || 0,
      atsScore: data.atsScore || null,
    };
  }

  // Get a user by their ID
  async getUser(id: number): Promise<User | undefined> {
    const userDoc = await usersCollection.doc(id.toString()).get();
    return this.docToUser(userDoc);
  }

  // Find a user by their username
  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await usersCollection
      .where("username", "==", username)
      .limit(1)
      .get();
    if (snapshot.empty) return undefined;
    return this.docToUser(snapshot.docs[0]);
  }

  // Create a new user
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = await this.getNextId("userId");
    const now = new Date();

    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name || null,
      email: insertUser.email || null,
      createdAt: now,
    };

    await usersCollection.doc(id.toString()).set(user);
    return user;
  }

  // Update an existing user's information
  async updateUser(
    id: number,
    userData: Partial<User>
  ): Promise<User | undefined> {
    const userRef = usersCollection.doc(id.toString());
    const userDoc = await userRef.get();

    if (!userDoc.exists) return undefined;

    await userRef.update(userData);
    const updatedUserDoc = await userRef.get();
    return this.docToUser(updatedUserDoc);
  }

  // Get a resume by its ID
  async getResume(id: number): Promise<Resume | undefined> {
    const resumeDoc = await resumesCollection.doc(id.toString()).get();
    if (!resumeDoc.exists) return undefined;
    return this.docToResume(resumeDoc);
  }

  // Get all resumes for a specific user
  async getResumesByUserId(userId: number): Promise<Resume[]> {
    const snapshot = await resumesCollection
      .where("userId", "==", userId)
      .orderBy("lastEdited", "desc")
      .get();

    return snapshot.docs
      .map((doc) => this.docToResume(doc))
      .filter((resume): resume is Resume => resume !== undefined);
  }

  // Create a new resume
  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = await this.getNextId("resumeId");
    const now = new Date();

    const resume: Resume = {
      id,
      userId: insertResume.userId,
      title: insertResume.title,
      createdAt: now,
      lastEdited: now,
      content: insertResume.content,
      template: insertResume.template,
      downloads: 0,
      atsScore: null,
    };

    await resumesCollection.doc(id.toString()).set(resume);
    return resume;
  }

  // Update an existing resume
  async updateResume(
    id: number,
    resumeData: Partial<Resume>
  ): Promise<Resume | undefined> {
    const resumeRef = resumesCollection.doc(id.toString());
    const resumeDoc = await resumeRef.get();

    if (!resumeDoc.exists) return undefined;

    // Update the lastEdited field
    const dataToUpdate = {
      ...resumeData,
      lastEdited: new Date(),
    };

    await resumeRef.update(dataToUpdate);
    const updatedResumeDoc = await resumeRef.get();
    return this.docToResume(updatedResumeDoc);
  }

  // Delete a resume
  async deleteResume(id: number): Promise<boolean> {
    const resumeRef = resumesCollection.doc(id.toString());
    const resumeDoc = await resumeRef.get();

    if (!resumeDoc.exists) return false;

    await resumeRef.delete();
    return true;
  }

  // Increase the download count for a resume
  async incrementDownloads(id: number): Promise<boolean> {
    const resumeRef = resumesCollection.doc(id.toString());
    const resumeDoc = await resumeRef.get();

    if (!resumeDoc.exists) return false;

    await resumeRef.update({
      downloads: FieldValue.increment(1),
    });

    return true;
  }

  // Update the ATS score for a resume
  async updateAtsScore(id: number, score: number): Promise<boolean> {
    const resumeRef = resumesCollection.doc(id.toString());
    const resumeDoc = await resumeRef.get();

    if (!resumeDoc.exists) return false;

    await resumeRef.update({
      atsScore: score,
    });

    return true;
  }
}

// Create and export a single instance of FirestoreStorage to be used throughout the application
export const storage = new FirestoreStorage();
