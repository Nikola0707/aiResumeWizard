// This file simply re-exports from firebase-admin.ts to avoid circular dependencies
import firebaseAdmin, { usersCollection, resumesCollection } from './firebase-admin';

export const db = firebaseAdmin.firestore();
export { usersCollection, resumesCollection };