import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileEdit, Download, Trash2, PlusCircle, Loader2 } from "lucide-react";
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
import { generateResumePDF } from "@/lib/pdf-generator";
import { format } from "date-fns";
import { type Resume } from "@shared/schema";

export default function ResumesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["/api/resumes"],
    queryFn: getQueryFn<Resume[]>({ on401: "throw" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/resumes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      toast({
        title: "Success",
        description: "Resume deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete resume",
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (id: number) => {
      const resume = await apiRequest("GET", `/api/resumes/${id}`);
      const resumeData = (await resume.json()) as Resume;
      await generateResumePDF(resumeData);
      await apiRequest("POST", `/api/resumes/${id}/download`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Resume downloaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download resume",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">My Resumes</h1>
          <Button
            onClick={() => setLocation("/builder")}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Resume
          </Button>
        </div>

        {!resumes || resumes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                You haven't created any resumes yet. Click the button above to
                create your first resume!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <Card key={resume.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg sm:text-xl">
                    {resume.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Last edited:{" "}
                    {resume.lastEdited
                      ? format(new Date(resume.lastEdited), "MMM d, yyyy")
                      : "Never"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <span>Template: {resume.template}</span>
                    <span>•</span>
                    <span>{resume.downloads} downloads</span>
                    {resume.atsScore && (
                      <>
                        <span>•</span>
                        <span>ATS Score: {resume.atsScore}%</span>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 mt-auto pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setLocation(`/resume/${resume.id}`)}
                    className="w-full"
                  >
                    <FileEdit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadMutation.mutate(resume.id)}
                    disabled={downloadMutation.isPending}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this resume? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(resume.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
