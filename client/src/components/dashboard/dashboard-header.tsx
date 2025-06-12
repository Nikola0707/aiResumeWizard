import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DashboardHeader() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {user?.name || user?.username}! Manage your resumes
            and track your progress.
          </p>
        </div>
        <Button
          onClick={() => navigate("/builder")}
          className="w-full sm:w-auto inline-flex items-center justify-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Resume
        </Button>
      </div>
    </div>
  );
}
