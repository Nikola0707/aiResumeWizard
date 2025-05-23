import firebaseAdmin, {
  usersCollection,
  resumesCollection,
} from "./firebase-admin";

export const db = firebaseAdmin.firestore();
export { usersCollection, resumesCollection };
