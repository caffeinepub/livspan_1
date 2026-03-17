import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/livspan-leaf-transparent.dim_120x120.png"
            alt="LivSpan"
            className="w-12 h-12 object-contain animate-pulse"
          />
          <Loader2 className="w-5 h-5 animate-spin text-green-accent" />
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? <DashboardPage /> : <LandingPage />}
      <Toaster position="top-right" />
    </>
  );
}
