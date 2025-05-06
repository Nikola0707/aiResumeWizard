// This file now just re-exports from firestore-db.ts
// It's kept to maintain compatibility with existing imports
import { db, usersCollection, resumesCollection } from "./firestore-db";

export { db, usersCollection as users, resumesCollection as resumes };