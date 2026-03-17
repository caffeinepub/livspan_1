import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Runtime "mo:core/Runtime";



actor {
  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Types
  public type UserProfile = {
    name : Text;
    birthYear : ?Nat;
    gender : ?Text;
    heightCm : ?Nat;
    weightKg : ?Float;
    bodyFatPct : ?Float;
  };

  // User state
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Routine Types
  public type Routine = {
    id : Nat;
    title : Text;
    time : Text; // HH:MM
    description : Text;
    createdAt : Int;
  };

  module Routine {
    public func compare(routine1 : Routine, routine2 : Routine) : Order.Order {
      switch (Int.compare(routine1.createdAt, routine2.createdAt)) {
        case (#equal) { Nat.compare(routine1.id, routine2.id) };
        case (order) { order };
      };
    };
  };

  public type RoutineWithStatus = {
    id : Nat;
    title : Text;
    time : Text;
    description : Text;
    createdAt : Int;
    done : Bool;
  };

  public type Result = {
    #ok;
    #err : Text;
  };

  public type RoutineInternal = {
    routine : Routine;
    owner : Principal;
  };

  // Routine state
  let routines = Map.empty<Nat, RoutineInternal>();
  let completions = Map.empty<Principal, Map.Map<Nat, Text>>();
  var nextRoutineId = 0;

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Routine Functions
  public shared ({ caller }) func createRoutine(title : Text, time : Text, description : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create routines");
    };

    if (title.size() <= 0 or time.size() <= 0) {
      return #err("Title and time required");
    };

    let id = nextRoutineId;
    nextRoutineId += 1;

    let routine : Routine = {
      id;
      title;
      time;
      description;
      createdAt = Time.now();
    };

    routines.add(id, { routine; owner = caller });
    #ok;
  };

  public shared ({ caller }) func updateRoutine(id : Nat, title : Text, time : Text, description : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update routines");
    };

    if (title.size() <= 0 or time.size() <= 0) {
      return #err("Title and time required");
    };

    switch (routines.get(id)) {
      case (null) { return #err("Routine not found") };
      case (?routineInternal) {
        if (routineInternal.owner != caller) {
          return #err("Only owner can update");
        };

        let updatedRoutine : Routine = {
          id;
          title;
          time;
          description;
          createdAt = routineInternal.routine.createdAt;
        };
        routines.add(id, { routine = updatedRoutine; owner = caller });
        #ok;
      };
    };
  };

  public shared ({ caller }) func deleteRoutine(id : Nat) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete routines");
    };

    switch (routines.get(id)) {
      case (null) { return #err("Routine not found") };
      case (?routineInternal) {
        if (routineInternal.owner != caller) {
          return #err("Only owner can delete");
        };
        routines.remove(id);
        #ok;
      };
    };
  };

  public query ({ caller }) func getRoutinesForCaller() : async [RoutineWithStatus] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view routines");
    };

    routines.values().toArray().filter(
      func(r) { r.owner == caller }
    ).map(
      func(internal) {
        let isDone = switch (completions.get(caller)) {
          case (null) { false };
          case (?userCompletions) {
            switch (userCompletions.get(internal.routine.id)) {
              case (null) { false };
              case (?_) { true };
            };
          };
        };
        {
          id = internal.routine.id;
          title = internal.routine.title;
          time = internal.routine.time;
          description = internal.routine.description;
          createdAt = internal.routine.createdAt;
          done = isDone;
        };
      }
    );
  };

  public query ({ caller }) func getSingleRoutine(id : Nat) : async RoutineWithStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view routines");
    };

    switch (routines.get(id)) {
      case (null) { Runtime.trap("Routine not found") };
      case (?routineInternal) {
        if (routineInternal.owner != caller) {
          Runtime.trap("Unauthorized: This is not your routine");
        };
        let isDone = switch (completions.get(caller)) {
          case (null) { false };
          case (?userCompletions) {
            switch (userCompletions.get(id)) {
              case (null) { false };
              case (?_) { true };
            };
          };
        };
        {
          id = routineInternal.routine.id;
          title = routineInternal.routine.title;
          time = routineInternal.routine.time;
          description = routineInternal.routine.description;
          createdAt = routineInternal.routine.createdAt;
          done = isDone;
        };
      };
    };
  };

  public shared ({ caller }) func markRoutineDone(id : Nat, date : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark routines as done");
    };

    switch (routines.get(id)) {
      case (null) { return #err("Routine not found") };
      case (?routineInternal) {
        if (routineInternal.owner != caller) {
          return #err("Can only mark your own routines as done");
        };
      };
    };

    let userCompletions = switch (completions.get(caller)) {
      case (null) { Map.empty<Nat, Text>() };
      case (?comps) { comps };
    };
    userCompletions.add(id, date);
    completions.add(caller, userCompletions);
    #ok;
  };

  public shared ({ caller }) func markRoutineUndone(id : Nat) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark routines as undone");
    };

    let userCompletions = switch (completions.get(caller)) {
      case (null) { return #err("No completions found") };
      case (?comps) { comps };
    };
    userCompletions.remove(id);
    completions.add(caller, userCompletions);
    #ok;
  };
};
