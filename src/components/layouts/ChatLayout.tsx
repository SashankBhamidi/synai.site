
import { ReactNode } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { 
  Sidebar, 
  SidebarContent,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface ChatLayoutProps {
  children: ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="flex h-full w-full">
      <ChatSidebar />
      <SidebarInset className="bg-background">
        <div className="relative w-full h-full">
          {/* Position the trigger in the middle left edge with improved styling */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 z-20">
            <SidebarTrigger className="h-16 w-5 sm:h-20 sm:w-6 rounded-r-lg rounded-l-none bg-background/80 backdrop-blur-md border border-border/20 border-l-0 shadow-lg hover:bg-accent/40 transition-all duration-300 flex items-center justify-center group hover:w-6 sm:hover:w-7 hover:shadow-xl">
              {/* Show different chevron based on sidebar state with subtle styling */}
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground/60 group-hover:text-foreground group-data-[state=expanded]:hidden transition-all duration-200 group-hover:scale-110" />
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground/60 group-hover:text-foreground hidden group-data-[state=expanded]:block transition-all duration-200 group-hover:scale-110" />
              <span className="sr-only">Toggle Sidebar</span>
            </SidebarTrigger>
          </div>
          {children}
        </div>
      </SidebarInset>
    </div>
  );
}
