import { useState } from "react";
import Layout from "@/components/layout/layout";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import StatCards from "@/components/dashboard/stat-cards";
import ResumesList from "@/components/dashboard/resumes-list";
import ResumeBuilderCard from "@/components/dashboard/resume-builder-card";
import AIAssistantCard from "@/components/dashboard/ai-assistant-card";

export default function HomePage() {
  return (
    <Layout>
      <div className="space-y-6">
        <DashboardHeader />
        
        <StatCards />
        
        <ResumesList />
        
        <ResumeBuilderCard />
        
        <AIAssistantCard />
      </div>
    </Layout>
  );
}
