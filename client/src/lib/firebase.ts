import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  OAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  UserCredential
} from "firebase/auth";
import { apiRequest } from "./queryClient";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Authentication providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export const linkedInProvider = new OAuthProvider('linkedin.com');

// Configure providers
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

facebookProvider.setCustomParameters({
  display: 'popup'
});

appleProvider.addScope('email');
appleProvider.addScope('name');

linkedInProvider.setCustomParameters({
  prompt: 'consent'
});

// Function to authenticate with our server after Firebase auth
export async function authenticateWithServer(user: FirebaseUser) {
  try {
    // Get the ID token from Firebase
    const idToken = await user.getIdToken();
    
    // Send to our backend
    const response = await apiRequest('POST', '/api/auth/firebase', { idToken });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to authenticate with server');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error authenticating with server:', error);
    throw error;
  }
}

// Social login functions
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await authenticateWithServer(result.user);
  return result;
}

export async function signInWithFacebook() {
  const result = await signInWithPopup(auth, facebookProvider);
  await authenticateWithServer(result.user);
  return result;
}

export async function signInWithApple() {
  const result = await signInWithPopup(auth, appleProvider);
  await authenticateWithServer(result.user);
  return result;
}

export async function signInWithLinkedIn() {
  const result = await signInWithPopup(auth, linkedInProvider);
  await authenticateWithServer(result.user);
  return result;
}

export default app;