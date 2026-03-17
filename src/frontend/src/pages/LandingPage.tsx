import { Button } from "@/components/ui/button";
import { Loader2, Shield, TrendingUp, Wallet, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Daily Routines",
    desc: "Build powerful habits with time-tracked daily routines that reset each morning.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Biomarker Tracking",
    desc: "Monitor key health metrics and visualize your longevity trajectory over time.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Longevity Journeys",
    desc: "Science-backed programs to extend healthspan, guided by expert protocols.",
  },
];

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.25 0.045 185 / 0.5) 0%, transparent 70%), linear-gradient(160deg, oklch(0.13 0.032 192) 0%, oklch(0.09 0.02 195) 50%, oklch(0.07 0.015 200) 100%)",
      }}
    >
      {/* Announcement bar */}
      <div className="w-full py-2 px-4 text-center text-xs text-muted-foreground border-b border-border/30 bg-muted/20">
        LivSpan — A premium wellness &amp; longevity platform built on Web3
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/generated/livspan-leaf-transparent.dim_120x120.png"
              alt="LivSpan leaf"
              className="w-7 h-7 object-contain"
            />
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              LivSpan
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <span className="text-green-accent font-medium">Home</span>
            <span className="hover:text-foreground transition-colors cursor-default">
              Journeys
            </span>
            <span className="hover:text-foreground transition-colors cursor-default">
              Library
            </span>
            <span className="hover:text-foreground transition-colors cursor-default">
              Community
            </span>
          </nav>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="rounded-full px-5 bg-gold text-primary-foreground hover:opacity-90 font-semibold text-sm"
            data-ocid="landing.primary_button"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-accent/30 bg-green-accent/10 text-green-accent text-xs font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Powered by the LivSpan Token
          </div>

          <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-6">
            Optimize Your Lifespan.
            <br />
            <span
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.76 0.14 148), oklch(0.75 0.1 75))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Live Better, Longer.
            </span>
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto mb-10">
            LivSpan is the world's first Web3-native wellness platform combining
            daily habit tracking, biomarker analysis, and longevity science —
            authenticated securely via your wallet.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              size="lg"
              className="rounded-full px-8 py-6 text-base font-semibold bg-gold text-primary-foreground hover:opacity-90 shadow-glow"
              data-ocid="landing.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet to Start
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full mt-20"
        >
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-5 text-left">
              <div className="w-9 h-9 rounded-xl bg-green-accent/15 flex items-center justify-center text-green-accent mb-3">
                {f.icon}
              </div>
              <h3 className="font-display font-semibold text-sm text-foreground mb-1.5">
                {f.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/30 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/livspan-leaf-transparent.dim_120x120.png"
              alt="LivSpan"
              className="w-4 h-4 object-contain opacity-60"
            />
            <span>LivSpan</span>
          </div>
          <span>
            © {new Date().getFullYear()}. Built with{" "}
            <span className="text-red-400">♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline underline-offset-2"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
