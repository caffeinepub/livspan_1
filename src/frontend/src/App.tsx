import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import DisclaimerModal, { useDisclaimer } from "./components/DisclaimerModal";
import PaywallScreen from "./components/PaywallScreen";
import { DailyHealthProvider } from "./hooks/useDailyHealth";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { LanguageProvider } from "./hooks/useLanguage";
import { useCheckSubscription } from "./hooks/useQueries";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";

function AuthenticatedApp() {
  const { data: subscription, isLoading, refetch } = useCheckSubscription();
  const { accepted, accept } = useDisclaimer();

  if (isLoading || !subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/uploads/IMG_8398-1.png"
            alt="LivSpan"
            className="w-16 h-16 object-contain animate-pulse"
          />
          <Loader2 className="w-5 h-5 animate-spin text-green-accent" />
        </div>
      </div>
    );
  }

  if (!subscription.isActive) {
    return (
      <PaywallScreen
        onSuccess={() => {
          refetch();
        }}
      />
    );
  }

  return (
    <>
      {!accepted && <DisclaimerModal onAccept={accept} />}
      <DashboardPage expiryDate={subscription.expiryDate} />
    </>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/uploads/IMG_8398-1.png"
            alt="LivSpan"
            className="w-16 h-16 object-contain animate-pulse"
          />
          <Loader2 className="w-5 h-5 animate-spin text-green-accent" />
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <DailyHealthProvider>
        {isAuthenticated ? <AuthenticatedApp /> : <LandingPage />}
        <Toaster position="top-right" />
      </DailyHealthProvider>
    </LanguageProvider>
  );
}
