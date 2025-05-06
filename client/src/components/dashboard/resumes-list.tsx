import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { 
  Card, 
  CardHeader, 
  CardContent 
} from "@/components/ui/card";
import { 
  FileEdit, 
  Download, 
  Trash2, 
  FileText, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generateResumePDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";

export default function ResumesList() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [resumeToDelete, setResumeToDelete] = useState<number | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState<number | null>(null);
  
  const { data: resumes, isLoading } = useQuery({
    queryKey: ["/api/resumes"],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/resumes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      toast({
        title: "Resume deleted",
        description: "Your resume has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete resume: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleEdit = (id: number) => {
    navigate(`/resume/${id}`);
  };
  
  const handleDownload = async (resume: any) => {
    try {
      setGeneratingPDF(resume.id);
      const pdfDataUri = await generateResumePDF(resume);
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `${resume.title || 'Resume'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download successful",
        description: "Your resume has been downloaded as a PDF",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was a problem generating your PDF file",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(null);
    }
  };
  
  const handleDelete = (id: number) => {
    setResumeToDelete(id);
  };
  
  const confirmDelete = () => {
    if (resumeToDelete !== null) {
      deleteMutation.mutate(resumeToDelete);
      setResumeToDelete(null);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Your Resumes</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!resumes || resumes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Your Resumes</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No resumes yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first resume to get started</p>
            <Button onClick={() => navigate("/builder")}>
              Create Resume
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Your Resumes</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {resumes.map((resume) => {
            // Format the date to relative time (e.g., "2 days ago")
            let lastEditedText = 'Unknown date';
            if (resume.lastEdited) {
              try {
                const date = new Date(resume.lastEdited);
                lastEditedText = `${formatDistanceToNow(date)} ago`;
              } catch (e) {
                console.error("Date parsing error:", e);
              }
            }
            
            // Determine which template color to use for the icon background
            const templateColors = {
              modern: "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300",
              professional: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
              creative: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
              simple: "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300",
              elegant: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
            };
            
            const colorClass = templateColors[resume.template as keyof typeof templateColors] || templateColors.modern;
            
            return (
              <li key={resume.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                <div className="flex items-center px-4 py-4">
                  <div className="min-w-0 flex-1 flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`h-12 w-10 flex items-center justify-center ${colorClass} rounded`}>
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 px-4">
                      <div>
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">
                          {resume.title}
                        </p>
                        <p className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span className="truncate">Last edited: {lastEditedText}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEdit(resume.id)}
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDownload(resume)}
                      disabled={generatingPDF === resume.id}
                    >
                      {generatingPDF === resume.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950"
                      onClick={() => handleDelete(resume.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
      
      <AlertDialog open={resumeToDelete !== null} onOpenChange={() => setResumeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              resume and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
