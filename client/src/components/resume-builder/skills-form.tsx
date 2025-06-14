import { useState } from "react";
import { useForm } from "react-hook-form";
import { SkillItem, ResumeContent, skillItem } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmptySkillItem } from "@/lib/resume-data";

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

import { apiRequest } from "@/lib/queryClient";

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

  const [skills, setSkills] = useState<SkillItem[]>(
    data.skills && data.skills.length > 0 ? data.skills : []
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
    if (
      skills.some(
        (skill) => skill.name.toLowerCase() === newSkill.name.toLowerCase()
      )
    ) {
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
    const updatedSkills = skills.filter((skill) => skill.id !== id);
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
      const response = await apiRequest("POST", "/api/ai/skills", {
        jobTitle,
        jobDescription,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const data = await response.json();
      setSuggestedSkills(data.skills);

      toast({
        title: "Skills generated",
        description:
          "AI has suggested skills based on your job title. Click to add them to your resume.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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

    const updatedSkills = [...skills, { ...newSkill, id: crypto.randomUUID() }];
    setSkills(updatedSkills);
    onUpdate({ skills: updatedSkills });

    // Remove from suggestions
    setSuggestedSkills(suggestedSkills.filter((skill) => skill !== skillName));
  };

  // Update skill level
  const updateSkillLevel = (id: string, newLevel: number) => {
    const updatedSkills = skills.map((skill) =>
      skill.id === id ? { ...skill, level: newLevel } : skill
    );
    setSkills(updatedSkills);
    onUpdate({ skills: updatedSkills });
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        <Alert className="bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800">
          <Wand2 className="h-4 w-4" />
          <AlertDescription>
            Skills showcase your expertise and strengths. Include both technical
            and soft skills relevant to your target role.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current skills list */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Skills</CardTitle>
                <CardDescription>
                  Add skills relevant to your target position. Rate your
                  proficiency from 1-5.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {skills.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <p>No skills added yet</p>
                    <p className="text-sm">
                      Add skills manually or generate suggestions with AI
                    </p>
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
                          <div className="mt-2">
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              value={[skill.level || 3]}
                              onValueChange={(value) =>
                                updateSkillLevel(skill.id, value[0])
                              }
                              className="py-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Beginner</span>
                              <span>Intermediate</span>
                              <span>Expert</span>
                            </div>
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
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Skill Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. React.js" {...field} />
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
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
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
                    <Button
                      type="button"
                      onClick={form.handleSubmit((values) => addSkill(values))}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skill
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>AI Skill Suggestions</CardTitle>
              <CardDescription>
                Generate relevant skills based on your target job title.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>Job Title</FormLabel>
                  <Input
                    placeholder="e.g. Senior Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel>Job Description (Optional)</FormLabel>
                  <Input
                    placeholder="Paste job description for more relevant suggestions"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={generateSuggestions}
                  disabled={isGenerating}
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

                {suggestedSkills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Suggested Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary-100"
                          onClick={() => addSuggestedSkill(skill)}
                        >
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
      </form>
    </Form>
  );
}
