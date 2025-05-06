import { Suspense } from "react";
import Layout from "@/components/layout/layout";
import ResumeWizard from "@/components/resume-builder/resume-wizard";
import { Loader2 } from "lucide-react";

function ResumeBuilderContent() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Resume</h1>
      <ResumeWizard />
    </div>
  );
}

export default function ResumeBuilderPage() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <ResumeBuilderContent />
      </Suspense>
    </Layout>
  );
}
