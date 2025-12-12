import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  type Language = {
    name : Text;
    code : Text;
    flagEmoji : Text;
    textDirection : TextDirection;
    gradientStart : Text;
    gradientEnd : Text;
    ordering : Nat;
    createdAt : Time.Time;
  };

  type Word = {
    id : Nat;
    english : Text;
    foreign : Text;
    languageName : Text;
    difficulty : Difficulty;
    examples : [Text];
    addedAt : Time.Time;
  };

  type UserProgress = {
    principal : Principal;
    totalCorrect : Nat;
    totalAnswered : Nat;
    streak : Nat;
    lastPlayed : ?Time.Time;
    badges : [Text];
  };

  public type UserProfile = {
    name : Text;
    preferredLanguages : [Text];
    joinedAt : Time.Time;
  };

  public type Difficulty = {
    #beginner;
    #medium;
    #hard;
    #advanced;
  };

  public type TextDirection = {
    #ltr;
    #rtl;
  };

  module Language {
    public func compare(l1 : Language, l2 : Language) : Order.Order {
      Nat.compare(l1.ordering, l2.ordering);
    };
  };

  module Word {
    public func compare(w1 : Word, w2 : Word) : Order.Order {
      switch (Text.compare(w1.languageName, w2.languageName)) {
        case (#equal) { Text.compare(w1.foreign, w2.foreign) };
        case (order) { order };
      };
    };

    public func compareByLanguage(w1 : Word, w2 : Word) : Order.Order {
      Text.compare(w1.languageName, w2.languageName);
    };

    public func compareByDifficulty(w1 : Word, w2 : Word) : Order.Order {
      let weight1 = getDifficultyWeight(w1.difficulty);
      let weight2 = getDifficultyWeight(w2.difficulty);

      if (weight1 < weight2) { #less } else if (weight1 > weight2) { #greater } else { #equal };
    };

    public func getDifficultyWeight(difficulty : Difficulty) : Nat {
      switch (difficulty) {
        case (#beginner) { 1 };
        case (#medium) { 2 };
        case (#hard) { 3 };
        case (#advanced) { 4 };
      };
    };
  };

  // Storage
  let languages = Map.empty<Text, Language>();
  let words = Map.empty<Nat, Word>();
  let userProgress = Map.empty<Principal, UserProgress>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextWordId = 1;

  // Authorization state
  let accessControlState = AccessControl.initState();

  // Initialize auth (first caller becomes admin, others become users)
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check happens inside
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // Admin login function - validates credentials for frontend UI access only
  // Does NOT grant admin role - admin role is granted via initializeAccessControl
  // This is a separate UI-level authentication check using static credentials
  public query func adminLogin(username : Text, password : Text) : async Bool {
    // Validate static credentials for UI purposes
    if (username == "admin" and password == "1234") {
      true;
    } else {
      Runtime.trap("Invalid username or password");
    };
  };

  // User Profile Management (Required by instructions)
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

  // Admin-only: Create new language
  public shared ({ caller }) func createLanguage(name : Text, code : Text, flag : Text, direction : TextDirection, startColor : Text, endColor : Text, ordering : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create a language");
    };

    if (languages.get(name) != null) { Runtime.trap("Language already exists") };

    let lang : Language = {
      name;
      code;
      flagEmoji = flag;
      textDirection = direction;
      gradientStart = startColor;
      gradientEnd = endColor;
      ordering;
      createdAt = Time.now();
    };

    languages.add(name, lang);
  };

  // Add word (admins only)
  public shared ({ caller }) func addWord(english : Text, foreign : Text, language : Text, difficulty : Difficulty, examples : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add words");
    };

    if (examples.size() > 5) {
      Runtime.trap("Only a maximum of 5 examples per word are allowed");
    };

    let word : Word = {
      id = nextWordId;
      english;
      foreign;
      languageName = language;
      difficulty;
      examples;
      addedAt = Time.now();
    };

    words.add(nextWordId, word);
    nextWordId += 1;
  };

  // Bulk import words (admins only)
  public shared ({ caller }) func bulkImportWords(wordsToImport : [Word]) : async { success : Bool; count : Nat } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can import words");
    };

    var importedCount = 0;

    for (word in wordsToImport.values()) {
      if (word.examples.size() > 5) {
        Runtime.trap("Only a maximum of 5 examples per word are allowed");
      };

      let newWord : Word = {
        id = nextWordId;
        english = word.english;
        foreign = word.foreign;
        languageName = word.languageName;
        difficulty = word.difficulty;
        examples = word.examples;
        addedAt = Time.now();
      };

      words.add(nextWordId, newWord);
      nextWordId += 1;
      importedCount += 1;
    };

    { success = true; count = importedCount };
  };

  // Update word (admins only)
  public shared ({ caller }) func updateWord(id : Nat, english : Text, foreign : Text, language : Text, difficulty : Difficulty, examples : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update words");
    };

    switch (words.get(id)) {
      case (null) { Runtime.trap("Word with id " # id.toText() # " does not exist. Cannot update") };
      case (?existingWord) {
        let word : Word = {
          id;
          english;
          foreign;
          languageName = language;
          difficulty;
          examples;
          addedAt = existingWord.addedAt;
        };
        words.add(id, word);
      };
    };
  };

  // Delete word (admins only)
  public shared ({ caller }) func deleteWord(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete words");
    };

    if (words.get(id) == null) {
      Runtime.trap("Word with id " # id.toText() # " does not exist. Cannot delete");
    } else {
      words.remove(id);
    };
  };

  // Remove words for a specific language (Admin-only)
  public shared ({ caller }) func removeWordsByLanguage(language : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove words");
    };

    // Filter and convert to list (avoid mutation during iteration)
    let matchingWords = words.entries().toArray().filter(
      func(pair) {
        let (_, word) = pair;
        word.languageName == language;
      }
    );

    // Already empty - no need to continue
    if (matchingWords.size() == 0) {
      return ();
    };

    // Remove only from matching entries instead of modifying during iteration
    for ((id, _) in matchingWords.values()) {
      words.remove(id);
    };
  };

  public shared ({ caller }) func removeLanguage(language : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove languages");
    };
    if (languages.get(language) == null) {
      Runtime.trap("Language does not exist. Cannot delete");
    } else {
      languages.remove(language);
      await removeWordsByLanguage(language);
    };
  };

  public shared ({ caller }) func updateLanguageOrdering(name : Text, newOrdering : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update language ordering");
    };

    switch (languages.get(name)) {
      case (null) { Runtime.trap("Language does not exist. Cannot update ordering") };
      case (?existingLanguage) {
        let updatedLanguage = {
          existingLanguage with ordering = newOrdering;
        };
        languages.add(name, updatedLanguage);
      };
    };
  };

  public query func getLanguagesSorted() : async [Language] {
    languages.values().toArray().sort();
  };

  // Get all words (admin only)
  public query ({ caller }) func getAllWords() : async [Word] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access all words");
    };
    words.values().toArray();
  };

  // Public query functions (accessible to all including guests)
  public query func getLanguage(name : Text) : async ?Language {
    languages.get(name);
  };

  public query func getWord(id : Nat) : async ?Word {
    words.get(id);
  };

  public query func getAllLanguages() : async [Language] {
    languages.values().toArray().sort();
  };

  public query func getWordsForLanguage(language : Text) : async [Word] {
    (words.values().toArray().sort(Word.compareByLanguage)).values().filter(
      func(w) {
        w.languageName == language;
      }
    ).toArray();
  };

  public query func getWordsByDifficulty(language : Text, difficulty : Difficulty) : async [Word] {
    (words.values().toArray().sort(Word.compareByLanguage)).values().filter(
      func(w) {
        w.languageName == language and w.difficulty == difficulty;
      }
    ).toArray();
  };

  public query func getWordsByDifficultyLevel(language : Text, difficulty : Text) : async [Word] {
    let difficultyEnum = switch (difficulty) {
      case ("Beginner") { #beginner };
      case ("Medium") { #medium };
      case ("Hard") { #hard };
      case ("Advanced") { #advanced };
      case (_) { #beginner };
    };

    words.values().toArray().filter(
      func(w) {
        w.languageName == language and w.difficulty == difficultyEnum;
      }
    );
  };

  // Get word counts per difficulty (public query)
  public query func getWordCountByDifficulty(language : Text) : async [(Text, Nat)] {
    let difficulties : [Difficulty] = [#beginner, #medium, #hard, #advanced];
    difficulties.map(
      func(d) {
        let count = words.values().toArray().filter(
          func(w) { w.languageName == language and w.difficulty == d }
        ).size();
        let difficultyName = switch (d) {
          case (#beginner) { "Beginner" };
          case (#medium) { "Medium" };
          case (#hard) { "Hard" };
          case (#advanced) { "Advanced" };
        };
        (difficultyName, count);
      }
    );
  };

  // Get user progress - users can only view their own, admins can view any
  public query ({ caller }) func getUserProgress(user : Principal) : async ?UserProgress {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own progress");
    };
    userProgress.get(user);
  };

  // Get caller's own progress (convenience function)
  public query ({ caller }) func getCallerProgress() : async ?UserProgress {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access progress");
    };
    userProgress.get(caller);
  };

  // Update user progress - users can only update their own
  public shared ({ caller }) func updateUserProgress(totalCorrect : Nat, totalAnswered : Nat, streak : Nat, badges : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update progress");
    };

    let progress : UserProgress = {
      principal = caller;
      totalCorrect;
      totalAnswered;
      streak;
      lastPlayed = ?Time.now();
      badges;
    };

    userProgress.add(caller, progress);
  };

  // Helper function to seed initial languages (admin-only)
  public shared ({ caller }) func seedInitialLanguages() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can seed initial languages");
    };

    let initialLanguages : [Language] = [
      {
        name = "Turkish";
        code = "tr";
        flagEmoji = "🇹🇷";
        textDirection = #ltr;
        gradientStart = "#DC2626";
        gradientEnd = "#EA580C";
        ordering = 1;
        createdAt = Time.now();
      },
      {
        name = "Spanish";
        code = "es";
        flagEmoji = "🇪🇸";
        textDirection = #ltr;
        gradientStart = "#36D1C4";
        gradientEnd = "#67F9D5";
        ordering = 2;
        createdAt = Time.now();
      },
      {
        name = "Arabic";
        code = "ar";
        flagEmoji = "🇸🇦";
        textDirection = #rtl;
        gradientStart = "#1e3c72";
        gradientEnd = "#2a5298";
        ordering = 3;
        createdAt = Time.now();
      },
      {
        name = "German";
        code = "de";
        flagEmoji = "🇩🇪";
        textDirection = #ltr;
        gradientStart = "#FF6B6B";
        gradientEnd = "#FFE66D";
        ordering = 4;
        createdAt = Time.now();
      },
      {
        name = "Japanese";
        code = "ja";
        flagEmoji = "🇯🇵";
        textDirection = #ltr;
        gradientStart = "#A8E6CF";
        gradientEnd = "#FFD3B6";
        ordering = 5;
        createdAt = Time.now();
      },
      {
        name = "French";
        code = "fr";
        flagEmoji = "🇫🇷";
        textDirection = #ltr;
        gradientStart = "#667EEA";
        gradientEnd = "#764BA2";
        ordering = 6;
        createdAt = Time.now();
      }
    ];

    for (lang in initialLanguages.values()) {
      languages.add(lang.name, lang);
    };
  };
};

