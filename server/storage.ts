import { type User, type InsertUser, type Resume, type InsertResume } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { usersCollection, resumesCollection } from "./firestore-db";
import { FieldValue } from 'firebase-admin/firestore';

const MemoryStore = createMemoryStore(session);

// Interface definition for storage operations
export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Resume related methods
  getResume(id: number): Promise<Resume | undefined>;
  getResumesByUserId(userId: number): Promise<Resume[]>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(id: number, resume: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: number): Promise<boolean>;
  incrementDownloads(id: number): Promise<boolean>;
  updateAtsScore(id: number, score: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.Store;
}

// In-memory storage implementation (for reference only)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resumes: Map<number, Resume>;
  sessionStore: session.Store;
  currentUserId: number;
  currentResumeId: number;

  constructor() {
    this.users = new Map();
    this.resumes = new Map();
    this.currentUserId = 1;
    this.currentResumeId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Resume related methods
  async getResume(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }

  async getResumesByUserId(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter(
      (resume) => resume.userId === userId,
    );
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = this.currentResumeId++;
    const now = new Date();
    const resume: Resume = {
      ...insertResume,
      id,
      lastEdited: now,
      createdAt: now,
      downloads: 0,
      atsScore: null,
    };
    this.resumes.set(id, resume);
    return resume;
  }

  async updateResume(id: number, resumeData: Partial<Resume>): Promise<Resume | undefined> {
    const resume = await this.getResume(id);
    if (!resume) return undefined;
    
    const updatedResume = { 
      ...resume, 
      ...resumeData,
      lastEdited: new Date(),
    };
    this.resumes.set(id, updatedResume);
    return updatedResume;
  }

  async deleteResume(id: number): Promise<boolean> {
    const exists = this.resumes.has(id);
    if (exists) {
      this.resumes.delete(id);
      return true;
    }
    return false;
  }

  async incrementDownloads(id: number): Promise<boolean> {
    const resume = await this.getResume(id);
    if (!resume) return false;
    
    const updatedResume = { 
      ...resume,
      downloads: (resume.downloads || 0) + 1,
    };
    this.resumes.set(id, updatedResume);
    return true;
  }

  async updateAtsScore(id: number, score: number): Promise<boolean> {
    const resume = await this.getResume(id);
    if (!resume) return false;
    
    const updatedResume = { 
      ...resume,
      atsScore: score,
    };
    this.resumes.set(id, updatedResume);
    return true;
  }
}

// Firestore storage implementation
export class FirestoreStorage implements IStorage {
  sessionStore: session.Store;
  currentUserId: number = 1;
  currentResumeId: number = 1;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    this.initCounters();
  }

  private async initCounters() {
    try {
      // Initialize counters for auto-incrementing IDs
      const countersRef = usersCollection.doc('counters');
      const doc = await countersRef.get();
      if (!doc.exists) {
        await countersRef.set({
          userId: this.currentUserId,
          resumeId: this.currentResumeId
        });
      } else {
        const data = doc.data();
        if (data) {
          this.currentUserId = data.userId || 1;
          this.currentResumeId = data.resumeId || 1;
        }
      }
    } catch (error) {
      console.error("Error initializing counters:", error);
      // Continue with default values
    }
  }

  private async getNextId(counterName: 'userId' | 'resumeId'): Promise<number> {
    try {
      const countersRef = usersCollection.doc('counters');
      const id = counterName === 'userId' ? this.currentUserId++ : this.currentResumeId++;
      
      // Update the counter in Firestore
      await countersRef.update({
        [counterName]: id + 1
      });
      
      return id;
    } catch (error) {
      console.error(`Error getting next ${counterName}:`, error);
      // Fallback to returning the current value without updating Firestore
      return counterName === 'userId' ? this.currentUserId++ : this.currentResumeId++;
    }
  }

  // Convert Firestore document to User type
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

  // Convert Firestore document to Resume type
  private docToResume(doc: FirebaseFirestore.DocumentSnapshot): Resume | undefined {
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

  async getUser(id: number): Promise<User | undefined> {
    const userDoc = await usersCollection.doc(id.toString()).get();
    return this.docToUser(userDoc);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await usersCollection.where('username', '==', username).limit(1).get();
    if (snapshot.empty) return undefined;
    return this.docToUser(snapshot.docs[0]);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = await this.getNextId('userId');
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

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const userRef = usersCollection.doc(id.toString());
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) return undefined;
    
    await userRef.update(userData);
    const updatedUserDoc = await userRef.get();
    return this.docToUser(updatedUserDoc);
  }

  async getResume(id: number): Promise<Resume | undefined> {
    const resumeDoc = await resumesCollection.doc(id.toString()).get();
    if (!resumeDoc.exists) return undefined;
    return this.docToResume(resumeDoc);
  }

  async getResumesByUserId(userId: number): Promise<Resume[]> {
    const snapshot = await resumesCollection
      .where('userId', '==', userId)
      .orderBy('lastEdited', 'desc')
      .get();
    
    return snapshot.docs
      .map(doc => this.docToResume(doc))
      .filter((resume): resume is Resume => resume !== undefined);
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = await this.getNextId('resumeId');
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

  async updateResume(id: number, resumeData: Partial<Resume>): Promise<Resume | undefined> {
    const resumeRef = resumesCollection.doc(id.toString());
    const resumeDoc = await resumeRef.get();
    
    if (!resumeDoc.exists) return undefined;
    
    // Update the lastEdited field
    const dataToUpdate = {
      ...resumeData,
      lastEdited: new Date()
    };
    
    await resumeRef.update(dataToUpdate);
    const updatedResumeDoc = await resumeRef.get();
    return this.docToResume(updatedResumeDoc);
  }

  async deleteResume(id: number): Promise<boolean> {
    const resumeRef = resumesCollection.doc(id.toString());
    const resumeDoc = await resumeRef.get();
    
    if (!resumeDoc.exists) return false;
    
    await resumeRef.delete();
    return true;
  }

  async incrementDownloads(id: number): Promise<boolean> {
    const resumeRef = resumesCollection.doc(id.toString());
    const resumeDoc = await resumeRef.get();
    
    if (!resumeDoc.exists) return false;
    
    await resumeRef.update({
      downloads: FieldValue.increment(1)
    });
    
    return true;
  }

  async updateAtsScore(id: number, score: number): Promise<boolean> {
    const resumeRef = resumesCollection.doc(id.toString());
    const resumeDoc = await resumeRef.get();
    
    if (!resumeDoc.exists) return false;
    
    await resumeRef.update({
      atsScore: score
    });
    
    return true;
  }
}

// Use FirestoreStorage as the actual storage implementation
export const storage = new FirestoreStorage();
