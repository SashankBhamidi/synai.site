
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const getThemeIcon = () => {
    if (theme === "system") {
      return <Monitor size={20} className="transition-transform hover:scale-110" />;
    }
    if (resolvedTheme === "dark") {
      return <Moon size={20} className="transition-transform hover:rotate-12" />;
    }
    return <Sun size={20} className="transition-transform hover:rotate-45" />;
  };
  
  const getThemeLabel = () => {
    switch (theme) {
      case "system":
        return `System (${resolvedTheme})`;
      case "dark":
        return "Dark";
      case "light":
        return "Light";
      default:
        return "Theme";
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full transition-colors"
          title={`Current theme: ${getThemeLabel()}`}
        >
          {getThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
          <Sun size={16} className="mr-2" />
          <span className="flex-1">Light</span>
          {theme === "light" && <Check size={16} className="ml-2" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
          <Moon size={16} className="mr-2" />
          <span className="flex-1">Dark</span>
          {theme === "dark" && <Check size={16} className="ml-2" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
          <Monitor size={16} className="mr-2" />
          <span className="flex-1">System</span>
          {theme === "system" && <Check size={16} className="ml-2" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
