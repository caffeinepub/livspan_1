import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";
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
import Nat64 "mo:core/Nat64";
import Blob "mo:core/Blob";


actor {
  // User Profile Types
  public type UserProfile = {
    name : Text;
    birthYear : ?Nat;
    gender : ?Text;
    heightCm : ?Nat;
    weightKg : ?Float;
    bodyFatPct : ?Float;
  };

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

  // Longevity Score History Types
  public type ScoreEntry = {
    date : Text; // YYYY-MM-DD
    score : Float;
  };

  // Diary Types
  public type DiaryEntry = {
    id : Nat;
    text : Text;
    timestamp : Text;
  };

  // Daily Health Data Types
  public type DailyHealthData = {
    date : Text;
    sleepDuration : ?Float; // hours
    sleepQuality : ?Float; // 1-10
    protein : ?Float; // grams
    veggies : ?Float; // servings
    water : ?Float; // liters
    sport : ?Text;
    intensity : ?Float; // 1-10
    movementDuration : ?Float; // minutes
    systolic : ?Float; // mmHg
    diastolic : ?Float; // mmHg
    restingHr : ?Float; // bpm
    fastingStart : ?Text;
    fastingEnd : ?Text;
    calories : ?Float;
  };

  // Subscription Types
  public type SubscriptionStatus = {
    isActive : Bool;
    expiryDate : ?Int; // Expiry timestamp in nanoseconds
  };

  // Admin subscription list type
  public type SubscriptionEntry = {
    user : Principal;
    expiryDate : Int;
    isActive : Bool;
  };

  // ICP Ledger Types
  type AccountIdentifier = Blob;
  type Tokens = { e8s : Nat64 };
  type Block = {
    transaction : {
      operation : ?{
        #Transfer : {
          from : AccountIdentifier;
          to : AccountIdentifier;
          amount : Tokens;
          fee : Tokens;
        };
      };
    };
  };
  type GetBlocksArgs = {
    start : Nat64;
    length : Nat64;
  };
  type QueryBlocksResponse = {
    blocks : [Block];
  };

  // LIV Token Types
  let totalLivSupply = 21_000_000;
  let tokenDecimals = 0;
  let tokenName = "LIV";
  let tokenSymbol = "LIV";

  // LIV Transaction History Types
  public type LivTransaction = {
    id : Nat;
    from : Text;
    to : Text;
    amount : Nat;
    timestamp : Int;
    txType : Text; // "send" | "receive" | "airdrop"
  };

  // Constants
  let ownerAccountId = "5677f79bb400519598c0e75be936cafc391a930d21268d6fcf1eee3cb5c9d582";
  let subscriptionPrice = 100_000_000;
  let subscriptionDuration = 365 * 24 * 60 * 60 * 1_000_000_000; // 12 months in nanoseconds
  let ledgerCanisterId = "ryjl3-tyaaa-aaaaa-aaaba-cai";

  // User state
  let userProfiles = Map.empty<Principal, UserProfile>();
  let userScoreHistory = Map.empty<Principal, [ScoreEntry]>();
  let userDiaryEntries = Map.empty<Principal, [DiaryEntry]>();
  let userDailyHealthData = Map.empty<Principal, [DailyHealthData]>();
  let subscriptions = Map.empty<Principal, Int>();
  var nextDiaryId = 0;

  // Routine state
  let routines = Map.empty<Nat, RoutineInternal>();
  let completions = Map.empty<Principal, Map.Map<Nat, Text>>();
  var nextRoutineId = 0;

  // LIV Token State
  let livBalances = Map.empty<Principal, Nat>();
  var livTokensClaimed = false;
  var adminPrincipalForLiv : ?Principal = null;
  let livWelcomeGranted = Map.empty<Principal, Bool>();
  let livTransactions = Map.empty<Principal, [LivTransaction]>();
  var nextTxId = 0;

  // Persistent admin state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Admin subscription list
  public query ({ caller }) func getAdminSubscriptionList() : async [SubscriptionEntry] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view subscription list");
    };

    let currentTime = Time.now();
    subscriptions.entries().toArray().map(
      func((user, expiry)) {
        {
          user;
          expiryDate = expiry;
          isActive = expiry > currentTime;
        };
      }
    );
  };

  // LIV Token Functions

  public shared ({ caller }) func claimFounderLivTokens() : async Result {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can claim founder LIV tokens");
    };

    if (livTokensClaimed) {
      #err("Founder LIV tokens already claimed");
    } else {
      livBalances.add(caller, totalLivSupply);
      livTokensClaimed := true;
      adminPrincipalForLiv := ?caller;
      #ok;
    };
  };

  public query ({ caller }) func getMyLivBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view LIV balances");
    };

    switch (livBalances.get(caller)) {
      case (?balance) { balance };
      case (null) { 0 };
    };
  };

  public query ({ caller }) func getLivBalance(p : Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view LIV balances");
    };

    switch (livBalances.get(p)) {
      case (?balance) { balance };
      case (null) { 0 };
    };
  };

  // Internal helper: append transaction for a user
  func appendTx(user : Principal, tx : LivTransaction) {
    let current = switch (livTransactions.get(user)) {
      case (?txs) { txs };
      case (null) { [] };
    };
    // Keep most recent first, cap at 100 entries
    let updated = [tx].concat(current);
    let capped = if (updated.size() > 100) {
      Array.tabulate(100, func(i) { updated[i] });
    } else {
      updated;
    };
    livTransactions.add(user, capped);
  };

  public shared ({ caller }) func transferLiv(to : Principal, amount : Nat) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can transfer LIV tokens");
    };

    switch (livBalances.get(caller)) {
      case (null) { #err("Insufficient balance") };
      case (?balance) {
        if (balance < amount) { return #err("Insufficient balance") };

        let newSenderBalance = balance - amount;
        livBalances.add(caller, newSenderBalance);

        let recipientBalance = switch (livBalances.get(to)) {
          case (?b) { b };
          case (null) { 0 };
        };
        let newRecipientBalance = recipientBalance + amount;
        livBalances.add(to, newRecipientBalance);

        let now = Time.now();
        let txId = nextTxId;
        nextTxId += 1;

        // Record sender transaction
        appendTx(caller, {
          id = txId;
          from = caller.toText();
          to = to.toText();
          amount;
          timestamp = now;
          txType = "send";
        });

        // Record recipient transaction
        appendTx(to, {
          id = txId;
          from = caller.toText();
          to = to.toText();
          amount;
          timestamp = now;
          txType = "receive";
        });

        #ok;
      };
    };
  };

  // Internal: grant 1 LIV to a new user from admin wallet (idempotent)
  func grantWelcomeLiv(user : Principal) {
    switch (livWelcomeGranted.get(user)) {
      case (?true) { return };
      case (_) {};
    };
    switch (adminPrincipalForLiv) {
      case (null) { return };
      case (?admin) {
        let grantAmount = 1;
        let adminBalance = switch (livBalances.get(admin)) {
          case (?b) { b };
          case (null) { 0 };
        };
        if (adminBalance >= grantAmount) {
          livBalances.add(admin, adminBalance - grantAmount);
          let userBalance = switch (livBalances.get(user)) {
            case (?b) { b };
            case (null) { 0 };
          };
          livBalances.add(user, userBalance + grantAmount);
          livWelcomeGranted.add(user, true);

          let now = Time.now();
          let txId = nextTxId;
          nextTxId += 1;

          // Record airdrop for recipient
          appendTx(user, {
            id = txId;
            from = admin.toText();
            to = user.toText();
            amount = grantAmount;
            timestamp = now;
            txType = "airdrop";
          });
        };
      };
    };
  };

  public query ({ caller }) func getLivTransactions() : async [LivTransaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };
    switch (livTransactions.get(caller)) {
      case (?txs) {
        if (txs.size() > 50) { Array.tabulate(50, func(i) { txs[i] }) } else { txs };
      };
      case (null) { [] };
    };
  };

  public query func getTotalLivSupply() : async Nat {
    totalLivSupply;
  };

  public query func getLivTokenInfo() : async { name : Text; symbol : Text; decimals : Nat } {
    {
      name = tokenName;
      symbol = tokenSymbol;
      decimals = tokenDecimals;
    };
  };

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

    let today = getCurrentDate();

    routines.values().toArray().filter(
      func(r) { r.owner == caller }
    ).map(
      func(internal) {
        let isDone = switch (completions.get(caller)) {
          case (null) { false };
          case (?userCompletions) {
            switch (userCompletions.get(internal.routine.id)) {
              case (null) { false };
              case (?date) {
                date == today;
              };
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

  // Longevity Score History Functions
  public shared ({ caller }) func saveDailyScore(date : Text, score : Float) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save score entries");
    };

    let newEntry : ScoreEntry = {
      date;
      score;
    };

    let currentEntries = switch (userScoreHistory.get(caller)) {
      case (null) { [] };
      case (?entries) { entries };
    };

    let filteredEntries = currentEntries.filter(
      func(entry) { entry.date != date }
    );

    userScoreHistory.add(caller, filteredEntries.concat([newEntry]));
    #ok;
  };

  public query ({ caller }) func getScoreHistoryForCaller() : async [ScoreEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view score history");
    };

    switch (userScoreHistory.get(caller)) {
      case (null) { [] };
      case (?entries) { entries };
    };
  };

  public query ({ caller }) func getScoreHistoryForUser(user : Principal) : async [ScoreEntry] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view other users' score history");
    };

    switch (userScoreHistory.get(user)) {
      case (null) { [] };
      case (?entries) { entries };
    };
  };

  // Diary Functions
  public query ({ caller }) func getDiaryEntriesForCaller() : async [DiaryEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view diary entries");
    };

    switch (userDiaryEntries.get(caller)) {
      case (null) { [] };
      case (?entries) { entries };
    };
  };

  public shared ({ caller }) func addDiaryEntry(text : Text, timestamp : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add diary entries");
    };

    if (text.size() <= 0) {
      return #err("Text required");
    };

    let id = nextDiaryId;
    nextDiaryId += 1;

    let newEntry : DiaryEntry = { id; text; timestamp };

    let currentEntries = switch (userDiaryEntries.get(caller)) {
      case (null) { [] };
      case (?entries) { entries };
    };

    userDiaryEntries.add(caller, [newEntry].concat(currentEntries));
    #ok;
  };

  public shared ({ caller }) func updateDiaryEntry(id : Nat, text : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update diary entries");
    };

    if (text.size() <= 0) {
      return #err("Text required");
    };

    let currentEntries = switch (userDiaryEntries.get(caller)) {
      case (null) { return #err("No entries found") };
      case (?entries) { entries };
    };

    let found = currentEntries.filter(func(e) { e.id == id });
    if (found.size() == 0) {
      return #err("Entry not found");
    };

    let updated = currentEntries.map(func(e) {
      if (e.id == id) { { id = e.id; text; timestamp = e.timestamp } }
      else { e }
    });

    userDiaryEntries.add(caller, updated);
    #ok;
  };

  public shared ({ caller }) func deleteDiaryEntry(id : Nat) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete diary entries");
    };

    let currentEntries = switch (userDiaryEntries.get(caller)) {
      case (null) { return #err("No entries found") };
      case (?entries) { entries };
    };

    let updated = currentEntries.filter(func(e) { e.id != id });
    userDiaryEntries.add(caller, updated);
    #ok;
  };

  // Daily Health Data Functions
  public shared ({ caller }) func saveDailyHealthData(
    date : Text,
    sleepDuration : ?Float,
    sleepQuality : ?Float,
    protein : ?Float,
    veggies : ?Float,
    water : ?Float,
    sport : ?Text,
    intensity : ?Float,
    movementDuration : ?Float,
    systolic : ?Float,
    diastolic : ?Float,
    restingHr : ?Float,
    fastingStart : ?Text,
    fastingEnd : ?Text,
    calories : ?Float,
  ) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save health data");
    };

    let newEntry : DailyHealthData = {
      date;
      sleepDuration;
      sleepQuality;
      protein;
      veggies;
      water;
      sport;
      intensity;
      movementDuration;
      systolic;
      diastolic;
      restingHr;
      fastingStart;
      fastingEnd;
      calories;
    };

    let currentEntries = switch (userDailyHealthData.get(caller)) {
      case (null) { [] };
      case (?entries) { entries };
    };

    let filteredEntries = currentEntries.filter(
      func(entry) { entry.date != date }
    );

    userDailyHealthData.add(caller, filteredEntries.concat([newEntry]));
    #ok;
  };

  public query ({ caller }) func getDailyHealthData(date : Text) : async ?DailyHealthData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view health data");
    };

    switch (userDailyHealthData.get(caller)) {
      case (null) { null };
      case (?entries) {
        let matching = entries.filter(func(e) { e.date == date });
        if (matching.size() == 0) { null } else { ?matching[0] };
      };
    };
  };

  public query ({ caller }) func getAllHealthData() : async [DailyHealthData] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view health data");
    };

    switch (userDailyHealthData.get(caller)) {
      case (null) { [] };
      case (?entries) { entries };
    };
  };

  // Subscription Functions
  public query ({ caller }) func checkSubscription() : async SubscriptionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check subscription status");
    };

    let currentTime = Time.now();
    switch (subscriptions.get(caller)) {
      case (null) {
        {
          isActive = false;
          expiryDate = null;
        };
      };
      case (?expiry) {
        if (expiry > currentTime) {
          {
            isActive = true;
            expiryDate = ?expiry;
          };
        } else {
          {
            isActive = false;
            expiryDate = null;
          };
        };
      };
    };
  };

  func hexCharToNat8(c : Char) : Nat8 {
    let code = c.toNat32().toNat();
    if (code >= 48 and code <= 57) {
      Nat8.fromNat(code - 48)
    } else if (code >= 97 and code <= 102) {
      Nat8.fromNat(code - 87)
    } else if (code >= 65 and code <= 70) {
      Nat8.fromNat(code - 55)
    } else {
      0
    }
  };

  func hexToBlob(hex : Text) : Blob {
    let chars = hex.chars().toArray();
    var bytes : [Nat8] = [];
    var i = 0;
    while (i + 1 < chars.size()) {
      let hi = hexCharToNat8(chars[i]);
      let lo = hexCharToNat8(chars[i + 1]);
      let byte : Nat8 = hi * 16 + lo;
      bytes := bytes.concat([byte]);
      i += 2;
    };
    Blob.fromArray(bytes);
  };

  public shared ({ caller }) func activateSubscription(blockIndex : Nat64) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can activate subscriptions");
    };

    let ledger : actor {
      query_blocks : (GetBlocksArgs) -> async QueryBlocksResponse;
    } = actor (ledgerCanisterId);

    let response = try {
      await ledger.query_blocks({
        start = blockIndex;
        length = 1;
      });
    } catch (e) {
      return #err("Failed to query ledger: " # e.message());
    };

    if (response.blocks.size() == 0) {
      return #err("Block not found");
    };

    let block = response.blocks[0];
    let ownerAccountBlob = hexToBlob(ownerAccountId);

    switch (block.transaction.operation) {
      case (?#Transfer(transfer)) {
        if (transfer.to != ownerAccountBlob) {
          return #err("Transfer not to owner account");
        };
        if (transfer.amount.e8s < Nat64.fromNat(subscriptionPrice)) {
          return #err("Insufficient payment amount");
        };
        let expiryTime = Time.now() + subscriptionDuration;
        subscriptions.add(caller, expiryTime);
        grantWelcomeLiv(caller);
        #ok;
      };
      case (_) {
        return #err("Invalid transaction type");
      };
    };
  };

  public shared ({ caller }) func adminActivateSubscription(user : Principal) : async Result {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can manually activate subscriptions");
    };

    let expiryTime = Time.now() + subscriptionDuration;
    subscriptions.add(user, expiryTime);
    grantWelcomeLiv(user);
    #ok;
  };


  public shared ({ caller }) func renewSubscription(blockIndex : Nat64) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can renew subscriptions");
    };

    let ledger : actor {
      query_blocks : (GetBlocksArgs) -> async QueryBlocksResponse;
    } = actor (ledgerCanisterId);

    let response = try {
      await ledger.query_blocks({
        start = blockIndex;
        length = 1;
      });
    } catch (e) {
      return #err("Failed to query ledger: " # e.message());
    };

    if (response.blocks.size() == 0) {
      return #err("Block not found");
    };

    let block = response.blocks[0];
    let ownerAccountBlob = hexToBlob(ownerAccountId);

    switch (block.transaction.operation) {
      case (?#Transfer(transfer)) {
        if (transfer.to != ownerAccountBlob) {
          return #err("Transfer not to owner account");
        };
        if (transfer.amount.e8s < Nat64.fromNat(subscriptionPrice)) {
          return #err("Insufficient payment amount");
        };
        let base = switch (subscriptions.get(caller)) {
          case (?existing) { if (existing > Time.now()) { existing } else { Time.now() } };
          case (null) { Time.now() };
        };
        let newExpiry = base + subscriptionDuration;
        subscriptions.add(caller, newExpiry);
        #ok;
      };
      case (_) {
        return #err("Invalid transaction type");
      };
    };
  };

  // Howard Hinnant civil_from_days algorithm -- proven correct for all dates
  func getCurrentDate() : Text {
    let now = Time.now();
    let now_s : Nat = Int.abs(now / 1_000_000_000).toNat();
    let z : Int = (now_s / 86_400) + 719468;

    let era : Int = (if (z >= 0) { z } else { z - 146096 }) / 146097;
    let doe : Nat = Int.abs(z - era * 146097);
    let yoe : Nat = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y : Int = yoe + era * 400;
    let doy : Nat = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp : Nat = (5 * doy + 2) / 153;
    let d : Nat = doy - (153 * mp + 2) / 5 + 1;
    let m : Int = if (mp < 10) { mp + 3 } else { mp - 9 };
    let finalYear : Int = if (m <= 2) { y + 1 } else { y };

    let yearText = finalYear.toText();
    let monthText = if (m < 10) { "0" # m.toText() } else { m.toText() };
    let dayText = if (d < 10) { "0" # d.toText() } else { d.toText() };

    yearText # "-" # monthText # "-" # dayText;
  };
};
