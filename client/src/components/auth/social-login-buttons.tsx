import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useToast } from "@/hooks/use-toast";
import { FaGoogle, FaFacebook, FaApple, FaLinkedin } from "react-icons/fa";

export default function SocialLoginButtons() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const {
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    signInWithLinkedIn,
  } = useFirebaseAuth();

  const handleSocialLogin = async (
    provider: "google" | "facebook" | "apple" | "linkedin",
    signInFunction: () => Promise<any>
  ) => {
    setIsLoading(provider);
    try {
      await signInFunction();
      // Note: We don't need to manually update the auth state as Firebase will trigger the auth change listener
      toast({
        title: "Login successful",
        description: "You have been signed in successfully",
      });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Login failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        onClick={() => handleSocialLogin("google", signInWithGoogle)}
        disabled={isLoading !== null}
        className="flex items-center justify-center"
      >
        {isLoading === "google" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <FaGoogle className="h-4 w-4 mr-2 text-red-500" />
        )}
        Google
      </Button>

      <Button
        variant="outline"
        onClick={() => handleSocialLogin("facebook", signInWithFacebook)}
        disabled={isLoading !== null}
        className="flex items-center justify-center"
      >
        {isLoading === "facebook" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <FaFacebook className="h-4 w-4 mr-2 text-blue-600" />
        )}
        Facebook
      </Button>

      <Button
        variant="outline"
        onClick={() => handleSocialLogin("apple", signInWithApple)}
        disabled={isLoading !== null}
        className="flex items-center justify-center"
      >
        {isLoading === "apple" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <FaApple className="h-4 w-4 mr-2" />
        )}
        Apple
      </Button>

      <Button
        variant="outline"
        onClick={() => handleSocialLogin("linkedin", signInWithLinkedIn)}
        disabled={isLoading !== null}
        className="flex items-center justify-center"
      >
        {isLoading === "linkedin" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <FaLinkedin className="h-4 w-4 mr-2 text-blue-700" />
        )}
        LinkedIn
      </Button>
    </div>
  );
}
