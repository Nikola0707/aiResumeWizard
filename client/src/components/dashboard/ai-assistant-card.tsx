import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2 } from "lucide-react";
import { analyzeResumeForATS } from "@/lib/openai";
import { convertResumeToText } from "@/lib/resume-data";
import { useToast } from "@/hooks/use-toast";

export default function AIAssistantCard() {
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  
  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ["/api/resumes"],
  });
  
  const analyzeMutation = useMutation({
    mutationFn: async (data: { resumeText: string; jobDescription: string; resumeId?: number }) => {
      return analyzeResumeForATS(data.resumeText, data.jobDescription, data.resumeId);
    },
    onSuccess: (data) => {
      toast({
        title: `ATS Score: ${data.score}/100`,
        description: data.score >= 70 
          ? "Your resume is well-optimized for ATS systems!" 
          : "Consider implementing the recommendations to improve your score.",
      });
      
      // Show the first 3 recommendations in separate toasts
      data.recommendations.slice(0, 3).forEach((recommendation, index) => {
        setTimeout(() => {
          toast({
            title: `Recommendation ${index + 1}`,
            description: recommendation,
            variant: "default",
          });
        }, 1000 * (index + 1));
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleGenerateSuggestions = async () => {
    if (!selectedResumeId) {
      toast({
        title: "No resume selected",
        description: "Please select a resume to analyze",
        variant: "destructive",
      });
      return;
    }
    
    const resume = resumes.find(r => r.id.toString() === selectedResumeId);
    if (!resume) {
      toast({
        title: "Resume not found",
        description: "The selected resume could not be found",
        variant: "destructive",
      });
      return;
    }
    
    const resumeText = convertResumeToText(resume);
    analyzeMutation.mutate({ 
      resumeText, 
      jobDescription,
      resumeId: resume.id
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Resume Assistant</CardTitle>
        <CardDescription>
          Get personalized suggestions to improve your resume and match job descriptions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex-1">
              <label 
                htmlFor="job-description" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Paste Job Description
              </label>
              <Textarea
                id="job-description"
                rows={4}
                placeholder="Paste the job description here to get tailored suggestions..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex-1">
              <label 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Select Resume
              </label>
              <Select 
                value={selectedResumeId} 
                onValueChange={setSelectedResumeId}
                disabled={resumesLoading || !resumes?.length}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes?.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id.toString()}>
                      {resume.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4">
            <Button 
              onClick={handleGenerateSuggestions}
              disabled={!jobDescription || !selectedResumeId || analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
