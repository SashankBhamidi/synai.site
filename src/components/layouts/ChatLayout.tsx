
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
          <div className="absolute top-1/2 -translate-y-1/2 left-0 z-10">
            <SidebarTrigger className="h-20 w-6 rounded-r-md rounded-l-none bg-background/20 backdrop-blur-sm border border-border/10 border-l-0 shadow-sm hover:bg-accent/30 transition-colors duration-200 flex items-center justify-center group">
              {/* Show different chevron based on sidebar state with subtle styling */}
              <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-foreground/80 group-data-[state=expanded]:hidden transition-all" />
              <ChevronLeft className="size-4 text-muted-foreground/40 group-hover:text-foreground/80 hidden group-data-[state=expanded]:block transition-all" />
              <span className="sr-only">Toggle Sidebar</span>
            </SidebarTrigger>
          </div>
          {children}
        </div>
      </SidebarInset>
    </div>
  );
}
