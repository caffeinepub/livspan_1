import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { RoutineWithStatus } from "../backend.d";
import CheckableCard from "../components/CheckableCard";
import DiaryCard from "../components/DiaryCard";
import FastingCard from "../components/FastingCard";
import InsightsCard from "../components/InsightsCard";
import LongevityScoreCard from "../components/LongevityScoreCard";
import MovementCard from "../components/MovementCard";
import NutritionCard from "../components/NutritionCard";
import PersonalDataCard from "../components/PersonalDataCard";
import PlaceholderCard from "../components/PlaceholderCard";
import RoutineModal from "../components/RoutineModal";
import SleepCard from "../components/SleepCard";
import StressCard from "../components/StressCard";
import { type CardKey, useDailyCardChecks } from "../hooks/useDailyCardChecks";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useLanguage } from "../hooks/useLanguage";
import {
  useClaimFounderLivTokens,
  useCreateRoutine,
  useDeleteRoutine,
  useGetMyLivBalance,
  useGetRoutines,
  useIsAdmin,
  useMarkRoutineDone,
  useMarkRoutineUndone,
  useTransferLiv,
  useUpdateRoutine,
} from "../hooks/useQueries";
import { t } from "../i18n";
import AdminPage from "./AdminPage";

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(date: Date, locale: string) {
  return date.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatExpiryDate(ns: bigint, locale: string) {
  const ms = Number(ns) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function shortenPrincipal(principal: string) {
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 6)}...${principal.slice(-4)}`;
}

function formatLivBalance(balance: bigint): string {
  return Number(balance).toLocaleString();
}

// Wallet dropdown panel component
function WalletDropdown({
  principal,
  onClose,
}: {
  principal: string;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const { data: livBalance, isLoading: livLoading } = useGetMyLivBalance();
  const transferLiv = useTransferLiv();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"main" | "send" | "receive">("main");
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const copyAddress = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr);
      toast.success("Address copied to clipboard");
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const handleSend = async () => {
    if (!sendTo.trim()) return toast.error("Please enter a recipient address");
    const amt = Number.parseInt(sendAmount, 10);
    if (Number.isNaN(amt) || amt <= 0)
      return toast.error("Enter a valid amount");
    try {
      await transferLiv.mutateAsync({ to: sendTo.trim(), amount: BigInt(amt) });
      toast.success(`Sent ${amt} LIV successfully`);
      setSendTo("");
      setSendAmount("");
      setView("main");
    } catch (e: any) {
      toast.error(e?.message ?? "Transfer failed");
    }
  };

  return (
    <div ref={dropdownRef} className="absolute right-0 top-full mt-2 z-50 w-80">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-card border border-border/40 rounded-2xl p-4 shadow-xl"
        data-ocid="wallet.panel"
      >
        {view === "send" ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setView("main")}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-sm font-semibold text-foreground">Send LIV</p>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Recipient Principal
                </p>
                <input
                  type="text"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  placeholder="aaaaa-aa..."
                  className="w-full bg-muted/40 border border-border/30 rounded-xl px-3 py-2 text-xs font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-green-accent/50"
                  data-ocid="wallet.input"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Amount (LIV)
                </p>
                <input
                  type="number"
                  min="1"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-muted/40 border border-border/30 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-green-accent/50"
                  data-ocid="wallet.input"
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={transferLiv.isPending}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.18 148), oklch(0.55 0.16 165))",
                }}
                data-ocid="wallet.primary_button"
              >
                {transferLiv.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                )}
                {transferLiv.isPending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        ) : view === "receive" ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setView("main")}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-sm font-semibold text-foreground">
                Receive LIV
              </p>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Share your principal address to receive LIV tokens:
            </p>
            <div className="flex items-start gap-2 bg-muted/40 rounded-xl p-3 border border-border/30 mb-3">
              <p
                className="font-mono text-xs text-foreground break-all flex-1 select-text leading-relaxed"
                data-ocid="wallet.input"
              >
                {principal}
              </p>
              <button
                type="button"
                onClick={() => copyAddress(principal)}
                className="mt-0.5 shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-green-accent hover:bg-green-accent/10 transition-colors"
                aria-label="Copy address"
                data-ocid="wallet.secondary_button"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-accent/15 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-green-accent" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  My Wallet
                </p>
                <p className="text-xs text-muted-foreground">
                  Internet Identity
                </p>
              </div>
            </div>

            {/* Full address */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                Wallet Address
              </p>
              <div className="flex items-start gap-2 bg-muted/40 rounded-xl p-3 border border-border/30">
                <p
                  className="font-mono text-xs text-foreground break-all flex-1 select-text leading-relaxed"
                  data-ocid="wallet.input"
                >
                  {principal}
                </p>
                <button
                  type="button"
                  onClick={() => copyAddress(principal)}
                  className="mt-0.5 shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-green-accent hover:bg-green-accent/10 transition-colors"
                  aria-label="Copy address"
                  data-ocid="wallet.secondary_button"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* LIV Token balance */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                LIV Token Balance
              </p>
              <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3 border border-border/30">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.65 0.18 148), oklch(0.55 0.16 165))",
                  }}
                >
                  <Coins className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  {livLoading ? (
                    <div
                      className="flex items-center gap-1.5"
                      data-ocid="wallet.loading_state"
                    >
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Loading...
                      </span>
                    </div>
                  ) : (
                    <p className="font-mono text-base font-bold text-foreground">
                      {formatLivBalance(livBalance ?? BigInt(0))}{" "}
                      <span className="text-xs font-semibold text-green-accent">
                        LIV
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">LivSpan Token</p>
                </div>
              </div>
            </div>

            {/* Send / Receive actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setView("send")}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.18 148), oklch(0.55 0.16 165))",
                }}
                data-ocid="wallet.primary_button"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Send
              </button>
              <button
                type="button"
                onClick={() => setView("receive")}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm border border-border/40 text-foreground hover:bg-muted/40 transition-all"
                data-ocid="wallet.secondary_button"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Receive
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

interface DashboardPageProps {
  expiryDate?: bigint;
}

export default function DashboardPage({ expiryDate }: DashboardPageProps) {
  const { clear, identity } = useInternetIdentity();
  const { lang, setLang } = useLanguage();
  const tr = t[lang];
  const locale = lang === "de" ? "de-DE" : "en-US";
  const queryClient = useQueryClient();
  const { data: routines = [], isLoading } = useGetRoutines();
  const { toggle, isChecked } = useDailyCardChecks();

  const createRoutine = useCreateRoutine();
  const updateRoutine = useUpdateRoutine();
  const deleteRoutine = useDeleteRoutine();
  const markDone = useMarkRoutineDone();
  const markUndone = useMarkRoutineUndone();
  const { data: isAdmin = false } = useIsAdmin();
  const { data: livBalanceAuto } = useGetMyLivBalance();
  const autoClaimTokens = useClaimFounderLivTokens();
  const autoClaimRef = useRef(false);
  useEffect(() => {
    if (isAdmin && livBalanceAuto === BigInt(0) && !autoClaimRef.current) {
      autoClaimRef.current = true;
      autoClaimTokens.mutate();
    }
  }, [isAdmin, livBalanceAuto, autoClaimTokens]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] =
    useState<RoutineWithStatus | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [showAdmin, setShowAdmin] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const walletPillRef = useRef<HTMLDivElement>(null);

  const principal = identity?.getPrincipal().toString() ?? "";
  const todayStr = getTodayString();
  const isToday = viewDate.toDateString() === new Date().toDateString();

  const sortedRoutines = [...routines].sort((a, b) =>
    a.time.localeCompare(b.time),
  );

  function getGreetingKey() {
    const h = new Date().getHours();
    if (h < 12) return "greeting_morning";
    if (h < 17) return "greeting_afternoon";
    return "greeting_evening";
  }

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleSave = async (
    title: string,
    time: string,
    description: string,
  ) => {
    try {
      if (editingRoutine) {
        await updateRoutine.mutateAsync({
          id: editingRoutine.id,
          title,
          time,
          description,
        });
        toast.success(tr.routine_updated);
      } else {
        await createRoutine.mutateAsync({ title, time, description });
        toast.success(tr.routine_created);
      }
      setModalOpen(false);
      setEditingRoutine(null);
    } catch {
      toast.error(tr.routine_save_error);
    }
  };

  const handleDelete = async (routine: RoutineWithStatus) => {
    try {
      await deleteRoutine.mutateAsync(routine.id);
      toast.success(tr.routine_deleted);
    } catch {
      toast.error(tr.routine_delete_error);
    }
  };

  const handleToggleDone = async (routine: RoutineWithStatus) => {
    try {
      if (routine.done) {
        await markUndone.mutateAsync(routine.id);
      } else {
        await markDone.mutateAsync({ id: routine.id, date: todayStr });
      }
    } catch {
      toast.error(tr.routine_update_error);
    }
  };

  const openEdit = (routine: RoutineWithStatus) => {
    setEditingRoutine(routine);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditingRoutine(null);
    setModalOpen(true);
  };

  const prevDay = () =>
    setViewDate((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() - 1);
      return n;
    });
  const nextDay = () =>
    setViewDate((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() + 1);
      return n;
    });

  if (showAdmin) {
    return <AdminPage onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.25 0.045 185 / 0.4) 0%, transparent 70%), linear-gradient(160deg, oklch(0.13 0.032 192) 0%, oklch(0.09 0.02 195) 50%, oklch(0.07 0.015 200) 100%)",
      }}
    >
      {/* Announcement bar */}
      <div className="w-full py-2 px-4 text-center text-xs text-muted-foreground border-b border-border/30 bg-muted/20">
        {tr.announcement}
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
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
          <nav className="flex items-center gap-4 text-sm">
            <span
              className="hidden md:inline text-green-accent font-semibold"
              data-ocid="dashboard.tab"
            >
              {tr.nav_dashboard}
            </span>
          </nav>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center gap-1 bg-muted/40 rounded-full p-0.5 border border-border/30">
              <button
                type="button"
                onClick={() => setLang("de")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  lang === "de"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid="dashboard.toggle"
              >
                🇩🇪 DE
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  lang === "en"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid="dashboard.toggle"
              >
                🇬🇧 EN
              </button>
            </div>

            {/* Subscription expiry badge */}
            {expiryDate !== undefined && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/25 text-xs text-gold/90"
                title="Subscription expiry"
                data-ocid="dashboard.panel"
              >
                <CalendarCheck className="w-3 h-3" />
                <span>
                  Access until: {formatExpiryDate(expiryDate, locale)}
                </span>
              </div>
            )}

            {/* Wallet pill — clickable to open dropdown */}
            <div className="relative hidden sm:block" ref={walletPillRef}>
              <button
                type="button"
                onClick={() => setWalletOpen((v) => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                  walletOpen
                    ? "bg-green-accent/10 border-green-accent/40"
                    : "bg-muted/50 border-border/40 hover:border-border/70 hover:bg-muted/70"
                }`}
                aria-label="Open wallet"
                data-ocid="wallet.open_modal_button"
              >
                <Wallet className="w-3.5 h-3.5 text-green-accent" />
                <span className="text-xs text-muted-foreground font-mono">
                  {shortenPrincipal(principal)}
                </span>
              </button>

              <AnimatePresence>
                {walletOpen && (
                  <WalletDropdown
                    principal={principal}
                    isAdmin={isAdmin}
                    onClose={() => setWalletOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdmin(true)}
                className="rounded-full border-gold/50 text-gold hover:bg-gold/10 text-xs gap-1.5"
                data-ocid="admin.open_modal_button"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-full border-border/50 text-muted-foreground hover:text-foreground text-xs"
              data-ocid="dashboard.secondary_button"
            >
              {tr.disconnect}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero greeting */}
      <section className="max-w-6xl mx-auto w-full px-6 pt-10 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-muted-foreground text-sm mb-1">
            {tr[getGreetingKey()]},
          </p>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground">
            {tr.welcome_back}{" "}
            <span
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.76 0.14 148), oklch(0.75 0.1 75))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {shortenPrincipal(principal)}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {tr.hero_sub_dashboard}
          </p>
        </motion.div>
      </section>

      {/* Dashboard content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pb-12">
        <h2 className="font-display font-semibold text-lg text-foreground mb-5">
          {tr.nav_dashboard}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Routines — left wide column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="glass-card rounded-2xl p-6">
              {/* Card header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    {tr.daily_routines}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={prevDay}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted/60 text-muted-foreground transition-colors"
                      data-ocid="routine.pagination_prev"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm text-muted-foreground">
                      {isToday ? tr.today : ""}
                      {formatDateLabel(viewDate, locale)}
                    </span>
                    <button
                      type="button"
                      onClick={nextDay}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted/60 text-muted-foreground transition-colors"
                      data-ocid="routine.pagination_next"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <Button
                  onClick={openCreate}
                  size="sm"
                  className="rounded-full px-4 bg-gold text-primary-foreground hover:opacity-90 font-semibold text-sm"
                  data-ocid="routine.primary_button"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  {tr.add_routine}
                </Button>
              </div>

              {/* Routine list */}
              {isLoading ? (
                <div
                  className="flex items-center justify-center py-16"
                  data-ocid="routine.loading_state"
                >
                  <Loader2 className="w-6 h-6 animate-spin text-green-accent" />
                </div>
              ) : sortedRoutines.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                  data-ocid="routine.empty_state"
                >
                  <div className="w-16 h-16 rounded-2xl bg-green-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-7 h-7 text-green-accent/60" />
                  </div>
                  <p className="text-foreground font-medium mb-1.5">
                    {tr.no_routines}
                  </p>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    {tr.no_routines_sub}
                  </p>
                  <Button
                    onClick={openCreate}
                    className="mt-4 rounded-full px-5 bg-gold text-primary-foreground hover:opacity-90 text-sm font-semibold"
                    data-ocid="routine.primary_button"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    {tr.add_first_routine}
                  </Button>
                </motion.div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div
                    className="absolute left-[46px] top-3 bottom-3 w-0.5 timeline-line"
                    aria-hidden="true"
                  />
                  <div className="space-y-3" data-ocid="routine.list">
                    <AnimatePresence>
                      {sortedRoutines.map((routine, idx) => (
                        <RoutineItem
                          key={String(routine.id)}
                          routine={routine}
                          index={idx + 1}
                          onToggle={() => handleToggleDone(routine)}
                          onEdit={() => openEdit(routine)}
                          onDelete={() => handleDelete(routine)}
                          isToday={isToday}
                          markDoneLabel={tr.mark_done}
                          markUndoneLabel={tr.mark_undone}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <PersonalDataCard />
            <LongevityScoreCard />
            {/* Daily Routine Summary */}
            {(() => {
              const cardKeys: CardKey[] = [
                "fasting",
                "nutrition",
                "movement",
                "stress",
                "sleep",
                "diary",
              ];
              const checkedCount = cardKeys.filter(isChecked).length;
              const allDone = checkedCount === 6;
              return (
                <div
                  className="bg-card border border-border/40 rounded-xl px-4 py-3 flex flex-col gap-2"
                  data-ocid="routines.panel"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {tr.daily_routines}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        allDone ? "text-green-400" : "text-foreground"
                      }`}
                    >
                      {tr.routines_progress(checkedCount)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(checkedCount / 6) * 100}%`,
                        background: allDone
                          ? "oklch(0.76 0.14 148)"
                          : "oklch(0.65 0.12 148 / 0.7)",
                      }}
                    />
                  </div>
                </div>
              );
            })()}
            <CheckableCard
              checked={isChecked("fasting")}
              onToggle={() => toggle("fasting")}
              label={isChecked("fasting") ? tr.mark_undone : tr.mark_done}
            >
              <FastingCard />
            </CheckableCard>
            <CheckableCard
              checked={isChecked("nutrition")}
              onToggle={() => toggle("nutrition")}
              label={isChecked("nutrition") ? tr.mark_undone : tr.mark_done}
            >
              <NutritionCard />
            </CheckableCard>
            <CheckableCard
              checked={isChecked("movement")}
              onToggle={() => toggle("movement")}
              label={isChecked("movement") ? tr.mark_undone : tr.mark_done}
            >
              <MovementCard />
            </CheckableCard>
            <CheckableCard
              checked={isChecked("stress")}
              onToggle={() => toggle("stress")}
              label={isChecked("stress") ? tr.mark_undone : tr.mark_done}
            >
              <StressCard />
            </CheckableCard>
            <CheckableCard
              checked={isChecked("sleep")}
              onToggle={() => toggle("sleep")}
              label={isChecked("sleep") ? tr.mark_undone : tr.mark_done}
            >
              <SleepCard />
            </CheckableCard>
            <CheckableCard
              checked={isChecked("diary")}
              onToggle={() => toggle("diary")}
              label={isChecked("diary") ? tr.mark_undone : tr.mark_done}
            >
              <DiaryCard />
            </CheckableCard>
            <PlaceholderCard
              title={tr.biomarkers_title}
              icon={<Activity className="w-5 h-5" />}
              description={tr.biomarkers_desc}
            />
            <InsightsCard />
          </motion.div>
        </div>
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

      <RoutineModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRoutine(null);
        }}
        onSave={handleSave}
        routine={editingRoutine}
        isSaving={createRoutine.isPending || updateRoutine.isPending}
      />
    </div>
  );
}

