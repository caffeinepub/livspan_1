import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { RoutineWithStatus } from "../backend.d";
import PlaceholderCard from "../components/PlaceholderCard";
import RoutineModal from "../components/RoutineModal";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateRoutine,
  useDeleteRoutine,
  useGetRoutines,
  useMarkRoutineDone,
  useMarkRoutineUndone,
  useUpdateRoutine,
} from "../hooks/useQueries";

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function shortenPrincipal(principal: string) {
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 6)}...${principal.slice(-4)}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function DashboardPage() {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: routines = [], isLoading } = useGetRoutines();

  const createRoutine = useCreateRoutine();
  const updateRoutine = useUpdateRoutine();
  const deleteRoutine = useDeleteRoutine();
  const markDone = useMarkRoutineDone();
  const markUndone = useMarkRoutineUndone();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] =
    useState<RoutineWithStatus | null>(null);
  const [viewDate, setViewDate] = useState(new Date());

  const principal = identity?.getPrincipal().toString() ?? "";
  const todayStr = getTodayString();
  const isToday = viewDate.toDateString() === new Date().toDateString();

  const sortedRoutines = [...routines].sort((a, b) =>
    a.time.localeCompare(b.time),
  );

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
        toast.success("Routine updated");
      } else {
        await createRoutine.mutateAsync({ title, time, description });
        toast.success("Routine created");
      }
      setModalOpen(false);
      setEditingRoutine(null);
    } catch {
      toast.error("Failed to save routine");
    }
  };

  const handleDelete = async (routine: RoutineWithStatus) => {
    try {
      await deleteRoutine.mutateAsync(routine.id);
      toast.success("Routine deleted");
    } catch {
      toast.error("Failed to delete routine");
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
      toast.error("Failed to update routine");
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
        LivSpan — Premium Wellness &amp; Longevity Platform
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
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
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <span
              className="text-green-accent font-semibold"
              data-ocid="dashboard.tab"
            >
              Dashboard
            </span>
            <span className="text-muted-foreground hover:text-foreground transition-colors cursor-default">
              Journeys
            </span>
            <span className="text-muted-foreground hover:text-foreground transition-colors cursor-default">
              Library
            </span>
            <span className="text-muted-foreground hover:text-foreground transition-colors cursor-default">
              Community
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/40">
              <Wallet className="w-3.5 h-3.5 text-green-accent" />
              <span className="text-xs text-muted-foreground font-mono">
                {shortenPrincipal(principal)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-full border-border/50 text-muted-foreground hover:text-foreground text-xs"
              data-ocid="dashboard.secondary_button"
            >
              Disconnect
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
            Good {getGreeting()},
          </p>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground">
            Welcome back,{" "}
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
            Track your daily routines and optimize your longevity.
          </p>
        </motion.div>
      </section>

      {/* Dashboard content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pb-12">
        <h2 className="font-display font-semibold text-lg text-foreground mb-5">
          Dashboard
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
                    Daily Routines
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
                      {isToday ? "Today, " : ""}
                      {formatDateLabel(viewDate)}
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
                  Add Routine
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
                    No routines yet
                  </p>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Start building your longevity practice. Add your first daily
                    routine.
                  </p>
                  <Button
                    onClick={openCreate}
                    className="mt-4 rounded-full px-5 bg-gold text-primary-foreground hover:opacity-90 text-sm font-semibold"
                    data-ocid="routine.primary_button"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add First Routine
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
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right sidebar — placeholder cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <PlaceholderCard
              title="Biomarkers"
              icon={<Activity className="w-5 h-5" />}
              description="Track HRV, blood glucose, VO2 max, and other key health biomarkers to understand your longevity score."
            />
            <PlaceholderCard
              title="Recent Insights"
              icon={<BookOpen className="w-5 h-5" />}
              description="AI-powered insights based on your routine consistency and biomarker trends."
            />
            <PlaceholderCard
              title="Upcoming Journey"
              icon={<MapPin className="w-5 h-5" />}
              description="Science-backed longevity programs tailored to your health profile and goals."
            />
          </motion.div>
        </div>
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
}

function RoutineItem({
  routine,
  index,
  onToggle,
  onEdit,
  onDelete,
  isToday,
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
              aria-label={routine.done ? "Mark as undone" : "Mark as done"}
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
                className={`font-medium text-sm leading-snug truncate ${
                  routine.done
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {routine.title}
              </p>
              {routine.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
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
