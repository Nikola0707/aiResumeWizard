import { useLocation, Link } from "wouter";
import { Home, FileText, PlusCircle, Wand2, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();
  
  const navItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Resumes", icon: FileText, path: "/resumes" },
    { name: "Create", icon: PlusCircle, path: "/builder" },
    { name: "AI", icon: Wand2, path: "/ai-assistant" },
    { name: "Profile", icon: User, path: "/profile" },
  ];
  
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className="flex flex-col items-center justify-center"
            >
              <item.icon className={cn(
                "text-lg",
                isActive 
                  ? "text-primary-600 dark:text-primary-400" 
                  : "text-gray-500 dark:text-gray-400"
              )} />
              <span className={cn(
                "text-xs mt-1",
                isActive 
                  ? "text-primary-600 dark:text-primary-400" 
                  : "text-gray-500 dark:text-gray-400"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
