import { Button } from "@/components/ui/button";
import {
  Activity,
  ChevronDown,
  Loader2,
  Shield,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../i18n";

const LANGS = [
  { code: "de" as const, flag: "🇩🇪", label: "DE" },
  { code: "en" as const, flag: "🇬🇧", label: "EN" },
  { code: "ru" as const, flag: "🇷🇺", label: "RU" },
  { code: "zh" as const, flag: "🇨🇳", label: "ZH" },
];

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();
  const { lang, setLang } = useLanguage();
  const tr = t[lang];
  const isLoggingIn = loginStatus === "logging-in";
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGS.find((l) => l.code === lang) ?? LANGS[0];

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
      icon: <Activity className="w-5 h-5" />,
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/assets/uploads/IMG_8398-1.png"
              alt="LivSpan leaf"
              className="w-9 h-9 object-contain"
            />
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              LivSpan
            </span>
          </div>

          {/* Nav + Language selector */}
          <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <span className="text-green-accent font-medium">{tr.nav_home}</span>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop language toggle - 4 pill buttons */}
            <div className="hidden md:flex items-center gap-1 bg-muted/40 rounded-full p-0.5 border border-border/30">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    lang === l.code
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid="landing.toggle"
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>

            {/* Mobile language dropdown */}
            <div className="relative md:hidden" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-muted/40 border border-border/30 text-foreground hover:bg-muted/60 transition-colors"
                data-ocid="landing.toggle"
              >
                <span>{currentLang.flag}</span>
                <span>{currentLang.label}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`}
                />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-background border border-border/40 rounded-xl shadow-lg overflow-hidden z-50 min-w-[80px]">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLang(l.code);
                        setLangOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/60 ${
                        lang === l.code
                          ? "text-foreground bg-muted/40"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              data-ocid="landing.primary_button"
              onClick={login}
              disabled={isLoggingIn}
              className="bg-green-accent text-background hover:bg-green-accent/90 font-semibold text-sm px-4 sm:px-5 shrink-0"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">{tr.connecting}</span>
                </>
              ) : (
                <span>{tr.connect_wallet}</span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto"
        >
          <div className="mb-6 flex justify-center">
            <img
              src="/assets/uploads/IMG_8398-1.png"
              alt="LivSpan"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-green-accent mb-4">
            {tr.tagline}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-3">
            {tr.hero_title_1}
          </h1>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-muted-foreground mb-6">
            {tr.hero_title_2}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto">
            {tr.hero_sub}
          </p>
          <Button
            data-ocid="landing.connect_button"
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="bg-green-accent text-background hover:bg-green-accent/90 font-semibold px-8 py-3 text-base rounded-xl"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {tr.connecting}
              </>
            ) : (
              tr.connect_wallet_start
            )}
          </Button>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl w-full"
        >
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-5 text-left">
              <div className="w-9 h-9 rounded-lg bg-green-accent/15 flex items-center justify-center text-green-accent mb-3">
                {f.icon}
              </div>
              <h3 className="font-display font-semibold text-foreground text-sm mb-1.5">
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
