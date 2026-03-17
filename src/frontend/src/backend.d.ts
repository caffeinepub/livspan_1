import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DailyHealthData {
    sleepQuality?: number;
    veggies?: number;
    date: string;
    calories?: number;
    restingHr?: number;
    systolic?: number;
    sport?: string;
    fastingStart?: string;
    movementDuration?: number;
    fastingEnd?: string;
    diastolic?: number;
    water?: number;
    intensity?: number;
    protein?: number;
    sleepDuration?: number;
}
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface ScoreEntry {
    date: string;
    score: number;
}
export interface DiaryEntry {
    id: bigint;
    text: string;
    timestamp: string;
}
export interface RoutineWithStatus {
    id: bigint;
    title: string;
    done: boolean;
    createdAt: bigint;
    time: string;
    description: string;
}
export interface SubscriptionStatus {
    expiryDate?: bigint;
    isActive: boolean;
}
export interface UserProfile {
    heightCm?: bigint;
    bodyFatPct?: number;
    birthYear?: bigint;
    name: string;
    weightKg?: number;
    gender?: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    activateSubscription(blockIndex: bigint): Promise<Result>;
    addDiaryEntry(text: string, timestamp: string): Promise<Result>;
    adminActivateSubscription(user: Principal): Promise<Result>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkSubscription(): Promise<SubscriptionStatus>;
    createRoutine(title: string, time: string, description: string): Promise<Result>;
    deleteDiaryEntry(id: bigint): Promise<Result>;
    deleteRoutine(id: bigint): Promise<Result>;
    getAllHealthData(): Promise<Array<DailyHealthData>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyHealthData(date: string): Promise<DailyHealthData | null>;
    getDiaryEntriesForCaller(): Promise<Array<DiaryEntry>>;
    getRoutinesForCaller(): Promise<Array<RoutineWithStatus>>;
    getScoreHistoryForCaller(): Promise<Array<ScoreEntry>>;
    getScoreHistoryForUser(user: Principal): Promise<Array<ScoreEntry>>;
    getSingleRoutine(id: bigint): Promise<RoutineWithStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markRoutineDone(id: bigint, date: string): Promise<Result>;
    markRoutineUndone(id: bigint): Promise<Result>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveDailyHealthData(date: string, sleepDuration: number | null, sleepQuality: number | null, protein: number | null, veggies: number | null, water: number | null, sport: string | null, intensity: number | null, movementDuration: number | null, systolic: number | null, diastolic: number | null, restingHr: number | null, fastingStart: string | null, fastingEnd: string | null, calories: number | null): Promise<Result>;
    saveDailyScore(date: string, score: number): Promise<Result>;
    updateDiaryEntry(id: bigint, text: string): Promise<Result>;
    updateRoutine(id: bigint, title: string, time: string, description: string): Promise<Result>;
}
