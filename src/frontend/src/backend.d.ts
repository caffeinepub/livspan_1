import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RoutineWithStatus {
    id: bigint;
    title: string;
    done: boolean;
    createdAt: bigint;
    time: string;
    description: string;
}
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createRoutine(title: string, time: string, description: string): Promise<Result>;
    deleteRoutine(id: bigint): Promise<Result>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getRoutinesForCaller(): Promise<Array<RoutineWithStatus>>;
    getSingleRoutine(id: bigint): Promise<RoutineWithStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markRoutineDone(id: bigint, date: string): Promise<Result>;
    markRoutineUndone(id: bigint): Promise<Result>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateRoutine(id: bigint, title: string, time: string, description: string): Promise<Result>;
}
