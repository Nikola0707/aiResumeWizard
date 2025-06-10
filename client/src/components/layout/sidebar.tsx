import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Home,
  FileText,
  FilePlus,
  Wand2,
  BarChart2,
  Settings,
  FileX,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { name: "Dashboard", icon: Home, path: "/" },
    { name: "My Resumes", icon: FileText, path: "/resumes" },
    { name: "Create New", icon: FilePlus, path: "/builder" },
    {
      name: "AI Assistant",
      icon: Wand2,
      path: "/ai-assistant",
      comingSoon: true,
    },
    {
      name: "Analytics",
      icon: BarChart2,
      path: "/analytics",
      comingSoon: true,
    },
    { name: "Settings", icon: Settings, path: "/settings", comingSoon: true },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <span className="ml-2 font-semibold text-lg">Resume AI</span>
          </div>
          <button
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            onClick={onClose}
          >
            <FileX className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => {
              const isActive = location === item.path;
              const menuItem = (
                <div
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                    item.comingSoon && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 mr-3",
                      isActive
                        ? "text-primary-500 dark:text-primary-400"
                        : "text-gray-400 dark:text-gray-500"
                    )}
                  />
                  {item.name}
                </div>
              );

              if (item.comingSoon) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <span>{menuItem}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Coming Soon</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link key={item.name} href={item.path} onClick={onClose}>
                  {menuItem}
                </Link>
              );
            })}
          </TooltipProvider>
        </nav>

        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {user?.name || user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Free Plan
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
