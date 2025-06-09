import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, FileText, Briefcase, GraduationCap, Award } from "lucide-react";
import { ResumeTemplate } from "@shared/schema";
import { resumeTemplates } from "@/lib/resume-data";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TemplateCardProps {
  name: string;
  description: string;
  selected: boolean;
  template: ResumeTemplate;
  onSelect: (template: ResumeTemplate) => void;
}

function TemplateCard({
  name,
  description,
  selected,
  template,
  onSelect,
}: TemplateCardProps) {
  // Define template-specific colors and styles
  const templateStyles: Record<
    ResumeTemplate,
    {
      bg: string;
      border: string;
      headerBg: string;
      accentColor: string;
      layout: "standard" | "modern" | "creative" | "minimal" | "elegant";
    }
  > = {
    modern: {
      bg: "bg-primary-50 dark:bg-primary-900",
      border: "border-primary-200 dark:border-primary-800",
      headerBg: "bg-primary-500",
      accentColor: "bg-primary-500",
      layout: "modern",
    },
    professional: {
      bg: "bg-blue-50 dark:bg-blue-900",
      border: "border-blue-200 dark:border-blue-800",
      headerBg: "bg-blue-600",
      accentColor: "bg-blue-500",
      layout: "standard",
    },
    creative: {
      bg: "bg-purple-50 dark:bg-purple-900",
      border: "border-purple-200 dark:border-purple-800",
      headerBg: "bg-purple-600",
      accentColor: "bg-purple-500",
      layout: "creative",
    },
    simple: {
      bg: "bg-gray-50 dark:bg-gray-800",
      border: "border-gray-200 dark:border-gray-700",
      headerBg: "bg-gray-700",
      accentColor: "bg-gray-500",
      layout: "minimal",
    },
    elegant: {
      bg: "bg-amber-50 dark:bg-amber-900",
      border: "border-amber-200 dark:border-amber-800",
      headerBg: "bg-amber-600",
      accentColor: "bg-amber-500",
      layout: "elegant",
    },
  };

  const { bg, border, headerBg, accentColor, layout } =
    templateStyles[template];

  const renderTemplatePreview = () => {
    switch (layout) {
      case "modern":
        return (
          <div className="absolute inset-0 flex flex-col">
            {/* Modern: Sidebar layout */}
            <div className="flex h-full">
              <div className={`w-1/3 ${headerBg} p-3`}>
                <div className="h-3 w-2/3 rounded-full bg-white/20 mb-2"></div>
                <div className="h-2 w-4/5 rounded-full bg-white/20 mb-4"></div>
                <div className="h-2 w-3/4 rounded-full bg-white/20 mb-2"></div>
                <div className="h-2 w-2/3 rounded-full bg-white/20"></div>
              </div>
              <div className="flex-1 p-3 bg-white dark:bg-gray-950">
                <div className="h-3 w-1/2 rounded-full bg-gray-200 dark:bg-gray-700 mb-2"></div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
                <div className="h-2 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700 mb-2"></div>
                <div className="h-2 w-2/3 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        );

      case "creative":
        return (
          <div className="absolute inset-0 flex flex-col">
            {/* Creative: Asymmetric layout */}
            <div className={`h-1/4 ${headerBg} p-3`}>
              <div className="h-3 w-1/2 rounded-full bg-white/20 mb-2"></div>
              <div className="h-2 w-3/4 rounded-full bg-white/20"></div>
            </div>
            <div className="flex-1 p-3 bg-white dark:bg-gray-950">
              <div className="flex gap-3">
                <div className="w-2/3">
                  <div className="h-3 w-1/3 rounded-full bg-gray-200 dark:bg-gray-700 mb-2"></div>
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 mb-2"></div>
                  <div className="h-2 w-4/5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="w-1/3">
                  <div className="h-3 w-2/3 rounded-full bg-gray-200 dark:bg-gray-700 mb-2"></div>
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </div>
            </div>
          </div>
        );

      case "minimal":
        return (
          <div className="absolute inset-0 flex flex-col">
            {/* Simple: Clean, minimal layout */}
            <div className="p-3 bg-white dark:bg-gray-950">
              <div className="h-3 w-1/3 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 mb-2"></div>
              <div className="h-2 w-4/5 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
              <div className="h-2 w-2/3 rounded-full bg-gray-200 dark:bg-gray-700 mb-2"></div>
              <div className="h-2 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        );

      case "elegant":
        return (
          <div className="absolute inset-0 flex flex-col">
            {/* Elegant: Classic layout with decorative elements */}
            <div className="p-3 bg-white dark:bg-gray-950">
              <div className="flex items-center mb-4">
                <div className="h-3 w-1/4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-px flex-1 mx-2 bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 mb-2"></div>
              <div className="h-2 w-4/5 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
              <div className="flex items-center mb-4">
                <div className="h-3 w-1/4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-px flex-1 mx-2 bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="h-2 w-2/3 rounded-full bg-gray-200 dark:bg-gray-700 mb-2"></div>
              <div className="h-2 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        );

      default: // standard/professional
        return (
          <div className="absolute inset-0 flex flex-col">
            {/* Professional: Traditional layout */}
            <div className={`h-1/5 ${headerBg} p-3`}>
              <div className="h-3 w-1/2 rounded-full bg-white/20 mb-2"></div>
              <div className="h-2 w-3/4 rounded-full bg-white/20"></div>
            </div>
            <div className="flex-1 p-3 bg-white dark:bg-gray-950">
              <div className="h-3 w-1/3 rounded-full bg-gray-200 dark:bg-gray-700 mb-2"></div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
              <div className="h-2 w-4/5 rounded-full bg-gray-200 dark:bg-gray-700 mb-2"></div>
              <div className="h-2 w-2/3 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        );
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all ${
        selected
          ? `${border} ring-2 ring-primary-500 dark:ring-primary-400`
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
      onClick={() => onSelect(template)}
    >
      <CardContent className="p-0">
        <div
          className={`${bg} p-4 ${
            selected ? "dark:bg-opacity-30" : "dark:bg-opacity-20"
          }`}
        >
          <div className="relative aspect-[8.5/11] rounded border bg-white dark:bg-gray-950 shadow-sm overflow-hidden mb-3">
            {renderTemplatePreview()}

            {/* Selection overlay */}
            {selected && (
              <div className="absolute inset-0 bg-primary-500 bg-opacity-20 dark:bg-opacity-40 flex items-center justify-center">
                <div className="bg-primary-500 text-white rounded-full p-2">
                  <Check className="h-6 w-6" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface TemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (template: string) => void;
}

export default function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const [previewType, setPreviewType] = useState<"grid" | "list">("grid");

  const templateKeys = Object.keys(resumeTemplates) as ResumeTemplate[];

  return (
    <div className="space-y-6">
      <Alert className="bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800">
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Choose a template that suits your industry and personal style. Each
          template is fully ATS-compatible.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end mb-4">
        <Tabs
          value={previewType}
          onValueChange={(v) => setPreviewType(v as "grid" | "list")}
        >
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {previewType === "grid" ? (
        // Grid view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templateKeys.map((template) => (
            <TemplateCard
              key={template}
              name={resumeTemplates[template].name}
              description={resumeTemplates[template].description}
              template={template}
              selected={selectedTemplate === template}
              onSelect={() => onSelectTemplate(template)}
            />
          ))}
        </div>
      ) : (
        // List view
        <div className="space-y-3">
          {templateKeys.map((template) => (
            <Card
              key={template}
              className={`cursor-pointer transition-all ${
                selectedTemplate === template
                  ? `border-primary-500 ring-2 ring-primary-500 dark:border-primary-400 dark:ring-primary-400`
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {resumeTemplates[template].name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {resumeTemplates[template].description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-1">
                      {template === "professional" && (
                        <Briefcase className="h-4 w-4 text-blue-500" />
                      )}
                      {template === "creative" && (
                        <Award className="h-4 w-4 text-purple-500" />
                      )}
                      {template === "modern" && (
                        <FileText className="h-4 w-4 text-primary-500" />
                      )}
                      {template === "elegant" && (
                        <GraduationCap className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    {selectedTemplate === template && (
                      <div className="h-6 w-6 bg-primary-500 text-white rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
