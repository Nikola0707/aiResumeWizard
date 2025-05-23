import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2, Copy, Download } from "lucide-react";
import { generateCoverLetter, type CoverLetterOptions } from "@/lib/openai";
import { convertResumeToText } from "@/lib/resume-data";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { type Resume } from "@shared/schema";

export default function CoverLetterGenerator() {
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [tone, setTone] = useState<CoverLetterOptions["tone"]>("professional");
  const [highlightSkills, setHighlightSkills] = useState<string[]>([]);
  const [highlightExperience, setHighlightExperience] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState<string>("");

  const { data: resumes, isLoading: resumesLoading } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: CoverLetterOptions) => {
      return generateCoverLetter(data);
    },
    onSuccess: (data) => {
      setGeneratedLetter(data);
      toast({
        title: "Cover letter generated",
        description: "Your cover letter has been generated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = async () => {
    if (!selectedResumeId || !jobDescription || !companyName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const resume = resumes?.find((r) => r.id.toString() === selectedResumeId);
    if (!resume) {
      toast({
        title: "Resume not found",
        description: "The selected resume could not be found",
        variant: "destructive",
      });
      return;
    }

    const resumeText = convertResumeToText(resume);
    generateMutation.mutate({
      resumeText,
      jobDescription,
      companyName,
      tone,
      highlightSkills: highlightSkills.length > 0 ? highlightSkills : undefined,
      highlightExperience:
        highlightExperience.length > 0 ? highlightExperience : undefined,
      customInstructions: customInstructions || undefined,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast({
      title: "Copied to clipboard",
      description: "The cover letter has been copied to your clipboard",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([generatedLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${companyName
      .toLowerCase()
      .replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cover Letter Generator</CardTitle>
        <CardDescription>
          Generate a personalized cover letter based on your resume and job
          description.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Select Resume</Label>
              <Select
                value={selectedResumeId}
                onValueChange={setSelectedResumeId}
                disabled={resumesLoading || !resumes?.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes?.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id.toString()}>
                      {resume.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Job Description</Label>
            <Textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Tone</Label>
            <Select
              value={tone}
              onValueChange={(value) =>
                setTone(value as CoverLetterOptions["tone"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Custom Instructions (Optional)</Label>
            <Textarea
              placeholder="Add any specific instructions or requirements..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={
              !companyName ||
              !selectedResumeId ||
              !jobDescription ||
              generateMutation.isPending
            }
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Cover Letter
              </>
            )}
          </Button>

          {generatedLetter && (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {generatedLetter}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
