import admin from "firebase-admin";
import "dotenv/config";

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}");
} catch (error) {
  throw new Error(
    `Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${(error as Error).message}`
  );
}

if (!serviceAccount.project_id) {
  throw new Error("Missing project_id in Firebase service account credentials");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const usersCollection = admin.firestore().collection("users");
export const resumesCollection = admin.firestore().collection("resumes");
export default admin;
