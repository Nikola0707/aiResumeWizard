import { useState } from "react";
import { useForm } from "react-hook-form";
import { SkillItem, ResumeContent, skillItem } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmptySkillItem } from "@/lib/resume-data";
import { useMutation } from "@tanstack/react-query";
import { generateSkillSuggestions } from "@/lib/openai";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Wand2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SkillsFormProps {
  data: ResumeContent;
  onUpdate: (data: Partial<ResumeContent>) => void;
}

export default function SkillsForm({ data, onUpdate }: SkillsFormProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [skills, setSkills] = useState<SkillItem[]>(
    data.skills && data.skills.length > 0 
      ? data.skills 
      : [createEmptySkillItem()]
  );

  // Set up the form
  const form = useForm({
    resolver: zodResolver(skillItem),
    defaultValues: createEmptySkillItem(),
  });

  // Reset form with a new empty skill
  const resetForm = () => {
    form.reset(createEmptySkillItem());
  };

  // Add a new skill
  const addSkill = (skillData?: SkillItem) => {
    const newSkill = skillData || form.getValues();
    
    if (!newSkill.name || newSkill.name.trim() === "") {
      toast({
        title: "Skill name is required",
        description: "Please enter a skill name",
        variant: "destructive",
      });
      return;
    }
    
    // Check for duplicates
    if (skills.some(skill => skill.name.toLowerCase() === newSkill.name.toLowerCase())) {
      toast({
        title: "Duplicate skill",
        description: "This skill already exists in your list",
        variant: "destructive",
      });
      return;
    }

    const updatedSkills = [...skills, { ...newSkill, id: crypto.randomUUID() }];
    setSkills(updatedSkills);
    onUpdate({ skills: updatedSkills });
    resetForm();
  };

  // Remove a skill
  const removeSkill = (id: string) => {
    const updatedSkills = skills.filter(skill => skill.id !== id);
    setSkills(updatedSkills);
    onUpdate({ skills: updatedSkills });
  };

  // Generate skill suggestions with AI
  const generateSuggestions = async () => {
    if (!jobTitle) {
      toast({
        title: "Job title required",
        description: "Please enter a job title to generate skill suggestions",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      const suggestions = await generateSkillSuggestions(jobTitle, jobDescription);
      setSuggestedSkills(suggestions);
      
      toast({
        title: "Skills generated",
        description: "AI has suggested skills based on your job title. Click to add them to your resume.",
      });
    } catch (error) {
      toast({
        title: "Error generating skills",
        description: "An error occurred while generating skill suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Add a suggested skill to the list
  const addSuggestedSkill = (skillName: string) => {
    const newSkill = createEmptySkillItem();
    newSkill.name = skillName;
    newSkill.level = 3; // Default level
    
    addSkill(newSkill);
    
    // Remove from suggestions
    setSuggestedSkills(suggestedSkills.filter(skill => skill !== skillName));
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800">
        <Wand2 className="h-4 w-4" />
        <AlertDescription>
          Skills showcase your expertise and strengths. Include both technical and soft skills relevant to your target role.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current skills list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Skills</CardTitle>
              <CardDescription>
                Add skills relevant to your target position. Rate your proficiency from 1-5.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <p>No skills added yet</p>
                  <p className="text-sm">Add skills manually or generate suggestions with AI</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skills.map((skill) => (
                    <div 
                      key={skill.id} 
                      className="p-3 rounded-md border border-gray-200 dark:border-gray-700 flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <p className="font-medium">{skill.name}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {skill.level}/5
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="bg-primary-600 h-1.5 rounded-full" 
                            style={{ width: `${(skill.level || 1) * 20}%` }}
                          ></div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-2 text-gray-500 hover:text-red-500"
                        onClick={() => removeSkill(skill.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add skill form */}
              <div className="mt-6">
                <Form {...form}>
                  <form 
                    onSubmit={form.handleSubmit(values => addSkill(values))}
                    className="space-y-4"
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Skill Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. React.js, Project Management" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Proficiency Level (1-5)</FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value || 3]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="py-4"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Beginner</span>
                              <span>Intermediate</span>
                              <span>Expert</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Skill
                    </Button>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* AI suggestions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>AI Skill Suggestions</CardTitle>
              <CardDescription>
                Get AI-generated skill suggestions based on your target job
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setDialogOpen(true)}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Skill Suggestions
                </Button>
                
                {suggestedSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Suggested Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestedSkills.map((skill, index) => (
                        <Badge 
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-950"
                          onClick={() => addSuggestedSkill(skill)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* AI Suggestions Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Skill Suggestions</DialogTitle>
            <DialogDescription>
              Enter your target job information to get AI-powered skill suggestions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <FormLabel htmlFor="job-title">Job Title (Required)</FormLabel>
              <Input 
                id="job-title" 
                placeholder="e.g. Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <FormLabel htmlFor="job-description">Job Description (Optional)</FormLabel>
              <textarea
                id="job-description"
                placeholder="Paste a job description for more targeted suggestions..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={generateSuggestions}
              disabled={isGenerating || !jobTitle}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
