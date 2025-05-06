import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DashboardHeader() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Welcome back, {user?.name || user?.username}! Manage your resumes and track your progress.
          </p>
        </div>
        <Button 
          onClick={() => navigate("/builder")}
          className="inline-flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Resume
        </Button>
      </div>
    </div>
  );
}
