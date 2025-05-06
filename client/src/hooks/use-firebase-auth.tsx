import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  UserCredential 
} from "firebase/auth";
import { 
  auth, 
  signInWithGoogle, 
  signInWithFacebook, 
  signInWithApple, 
  signInWithLinkedIn, 
  authenticateWithServer 
} from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

type FirebaseAuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithFacebook: () => Promise<UserCredential>;
  signInWithApple: () => Promise<UserCredential>;
  signInWithLinkedIn: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextType | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUser(firebaseUser);
        
        // If user just logged in, authenticate with our server
        if (firebaseUser) {
          try {
            const serverUser = await authenticateWithServer(firebaseUser);
            // Update the user data in our React Query cache
            queryClient.setQueryData(["/api/user"], serverUser);
          } catch (error) {
            console.error("Failed to authenticate with server:", error);
            // Don't set an error state here, as the user might just be browsing,
            // and we don't want to show error toasts on page load
          }
        }
        
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sign out function
  const signOut = async () => {
    try {
      // First log out from our server
      await fetch('/api/logout', { method: 'POST' });
      // Then sign out from Firebase
      await firebaseSignOut(auth);
      // Clear the user in React Query
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    signInWithLinkedIn,
    signOut,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
}