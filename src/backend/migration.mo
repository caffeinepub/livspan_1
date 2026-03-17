import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Principal "mo:core/Principal";

module {
  type UserProfile = {
    name : Text;
    birthYear : ?Nat;
    gender : ?Text;
    heightCm : ?Nat;
    weightKg : ?Float;
    bodyFatPct : ?Float;
  };

  type Routine = {
    id : Nat;
    title : Text;
    time : Text;
    description : Text;
    createdAt : Int;
  };

  type RoutineInternal = {
    routine : Routine;
    owner : Principal;
  };

  type ScoreEntry = {
    date : Text;
    score : Float;
  };

  type DiaryEntry = {
    id : Nat;
    text : Text;
    timestamp : Text;
  };

  type DailyHealthData = {
    date : Text;
    sleepDuration : ?Float;
    sleepQuality : ?Float;
    protein : ?Float;
    veggies : ?Float;
    water : ?Float;
    sport : ?Text;
    intensity : ?Float;
    movementDuration : ?Float;
    systolic : ?Float;
    diastolic : ?Float;
    restingHr : ?Float;
    fastingStart : ?Text;
    fastingEnd : ?Text;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    userScoreHistory : Map.Map<Principal, [ScoreEntry]>;
    userDiaryEntries : Map.Map<Principal, [DiaryEntry]>;
    routines : Map.Map<Nat, RoutineInternal>;
    completions : Map.Map<Principal, Map.Map<Nat, Text>>;
    nextRoutineId : Nat;
    nextDiaryId : Nat;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    userScoreHistory : Map.Map<Principal, [ScoreEntry]>;
    userDiaryEntries : Map.Map<Principal, [DiaryEntry]>;
    routines : Map.Map<Nat, RoutineInternal>;
    completions : Map.Map<Principal, Map.Map<Nat, Text>>;
    nextRoutineId : Nat;
    nextDiaryId : Nat;
    userDailyHealthData : Map.Map<Principal, [DailyHealthData]>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserDailyHealthData = Map.empty<Principal, [DailyHealthData]>();
    {
      old with
      userDailyHealthData = newUserDailyHealthData
    };
  };
};
