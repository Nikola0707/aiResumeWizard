import { useLocation } from "wouter";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Upload, FileUp } from "lucide-react";
import { FaLinkedin } from "react-icons/fa";

export default function ResumeBuilderCard() {
  const [_, navigate] = useLocation();
  
  const handleStartFromScratch = () => {
    navigate("/builder");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Builder</CardTitle>
        <CardDescription>
          Create a new resume in minutes with our AI-powered assistant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div 
            onClick={handleStartFromScratch}
            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500 transition-colors cursor-pointer"
          >
            <div className="text-center mb-2">
              <div className="p-2 h-12 w-12 mx-auto rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <h4 className="text-center text-sm font-medium text-gray-900 dark:text-white">Start from Scratch</h4>
            <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
              Create a new resume with our step-by-step wizard
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500 transition-colors cursor-pointer">
            <div className="text-center mb-2">
              <div className="p-2 h-12 w-12 mx-auto rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h4 className="text-center text-sm font-medium text-gray-900 dark:text-white">Upload Existing</h4>
            <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
              Upload and enhance your current resume
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500 transition-colors cursor-pointer">
            <div className="text-center mb-2">
              <div className="p-2 h-12 w-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                <FaLinkedin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h4 className="text-center text-sm font-medium text-gray-900 dark:text-white">Import from LinkedIn</h4>
            <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
              Use your LinkedIn profile to create a resume
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
