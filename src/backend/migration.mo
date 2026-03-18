module {
  type OldActor = {};
  type NewActor = {
    livTokensClaimed : Bool;
  };

  public func run(old : OldActor) : NewActor {
    { old with livTokensClaimed = false };
  };
};
