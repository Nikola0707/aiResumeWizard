import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import PersonalInfoForm from "@/components/resume-builder/personal-info-form";
import ExperienceForm from "@/components/resume-builder/experience-form";
import EducationForm from "@/components/resume-builder/education-form";
import SkillsForm from "@/components/resume-builder/skills-form";
import TemplateSelector from "@/components/resume-builder/template-selector";
import ResumePreview from "@/components/resume-builder/resume-preview";
import { useToast } from "@/hooks/use-toast";
import { ResumeContent, resumeContent } from "@shared/schema";
import {
  createEmptyResumeContent,
  convertResumeToText,
} from "@/lib/resume-data";
import {
  Save,
  Eye,
  Download,
  FileEdit,
  Trash2,
  ArrowLeft,
  Loader2,
  RotateCcw,
} from "lucide-react";
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

export default function ResumeEditPage() {
  const [, params] = useRoute<{ id: string }>("/resume/:id");
  const resumeId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [resumeTitle, setResumeTitle] = useState("");
  const [resumeData, setResumeData] = useState<ResumeContent>(
    createEmptyResumeContent()
  );
  const [template, setTemplate] = useState("modern");
  const [activeTab, setActiveTab] = useState("edit");
  const [editSection, setEditSection] = useState("personal-info");

  // Fetch resume data
  const { data: resume, isLoading } = useQuery({
    queryKey: [`/api/resumes/${resumeId}`],
    enabled: resumeId !== null,
  });

  // Initialize form data when resume loads
  useEffect(() => {
    if (resume) {
      setResumeTitle(resume.title);
      setTemplate(resume.template);
      setResumeData(resume.content as ResumeContent);
    }
  }, [resume]);

  // Update resume mutation
  const updateResumeMutation = useMutation({
    mutationFn: async () => {
      if (!resumeId) throw new Error("Resume ID is required");

      try {
        // Validate data with zod
        const validatedData = resumeContent.parse(resumeData);

        const res = await apiRequest("PUT", `/api/resumes/${resumeId}`, {
          title: resumeTitle,
          template,
          content: validatedData,
        });

        return await res.json();
      } catch (error) {
        throw new Error("Invalid resume data");
      }
    },
    onSuccess: () => {
      toast({
        title: "Resume updated",
        description: "Your changes have been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/resumes/${resumeId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: `Failed to update resume: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete resume mutation
  const deleteResumeMutation = useMutation({
    mutationFn: async () => {
      if (!resumeId) throw new Error("Resume ID is required");
      await apiRequest("DELETE", `/api/resumes/${resumeId}`);
    },
    onSuccess: () => {
      toast({
        title: "Resume deleted",
        description: "Your resume has been deleted successfully",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: `Failed to delete resume: ${error.message}`,
        variant: "destructive",
      });
      setIsDeleting(false);
    },
  });

  // Handle form updates
  const handleUpdate = (data: Partial<ResumeContent>) => {
    setResumeData({ ...resumeData, ...data });
  };

  // Save changes
  const handleSave = () => {
    updateResumeMutation.mutate();
  };

  // Navigate back to dashboard
  const handleBack = () => {
    navigate("/");
  };

  // Delete resume
  const handleDelete = () => {
    setIsDeleting(true);
    deleteResumeMutation.mutate();
  };

  // Download PDF
  const handleDownload = async () => {
    if (!resume) return;

    try {
      setIsDownloading(true);
      const pdfDataUri = await generateResumePDF(resume);

      // Create a link and trigger download
      const link = document.createElement("a");
      link.href = pdfDataUri;
      link.download = `${resumeTitle || "Resume"}.pdf`;
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
      setIsDownloading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // If resume is not found
  if (!resume && !isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Resume Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The resume you're looking for might have been deleted or doesn't
            exist.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Edit Resume</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Update your resume details and preview changes
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Resume Title"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              className="w-full"
            />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your resume and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 text-white hover:bg-red-600"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={updateResumeMutation.isPending}
          >
            {updateResumeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="edit">
            <FileEdit className="mr-2 h-4 w-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Sections</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <div className="space-y-1">
                  <Button
                    variant={
                      editSection === "personal-info" ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => setEditSection("personal-info")}
                  >
                    Personal Information
                  </Button>
                  <Button
                    variant={
                      editSection === "experience" ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => setEditSection("experience")}
                  >
                    Work Experience
                  </Button>
                  <Button
                    variant={
                      editSection === "education" ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => setEditSection("education")}
                  >
                    Education
                  </Button>
                  <Button
                    variant={editSection === "skills" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setEditSection("skills")}
                  >
                    Skills
                  </Button>
                  <Button
                    variant={editSection === "template" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setEditSection("template")}
                  >
                    Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="md:col-span-3">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                }
              >
                {editSection === "personal-info" && (
                  <PersonalInfoForm data={resumeData} onUpdate={handleUpdate} />
                )}

                {editSection === "experience" && (
                  <ExperienceForm data={resumeData} onUpdate={handleUpdate} />
                )}

                {editSection === "education" && (
                  <EducationForm data={resumeData} onUpdate={handleUpdate} />
                )}

                {editSection === "skills" && (
                  <SkillsForm data={resumeData} onUpdate={handleUpdate} />
                )}

                {editSection === "template" && (
                  <TemplateSelector
                    selectedTemplate={template}
                    onSelectTemplate={setTemplate}
                  />
                )}
              </Suspense>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <ResumePreview resumeData={resumeData} template={template} />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
