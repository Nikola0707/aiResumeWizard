import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ResumeContent } from "@shared/schema";
import { createEmptyResumeContent, resumeTemplates } from "@/lib/resume-data";
import PersonalInfoForm from "./personal-info-form";
import ExperienceForm from "./experience-form";
import EducationForm from "./education-form";
import SkillsForm from "./skills-form";
import TemplateSelector from "./template-selector";
import ResumePreview from "./resume-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronRight,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { id: "personal-info", title: "Personal Information" },
  { id: "experience", title: "Work Experience" },
  { id: "education", title: "Education" },
  { id: "skills", title: "Skills" },
  { id: "template", title: "Template" },
  { id: "preview", title: "Preview" },
];

export default function ResumeWizard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [resumeData, setResumeData] = useState<ResumeContent>({
    ...createEmptyResumeContent(),
    skills: [],
  });
  const [template, setTemplate] = useState<
    "modern" | "classic" | "professional" | "creative"
  >("modern");
  const [resumeId, setResumeId] = useState<string | null>(null);

  // Create/Update resume mutation
  const createResumeMutation = useMutation({
    mutationFn: async () => {
      const professionalTitle = resumeData.personalInfo?.professionalTitle;
      const title = professionalTitle
        ? `${professionalTitle}'s Resume`
        : "Untitled Resume";

      // If we have a resumeId, update the existing resume
      if (resumeId) {
        const response = await apiRequest("PUT", `/api/resumes/${resumeId}`, {
          title,
          template,
          content: resumeData,
        });
        return response.json();
      }

      // Otherwise create a new resume
      const response = await apiRequest("POST", "/api/resumes", {
        title,
        template,
        content: resumeData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      // Store the resumeId after first creation
      if (!resumeId) {
        setResumeId(data.id);
      }
      toast({
        title: "Resume saved",
        description: "Your progress has been saved successfully",
      });
      return data;
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: `Failed to save resume: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleUpdate = (data: Partial<ResumeContent>) => {
    setResumeData({ ...resumeData, ...data });
  };

  const handleNext = async () => {
    // Validate current step
    if (!isStepValid(currentStep)) {
      toast({
        title: "Incomplete information",
        description: "Please complete all required fields before proceeding",
        variant: "destructive",
      });
      return;
    }

    // Save progress
    await createResumeMutation.mutateAsync();

    // Move to next step
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinish = async () => {
    if (!isStepValid(currentStep)) {
      toast({
        title: "Incomplete information",
        description: "Please complete all required fields before proceeding",
        variant: "destructive",
      });
      return;
    }

    const data = await createResumeMutation.mutateAsync();
    navigate(`/resume/${data.id}`);
  };

  const handlePrevious = async () => {
    // Save progress
    await createResumeMutation.mutateAsync();

    // Move to previous step
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: // Personal Info
        return !!(
          resumeData.personalInfo?.fullName &&
          resumeData.personalInfo?.email &&
          resumeData.personalInfo?.professionalTitle
        );
      case 1: // Experience
        return resumeData.experience?.some(
          (exp) =>
            exp.title &&
            exp.company &&
            exp.startDate &&
            (!exp.current ? exp.endDate : true)
        );
      case 2: // Education
        return resumeData.education?.some(
          (edu) =>
            edu.institution &&
            edu.degree &&
            edu.field &&
            edu.startDate &&
            (!edu.current ? edu.endDate : true)
        );
      case 3: // Skills
        return resumeData.skills?.some(
          (skill) => skill.name && skill.level && skill.level > 0
        );
      case 4: // Template
        return true;
      case 5: // Preview
        return true;
      default:
        return false;
    }
  };

  const handleTemplateSelect = (template: string) => {
    setTemplate(template as "modern" | "classic" | "professional" | "creative");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalInfoForm data={resumeData} onUpdate={handleUpdate} />;
      case 1:
        return <ExperienceForm data={resumeData} onUpdate={handleUpdate} />;
      case 2:
        return <EducationForm data={resumeData} onUpdate={handleUpdate} />;
      case 3:
        return <SkillsForm data={resumeData} onUpdate={handleUpdate} />;
      case 4:
        return (
          <TemplateSelector
            selectedTemplate={template}
            onSelectTemplate={handleTemplateSelect}
          />
        );
      case 5:
        return <ResumePreview resumeData={resumeData} template={template} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        <ol className="flex items-center w-full">
          {STEPS.map((step, index) => {
            const isActive = currentStep === index;
            const isCompleted = currentStep > index;

            return (
              <li
                key={step.id}
                className={`flex items-center ${
                  index === STEPS.length - 1 ? "" : "w-full"
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
                    {step.title}
                  </span>
                </div>

                {index < STEPS.length - 1 && (
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

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || createResumeMutation.isPending}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button
          onClick={currentStep === STEPS.length - 1 ? handleFinish : handleNext}
          disabled={createResumeMutation.isPending || !isStepValid(currentStep)}
        >
          {createResumeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : currentStep === STEPS.length - 1 ? (
            "Finish"
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
