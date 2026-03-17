import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RoutineWithStatus, UserProfile } from "../backend.d";
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
