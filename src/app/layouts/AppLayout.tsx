import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileTabBar } from "./MobileTabBar";
import { SidebarProvider } from "./sidebarContext";
import { PageLoader } from "@/shared/components/PageLoader";
import { useSyncMe } from "@/modules/auth/hooks/useAuth";

export function AppLayout() {
  // Keeps the cached role / tenant in step with the server for every screen.
  useSyncMe();

  return (
    <SidebarProvider>
      <div className="flex h-full">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />
          {/* `pb-24` below md clears the fixed tab bar and the FAB above it. */}
          <main className="flex-1 overflow-auto bg-background p-4 pb-24 md:p-6 md:pb-6">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
        <MobileTabBar />
      </div>
    </SidebarProvider>
  );
}
