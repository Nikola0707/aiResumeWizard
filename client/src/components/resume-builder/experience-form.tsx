import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { ExperienceItem, ResumeContent, experienceItem } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmptyExperienceItem } from "@/lib/resume-data";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { generateExperienceBullets } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Plus, Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface ExperienceFormProps {
  data: ResumeContent;
  onUpdate: (data: Partial<ResumeContent>) => void;
}

export default function ExperienceForm({
  data,
  onUpdate,
}: ExperienceFormProps) {
  const { toast } = useToast();
  const [experiences, setExperiences] = useState<ExperienceItem[]>(
    data.experience && data.experience.length > 0
      ? data.experience
      : [createEmptyExperienceItem()]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [generatingBullets, setGeneratingBullets] = useState<string | null>(
    null
  );

  // Set up the active experience form
  const form = useForm({
    resolver: zodResolver(experienceItem),
    defaultValues: experiences[activeIndex] || createEmptyExperienceItem(),
  });

  // Watch current checkbox to show/hide end date
  const currentJob = form.watch("current");

  // Update form when active experience changes
  useEffect(() => {
    form.reset(experiences[activeIndex] || createEmptyExperienceItem());
  }, [activeIndex, experiences, form]);

  // Update parent state on form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      const updatedExperiences = [...experiences];
      updatedExperiences[activeIndex] = value as ExperienceItem;
      setExperiences(updatedExperiences);
      onUpdate({ experience: updatedExperiences });
    });
    return () => subscription.unsubscribe();
  }, [form, experiences, activeIndex, onUpdate]);

  // Add a new experience
  const addExperience = () => {
    const newExperience = createEmptyExperienceItem();
    const updatedExperiences = [...experiences, newExperience];
    setExperiences(updatedExperiences);
    onUpdate({ experience: updatedExperiences });
    setActiveIndex(updatedExperiences.length - 1);
    form.reset(newExperience);
  };

  // Remove an experience
  const removeExperience = (index: number) => {
    if (experiences.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one experience entry",
        variant: "destructive",
      });
      return;
    }

    const updatedExperiences = [...experiences];
    updatedExperiences.splice(index, 1);
    setExperiences(updatedExperiences);
    onUpdate({ experience: updatedExperiences });

    // If we're removing the active item, select the one before it
    if (index === activeIndex) {
      const newIndex = Math.max(0, index - 1);
      setActiveIndex(newIndex);
      form.reset(updatedExperiences[newIndex]);
    } else if (index < activeIndex) {
      // If we're removing an item before the active one, decrement the index
      setActiveIndex(activeIndex - 1);
    }
  };

  // Select an experience to edit
  const selectExperience = (index: number) => {
    setActiveIndex(index);
    form.reset(experiences[index]);
  };

  // Generate bullet points using AI
  const generateBulletsMutation = useMutation({
    mutationFn: async () => {
      const jobTitle = form.getValues("title");
      const company = form.getValues("company");

      if (!jobTitle || !company) {
        throw new Error("Job title and company are required");
      }

      const bullets = await generateExperienceBullets({
        jobTitle,
        company,
      });

      return bullets;
    },
    onSuccess: (bullets) => {
      form.setValue("highlights", bullets);
      const updatedExperiences = [...experiences];
      updatedExperiences[activeIndex] = {
        ...updatedExperiences[activeIndex],
        highlights: bullets,
      };
      setExperiences(updatedExperiences);
      onUpdate({ experience: updatedExperiences });

      toast({
        title: "Bullet points generated",
        description:
          "AI has created bullet points for your experience. Feel free to edit them!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to generate bullet points. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Alert className="bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800">
        <Wand2 className="h-4 w-4" />
        <AlertDescription>
          List your work experience in reverse chronological order. Focus on
          achievements and responsibilities that demonstrate your skills.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {experiences.map((exp, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Button
                    variant={activeIndex === index ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => selectExperience(index)}
                  >
                    {exp.title || "Untitled Position"}
                  </Button>
                  {experiences.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExperience(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={addExperience}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Experience
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <Form {...form}>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
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
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Acme Corporation" {...field} />
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
                        <Input
                          placeholder="e.g. San Francisco, CA"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end gap-4">
                  <FormField
                    control={form.control}
                    name="current"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-end space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Current Position</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. June 2020" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!currentJob && (
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. May 2023" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Key Achievements</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateBulletsMutation.mutate()}
                    disabled={generateBulletsMutation.isPending}
                  >
                    {generateBulletsMutation.isPending ? (
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

                <FormField
                  control={form.control}
                  name="highlights"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="List your key achievements and responsibilities..."
                          className="h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
