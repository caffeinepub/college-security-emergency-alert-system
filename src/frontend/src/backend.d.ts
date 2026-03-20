import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface IncidentReport {
    description: string;
    timestamp: Time;
    photoBlobId?: string;
    location: string;
    incidentType: string;
}
export type Time = bigint;
export interface SOSAlert {
    status: boolean;
    message: string;
    timestamp: Time;
    location: string;
}
export interface UserProfile {
    studentId: string;
    name: string;
    department: string;
    phoneNumber: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllActiveAlerts(): Promise<Array<[Principal, Array<SOSAlert>]>>;
    getAllReports(): Promise<Array<[Principal, Array<IncidentReport>]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getStudentAlerts(): Promise<Array<SOSAlert>>;
    getStudentReports(): Promise<Array<IncidentReport>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitIncidentReport(incidentType: string, location: string, description: string, photoBlobId: string | null): Promise<void>;
    submitSOSAlert(location: string, message: string): Promise<void>;
    updateAlertStatus(user: Principal, alertIndex: bigint, newStatus: boolean): Promise<void>;
}
