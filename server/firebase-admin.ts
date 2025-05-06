import admin from "firebase-admin";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
);

if (!serviceAccount.project_id) {
  throw new Error("Missing project_id in Firebase service account credentials");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
