import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ResumeBuilderPage from "@/pages/resume-builder-page";
import ResumeEditPage from "@/pages/resume-edit-page";
import ResumesPage from "@/pages/resumes-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { FirebaseAuthProvider } from "./hooks/use-firebase-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { useSessionHandler } from "./hooks/use-session-handler";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/builder" component={ResumeBuilderPage} />
      <ProtectedRoute path="/resume/:id" component={ResumeEditPage} />
      <ProtectedRoute path="/resumes" component={ResumesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  // Add session handling
  useSessionHandler();

  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="resume-builder-theme">
        <FirebaseAuthProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </FirebaseAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
