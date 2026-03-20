import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin, useUserProfile } from "./hooks/useQueries";
import AdminPanel from "./pages/AdminPanel";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();

  if (isInitializing || (isAuthenticated && (adminLoading || profileLoading))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  if (isAdmin) {
    return (
      <>
        <AdminPanel />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <StudentDashboard profile={userProfile ?? null} />
      <Toaster />
    </>
  );
}
