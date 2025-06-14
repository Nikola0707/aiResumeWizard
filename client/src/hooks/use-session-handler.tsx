import { useEffect, useRef } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { useLocation } from "wouter";

export function useSessionHandler() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();

  // Ref to store the timeout ID for debouncing activity pings
  const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Function to handle session expiration (e.g., from a 401 response)
    const handleSessionExpired = () => {
      if (location === "/auth" && !user) {
        return;
      }

      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      logoutMutation.mutate();
    };

    // Add a global interceptor for fetch requests to catch 401 Unauthorized responses
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        // If a 401 is received, it means the session might have expired on the server
        if (response.status === 401) {
          handleSessionExpired();
        }
        return response;
      } catch (error) {
        // Catch network errors or other fetch-related issues
        console.error("Fetch error:", error);
        // You might want to handle specific error types here if needed
        throw error; // Re-throw the error so the original caller can handle it
      }
    };

    // Cleanup function: restore original fetch behavior when component unmounts
    return () => {
      window.fetch = originalFetch;
    };
  }, [logoutMutation, toast, location, user]);

  // Effect for handling user activity and debouncing session pings
  useEffect(() => {
    // If no user is logged in, no need to track activity
    if (!user) {
      // Clear any pending ping timer if the user logs out
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
        activityTimerRef.current = null;
      }
      return;
    }

    // Define the debounce time (1 minute)
    const DEBOUNCE_TIME = 60 * 1000; // milliseconds

    // Function to send a ping to the server to extend the session
    const sendPing = () => {
      fetch("/api/ping", { method: "POST" }).catch((err) => {
        console.error("Failed to send session ping:", err);
        // Optionally, handle specific errors here, e.g., if the server is unreachable
      });
    };

    // Function to reset the activity timer
    // This clears any existing timer and sets a new one to send a ping after DEBOUNCE_TIME
    const resetActivityTimer = () => {
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
      activityTimerRef.current = setTimeout(sendPing, DEBOUNCE_TIME);
    };

    // Trigger an initial ping (or start the timer) when the user first becomes active or component mounts
    resetActivityTimer();

    // List of events that indicate user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    // Attach event listeners to the window to detect user activity
    events.forEach((event) => {
      window.addEventListener(event, resetActivityTimer);
    });

    // Cleanup function: remove event listeners and clear the timer when the component unmounts or user changes
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetActivityTimer);
      });
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
        activityTimerRef.current = null;
      }
    };
  }, [user]);
}
