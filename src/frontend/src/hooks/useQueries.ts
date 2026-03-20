import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "../backend";
import { useActor } from "./useActor";

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => actor!.isCallerAdmin(),
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: UserProfile) => actor!.saveCallerUserProfile(profile),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
  });
}

export function useStudentAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["studentAlerts"],
    queryFn: () => actor!.getStudentAlerts(),
    enabled: !!actor && !isFetching,
  });
}

export function useStudentReports() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["studentReports"],
    queryFn: () => actor!.getStudentReports(),
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitSOS() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      location,
      message,
    }: { location: string; message: string }) =>
      actor!.submitSOSAlert(location, message),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["studentAlerts"] }),
  });
}

export function useSubmitReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      incidentType,
      location,
      description,
      photoBlobId,
    }: {
      incidentType: string;
      location: string;
      description: string;
      photoBlobId: string | null;
    }) =>
      actor!.submitIncidentReport(
        incidentType,
        location,
        description,
        photoBlobId,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["studentReports"] }),
  });
}

export function useAllAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allAlerts"],
    queryFn: () => actor!.getAllActiveAlerts(),
    enabled: !!actor && !isFetching,
  });
}

export function useAllReports() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allReports"],
    queryFn: () => actor!.getAllReports(),
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateAlertStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      user,
      alertIndex,
      newStatus,
    }: {
      user: Principal;
      alertIndex: bigint;
      newStatus: boolean;
    }) => actor!.updateAlertStatus(user, alertIndex, newStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allAlerts"] }),
  });
}

export function useAssignAdminRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ user }: { user: Principal }) =>
      actor!.assignCallerUserRole(user, "admin" as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["isAdmin"] }),
  });
}
