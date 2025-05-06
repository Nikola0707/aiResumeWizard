import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ResumeContent, personalInfo } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateProfessionalSummary } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";

interface PersonalInfoFormProps {
  data: ResumeContent;
  onUpdate: (data: Partial<ResumeContent>) => void;
}

export default function PersonalInfoForm({ data, onUpdate }: PersonalInfoFormProps) {
  const { toast } = useToast();
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(personalInfo),
    defaultValues: data.personalInfo,
  });
  
  const handleSubmit = (values: any) => {
    onUpdate({ personalInfo: values });
  };
  
  const handleGenerateSummary = async () => {
    try {
      setIsGeneratingSummary(true);
      
      const professionalTitle = form.getValues("professionalTitle");
      if (!professionalTitle) {
        toast({
          title: "Professional title required",
          description: "Please enter your professional title to generate a summary",
          variant: "destructive",
        });
        return;
      }
      
      const summary = await generateProfessionalSummary({
        professionalTitle
      });
      
      form.setValue("summary", summary);
      
      toast({
        title: "Summary generated",
        description: "AI has created a professional summary for you. Feel free to edit it!",
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
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" onChange={form.handleSubmit(handleSubmit)}>
        <Alert className="bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800">
          <Wand2 className="h-4 w-4" />
          <AlertDescription>
            Your personal section establishes your professional identity. Be sure to include a professional email and LinkedIn URL.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. John Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="professionalTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Professional Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Senior Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="e.g. john.smith@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. San Francisco, CA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website/LinkedIn</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. linkedin.com/in/johnsmith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="md:col-span-2">
            <div className="flex justify-between items-center">
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Professional Summary</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write a brief summary of your professional background and key qualifications..." 
                        className="h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
            >
              {isGeneratingSummary ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
