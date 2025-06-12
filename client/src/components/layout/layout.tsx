import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import MobileNav from "./mobile-nav";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 mb-7 xs:mb-0">
      {/* Sidebar - Only visible on md and up */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>

        {/* Mobile Nav - Only visible on small screens */}
        <MobileNav />
      </div>
    </div>
  );
}
