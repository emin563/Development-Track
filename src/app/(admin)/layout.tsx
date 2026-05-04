import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TooltipProvider>
            <SidebarProvider>
                <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <div className="flex w-full flex-col">
                        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-6">
                            <SidebarTrigger />
                            <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
                        </header>
                        <main className="flex-1 p-6">
                            {children}
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </TooltipProvider>
    );
}
