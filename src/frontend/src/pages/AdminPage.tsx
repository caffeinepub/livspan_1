import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Principal } from "@dfinity/principal";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Copy,
  Loader2,
  RefreshCw,
  Shield,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../hooks/useLanguage";
import {
  useAdminActivateSubscription,
  useAdminSubscriptionList,
} from "../hooks/useQueries";

interface AdminPageProps {
  onBack: () => void;
}

function formatDate(ns: bigint, locale: string) {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function shortenPrincipal(p: string) {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}...${p.slice(-6)}`;
}

export default function AdminPage({ onBack }: AdminPageProps) {
  const { lang } = useLanguage();
  const locale = "en-US";
  const [principalInput, setPrincipalInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activatedList, setActivatedList] = useState<
    { principal: string; activatedAt: Date }[]
  >([]);

  const activateMutation = useAdminActivateSubscription();
  const {
    data: subscriptionList = [],
    isLoading: listLoading,
    refetch: refetchList,
    isFetching: listFetching,
  } = useAdminSubscriptionList();

  const tr = {
    de: {
      title: "Admin-Bereich",
      subtitle: "Abonnementverwaltung",
      back: "Zur\u00fcck",
      activate_title: "Abonnement manuell freischalten",
      activate_desc:
        "Gib die Principal ID des Nutzers ein, um den Zugang f\u00fcr 12 Monate zu aktivieren.",
      principal_label: "Principal ID",
      principal_placeholder: "z.B. aaaaa-aa",
      activate_button: "Freischalten",
      activating: "Freischalten...",
      history_title: "Manuell freigeschaltet (diese Sitzung)",
      history_empty: "Noch keine manuellen Freischaltungen in dieser Sitzung.",
      col_principal: "Principal",
      col_activated: "Freigeschaltet um",
      success: "Abonnement erfolgreich aktiviert!",
      error_invalid: "Ung\u00fcltige Principal ID.",
      all_subs_title: "Alle Abonnements",
      all_subs_desc:
        "\u00dcbersicht aller aktiven und abgelaufenen Zug\u00e4nge.",
      liv_auto_note:
        "Jedes neue Abonnement erh\u00e4lt automatisch 1 LIV-Token aus deiner Wallet.",
      col_user: "Nutzer (Principal)",
      col_expiry: "Ablaufdatum",
      col_status: "Status",
      status_active: "Aktiv",
      status_expired: "Abgelaufen",
      no_subs: "Noch keine Abonnements vorhanden.",
      refresh: "Aktualisieren",
      total: "Gesamt",
      active_count: "Aktiv",
      expired_count: "Abgelaufen",
      copied: "Kopiert!",
      copy_all: "Alle Adressen kopieren",
    },
    en: {
      title: "Admin Area",
      subtitle: "Subscription Management",
      back: "Back",
      activate_title: "Manually Activate Subscription",
      activate_desc:
        "Enter the user's Principal ID to activate access for 12 months.",
      principal_label: "Principal ID",
      principal_placeholder: "e.g. aaaaa-aa",
      activate_button: "Activate",
      activating: "Activating...",
      history_title: "Manually Activated (this session)",
      history_empty: "No manual activations in this session yet.",
      col_principal: "Principal",
      col_activated: "Activated at",
      success: "Subscription activated successfully!",
      error_invalid: "Invalid Principal ID.",
      all_subs_title: "All Subscriptions",
      all_subs_desc: "Overview of all active and expired access.",
      liv_auto_note:
        "Each new subscription automatically receives 1 LIV token from your wallet.",
      col_user: "User (Principal)",
      col_expiry: "Expiry Date",
      col_status: "Status",
      status_active: "Active",
      status_expired: "Expired",
      no_subs: "No subscriptions yet.",
      refresh: "Refresh",
      total: "Total",
      active_count: "Active",
      expired_count: "Expired",
      copied: "Copied!",
      copy_all: "Copy All Addresses",
    },
    ru: {
      title: "Панель администратора",
      subtitle: "Управление подписками",
      back: "Назад",
      activate_title: "Активировать подписку вручную",
      activate_desc:
        "Введите Principal ID пользователя для активации доступа на 12 месяцев.",
      principal_label: "Principal ID",
      principal_placeholder: "напр. aaaaa-aa",
      activate_button: "Активировать",
      activating: "Активация...",
      history_title: "Активировано вручную (эта сессия)",
      history_empty: "В этой сессии ещё нет ручных активаций.",
      col_principal: "Principal",
      col_activated: "Активировано в",
      success: "Подписка успешно активирована!",
      error_invalid: "Неверный Principal ID.",
      all_subs_title: "Все подписки",
      all_subs_desc: "Обзор всех активных и истёкших доступов.",
      liv_auto_note:
        "Каждая новая подписка автоматически получает 1 LIV-токен из вашего кошелька.",
      col_user: "Пользователь (Principal)",
      col_expiry: "Дата истечения",
      col_status: "Статус",
      status_active: "Активна",
      status_expired: "Истекла",
      no_subs: "Подписок пока нет.",
      refresh: "Обновить",
      total: "Всего",
      active_count: "Активных",
      expired_count: "Истекших",
      copied: "Скопировано!",
      copy_all: "Скопировать все адреса",
    },
  }[lang];

  const activeCount = subscriptionList.filter((s) => s.isActive).length;
  const expiredCount = subscriptionList.length - activeCount;

  const handleCopyOne = async (principal: string) => {
    try {
      await navigator.clipboard.writeText(principal);
      setCopiedId(principal);
      toast.success(tr.copied);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleCopyAll = async () => {
    if (subscriptionList.length === 0) return;
    const allPrincipals = subscriptionList
      .map((s) => s.user.toString())
      .join("\n");
    try {
      await navigator.clipboard.writeText(allPrincipals);
      toast.success(tr.copied);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleActivate = async () => {
    setInputError("");
    const trimmed = principalInput.trim();
    if (!trimmed) {
      setInputError(tr.error_invalid);
      return;
    }
    let principal: Principal;
    try {
      principal = Principal.fromText(trimmed);
    } catch {
      setInputError(tr.error_invalid);
      return;
    }
    try {
      await activateMutation.mutateAsync(principal);
      toast.success(tr.success);
      setActivatedList((prev) => [
        { principal: trimmed, activatedAt: new Date() },
        ...prev,
      ]);
      setPrincipalInput("");
      refetchList();
    } catch (e: any) {
      toast.error(e?.message ?? tr.error_invalid);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.25 0.045 185 / 0.4) 0%, transparent 70%), linear-gradient(160deg, oklch(0.13 0.032 192) 0%, oklch(0.09 0.02 195) 50%, oklch(0.07 0.015 200) 100%)",
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gold" />
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              {tr.title}
            </span>
            <span className="text-border/60 text-sm">/</span>
            <span className="text-muted-foreground text-sm">{tr.subtitle}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="rounded-full border-border/50 text-muted-foreground hover:text-foreground text-xs gap-1.5"
            data-ocid="admin.secondary_button"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {tr.back}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-6"
        >
          {/* Activate form */}
          <Card className="glass-card border-border/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-accent" />
                <CardTitle className="text-foreground font-display">
                  {tr.activate_title}
                </CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                {tr.activate_desc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor="admin-principal" className="sr-only">
                    {tr.principal_label}
                  </Label>
                  <Input
                    id="admin-principal"
                    value={principalInput}
                    onChange={(e) => {
                      setPrincipalInput(e.target.value);
                      setInputError("");
                    }}
                    placeholder={tr.principal_placeholder}
                    className="font-mono text-sm bg-muted/30 border-border/50 focus:border-green-accent/60"
                    data-ocid="admin.input"
                    onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                  />
                  {inputError && (
                    <p
                      className="mt-1.5 text-xs text-destructive"
                      data-ocid="admin.error_state"
                    >
                      {inputError}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleActivate}
                  disabled={
                    activateMutation.isPending || !principalInput.trim()
                  }
                  className="rounded-lg bg-gold text-primary-foreground hover:opacity-90 font-semibold shrink-0"
                  data-ocid="admin.primary_button"
                >
                  {activateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tr.activating}
                    </>
                  ) : (
                    tr.activate_button
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Full subscription list */}
          <Card className="glass-card border-border/30">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold" />
                  <CardTitle className="text-foreground font-display">
                    {tr.all_subs_title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {subscriptionList.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAll}
                      className="rounded-full text-muted-foreground hover:text-gold h-8 px-2.5 gap-1.5 text-xs"
                      title={tr.copy_all}
                      data-ocid="admin.secondary_button"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tr.copy_all}</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchList()}
                    disabled={listFetching}
                    className="rounded-full text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                    title={tr.refresh}
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        listFetching ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-muted-foreground">
                {tr.all_subs_desc}
              </CardDescription>
              <CardDescription className="text-xs text-gold/70 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
                {tr.liv_auto_note}
              </CardDescription>
              {/* Summary stats */}
              {subscriptionList.length > 0 && (
                <div className="flex items-center gap-4 pt-1">
                  <span className="text-xs text-muted-foreground">
                    {tr.total}:{" "}
                    <span className="text-foreground font-semibold">
                      {subscriptionList.length}
                    </span>
                  </span>
                  <span className="text-xs text-green-accent">
                    {tr.active_count}:{" "}
                    <span className="font-semibold">{activeCount}</span>
                  </span>
                  <span className="text-xs text-destructive/80">
                    {tr.expired_count}:{" "}
                    <span className="font-semibold">{expiredCount}</span>
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <div
                  className="flex items-center justify-center py-10"
                  data-ocid="admin.loading_state"
                >
                  <Loader2 className="w-5 h-5 animate-spin text-gold" />
                </div>
              ) : subscriptionList.length === 0 ? (
                <p
                  className="text-muted-foreground text-sm py-8 text-center"
                  data-ocid="admin.empty_state"
                >
                  {tr.no_subs}
                </p>
              ) : (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm" data-ocid="admin.list">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left text-xs font-medium text-muted-foreground px-2 pb-2">
                          {tr.col_user}
                        </th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-2 pb-2">
                          {tr.col_expiry}
                        </th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-2 pb-2">
                          {tr.col_status}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...subscriptionList]
                        .sort((a, b) =>
                          a.isActive === b.isActive
                            ? Number(b.expiryDate) - Number(a.expiryDate)
                            : a.isActive
                              ? -1
                              : 1,
                        )
                        .map((entry, idx) => {
                          const principalStr = entry.user.toString();
                          const isCopied = copiedId === principalStr;
                          return (
                            <tr
                              key={principalStr}
                              className="border-b border-border/15 hover:bg-muted/10 transition-colors"
                              data-ocid={`admin.item.${idx + 1}`}
                            >
                              <td className="px-2 py-2.5">
                                <div className="flex items-center gap-1">
                                  <span
                                    className="font-mono text-xs text-foreground/80"
                                    title={principalStr}
                                  >
                                    {shortenPrincipal(principalStr)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyOne(principalStr)}
                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted/30 text-muted-foreground hover:text-gold transition-colors shrink-0"
                                    title={tr.copied}
                                    data-ocid={`admin.secondary_button.${idx + 1}`}
                                  >
                                    {isCopied ? (
                                      <CheckCircle2 className="w-3 h-3 text-green-accent" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="px-2 py-2.5">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(entry.expiryDate, locale)}
                                </span>
                              </td>
                              <td className="px-2 py-2.5 text-right">
                                {entry.isActive ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-green-accent font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {tr.status_active}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-destructive/70 font-medium">
                                    <XCircle className="w-3.5 h-3.5" />
                                    {tr.status_expired}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session history */}
          {activatedList.length > 0 && (
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="text-foreground font-display text-base">
                  {tr.history_title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2" data-ocid="admin.list">
                  {activatedList.map((entry, idx) => (
                    <div
                      key={`${entry.principal}-${entry.activatedAt.getTime()}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/20 border border-border/25"
                      data-ocid={`admin.item.${idx + 1}`}
                    >
                      <span className="font-mono text-xs text-foreground/80 truncate">
                        {entry.principal}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {entry.activatedAt.toLocaleTimeString(locale)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/30 py-6 px-6">
        <div className="max-w-4xl mx-auto text-xs text-muted-foreground text-center">
          LivSpan Admin &mdash;{" "}
          <span className="opacity-60">
            &copy; {new Date().getFullYear()}. Built with{" "}
            <span className="text-red-400">&hearts;</span> using{" "}
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
