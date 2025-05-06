import { useState } from "react";
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
import { Plus, Trash2, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  // Update data when form changes
  const updateEducation = (values: EducationItem) => {
    const updatedEducations = [...educations];
    updatedEducations[activeIndex] = values;
    setEducations(updatedEducations);
    onUpdate({ education: updatedEducations });
  };

  // Add a new education
  const addEducation = () => {
    // First save the current form
    form.handleSubmit((values) => {
      const updatedEducations = [...educations];
      updatedEducations[activeIndex] = values;
      const newEducation = createEmptyEducationItem();
      updatedEducations.push(newEducation);
      setEducations(updatedEducations);
      onUpdate({ education: updatedEducations });
      setActiveIndex(updatedEducations.length - 1);
      form.reset(newEducation);
    })();
  };

  // Remove an education
  const removeEducation = (index: number) => {
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
    // First save the current form
    form.handleSubmit((values) => {
      const updatedEducations = [...educations];
      updatedEducations[activeIndex] = values;
      setEducations(updatedEducations);
      onUpdate({ education: updatedEducations });
      setActiveIndex(index);
      form.reset(updatedEducations[index]);
    })();
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800">
        <Wand2 className="h-4 w-4" />
        <AlertDescription>
          Education details highlight your academic credentials. Include relevant coursework or academic achievements that align with your target job.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left side - Education list */}
        <div className="md:col-span-1">
          <h3 className="text-sm font-medium mb-3">Education</h3>
          <div className="space-y-2">
            {educations.map((edu, index) => (
              <div 
                key={edu.id} 
                className={`
                  p-3 rounded-md cursor-pointer border
                  ${index === activeIndex 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 dark:border-primary-500' 
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}
                `}
                onClick={() => selectEducation(index)}
              >
                <div className="flex justify-between items-start">
                  <div className="w-full overflow-hidden">
                    <p className="font-medium truncate">
                      {edu.institution || "Institution Name"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {edu.degree || "Degree"}{edu.field ? ` in ${edu.field}` : ''}
                    </p>
                  </div>
                  {educations.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEducation(index);
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
              onClick={addEducation}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </div>
        </div>
        
        {/* Right side - Edit form */}
        <div className="md:col-span-3">
          <Form {...form}>
            <form 
              className="space-y-4" 
              onChange={form.handleSubmit(updateEducation)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="institution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Stanford University" {...field} />
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
                        <Input placeholder="e.g. Bachelor of Science" {...field} />
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
