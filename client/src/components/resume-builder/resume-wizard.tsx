import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ResumeContent, resumeContent } from "@shared/schema";
import { createEmptyResumeContent, resumeTemplates } from "@/lib/resume-data";
import PersonalInfoForm from "./personal-info-form";
import ExperienceForm from "./experience-form";
import EducationForm from "./education-form";
import SkillsForm from "./skills-form";
import TemplateSelector from "./template-selector";
import ResumePreview from "./resume-preview";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type WizardStep =
  | "personal-info"
  | "experience"
  | "education"
  | "skills"
  | "template"
  | "preview";

interface Step {
  id: WizardStep;
  name: string;
}

const steps: Step[] = [
  { id: "personal-info", name: "Personal Info" },
  { id: "experience", name: "Experience" },
  { id: "education", name: "Education" },
  { id: "skills", name: "Skills" },
  { id: "template", name: "Template" },
  { id: "preview", name: "Preview" },
];

export default function ResumeWizard() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<WizardStep>("personal-info");
  const [resumeData, setResumeData] = useState<ResumeContent>(
    createEmptyResumeContent()
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>("modern");

  const createResumeMutation = useMutation({
    mutationFn: async () => {
      // Validate the data with zod schema
      const validatedData = resumeContent.parse(resumeData);

      // Create the resume
      const response = await apiRequest("POST", "/api/resumes", {
        title: resumeData.personalInfo.professionalTitle || "Untitled Resume",
        template: selectedTemplate,
        content: validatedData,
      });

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      toast({
        title: "Resume created",
        description: "Your resume has been created successfully!",
      });
      navigate(`/resume/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create resume: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
      window.scrollTo(0, 0);
    }
  };

  const handleFinish = () => {
    createResumeMutation.mutate();
  };

  const handleUpdate = (newData: Partial<ResumeContent>) => {
    setResumeData((prevData) => ({
      ...prevData,
      ...newData,
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "personal-info":
        return <PersonalInfoForm data={resumeData} onUpdate={handleUpdate} />;
      case "experience":
        return <ExperienceForm data={resumeData} onUpdate={handleUpdate} />;
      case "education":
        return <EducationForm data={resumeData} onUpdate={handleUpdate} />;
      case "skills":
        return <SkillsForm data={resumeData} onUpdate={handleUpdate} />;
      case "template":
        return (
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
          />
        );
      case "preview":
        return (
          <ResumePreview resumeData={resumeData} template={selectedTemplate} />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Resume</CardTitle>
      </CardHeader>

      <div className="px-6 mb-6">
        <div className="flex items-center justify-between">
          <ol className="flex items-center w-full">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStepIndex > index;

              return (
                <li
                  key={step.id}
                  className={`flex items-center ${
                    index === steps.length - 1 ? "" : "w-full"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 border ${
                        isActive
                          ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                          : isCompleted
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-500 dark:border-gray-400 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                    </div>

                    <span
                      className={`hidden md:block ml-2 text-sm ${
                        isActive
                          ? "font-medium text-primary-600 dark:text-primary-400"
                          : isCompleted
                          ? "font-medium text-gray-900 dark:text-white"
                          : "font-normal text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="w-full flex items-center">
                      <div
                        className={`w-full h-1 mx-2 ${
                          isCompleted
                            ? "bg-green-500"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      ></div>
                      <ChevronRight className="hidden md:block h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <CardContent>{renderStepContent()}</CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStepIndex < steps.length - 1 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={createResumeMutation.isPending}
          >
            {createResumeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Finish & Save
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
