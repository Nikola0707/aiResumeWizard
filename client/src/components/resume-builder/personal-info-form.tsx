// Type for resume data structure - used for form validation and data handling
import { ResumeContent } from "@shared/schema";

import {
  Form,
  FormControl,
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
import { usePersonalInfoForm } from "@/hooks/use-personal-info-form";

interface PersonalInfoFormProps {
  data: ResumeContent;
  onUpdate: (data: Partial<ResumeContent>) => void;
}

export default function PersonalInfoForm({
  data,
  onUpdate,
}: PersonalInfoFormProps) {
  const { form, isGeneratingSummary, handleGenerateSummary } =
    usePersonalInfoForm(data, onUpdate);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <Alert className="bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800">
          <Wand2 className="h-4 w-4" />
          <AlertDescription>
            Your personal section establishes your professional identity. Be
            sure to include a professional email and LinkedIn URL.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem key="fullName">
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
              <FormItem key="professionalTitle">
                <FormLabel>Professional Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Senior Software Engineer"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem key="email">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="e.g. john.smith@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem key="phone">
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
              <FormItem key="location">
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
              <FormItem key="website">
                <FormLabel>Website/LinkedIn</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. linkedin.com/in/johnsmith"
                    {...field}
                  />
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
                  <FormItem key="summary" className="w-full">
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
