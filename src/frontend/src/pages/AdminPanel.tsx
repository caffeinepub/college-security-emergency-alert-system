import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Principal } from "@icp-sdk/core/principal";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  FileText,
  Loader2,
  MapPin,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import AppFooter from "../components/AppFooter";
import AppHeader from "../components/AppHeader";
import {
  useAllAlerts,
  useAllReports,
  useUpdateAlertStatus,
} from "../hooks/useQueries";
import { formatTimestamp } from "../utils/helpers";

type Tab = "home" | "dashboard" | "alerts" | "reports" | "contacts";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { data: allAlerts, isLoading: alertsLoading } = useAllAlerts();
  const { data: allReports, isLoading: reportsLoading } = useAllReports();
  const updateAlertStatus = useUpdateAlertStatus();

  // Flatten alerts with user principal
  const flatAlerts =
    allAlerts?.flatMap(([principal, alerts]) =>
      alerts.map((a, idx) => ({ principal, alert: a, idx: BigInt(idx) })),
    ) ?? [];

  const flatReports =
    allReports?.flatMap(([, reports]) => reports.map((r) => r)) ?? [];

  const openAlerts = flatAlerts.filter((a) => !a.alert.status).length;
  const totalReports = flatReports.length;

  const handleResolve = async (principal: Principal, idx: bigint) => {
    try {
      await updateAlertStatus.mutateAsync({
        user: principal,
        alertIndex: idx,
        newStatus: true,
      });
      toast.success("Alert marked as resolved");
    } catch {
      toast.error("Failed to update alert");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} isAdmin />

      {/* Admin Hero */}
      <div
        className="h-36 flex items-end"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.1 15) 0%, oklch(0.14 0.07 15) 60%, oklch(0.2 0.12 255) 100%)",
        }}
      >
        <div className="px-6 pb-5 md:px-12">
          <div className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest opacity-70">
              Admin Panel
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Security Operations Center
          </h1>
          <p className="text-sm text-white/70">
            GHRCEM Pune — Real-time monitoring dashboard
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            {
              label: "Open Alerts",
              value: openAlerts,
              icon: AlertTriangle,
              color: "text-destructive",
              bg: "bg-destructive/10",
            },
            {
              label: "Total Reports",
              value: totalReports,
              icon: FileText,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: "Resolved",
              value: flatAlerts.filter((a) => a.alert.status).length,
              icon: CheckCircle,
              color: "text-success",
              bg: "bg-success-bg",
            },
            {
              label: "Students",
              value: allAlerts?.length ?? 0,
              icon: Shield,
              color: "text-muted-foreground",
              bg: "bg-muted",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="card-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <div className="text-2xl font-black">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Section title */}
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Admin Panel (Overview)
          </h2>
        </div>

        {/* Alerts Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-destructive" />
                Recent SOS Alerts & Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {alertsLoading ? (
                <div
                  data-ocid="admin.alerts.loading_state"
                  className="p-4 space-y-3"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : flatAlerts.length === 0 ? (
                <div
                  data-ocid="admin.alerts.empty_state"
                  className="p-8 text-center text-muted-foreground"
                >
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No alerts recorded yet</p>
                </div>
              ) : (
                <Table data-ocid="admin.alerts.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Location</TableHead>
                      <TableHead className="text-xs">Message</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flatAlerts.map(({ principal, alert, idx }, i) => (
                      <TableRow
                        key={`al-${String(alert.timestamp)}-${i}`}
                        data-ocid={`admin.alerts.row.${i + 1}`}
                      >
                        <TableCell className="text-xs">
                          {formatTimestamp(alert.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">
                            SOS
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {alert.location}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {alert.message}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              alert.status
                                ? "text-xs text-success border-success"
                                : "text-xs text-destructive border-destructive"
                            }
                          >
                            {alert.status ? "Resolved" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!alert.status && (
                            <Button
                              data-ocid={`admin.alerts.resolve_button.${i + 1}`}
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-success border-success hover:bg-success-bg"
                              onClick={() => handleResolve(principal, idx)}
                              disabled={updateAlertStatus.isPending}
                            >
                              {updateAlertStatus.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Resolve
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Reports Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                All Incident Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {reportsLoading ? (
                <div
                  data-ocid="admin.reports.loading_state"
                  className="p-4 space-y-3"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : flatReports.length === 0 ? (
                <div
                  data-ocid="admin.reports.empty_state"
                  className="p-8 text-center text-muted-foreground"
                >
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No incident reports yet</p>
                </div>
              ) : (
                <Table data-ocid="admin.reports.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Location</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Photo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flatReports.map((r, i) => (
                      <TableRow
                        key={`rp-${String(r.timestamp)}-${i}`}
                        data-ocid={`admin.reports.row.${i + 1}`}
                      >
                        <TableCell className="text-xs">
                          {formatTimestamp(r.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {r.incidentType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {r.location}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {r.description}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.photoBlobId ? (
                            <Badge
                              className="text-xs bg-primary/10 text-primary"
                              variant="outline"
                            >
                              Photo
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <AppFooter />
    </div>
  );
}
