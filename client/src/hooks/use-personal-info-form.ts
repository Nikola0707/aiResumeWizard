import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ResumeContent } from "@shared/schema";
import { generateProfessionalSummary } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";

export const usePersonalInfoForm = (
  data: ResumeContent,
  onUpdate: (data: Partial<ResumeContent>) => void
) => {
  const { toast } = useToast();
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const form = useForm({
    mode: "onChange",
    defaultValues: {
      fullName: data.personalInfo?.fullName ?? "",
      professionalTitle: data.personalInfo?.professionalTitle ?? "",
      email: data.personalInfo?.email ?? "",
      phone: data.personalInfo?.phone ?? "",
      location: data.personalInfo?.location ?? "",
      website: data.personalInfo?.website ?? "",
      summary: data.personalInfo?.summary ?? "",
    },
  } as const);

  useEffect(() => {
    form.reset(data.personalInfo);
  }, [data.personalInfo, form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      onUpdate({
        personalInfo: {
          fullName: value.fullName || "",
          professionalTitle: value.professionalTitle || "",
          email: value.email,
          phone: value.phone,
          location: value.location,
          website: value.website,
          summary: value.summary,
        },
      });
    });
    return () => subscription.unsubscribe();
  }, [form, onUpdate]);

  const handleGenerateSummary = async () => {
    try {
      setIsGeneratingSummary(true);

      const professionalTitle = form.getValues("professionalTitle");
      if (!professionalTitle) {
        toast({
          title: "Professional title required",
          description:
            "Please enter your professional title to generate a summary",
          variant: "destructive",
        });
        return;
      }

      const summary = await generateProfessionalSummary({
        professionalTitle,
      });

      form.setValue("summary", summary);
      onUpdate({ personalInfo: { ...form.getValues(), summary } });

      toast({
        title: "Summary generated",
        description:
          "AI has created a professional summary for you. Feel free to edit it!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return {
    form,
    isGeneratingSummary,
    handleGenerateSummary,
  };
};
