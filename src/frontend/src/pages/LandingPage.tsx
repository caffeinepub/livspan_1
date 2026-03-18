import { Button } from "@/components/ui/button";
import { Loader2, Shield, TrendingUp, Wallet, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../i18n";

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();
  const { lang, setLang } = useLanguage();
  const tr = t[lang];
  const isLoggingIn = loginStatus === "logging-in";

  const features = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: tr.feature_routines_title,
      desc: tr.feature_routines_desc,
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: tr.feature_biomarker_title,
      desc: tr.feature_biomarker_desc,
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: tr.feature_journeys_title,
      desc: tr.feature_journeys_desc,
    },
  ];

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
        {tr.announcement}
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/uploads/IMG_8398-1.png"
              alt="LivSpan leaf"
              className="w-7 h-7 object-contain"
            />
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              LivSpan
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <span className="text-green-accent font-medium">{tr.nav_home}</span>
            <span className="hover:text-foreground transition-colors cursor-default">
              {tr.nav_journeys}
            </span>
          </nav>
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center rounded-full border border-border/50 bg-muted/30 overflow-hidden text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLang("de")}
                className={`px-3 py-1.5 transition-colors ${
                  lang === "de"
                    ? "bg-green-accent/20 text-green-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid="landing.toggle"
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 transition-colors ${
                  lang === "en"
                    ? "bg-green-accent/20 text-green-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid="landing.toggle"
              >
                EN
              </button>
            </div>
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="rounded-full px-5 bg-gold text-primary-foreground hover:opacity-90 font-semibold text-sm"
              data-ocid="landing.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {tr.connecting}
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  {tr.connect_wallet}
                </>
              )}
            </Button>
          </div>
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
            {tr.tagline}
          </div>

          <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-6">
            {tr.hero_title_1}
            <br />
            <span
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.76 0.14 148), oklch(0.75 0.1 75))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {tr.hero_title_2}
            </span>
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto mb-10">
            {tr.hero_sub}
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
                  {tr.connecting}
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  {tr.connect_wallet_start}
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
              src="/assets/uploads/IMG_8398-1.png"
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
