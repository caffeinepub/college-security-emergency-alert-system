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
  ChevronRight,
  FileText,
  LayoutDashboard,
  Loader2,
  MapPin,
  Shield,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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

type AdminPage = "overview" | "sos-alerts" | "incident-reports" | "users";

const adminNavItems: {
  page: AdminPage;
  label: string;
  icon: React.ElementType;
}[] = [
  { page: "overview", label: "Overview", icon: LayoutDashboard },
  { page: "sos-alerts", label: "SOS Alerts", icon: AlertTriangle },
  { page: "incident-reports", label: "Incident Reports", icon: FileText },
  { page: "users", label: "Registered Users", icon: Users },
];

export default function AdminPanel() {
  const [activePage, setActivePage] = useState<AdminPage>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: allAlerts, isLoading: alertsLoading } = useAllAlerts();
  const { data: allReports, isLoading: reportsLoading } = useAllReports();
  const updateAlertStatus = useUpdateAlertStatus();

  const flatAlerts =
    allAlerts?.flatMap(([principal, alerts]) =>
      alerts.map((a, idx) => ({ principal, alert: a, idx: BigInt(idx) })),
    ) ?? [];

  const flatReports = allReports?.flatMap(([, reports]) => reports) ?? [];

  const openAlerts = flatAlerts.filter((a) => !a.alert.status).length;
  const resolvedAlerts = flatAlerts.filter((a) => a.alert.status).length;

  const uniqueUsers = [
    ...new Set([
      ...(allAlerts?.map(([p]) => p.toString()) ?? []),
      ...(allReports?.map(([p]) => p.toString()) ?? []),
    ]),
  ];

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

  const navigate = (page: AdminPage) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader
        isAdmin
        showMenuButton
        onMenuToggle={() => setSidebarOpen((o) => !o)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Admin Sidebar */}
        <aside
          className={`
            fixed md:sticky top-16 z-50 md:z-auto h-[calc(100vh-4rem)] w-64 shrink-0
            flex flex-col transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
          style={{
            background:
              "linear-gradient(180deg, oklch(0.2 0.1 15) 0%, oklch(0.14 0.06 15) 100%)",
            borderRight: "1px solid oklch(0.3 0.08 15)",
          }}
        >
          {/* Admin badge */}
          <div
            className="p-4 border-b"
            style={{ borderColor: "oklch(0.3 0.08 15)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">Admin Panel</div>
                <div className="text-xs text-white/50">Security Operations</div>
              </div>
              <button
                type="button"
                className="md:hidden text-white/50 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {adminNavItems.map(({ page, label, icon: Icon }) => {
              const isActive = activePage === page;
              return (
                <button
                  key={page}
                  type="button"
                  data-ocid={`admin.nav.${page}.link`}
                  onClick={() => navigate(page)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-white/65 hover:text-white hover:bg-white/8"
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white/50" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Stats summary */}
          <div
            className="p-4 space-y-2"
            style={{ borderTop: "1px solid oklch(0.3 0.08 15)" }}
          >
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Open Alerts</span>
              <span className="font-bold text-red-400">{openAlerts}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Total Reports</span>
              <span className="font-bold text-white">{flatReports.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Users</span>
              <span className="font-bold text-white">{uniqueUsers.length}</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {activePage === "overview" && (
                <AdminOverviewDashboard
                  openAlerts={openAlerts}
                  resolvedAlerts={resolvedAlerts}
                  totalReports={flatReports.length}
                  registeredStudents={uniqueUsers.length}
                  recentAlerts={flatAlerts.slice(0, 5)}
                  recentReports={flatReports.slice(0, 5)}
                  alertsLoading={alertsLoading}
                  reportsLoading={reportsLoading}
                  onNavigate={navigate}
                />
              )}
              {activePage === "sos-alerts" && (
                <AdminAlertsDashboard
                  flatAlerts={flatAlerts}
                  isLoading={alertsLoading}
                  onResolve={handleResolve}
                  resolving={updateAlertStatus.isPending}
                />
              )}
              {activePage === "incident-reports" && (
                <AdminReportsDashboard
                  flatReports={flatReports}
                  isLoading={reportsLoading}
                />
              )}
              {activePage === "users" && (
                <AdminUsersDashboard
                  allAlerts={allAlerts}
                  allReports={allReports}
                  isLoading={alertsLoading || reportsLoading}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AppFooter />
    </div>
  );
}

/* ─── Admin Page Header ──────────────────────────────────────────── */
function AdminPageHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="px-6 py-5 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.22 0.1 15), oklch(0.35 0.12 15))",
            }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Admin Overview Dashboard ───────────────────────────────────── */
function AdminOverviewDashboard({
  openAlerts,
  resolvedAlerts,
  totalReports,
  registeredStudents,
  recentAlerts,
  recentReports,
  alertsLoading,
  reportsLoading,
  onNavigate,
}: {
  openAlerts: number;
  resolvedAlerts: number;
  totalReports: number;
  registeredStudents: number;
  recentAlerts: any[];
  recentReports: any[];
  alertsLoading: boolean;
  reportsLoading: boolean;
  onNavigate: (page: AdminPage) => void;
}) {
  const stats = [
    {
      label: "Open Alerts",
      value: openAlerts,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      page: "sos-alerts" as AdminPage,
    },
    {
      label: "Total Reports",
      value: totalReports,
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
      page: "incident-reports" as AdminPage,
    },
    {
      label: "Resolved Alerts",
      value: resolvedAlerts,
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success-bg",
      page: "sos-alerts" as AdminPage,
    },
    {
      label: "Registered Students",
      value: registeredStudents,
      icon: Users,
      color: "text-muted-foreground",
      bg: "bg-muted",
      page: "users" as AdminPage,
    },
  ];

  return (
    <div>
      {/* Admin hero banner */}
      <div
        className="h-36 flex items-end"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.1 15) 0%, oklch(0.14 0.07 15) 60%, oklch(0.2 0.12 255) 100%)",
        }}
      >
        <div className="px-6 pb-5">
          <div className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-70">
              Security Operations Center
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Admin Overview
          </h2>
          <p className="text-sm text-white/60">
            GHRCEM Pune — Real-time monitoring
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg, page }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <Card
                className="card-shadow cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onNavigate(page)}
                data-ocid={`admin.overview.${page}.card`}
              >
                <CardContent className="p-5">
                  <div
                    className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}
                  >
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {value}
                  </div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent alerts */}
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-destructive" />
                Recent SOS Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div
                  data-ocid="admin.overview.alerts.loading_state"
                  className="space-y-2"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentAlerts.length > 0 ? (
                <div className="space-y-2">
                  {recentAlerts.map(({ alert, principal }, i) => (
                    <div
                      key={`ra-${String(alert.timestamp)}-${i}`}
                      data-ocid={`admin.overview.alert.item.${i + 1}`}
                      className="flex items-center gap-2.5 p-2.5 rounded-md bg-destructive/5 border border-destructive/15"
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          alert.status ? "bg-success" : "bg-destructive"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {principal.toString().slice(0, 12)}...
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatTimestamp(alert.timestamp)}
                        </div>
                      </div>
                      <Badge
                        variant={alert.status ? "outline" : "destructive"}
                        className="text-[10px]"
                      >
                        {alert.status ? "Resolved" : "Active"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  data-ocid="admin.overview.alerts.empty_state"
                  className="py-8 text-center text-muted-foreground"
                >
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No alerts yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent reports */}
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Recent Incident Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div
                  data-ocid="admin.overview.reports.loading_state"
                  className="space-y-2"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentReports.length > 0 ? (
                <div className="space-y-2">
                  {recentReports.map((r, i) => (
                    <div
                      key={`rr-${String(r.timestamp)}-${i}`}
                      data-ocid={`admin.overview.report.item.${i + 1}`}
                      className="flex items-center gap-2.5 p-2.5 rounded-md bg-muted/60"
                    >
                      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {r.incidentType}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.location} · {formatTimestamp(r.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  data-ocid="admin.overview.reports.empty_state"
                  className="py-8 text-center text-muted-foreground"
                >
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No reports yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Admin Alerts Dashboard ─────────────────────────────────────── */
function AdminAlertsDashboard({
  flatAlerts,
  isLoading,
  onResolve,
  resolving,
}: {
  flatAlerts: { principal: Principal; alert: any; idx: bigint }[];
  isLoading: boolean;
  onResolve: (principal: Principal, idx: bigint) => void;
  resolving: boolean;
}) {
  return (
    <div>
      <AdminPageHeader
        title="SOS Alerts"
        subtitle="All student emergency alerts — resolve active ones here"
        icon={AlertTriangle}
      />
      <div className="p-6">
        <Card className="card-shadow">
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div
                data-ocid="admin.alerts.loading_state"
                className="p-6 space-y-3"
              >
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : flatAlerts.length === 0 ? (
              <div
                data-ocid="admin.alerts.empty_state"
                className="p-12 text-center text-muted-foreground"
              >
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No alerts recorded yet</p>
              </div>
            ) : (
              <Table data-ocid="admin.alerts.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date & Time</TableHead>
                    <TableHead className="text-xs">Student Principal</TableHead>
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
                      <TableCell className="text-xs font-mono">
                        {principal.toString().slice(0, 16)}...
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {alert.location}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs max-w-[180px] truncate">
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
                            onClick={() => onResolve(principal, idx)}
                            disabled={resolving}
                          >
                            {resolving ? (
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
      </div>
    </div>
  );
}

/* ─── Admin Reports Dashboard ────────────────────────────────────── */
function AdminReportsDashboard({
  flatReports,
  isLoading,
}: {
  flatReports: any[];
  isLoading: boolean;
}) {
  return (
    <div>
      <AdminPageHeader
        title="Incident Reports"
        subtitle="All student-submitted incident reports"
        icon={FileText}
      />
      <div className="p-6">
        <Card className="card-shadow">
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div
                data-ocid="admin.reports.loading_state"
                className="p-6 space-y-3"
              >
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : flatReports.length === 0 ? (
              <div
                data-ocid="admin.reports.empty_state"
                className="p-12 text-center text-muted-foreground"
              >
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No incident reports yet</p>
              </div>
            ) : (
              <Table data-ocid="admin.reports.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date & Time</TableHead>
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
      </div>
    </div>
  );
}

/* ─── Admin Users Dashboard ──────────────────────────────────────── */
function AdminUsersDashboard({
  allAlerts,
  allReports,
  isLoading,
}: {
  allAlerts: [Principal, any[]][] | undefined;
  allReports: [Principal, any[]][] | undefined;
  isLoading: boolean;
}) {
  // Build user map: principal -> { alertCount, reportCount }
  const userMap = new Map<
    string,
    { principal: string; alertCount: number; reportCount: number }
  >();

  for (const [p, alerts] of allAlerts ?? []) {
    const key = p.toString();
    const entry = userMap.get(key) ?? {
      principal: key,
      alertCount: 0,
      reportCount: 0,
    };
    entry.alertCount += alerts.length;
    userMap.set(key, entry);
  }

  for (const [p, reports] of allReports ?? []) {
    const key = p.toString();
    const entry = userMap.get(key) ?? {
      principal: key,
      alertCount: 0,
      reportCount: 0,
    };
    entry.reportCount += reports.length;
    userMap.set(key, entry);
  }

  const users = [...userMap.values()];

  return (
    <div>
      <AdminPageHeader
        title="Registered Users"
        subtitle="All students who have submitted alerts or reports"
        icon={Users}
      />
      <div className="p-6">
        <Card className="card-shadow">
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div
                data-ocid="admin.users.loading_state"
                className="p-6 space-y-3"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div
                data-ocid="admin.users.empty_state"
                className="p-12 text-center text-muted-foreground"
              >
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No registered users yet</p>
              </div>
            ) : (
              <Table data-ocid="admin.users.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Principal ID</TableHead>
                    <TableHead className="text-xs">SOS Alerts</TableHead>
                    <TableHead className="text-xs">Reports</TableHead>
                    <TableHead className="text-xs">Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u, i) => (
                    <TableRow
                      key={u.principal}
                      data-ocid={`admin.users.row.${i + 1}`}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {u.principal}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.alertCount > 0 ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          {u.alertCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {u.reportCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex gap-1">
                          {u.alertCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[10px]">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {u.alertCount} SOS
                            </span>
                          )}
                          {u.reportCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">
                              <FileText className="w-2.5 h-2.5" />
                              {u.reportCount} Reports
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
