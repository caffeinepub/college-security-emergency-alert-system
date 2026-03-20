import Time "mo:core/Time";
import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    studentId : Text;
    department : Text;
    phoneNumber : Text;
  };

  public type SOSAlert = {
    timestamp : Time.Time;
    location : Text;
    message : Text;
    status : Bool;
  };

  public type IncidentReport = {
    timestamp : Time.Time;
    incidentType : Text;
    location : Text;
    description : Text;
    photoBlobId : ?Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let studentAlerts = Map.empty<Principal, List.List<SOSAlert>>();
  let studentReports = Map.empty<Principal, List.List<IncidentReport>>();

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
  };

  public shared ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireAuth(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireAuth(caller);
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func submitSOSAlert(location : Text, message : Text) : async () {
    requireAuth(caller);
    let newAlert : SOSAlert = { timestamp = Time.now(); location; message; status = true };
    switch (studentAlerts.get(caller)) {
      case (null) { let a = List.empty<SOSAlert>(); a.add(newAlert); studentAlerts.add(caller, a) };
      case (?a) { a.add(newAlert) };
    };
  };

  public shared ({ caller }) func updateAlertStatus(user : Principal, alertIndex : Nat, newStatus : Bool) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update alert status");
    };
    switch (studentAlerts.get(user)) {
      case (null) { Runtime.trap("No alerts found") };
      case (?alerts) {
        if (alertIndex >= alerts.size()) Runtime.trap("Invalid alert index");
        var i = 0;
        let updated = alerts.map<SOSAlert, SOSAlert>(func(a) {
          let r = if (i == alertIndex) { { timestamp = a.timestamp; location = a.location; message = a.message; status = newStatus } } else { a };
          i += 1; r
        });
        studentAlerts.add(user, updated);
      };
    };
  };

  public shared ({ caller }) func getStudentAlerts() : async [SOSAlert] {
    requireAuth(caller);
    switch (studentAlerts.get(caller)) { case (null) { [] }; case (?a) { a.toArray() } };
  };

  public query ({ caller }) func getAllActiveAlerts() : async [(Principal, [SOSAlert])] {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
    var result = List.empty<(Principal, [SOSAlert])>();
    for ((s, alerts) in studentAlerts.entries()) {
      let filtered = alerts.filter(func(a) { a.status }).toArray();
      if (filtered.size() > 0) result.add((s, filtered));
    };
    result.toArray();
  };

  public shared ({ caller }) func submitIncidentReport(incidentType : Text, location : Text, description : Text, photoBlobId : ?Text) : async () {
    requireAuth(caller);
    let report : IncidentReport = { timestamp = Time.now(); incidentType; location; description; photoBlobId };
    switch (studentReports.get(caller)) {
      case (null) { let r = List.empty<IncidentReport>(); r.add(report); studentReports.add(caller, r) };
      case (?r) { r.add(report) };
    };
  };

  public shared ({ caller }) func getStudentReports() : async [IncidentReport] {
    requireAuth(caller);
    switch (studentReports.get(caller)) { case (null) { [] }; case (?r) { r.toArray() } };
  };

  public query ({ caller }) func getAllReports() : async [(Principal, [IncidentReport])] {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
    var result = List.empty<(Principal, [IncidentReport])>();
    for ((s, reports) in studentReports.entries()) {
      let arr = reports.toArray();
      if (arr.size() > 0) result.add((s, arr));
    };
    result.toArray();
  };
};