interface RoutineItemProps {
  routine: RoutineWithStatus;
  index: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isToday: boolean;
  markDoneLabel: string;
  markUndoneLabel: string;
}

function RoutineItem({
  routine,
  index,
  onToggle,
  onEdit,
  onDelete,
  isToday,
  markDoneLabel,
  markUndoneLabel,
}: RoutineItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-4 group"
      data-ocid={`routine.item.${index}`}
    >
      {/* Time + node */}
      <div className="flex flex-col items-center w-10 shrink-0 pt-1">
        <span className="text-xs text-muted-foreground font-mono mb-1 leading-none">
          {routine.time}
        </span>
        <div
          className={`w-3.5 h-3.5 rounded-full border-2 z-10 transition-all duration-300 ${
            routine.done
              ? "border-green-accent bg-green-accent"
              : "border-border bg-background"
          }`}
        />
      </div>

      {/* Routine card */}
      <div
        className={`flex-1 rounded-xl p-3.5 border transition-all duration-200 ${
          routine.done
            ? "bg-green-accent/8 border-green-accent/25 opacity-70"
            : "bg-muted/30 border-border/40 hover:border-border/70 hover:bg-muted/50"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Checkbox */}
            <button
              type="button"
              onClick={onToggle}
              disabled={!isToday}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                routine.done
                  ? "border-green-accent bg-green-accent"
                  : "border-border/60 hover:border-green-accent/70"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label={routine.done ? markUndoneLabel : markDoneLabel}
              data-ocid={`routine.checkbox.${index}`}
            >
              {routine.done && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="animate-check-pop"
                >
                  <Check
                    className="w-3 h-3 text-primary-foreground"
                    strokeWidth={3}
                  />
                </motion.div>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm leading-snug ${
                  routine.done
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {routine.title}
              </p>
              {routine.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {routine.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Edit routine"
              data-ocid={`routine.edit_button.${index}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Delete routine"
              data-ocid={`routine.delete_button.${index}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
