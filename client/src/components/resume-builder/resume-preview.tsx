import { useState } from "react";
import { ResumeContent, ResumeTemplate, Resume } from "@shared/schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileDown,
  Printer,
  Loader2,
  MoveHorizontal,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateResumePDF } from "@/lib/pdf-generator";

interface ResumePreviewProps {
  resumeData: ResumeContent;
  template: string;
}

export default function ResumePreview({
  resumeData,
  template,
}: ResumePreviewProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [scale, setScale] = useState(1);

  // Parse template as ResumeTemplate
  const resumeTemplate = template as ResumeTemplate;

  // Template-specific styles
  const templateStyles: Record<
    ResumeTemplate,
    {
      headerBg: string;
      headerText: string;
      sectionTitle: string;
      border: string;
      accent: string;
    }
  > = {
    modern: {
      headerBg: "bg-primary-100 dark:bg-primary-900",
      headerText: "text-primary-950 dark:text-primary-50",
      sectionTitle:
        "text-primary-600 dark:text-primary-400 border-b border-primary-200 dark:border-primary-800",
      border: "border-primary-200 dark:border-primary-800",
      accent: "text-primary-600 dark:text-primary-400",
    },
    professional: {
      headerBg: "bg-blue-100 dark:bg-blue-900",
      headerText: "text-blue-950 dark:text-blue-50",
      sectionTitle:
        "text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-800",
      border: "border-blue-200 dark:border-blue-800",
      accent: "text-blue-600 dark:text-blue-400",
    },
    creative: {
      headerBg: "bg-purple-100 dark:bg-purple-900",
      headerText: "text-purple-950 dark:text-purple-50",
      sectionTitle:
        "text-purple-600 dark:text-purple-400 border-b border-purple-200 dark:border-purple-800",
      border: "border-purple-200 dark:border-purple-800",
      accent: "text-purple-600 dark:text-purple-400",
    },
    simple: {
      headerBg: "bg-gray-100 dark:bg-gray-800",
      headerText: "text-gray-950 dark:text-gray-50",
      sectionTitle:
        "text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700",
      border: "border-gray-200 dark:border-gray-700",
      accent: "text-gray-600 dark:text-gray-400",
    },
    elegant: {
      headerBg: "bg-amber-50 dark:bg-amber-900",
      headerText: "text-amber-950 dark:text-amber-50",
      sectionTitle:
        "text-amber-600 dark:text-amber-400 border-b border-amber-200 dark:border-amber-800",
      border: "border-amber-200 dark:border-amber-800",
      accent: "text-amber-600 dark:text-amber-400",
    },
  };

  const { headerBg, headerText, sectionTitle, border, accent } =
    templateStyles[resumeTemplate] || templateStyles.modern;

  const handlePrint = () => {
    toast({
      title: "Print feature",
      description: "Print functionality will be available in the full version",
    });
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const pdfDataUri = await generateResumePDF({
        id: 0,
        userId: 0,
        title: resumeData.personalInfo.fullName || "Resume",
        template: template as ResumeTemplate,
        content: resumeData,
        createdAt: new Date(),
        lastEdited: new Date(),
        downloads: 0,
        atsScore: null,
      });

      // Create a link and trigger download
      const link = document.createElement("a");
      link.href = pdfDataUri;

      // Create a sanitized filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const name = resumeData.personalInfo.fullName || "Resume";
      const sanitizedName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const filename = `${sanitizedName}_resume_${timestamp}.pdf`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download successful",
        description: "Your resume has been downloaded as a PDF",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Download failed",
        description: "There was a problem generating your PDF file",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 1.5));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  return (
    <div className="space-y-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Resume Preview</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={scale <= 0.5}
              >
                -
              </Button>
              <span className="text-sm">{Math.round(scale * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={scale >= 1.5}
              >
                +
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex justify-center">
            <div
              className="w-full max-w-[21cm] bg-white dark:bg-gray-950 shadow-lg rounded-md overflow-hidden border border-gray-200 dark:border-gray-800 transition-all"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top center",
              }}
            >
              {/* Resume Header */}
              <div className={`${headerBg} p-6`}>
                <h1 className={`text-2xl font-bold ${headerText}`}>
                  {resumeData.personalInfo.fullName || "Your Name"}
                </h1>
                <h2 className={`text-lg font-medium mt-1 ${headerText}`}>
                  {resumeData.personalInfo.professionalTitle ||
                    "Professional Title"}
                </h2>

                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm">
                  {resumeData.personalInfo.email && (
                    <div className="flex items-center gap-1">
                      <Mail className={`h-4 w-4 ${accent}`} />
                      <span>{resumeData.personalInfo.email}</span>
                    </div>
                  )}

                  {resumeData.personalInfo.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className={`h-4 w-4 ${accent}`} />
                      <span>{resumeData.personalInfo.phone}</span>
                    </div>
                  )}

                  {resumeData.personalInfo.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className={`h-4 w-4 ${accent}`} />
                      <span>{resumeData.personalInfo.location}</span>
                    </div>
                  )}

                  {resumeData.personalInfo.website && (
                    <div className="flex items-center gap-1">
                      <Globe className={`h-4 w-4 ${accent}`} />
                      <span>{resumeData.personalInfo.website}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resume Content */}
              <div className="p-6 space-y-5">
                {/* Summary */}
                {resumeData.personalInfo.summary && (
                  <div>
                    <h3
                      className={`text-lg font-semibold pb-1 mb-2 ${sectionTitle}`}
                    >
                      Professional Summary
                    </h3>
                    <p className="text-sm">{resumeData.personalInfo.summary}</p>
                  </div>
                )}

                {/* Experience */}
                {resumeData.experience && resumeData.experience.length > 0 && (
                  <div>
                    <h3
                      className={`text-lg font-semibold pb-1 mb-3 ${sectionTitle}`}
                    >
                      Work Experience
                    </h3>
                    <div className="space-y-4">
                      {resumeData.experience.map((exp, index) => (
                        <div key={exp.id || index} className="space-y-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">
                              {exp.title || "Position"}
                            </h4>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="mr-1 h-3 w-3" />
                              <span>
                                {exp.startDate || "Start"} -{" "}
                                {exp.current ? "Present" : exp.endDate || "End"}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">
                              {exp.company || "Company"}
                            </span>
                            {exp.location && <span>{exp.location}</span>}
                          </div>

                          {exp.description && (
                            <p className="text-sm mt-1">{exp.description}</p>
                          )}

                          {exp.highlights && exp.highlights.length > 0 && (
                            <ul className="mt-1 ml-4 text-sm space-y-0.5">
                              {exp.highlights.map((highlight, idx) => (
                                <li
                                  key={idx}
                                  className="list-disc list-outside"
                                >
                                  {highlight}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {resumeData.education && resumeData.education.length > 0 && (
                  <div>
                    <h3
                      className={`text-lg font-semibold pb-1 mb-3 ${sectionTitle}`}
                    >
                      Education
                    </h3>
                    <div className="space-y-4">
                      {resumeData.education.map((edu, index) => (
                        <div key={edu.id || index} className="space-y-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">
                              {edu.institution || "Institution"}
                            </h4>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="mr-1 h-3 w-3" />
                              <span>
                                {edu.startDate || "Start"} -{" "}
                                {edu.current ? "Present" : edu.endDate || "End"}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span>
                              {edu.degree && (
                                <span className="font-medium">
                                  {edu.degree}
                                </span>
                              )}
                              {edu.degree && edu.field && <span> in </span>}
                              {edu.field && <span>{edu.field}</span>}
                            </span>
                            {edu.location && <span>{edu.location}</span>}
                          </div>

                          {edu.description && (
                            <p className="text-sm mt-1">{edu.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {resumeData.skills && resumeData.skills.length > 0 && (
                  <div>
                    <h3
                      className={`text-lg font-semibold pb-1 mb-3 ${sectionTitle}`}
                    >
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.skills.map((skill, index) => (
                        <div
                          key={skill.id || index}
                          className={`px-3 py-1 rounded-full text-sm ${border} ${accent}`}
                        >
                          {skill.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownload} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
