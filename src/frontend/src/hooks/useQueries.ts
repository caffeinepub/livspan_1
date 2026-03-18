import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DailyHealthData,
  DiaryEntry,
  RoutineWithStatus,
  ScoreEntry,
  SubscriptionEntry,
  SubscriptionStatus,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

export function useGetRoutines() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<RoutineWithStatus[]>({
    queryKey: ["routines"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRoutinesForCaller();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateRoutine() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      time,
      description,
    }: {
      title: string;
      time: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.createRoutine(title, time, description);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useUpdateRoutine() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      time,
      description,
    }: {
      id: bigint;
      title: string;
      time: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.updateRoutine(id, title, time, description);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useDeleteRoutine() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.deleteRoutine(id);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useMarkRoutineDone() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, date }: { id: bigint; date: string }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.markRoutineDone(id, date);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useMarkRoutineUndone() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.markRoutineUndone(id);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useGetCallerProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["callerProfile"] }),
  });
}

export function useGetScoreHistory() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<ScoreEntry[]>({
    queryKey: ["scoreHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getScoreHistoryForCaller();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveScoreEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, score }: { date: string; score: number }) => {
      if (!actor) throw new Error("Not connected");
      await actor.saveDailyScore(date, score);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scoreHistory"] }),
  });
}

// Diary hooks
export function useGetDiaryEntries() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<DiaryEntry[]>({
    queryKey: ["diaryEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDiaryEntriesForCaller();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddDiaryEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      text,
      timestamp,
    }: { text: string; timestamp: string }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.addDiaryEntry(text, timestamp);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diaryEntries"] }),
  });
}

export function useUpdateDiaryEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: bigint; text: string }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.updateDiaryEntry(id, text);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diaryEntries"] }),
  });
}

export function useDeleteDiaryEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.deleteDiaryEntry(id);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diaryEntries"] }),
  });
}

// Daily health data hooks
export function useGetTodayHealthData(date: string) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<DailyHealthData | null>({
    queryKey: ["healthData", date],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDailyHealthData(date);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveHealthData() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: DailyHealthData) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.saveDailyHealthData(
        data.date,
        data.sleepDuration ?? null,
        data.sleepQuality ?? null,
        data.protein ?? null,
        data.veggies ?? null,
        data.water ?? null,
        data.sport ?? null,
        data.intensity ?? null,
        data.movementDuration ?? null,
        data.systolic ?? null,
        data.diastolic ?? null,
        data.restingHr ?? null,
        data.fastingStart ?? null,
        data.fastingEnd ?? null,
        data.calories ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["healthData", variables.date] }),
  });
}

// Subscription hooks
export function useCheckSubscription() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<SubscriptionStatus>({
    queryKey: ["subscription"],
    queryFn: async () => {
      if (!actor) return { isActive: false };
      return actor.checkSubscription();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useActivateSubscription() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockIndex: bigint) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.activateSubscription(blockIndex);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscription"] }),
  });
}

// Admin hooks
export function useIsAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAdminActivateSubscription() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: import("@dfinity/principal").Principal) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.adminActivateSubscription(user);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscription"] }),
  });
}

export function useAdminSubscriptionList() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<SubscriptionEntry[]>({
    queryKey: ["adminSubscriptionList"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAdminSubscriptionList();
    },
    enabled: !!actor && !actorFetching,
  });
}

// LIV Token hooks
export function useGetMyLivBalance() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["livBalance"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getMyLivBalance();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useClaimFounderLivTokens() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.claimFounderLivTokens();
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["livBalance"] }),
  });
}

export function useTransferLiv() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      to,
      amount,
    }: {
      to: string;
      amount: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@dfinity/principal");
      const toPrincipal = Principal.fromText(to);
      const result = await actor.transferLiv(toPrincipal, amount);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["livBalance"] }),
  });
}

export function useGetLivTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["livTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getLivTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}
