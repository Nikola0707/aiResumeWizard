import { useState } from "react";
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

export default function ExperienceForm({ data, onUpdate }: ExperienceFormProps) {
  const { toast } = useToast();
  const [experiences, setExperiences] = useState<ExperienceItem[]>(
    data.experience && data.experience.length > 0 
      ? data.experience 
      : [createEmptyExperienceItem()]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [generatingBullets, setGeneratingBullets] = useState<string | null>(null);

  // Set up the active experience form
  const form = useForm({
    resolver: zodResolver(experienceItem),
    defaultValues: experiences[activeIndex] || createEmptyExperienceItem(),
  });
  
  // Watch current checkbox to show/hide end date
  const currentJob = form.watch("current");

  // Update data when form changes
  const updateExperience = (values: ExperienceItem) => {
    const updatedExperiences = [...experiences];
    updatedExperiences[activeIndex] = values;
    setExperiences(updatedExperiences);
    onUpdate({ experience: updatedExperiences });
  };

  // Add a new experience
  const addExperience = () => {
    // First save the current form
    form.handleSubmit((values) => {
      const updatedExperiences = [...experiences];
      updatedExperiences[activeIndex] = values;
      const newExperience = createEmptyExperienceItem();
      updatedExperiences.push(newExperience);
      setExperiences(updatedExperiences);
      onUpdate({ experience: updatedExperiences });
      setActiveIndex(updatedExperiences.length - 1);
      form.reset(newExperience);
    })();
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
    // First save the current form
    form.handleSubmit((values) => {
      const updatedExperiences = [...experiences];
      updatedExperiences[activeIndex] = values;
      setExperiences(updatedExperiences);
      onUpdate({ experience: updatedExperiences });
      setActiveIndex(index);
      form.reset(updatedExperiences[index]);
    })();
  };

  // Generate bullet points with AI
  const handleGenerateBullets = async () => {
    try {
      const id = form.getValues("id");
      setGeneratingBullets(id);
      
      const jobTitle = form.getValues("title");
      const company = form.getValues("company");
      const description = form.getValues("description") || "";
      
      if (!jobTitle || !company) {
        toast({
          title: "Missing information",
          description: "Please provide a job title and company to generate bullet points",
          variant: "destructive",
        });
        setGeneratingBullets(null);
        return;
      }
      
      const bullets = await generateExperienceBullets({
        jobTitle,
        jobDescription: `${description} at ${company}`,
      });
      
      // Update the form with the generated bullet points
      const currentHighlights = form.getValues("highlights") || [];
      const updatedHighlights = [...currentHighlights, ...bullets];
      
      form.setValue("highlights", updatedHighlights);
      
      // Also update the experiences array
      const updatedValues = { ...form.getValues(), highlights: updatedHighlights };
      updateExperience(updatedValues);
      
      toast({
        title: "Bullet points generated",
        description: "AI has created bullet points for your experience. Feel free to edit them!",
      });
    } catch (error) {
      toast({
        title: "Failed to generate bullet points",
        description: "An error occurred while generating bullet points. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingBullets(null);
    }
  };

  // Handlers for bullet point items
  const addBulletPoint = () => {
    const currentHighlights = form.getValues("highlights") || [];
    const updatedHighlights = [...currentHighlights, ""];
    form.setValue("highlights", updatedHighlights);
    
    // Also update the experiences array
    const updatedValues = { ...form.getValues(), highlights: updatedHighlights };
    updateExperience(updatedValues);
  };

  const updateBulletPoint = (index: number, value: string) => {
    const currentHighlights = form.getValues("highlights") || [];
    const updatedHighlights = [...currentHighlights];
    updatedHighlights[index] = value;
    form.setValue("highlights", updatedHighlights);
    
    // Also update the experiences array
    const updatedValues = { ...form.getValues(), highlights: updatedHighlights };
    updateExperience(updatedValues);
  };

  const removeBulletPoint = (index: number) => {
    const currentHighlights = form.getValues("highlights") || [];
    const updatedHighlights = currentHighlights.filter((_, i) => i !== index);
    form.setValue("highlights", updatedHighlights);
    
    // Also update the experiences array
    const updatedValues = { ...form.getValues(), highlights: updatedHighlights };
    updateExperience(updatedValues);
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800">
        <Wand2 className="h-4 w-4" />
        <AlertDescription>
          A strong work experience section should showcase your achievements with measurable results. Use action verbs and quantify your impact where possible.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left side - Experience list */}
        <div className="md:col-span-1">
          <h3 className="text-sm font-medium mb-3">Work Experience</h3>
          <div className="space-y-2">
            {experiences.map((exp, index) => (
              <div 
                key={exp.id} 
                className={`
                  p-3 rounded-md cursor-pointer border
                  ${index === activeIndex 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 dark:border-primary-500' 
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}
                `}
                onClick={() => selectExperience(index)}
              >
                <div className="flex justify-between items-start">
                  <div className="w-full overflow-hidden">
                    <p className="font-medium truncate">
                      {exp.title || "Position Title"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {exp.company || "Company Name"}
                    </p>
                  </div>
                  {experiences.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeExperience(index);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full mt-2" 
              size="sm"
              onClick={addExperience}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Work Experience
            </Button>
          </div>
        </div>
        
        {/* Right side - Edit form */}
        <div className="md:col-span-3">
          <Form {...form}>
            <form 
              className="space-y-4" 
              onChange={form.handleSubmit(updateExperience)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Senior Software Engineer" {...field} />
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
                        <Input placeholder="e.g. San Francisco, CA" {...field} />
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
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly describe your role and responsibilities..."
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <FormLabel>Key Achievements</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateBullets}
                    disabled={generatingBullets === form.getValues("id")}
                  >
                    {generatingBullets === form.getValues("id") ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Bullet Points
                      </>
                    )}
                  </Button>
                </div>
                
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {form.watch("highlights")?.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="mt-2.5">•</span>
                        <Input
                          value={highlight}
                          onChange={(e) => updateBulletPoint(idx, e.target.value)}
                          placeholder="Describe a specific achievement or responsibility"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => removeBulletPoint(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {(!form.watch("highlights") || form.watch("highlights").length === 0) && (
                      <div className="text-center py-2 text-gray-500 dark:text-gray-400">
                        <p>No bullet points added yet</p>
                        <p className="text-sm">Add bullet points manually or generate with AI</p>
                      </div>
                    )}
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-2"
                      size="sm"
                      onClick={addBulletPoint}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Bullet Point
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
