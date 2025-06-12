import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Wand2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { analyzeResumeForATS } from "@/lib/openai";
import { convertResumeToText } from "@/lib/resume-data";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Resume } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function AIAssistantCard() {
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const { data: resumes, isLoading: resumesLoading } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: {
      resumeText: string;
      jobDescription: string;
      resumeId?: number;
    }) => {
      const response = await apiRequest("POST", "/api/ai/analyze", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: `ATS Score: ${data.score}/100`,
        description:
          data.score >= 70
            ? "Your resume is well-optimized for ATS systems!"
            : "Consider implementing the recommendations to improve your score.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateSuggestions = async () => {
    if (!selectedResumeId) {
      toast({
        title: "No resume selected",
        description: "Please select a resume to analyze",
        variant: "destructive",
      });
      return;
    }

    if (!resumes) {
      toast({
        title: "No resumes found",
        description: "Please create a resume first",
        variant: "destructive",
      });
      return;
    }

    const resume = resumes.find((r) => r.id.toString() === selectedResumeId);
    if (!resume) {
      toast({
        title: "Resume not found",
        description: "The selected resume could not be found",
        variant: "destructive",
      });
      return;
    }

    const resumeText = convertResumeToText(resume);
    analyzeMutation.mutate({
      resumeText,
      jobDescription,
      resumeId: resume.id,
    });
  };

  const renderKeywordMatches = () => {
    if (!analysisResult?.keywordMatches?.length) return null;

    return (
      <div className="space-y-2">
        {analysisResult.keywordMatches.map((match: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            {match.present ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              {match.keyword}
              <Badge variant="outline" className="ml-2">
                {match.importance}
              </Badge>
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderIndustryAnalysis = () => {
    if (!analysisResult?.industryAnalysis) return null;
    const {
      detectedIndustry,
      industrySpecificKeywords,
      industryRecommendations,
    } = analysisResult.industryAnalysis;

    return (
      <div className="space-y-4">
        {detectedIndustry && (
          <div>
            <h4 className="text-sm font-medium mb-2">Detected Industry</h4>
            <Badge>{detectedIndustry}</Badge>
          </div>
        )}

        {industrySpecificKeywords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Industry Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {industrySpecificKeywords.map(
                (keyword: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                )
              )}
            </div>
          </div>
        )}

        {industryRecommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">
              Industry Recommendations
            </h4>
            <ul className="space-y-2">
              {industryRecommendations.map((rec: string, index: number) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderFormatAnalysis = () => {
    if (!analysisResult?.formatAnalysis) return null;
    const { structureScore, readabilityScore, formatIssues } =
      analysisResult.formatAnalysis;

    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Structure Score</h4>
          <Progress value={structureScore} className="h-2" />
          <span className="text-sm text-muted-foreground mt-1 block">
            {structureScore}%
          </span>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Readability Score</h4>
          <Progress value={readabilityScore} className="h-2" />
          <span className="text-sm text-muted-foreground mt-1 block">
            {readabilityScore}%
          </span>
        </div>

        {formatIssues.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Format Issues</h4>
            <ul className="space-y-2">
              {formatIssues.map((issue: string, index: number) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderContentAnalysis = () => {
    if (!analysisResult?.contentAnalysis) return null;
    const { actionVerbs, quantifiableAchievements, missingElements } =
      analysisResult.contentAnalysis;

    return (
      <div className="space-y-4">
        {actionVerbs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Action Verbs Used</h4>
            <div className="flex flex-wrap gap-2">
              {actionVerbs.map((verb: string, index: number) => (
                <Badge key={index} variant="outline">
                  {verb}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {quantifiableAchievements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">
              Quantifiable Achievements
            </h4>
            <ul className="space-y-2">
              {quantifiableAchievements.map(
                (achievement: string, index: number) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>{achievement}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        )}

        {missingElements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Missing Elements</h4>
            <ul className="space-y-2">
              {missingElements.map((element: string, index: number) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                  <span>{element}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Resume Assistant</CardTitle>
        <CardDescription>
          Get personalized suggestions to improve your resume and match job
          descriptions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex-1">
              <label
                htmlFor="job-description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Paste Job Description
              </label>
              <Textarea
                id="job-description"
                rows={4}
                placeholder="Paste the job description here to get tailored suggestions..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Resume
              </label>
              <Select
                value={selectedResumeId}
                onValueChange={setSelectedResumeId}
                disabled={resumesLoading || !resumes?.length}
              >
                <SelectTrigger className="mt-1">
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

          <div className="mt-4">
            <Button
              onClick={handleGenerateSuggestions}
              disabled={
                !jobDescription ||
                !selectedResumeId ||
                analyzeMutation.isPending
              }
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>
        </div>

        {analysisResult && (
          <div className="mt-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                <TabsTrigger value="industry">Industry</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Overall Score
                      </h3>
                      <Progress value={analysisResult.score} className="h-2" />
                      <span className="text-sm text-muted-foreground mt-1 block">
                        {analysisResult.score}% ATS Compatibility
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Format Analysis
                      </h3>
                      {renderFormatAnalysis()}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.map(
                          (rec: string, index: number) => (
                            <li
                              key={index}
                              className="text-sm flex items-start gap-2"
                            >
                              <AlertCircle className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="keywords" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {renderKeywordMatches()}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="industry" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {renderIndustryAnalysis()}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="content" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {renderContentAnalysis()}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
