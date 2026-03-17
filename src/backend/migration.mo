import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type OldDailyHealthData = {
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
    userDailyHealthData : Map.Map<Principal, [OldDailyHealthData]>;
  };

  type NewDailyHealthData = {
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
    calories : ?Float;
  };

  type NewActor = {
    userDailyHealthData : Map.Map<Principal, [NewDailyHealthData]>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserData = old.userDailyHealthData.map<Principal, [OldDailyHealthData], [NewDailyHealthData]>(
      func(_principal, oldEntries) {
        oldEntries.map(
          func(oldData) {
            { oldData with calories = null };
          }
        );
      }
    );
    { old with userDailyHealthData = newUserData };
  };
};
