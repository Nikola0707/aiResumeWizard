import admin from "firebase-admin";
import { usersCollection } from "../firebase-admin";
import { UserAITracking } from "./types";

export async function incrementAIGenerationCount(
  userId: string
): Promise<void> {
  const userRef = usersCollection.doc(String(userId));

  try {
    await userRef.update({
      aiGenerationCount: admin.firestore.FieldValue.increment(1),
      lastGenerationTimestamp: new Date(),
    });
  } catch (error: any) {
    console.error(
      "Error updating AI generation count:",
      error.message || error.toString()
    );
    throw new Error("Failed to update AI generation count");
  }
}

export async function getAIGenerationStats(
  userId: string
): Promise<UserAITracking | null> {
  const userRef = usersCollection.doc(String(userId));

  try {
    const doc = await userRef.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      aiGenerationCount: data?.aiGenerationCount || 0,
      lastGenerationTimestamp:
        data?.lastGenerationTimestamp?.toDate() || new Date(),
    };
  } catch (error: any) {
    console.error(
      "Error fetching AI generation stats:",
      error.message || error.toString()
    );
    throw new Error("Failed to fetch AI generation stats");
  }
}
