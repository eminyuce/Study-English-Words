import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";

module {
  type OldLanguage = {
    name : Text;
    code : Text;
    flagEmoji : Text;
    textDirection : TextDirection;
    gradientStart : Text;
    gradientEnd : Text;
    createdAt : Time.Time;
  };

  type OldWord = {
    id : Nat;
    english : Text;
    foreign : Text;
    languageName : Text;
    difficulty : Difficulty;
    examples : [Text];
    addedAt : Time.Time;
  };

  type OldUserProgress = {
    principal : Principal;
    totalCorrect : Nat;
    totalAnswered : Nat;
    streak : Nat;
    lastPlayed : ?Time.Time;
    badges : [Text];
  };

  type OldUserProfile = {
    name : Text;
    preferredLanguages : [Text];
    joinedAt : Time.Time;
  };

  type OldActor = {
    languages : Map.Map<Text, OldLanguage>;
    words : Map.Map<Nat, OldWord>;
    userProgress : Map.Map<Principal, OldUserProgress>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    nextWordId : Nat;
    accessControlState : AccessControl.AccessControlState;
  };

  type Difficulty = {
    #beginner;
    #medium;
    #hard;
    #advanced;
  };

  type TextDirection = {
    #ltr;
    #rtl;
  };

  type NewLanguage = {
    name : Text;
    code : Text;
    flagEmoji : Text;
    textDirection : TextDirection;
    gradientStart : Text;
    gradientEnd : Text;
    ordering : Nat;
    createdAt : Time.Time;
  };

  type NewWord = {
    id : Nat;
    english : Text;
    foreign : Text;
    languageName : Text;
    difficulty : Difficulty;
    examples : [Text];
    addedAt : Time.Time;
  };

  type NewUserProgress = {
    principal : Principal;
    totalCorrect : Nat;
    totalAnswered : Nat;
    streak : Nat;
    lastPlayed : ?Time.Time;
    badges : [Text];
  };

  type NewUserProfile = {
    name : Text;
    preferredLanguages : [Text];
    joinedAt : Time.Time;
  };

  type NewActor = {
    languages : Map.Map<Text, NewLanguage>;
    words : Map.Map<Nat, NewWord>;
    userProgress : Map.Map<Principal, NewUserProgress>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
    nextWordId : Nat;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor {
    let newLanguages = old.languages.map<Text, OldLanguage, NewLanguage>(
      func(_name, oldLanguage) {
        {
          oldLanguage with
          ordering = 1; // Default ordering, should be updated as needed
        };
      }
    );

    { old with languages = newLanguages };
  };
};

