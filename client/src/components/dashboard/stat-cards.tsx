import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type Resume } from "@shared/schema";

export default function StatCards() {
  const { data: resumes, isLoading } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="ml-5 w-full">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate total downloads and average ATS score
  const totalResumes = resumes?.length || 0;
  const totalDownloads =
    resumes?.reduce((sum, resume) => sum + (resume.downloads || 0), 0) || 0;

  const resumesWithScores =
    resumes?.filter((resume) => resume.atsScore !== null) || [];
  const avgScore = resumesWithScores.length
    ? Math.round(
        resumesWithScores.reduce(
          (sum, resume) => sum + (resume.atsScore || 0),
          0
        ) / resumesWithScores.length
      )
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-800 rounded-md p-3">
              <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Total Resumes
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {totalResumes}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-md p-3">
              <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Downloads
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {totalDownloads}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900 rounded-md p-3">
              <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Avg. ATS Score
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {resumesWithScores.length ? `${avgScore}/100` : "No data"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
