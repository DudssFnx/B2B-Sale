import { AppSidebar } from "../AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  return (
    <SidebarProvider>
      <div className="flex h-[400px] w-full">
        <AppSidebar 
          userRole="admin" 
          userName="John Admin"
          onLogout={() => console.log("Logout clicked")}
        />
        <div className="flex-1 p-4">
          <SidebarTrigger />
          <p className="mt-4 text-muted-foreground">Main content area</p>
        </div>
      </div>
    </SidebarProvider>
  );
}
