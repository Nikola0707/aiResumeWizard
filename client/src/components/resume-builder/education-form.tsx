import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { EducationItem, ResumeContent, educationItem } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmptyEducationItem } from "@/lib/resume-data";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import debounce from "lodash/debounce";

interface EducationFormProps {
  data: ResumeContent;
  onUpdate: (data: Partial<ResumeContent>) => void;
}

export default function EducationForm({ data, onUpdate }: EducationFormProps) {
  const { toast } = useToast();
  const [educations, setEducations] = useState<EducationItem[]>(
    data.education && data.education.length > 0
      ? data.education
      : [createEmptyEducationItem()]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  // Set up the active education form
  const form = useForm({
    resolver: zodResolver(educationItem),
    defaultValues: educations[activeIndex] || createEmptyEducationItem(),
  });

  // Watch current checkbox to show/hide end date
  const currentEducation = form.watch("current");

  // Update form when active education changes
  useEffect(() => {
    form.reset(educations[activeIndex] || createEmptyEducationItem());
  }, [activeIndex, educations, form]);

  // Update parent state on form changes with debounce
  useEffect(() => {
    const updateEducations = debounce((value: any) => {
      if (!value) {
        console.log("No value in education form watch, returning");
        return;
      }

      const updatedEducations = [...educations];
      const currentEducation = updatedEducations[activeIndex];

      // Only update if there are actual changes
      const hasChanges = Object.keys(value).some(
        (key) => currentEducation[key as keyof EducationItem] !== value[key]
      );

      if (!hasChanges) {
        console.log("No changes detected, skipping update");
        return;
      }

      updatedEducations[activeIndex] = {
        ...currentEducation,
        ...value,
      } as EducationItem;

      console.log("Updating educations:", {
        before: educations,
        after: updatedEducations,
        activeIndex,
        changes: value,
      });

      setEducations(updatedEducations);
      onUpdate({ education: updatedEducations });
    }, 300); // 300ms debounce

    const subscription = form.watch((value) => {
      console.log("Education form watch triggered:", {
        value,
        activeIndex,
        currentEducations: educations,
      });
      updateEducations(value);
    });

    return () => {
      subscription.unsubscribe();
      updateEducations.cancel();
    };
  }, [form, educations, activeIndex, onUpdate]);

  // Add a new education
  const addEducation = () => {
    console.log("Adding new education:", {
      currentEducations: educations,
    });

    const newEducation = createEmptyEducationItem();
    const updatedEducations = [...educations, newEducation];

    console.log("New education added:", {
      newEducation,
      updatedEducations,
    });

    setEducations(updatedEducations);
    onUpdate({ education: updatedEducations });
    setActiveIndex(updatedEducations.length - 1);
    form.reset(newEducation);
  };

  // Remove an education
  const removeEducation = (index: number) => {
    console.log("Removing education:", {
      index,
      currentEducations: educations,
    });

    if (educations.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one education entry",
        variant: "destructive",
      });
      return;
    }

    const updatedEducations = [...educations];
    updatedEducations.splice(index, 1);

    console.log("Education removed:", {
      before: educations,
      after: updatedEducations,
      index,
    });

    setEducations(updatedEducations);
    onUpdate({ education: updatedEducations });

    // If we're removing the active item, select the one before it
    if (index === activeIndex) {
      const newIndex = Math.max(0, index - 1);
      setActiveIndex(newIndex);
      form.reset(updatedEducations[newIndex]);
    } else if (index < activeIndex) {
      // If we're removing an item before the active one, decrement the index
      setActiveIndex(activeIndex - 1);
    }
  };

  // Select an education to edit
  const selectEducation = (index: number) => {
    console.log("Selecting education:", {
      index,
      education: educations[index],
    });

    setActiveIndex(index);
    form.reset(educations[index]);
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800">
        <AlertDescription>
          List your educational background in reverse chronological order.
          Include relevant coursework, honors, and achievements.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {educations.map((edu, index) => (
                <div key={edu.id} className="flex items-center gap-2">
                  <Button
                    variant={activeIndex === index ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => selectEducation(index)}
                  >
                    {edu.institution || "Untitled Institution"}
                  </Button>
                  {educations.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEducation(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={addEducation}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Education
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
                  name="institution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Stanford University"
                          {...field}
                        />
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
                        <Input placeholder="e.g. Stanford, CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Bachelor of Science"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="field"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field of Study</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Computer Science" {...field} />
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
                        <FormLabel>Currently Studying</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. September 2018" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!currentEducation && (
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. June 2022" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add details about relevant coursework, honors, activities, etc."
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
