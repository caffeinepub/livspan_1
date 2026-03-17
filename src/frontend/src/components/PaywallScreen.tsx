import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Loader2, Lock, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useActivateSubscription } from "../hooks/useQueries";

const PAYMENT_ADDRESS =
  "5677f79bb400519598c0e75be936cafc391a930d21268d6fcf1eee3cb5c9d582";

export default function PaywallScreen({
  onSuccess,
}: { onSuccess: () => void }) {
  const { lang, setLang } = useLanguage();
  const activate = useActivateSubscription();

  const [blockIndex, setBlockIndex] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const de = lang === "de";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(PAYMENT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setError(null);
    const parsed = BigInt(blockIndex.trim());
    try {
      await activate.mutateAsync(parsed);
      setSuccess(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (e: any) {
      setError(
        e?.message ??
          (de ? "Verifizierung fehlgeschlagen." : "Verification failed."),
      );
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.25 0.045 185 / 0.5) 0%, transparent 70%), linear-gradient(160deg, oklch(0.13 0.032 192) 0%, oklch(0.09 0.02 195) 50%, oklch(0.07 0.015 200) 100%)",
      }}
    >
      {/* Minimal header */}
      <header className="w-full border-b border-border/30 bg-background/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/generated/livspan-leaf-transparent.dim_120x120.png"
              alt="LivSpan"
              className="w-7 h-7 object-contain"
            />
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              LivSpan
            </span>
          </div>
          <div className="flex items-center rounded-full border border-border/50 bg-muted/30 overflow-hidden text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLang("de")}
              className={`px-3 py-1.5 transition-colors ${
                lang === "de"
                  ? "bg-green-accent/20 text-green-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="paywall.toggle"
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
              data-ocid="paywall.toggle"
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Paywall card */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-lg"
          data-ocid="paywall.card"
        >
          <div className="glass-card rounded-2xl p-8 border border-border/40">
            {/* Icon + title */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center mb-4">
                <Lock className="w-7 h-7 text-gold" />
              </div>
              <h1 className="font-display font-bold text-2xl text-foreground mb-2">
                {de ? "Zugang freischalten" : "Unlock Access"}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                {de
                  ? "Erhalte 12 Monate Zugang zur LivSpan App für 1 ICP."
                  : "Get 12 months access to LivSpan App for 1 ICP."}
              </p>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6"
                data-ocid="paywall.success_state"
              >
                <div className="w-14 h-14 rounded-full bg-green-accent/20 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-green-accent" />
                </div>
                <p className="font-semibold text-foreground">
                  {de ? "Zugang aktiviert!" : "Access activated!"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {de
                    ? "Du wirst weitergeleitet…"
                    : "Redirecting to dashboard…"}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Step 1 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {de
                        ? "Sende genau 1 ICP an diese Adresse:"
                        : "Send exactly 1 ICP to this address:"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 border border-border/50 px-3 py-2.5">
                    <code className="flex-1 text-xs font-mono text-foreground/80 break-all leading-relaxed">
                      {PAYMENT_ADDRESS}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      aria-label={de ? "Adresse kopieren" : "Copy address"}
                      data-ocid="paywall.primary_button"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-accent" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {de
                        ? "Gib die Block-Index deiner Transaktion ein:"
                        : "Enter the block index of your transaction:"}
                    </span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    placeholder={
                      de
                        ? "Block Index / Transaktions-ID"
                        : "Block Index / Transaction ID"
                    }
                    value={blockIndex}
                    onChange={(e) => setBlockIndex(e.target.value)}
                    className="bg-muted/30 border-border/50 font-mono"
                    data-ocid="paywall.input"
                  />
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
                    data-ocid="paywall.error_state"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Verify button */}
                <Button
                  onClick={handleVerify}
                  disabled={!blockIndex.trim() || activate.isPending}
                  className="w-full rounded-xl py-5 font-semibold bg-gold text-primary-foreground hover:opacity-90 shadow-glow"
                  data-ocid="paywall.submit_button"
                >
                  {activate.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {de ? "Verifiziere…" : "Verifying…"}
                    </>
                  ) : de ? (
                    "Zahlung verifizieren"
                  ) : (
                    "Verify Payment"
                  )}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <footer className="w-full border-t border-border/30 py-5 px-6">
        <div className="max-w-6xl mx-auto text-center text-xs text-muted-foreground">
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
        </div>
      </footer>
    </div>
  );
}
