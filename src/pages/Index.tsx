
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatLayout } from "@/components/layouts/ChatLayout";
import { ChatInterface } from "@/components/ChatInterface";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  // On mobile, start with the sidebar closed
  const isMobile = useIsMobile();
  const defaultOpen = !isMobile;
  
  return (
    <div className="h-screen bg-background text-foreground">
      <SidebarProvider defaultOpen={defaultOpen}>
        <ChatLayout>
          <ChatInterface />
        </ChatLayout>
      </SidebarProvider>
    </div>
  );
};

export default Index;
