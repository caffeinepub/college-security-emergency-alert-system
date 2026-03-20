import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { HttpAgent } from "@icp-sdk/core/agent";
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Loader2,
  MapPin,
  Phone,
  Shield,
  Upload,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import AppFooter from "../components/AppFooter";
import AppHeader from "../components/AppHeader";
import ProfileSetupModal from "../components/ProfileSetupModal";
import { loadConfig } from "../config";
import {
  useStudentAlerts,
  useStudentReports,
  useSubmitReport,
  useSubmitSOS,
} from "../hooks/useQueries";
import { StorageClient } from "../utils/StorageClient";
import { formatTimestamp } from "../utils/helpers";

type Page = "overview" | "sos" | "reports" | "contacts" | "profile";

interface Props {
  profile: UserProfile | null;
}

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: "overview", label: "Overview", icon: LayoutDashboard },
  { page: "sos", label: "SOS Emergency", icon: AlertTriangle },
  { page: "reports", label: "Incident Reports", icon: FileText },
  { page: "contacts", label: "Emergency Contacts", icon: Phone },
  { page: "profile", label: "My Profile", icon: User },
];

export default function StudentDashboard({ profile }: Props) {
  const [activePage, setActivePage] = useState<Page>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(!profile);
  const [reportForm, setReportForm] = useState({
    incidentType: "",
    location: "",
    description: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: alerts, isLoading: alertsLoading } = useStudentAlerts();
  const { data: reports, isLoading: reportsLoading } = useStudentReports();
  const submitSOS = useSubmitSOS();
  const submitReport = useSubmitReport();

  const handleSOS = async () => {
    const confirmed = window.confirm(
      "⚠️ Are you sure you want to send an SOS emergency alert? This will notify campus security immediately.",
    );
    if (!confirmed) return;

    let locationStr = "GHRCEM Pune, 18.5626° N, 73.7709° E";
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
          }),
        );
        locationStr = `${pos.coords.latitude.toFixed(6)}° N, ${pos.coords.longitude.toFixed(6)}° E`;
      } catch {
        // use fallback
      }
    }

    try {
      await submitSOS.mutateAsync({
        location: locationStr,
        message: "Emergency SOS triggered by student",
      });
      toast.success("🚨 SOS Alert sent! Campus security has been notified.");
    } catch {
      toast.error("Failed to send SOS alert. Call 020-1234-5678 directly.");
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !reportForm.incidentType ||
      !reportForm.location ||
      !reportForm.description
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    let photoBlobId: string | null = null;
    if (photoFile) {
      setUploadingPhoto(true);
      try {
        const cfg = await loadConfig();
        const agent = await HttpAgent.create({ host: cfg.backend_host });
        const storageClient = new StorageClient(
          cfg.bucket_name,
          cfg.storage_gateway_url,
          cfg.backend_canister_id,
          cfg.project_id,
          agent,
        );
        const bytes = new Uint8Array(await photoFile.arrayBuffer());
        const { hash } = await storageClient.putFile(bytes);
        photoBlobId = hash;
      } catch {
        toast.error("Photo upload failed, submitting without photo");
      } finally {
        setUploadingPhoto(false);
      }
    }

    try {
      await submitReport.mutateAsync({ ...reportForm, photoBlobId });
      toast.success("Report submitted successfully!");
      setReportForm({ incidentType: "", location: "", description: "" });
      setPhotoFile(null);
    } catch {
      toast.error("Failed to submit report");
    }
  };

  const navigate = (page: Page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader
        showMenuButton
        onMenuToggle={() => setSidebarOpen((o) => !o)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay on mobile */}
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

        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-16 z-50 md:z-auto h-[calc(100vh-4rem)] w-64 shrink-0
            bg-sidebar-bg border-r border-sidebar-border flex flex-col
            transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Profile mini */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.22 0.1 15), oklch(0.4 0.14 15))",
                }}
              >
                {profile?.name ? (
                  profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-sidebar-fg truncate">
                  {profile?.name || "Student"}
                </div>
                <div className="text-xs text-sidebar-muted truncate">
                  {profile?.studentId || "Setup profile"}
                </div>
              </div>
              <button
                type="button"
                className="md:hidden text-sidebar-muted hover:text-sidebar-fg"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(({ page, label, icon: Icon }) => {
              const isActive = activePage === page;
              return (
                <button
                  key={page}
                  type="button"
                  data-ocid={`student.nav.${page}.link`}
                  onClick={() => navigate(page)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-fg hover:bg-sidebar-hover"
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* SOS quick-access at bottom */}
          <div className="p-3 border-t border-sidebar-border">
            <button
              type="button"
              data-ocid="sidebar.sos.button"
              onClick={handleSOS}
              disabled={submitSOS.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-60"
              style={{ background: "oklch(var(--sos-red))" }}
            >
              {submitSOS.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Quick SOS
                </>
              )}
            </button>
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
              className="h-full"
            >
              {activePage === "overview" && (
                <OverviewDashboard
                  profile={profile}
                  alerts={alerts}
                  reports={reports}
                  alertsLoading={alertsLoading}
                  reportsLoading={reportsLoading}
                  onNavigate={navigate}
                  onSOS={handleSOS}
                  sosPending={submitSOS.isPending}
                />
              )}
              {activePage === "sos" && (
                <SOSDashboard
                  alerts={alerts}
                  isLoading={alertsLoading}
                  onSOS={handleSOS}
                  sosPending={submitSOS.isPending}
                />
              )}
              {activePage === "reports" && (
                <ReportsDashboard
                  reports={reports}
                  isLoading={reportsLoading}
                  reportForm={reportForm}
                  setReportForm={setReportForm}
                  photoFile={photoFile}
                  setPhotoFile={setPhotoFile}
                  fileInputRef={fileInputRef}
                  uploadingPhoto={uploadingPhoto}
                  handleReportSubmit={handleReportSubmit}
                  reportPending={submitReport.isPending || uploadingPhoto}
                />
              )}
              {activePage === "contacts" && <ContactsDashboard />}
              {activePage === "profile" && (
                <ProfileDashboard
                  profile={profile}
                  onSetupProfile={() => setShowProfileModal(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AppFooter />

      <ProfileSetupModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}

/* ─── Page Header Component ────────────────────────────────────── */
function PageHeader({
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
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
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

/* ─── Overview Dashboard ────────────────────────────────────────── */
function OverviewDashboard({
  profile,
  alerts,
  reports,
  alertsLoading,
  reportsLoading,
  onNavigate,
  onSOS,
  sosPending,
}: {
  profile: UserProfile | null;
  alerts: any[] | undefined;
  reports: any[] | undefined;
  alertsLoading: boolean;
  reportsLoading: boolean;
  onNavigate: (page: Page) => void;
  onSOS: () => void;
  sosPending: boolean;
}) {
  const activeAlerts = alerts?.filter((a) => !a.status).length ?? 0;
  const totalReports = reports?.length ?? 0;

  return (
    <div>
      {/* College hero banner */}
      <div
        className="relative h-48 md:h-64 flex items-end"
        style={{
          backgroundImage:
            "url('/assets/uploads/3df64438-ad54-4fe0-8cf8-1a8a54442ae8-1.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.52)" }}
        />
        <div className="relative z-10 px-6 pb-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">
              GH Raisoni College of Engineering and Management, Pune
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              Welcome, {profile?.name || "Student"}
            </h2>
            <p className="text-sm text-white/75 mt-1">
              Your safety is our priority.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Active Alerts",
              value: alertsLoading ? "—" : activeAlerts,
              icon: AlertTriangle,
              color: "text-destructive",
              bg: "bg-destructive/10",
              page: "sos" as Page,
            },
            {
              label: "Reports Filed",
              value: reportsLoading ? "—" : totalReports,
              icon: FileText,
              color: "text-primary",
              bg: "bg-primary/10",
              page: "reports" as Page,
            },
            {
              label: "Profile Status",
              value: profile ? "Complete" : "Incomplete",
              icon: User,
              color: profile ? "text-success" : "text-muted-foreground",
              bg: profile ? "bg-success-bg" : "bg-muted",
              page: "profile" as Page,
            },
          ].map(({ label, value, icon: Icon, color, bg, page }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
            >
              <Card
                className="card-shadow cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onNavigate(page)}
                data-ocid={`overview.${page}.card`}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-foreground">
                      {value}
                    </div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* SOS Quick Trigger */}
          <Card className="overflow-hidden border-0 sos-gradient text-white">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">
                  Emergency SOS
                </span>
              </div>
              <p className="text-xs opacity-75 max-w-xs">
                Press the button to send an immediate emergency alert with your
                location to campus security.
              </p>
              <button
                type="button"
                data-ocid="sos.primary_button"
                onClick={onSOS}
                disabled={sosPending}
                className="w-28 h-28 rounded-full flex flex-col items-center justify-center text-white font-black text-lg uppercase tracking-widest transition-transform active:scale-95 disabled:opacity-60 sos-glow"
                style={{ background: "oklch(var(--sos-red))" }}
              >
                {sosPending ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <AlertTriangle className="w-8 h-8 mb-1" />
                    SOS
                  </>
                )}
              </button>
              <button
                type="button"
                className="text-xs opacity-60 underline underline-offset-2"
                onClick={() => onNavigate("sos")}
              >
                View SOS History →
              </button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-destructive" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alertsLoading || reportsLoading ? (
                <div
                  data-ocid="overview.activity.loading_state"
                  className="space-y-2"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {(alerts?.slice(0, 2) ?? []).map((a, i) => (
                    <div
                      key={`oa-${String(a.timestamp)}-${i}`}
                      data-ocid={`overview.alert.item.${i + 1}`}
                      className="flex items-center gap-2.5 p-2.5 rounded-md bg-destructive/5 border border-destructive/15"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {a.message}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatTimestamp(a.timestamp)}
                        </div>
                      </div>
                      <Badge
                        variant={a.status ? "outline" : "destructive"}
                        className="text-[10px]"
                      >
                        {a.status ? "Resolved" : "Active"}
                      </Badge>
                    </div>
                  ))}
                  {(reports?.slice(0, 2) ?? []).map((r, i) => (
                    <div
                      key={`or-${String(r.timestamp)}-${i}`}
                      data-ocid={`overview.report.item.${i + 1}`}
                      className="flex items-center gap-2.5 p-2.5 rounded-md bg-muted/60"
                    >
                      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {r.incidentType}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatTimestamp(r.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!alerts?.length && !reports?.length && (
                    <div
                      data-ocid="overview.activity.empty_state"
                      className="text-center py-6 text-muted-foreground"
                    >
                      <Bell className="w-7 h-7 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── SOS Dashboard ──────────────────────────────────────────────── */
function SOSDashboard({
  alerts,
  isLoading,
  onSOS,
  sosPending,
}: {
  alerts: any[] | undefined;
  isLoading: boolean;
  onSOS: () => void;
  sosPending: boolean;
}) {
  return (
    <div>
      <PageHeader
        title="SOS Emergency"
        subtitle="Send emergency alerts and view your alert history"
        icon={AlertTriangle}
      />
      <div className="p-6 space-y-8">
        {/* Big SOS trigger */}
        <Card className="overflow-hidden border-0 sos-gradient text-white">
          <CardContent className="p-8 flex flex-col items-center text-center gap-5">
            <h2 className="text-xl font-bold uppercase tracking-widest">
              Emergency SOS
            </h2>
            <p className="text-sm opacity-80 max-w-md">
              Press the button below to instantly send your GPS location and an
              emergency alert to campus security. Help will be dispatched
              immediately.
            </p>
            <motion.button
              type="button"
              data-ocid="sos.primary_button"
              onClick={onSOS}
              disabled={sosPending}
              whileTap={{ scale: 0.93 }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 2.5,
                ease: "easeInOut",
              }}
              className="w-40 h-40 rounded-full flex flex-col items-center justify-center text-white font-black text-2xl uppercase tracking-widest disabled:opacity-60"
              style={{
                background: "oklch(var(--sos-red))",
                boxShadow:
                  "0 0 0 16px oklch(var(--sos-red) / 0.15), 0 0 0 32px oklch(var(--sos-red) / 0.07), 0 0 32px 4px oklch(var(--sos-red) / 0.4)",
              }}
            >
              {sosPending ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="w-10 h-10 mb-1" />
                  SOS
                </>
              )}
            </motion.button>
            <p className="text-xs opacity-60">
              ⚠️ Only press in a real emergency. You will be asked to confirm.
            </p>
          </CardContent>
        </Card>

        {/* Alert History */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Your SOS Alert History
          </h3>
          {isLoading ? (
            <div data-ocid="sos.history.loading_state" className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <Card
                  key={`sh-${String(a.timestamp)}-${i}`}
                  data-ocid={`sos.history.item.${i + 1}`}
                  className="card-shadow"
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${a.status ? "bg-success" : "bg-destructive"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{a.message}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {a.location}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(a.timestamp)}
                      </div>
                    </div>
                    <Badge
                      variant={a.status ? "outline" : "destructive"}
                      className="text-xs"
                    >
                      {a.status ? "Resolved" : "Active"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="card-shadow">
              <CardContent
                data-ocid="sos.history.empty_state"
                className="py-12 text-center text-muted-foreground"
              >
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No SOS alerts sent yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Reports Dashboard ──────────────────────────────────────────── */
function ReportsDashboard({
  reports,
  isLoading,
  reportForm,
  setReportForm,
  photoFile,
  setPhotoFile,
  fileInputRef,
  uploadingPhoto,
  handleReportSubmit,
  reportPending,
}: {
  reports: any[] | undefined;
  isLoading: boolean;
  reportForm: { incidentType: string; location: string; description: string };
  setReportForm: React.Dispatch<
    React.SetStateAction<{
      incidentType: string;
      location: string;
      description: string;
    }>
  >;
  photoFile: File | null;
  setPhotoFile: (f: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadingPhoto: boolean;
  handleReportSubmit: (e: React.FormEvent) => void;
  reportPending: boolean;
}) {
  return (
    <div>
      <PageHeader
        title="Incident Reports"
        subtitle="Submit a new incident report or review your history"
        icon={FileText}
      />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
              New Report
            </h3>
            <Card className="card-shadow">
              <CardContent className="pt-5">
                <form
                  onSubmit={handleReportSubmit}
                  className="space-y-4"
                  data-ocid="report.panel"
                >
                  <div className="space-y-1.5">
                    <Label>Incident Type *</Label>
                    <Select
                      value={reportForm.incidentType}
                      onValueChange={(v) =>
                        setReportForm((f) => ({ ...f, incidentType: v }))
                      }
                    >
                      <SelectTrigger data-ocid="report.select">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Theft",
                          "Harassment",
                          "Medical Emergency",
                          "Fire",
                          "Suspicious Activity",
                          "Vandalism",
                          "Other",
                        ].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location *</Label>
                    <Input
                      data-ocid="report.input"
                      placeholder="e.g. Block A, Ground Floor"
                      value={reportForm.location}
                      onChange={(e) =>
                        setReportForm((f) => ({
                          ...f,
                          location: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description *</Label>
                    <Textarea
                      data-ocid="report.textarea"
                      className="resize-none"
                      rows={4}
                      placeholder="Describe what happened..."
                      value={reportForm.description}
                      onChange={(e) =>
                        setReportForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Photo (optional)</Label>
                    <button
                      type="button"
                      data-ocid="report.dropzone"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setPhotoFile(e.target.files?.[0] ?? null)
                        }
                      />
                      <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {photoFile ? photoFile.name : "Click to upload photo"}
                      </p>
                    </button>
                  </div>
                  <Button
                    data-ocid="report.submit_button"
                    type="submit"
                    className="w-full"
                    disabled={reportPending}
                  >
                    {reportPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {uploadingPhoto
                          ? "Uploading photo..."
                          : "Submitting..."}
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* History */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Your Report History
            </h3>
            {isLoading ? (
              <div
                data-ocid="reports.history.loading_state"
                className="space-y-3"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map((r, i) => (
                  <Card
                    key={`rh-${String(r.timestamp)}-${i}`}
                    data-ocid={`reports.item.${i + 1}`}
                    className="card-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2 text-xs">
                            {r.incidentType}
                          </Badge>
                          <p className="text-sm text-foreground">
                            {r.description}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {r.location}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right shrink-0">
                          {formatTimestamp(r.timestamp)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-shadow">
                <CardContent
                  data-ocid="reports.history.empty_state"
                  className="py-12 text-center text-muted-foreground"
                >
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No incident reports submitted yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Contacts Dashboard ─────────────────────────────────────────── */
function ContactsDashboard() {
  const contacts = [
    {
      name: "Campus Security Control Room",
      phone: "020-1234-5678",
      available: "24/7",
      urgent: true,
    },
    {
      name: "Police Control Room",
      phone: "100",
      available: "24/7",
      urgent: true,
    },
    { name: "Fire Brigade", phone: "101", available: "24/7", urgent: true },
    { name: "Ambulance", phone: "108", available: "24/7", urgent: true },
    { name: "Women Helpline", phone: "1091", available: "24/7", urgent: true },
    {
      name: "GHRCEM Admin Office",
      phone: "020-2765-1111",
      available: "Mon–Sat 9AM–5PM",
      urgent: false,
    },
    {
      name: "Student Welfare Cell",
      phone: "020-2765-1122",
      available: "Mon–Fri 10AM–4PM",
      urgent: false,
    },
    {
      name: "Anti-Ragging Committee",
      phone: "020-2765-1133",
      available: "Mon–Fri 9AM–5PM",
      urgent: false,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Emergency Contacts"
        subtitle="Quick access to all campus and emergency helplines"
        icon={Phone}
      />
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Emergency Helplines
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contacts
              .filter((c) => c.urgent)
              .map((c, i) => (
                <Card
                  key={c.name}
                  data-ocid={`contacts.item.${i + 1}`}
                  className="card-shadow border-destructive/20"
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm leading-tight">
                        {c.name}
                      </div>
                      <a
                        href={`tel:${c.phone}`}
                        className="text-destructive text-base font-black"
                      >
                        {c.phone}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        {c.available}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
            College Contacts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contacts
              .filter((c) => !c.urgent)
              .map((c, i) => (
                <Card
                  key={c.name}
                  data-ocid={`contacts.college.item.${i + 1}`}
                  className="card-shadow"
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm leading-tight">
                        {c.name}
                      </div>
                      <a
                        href={`tel:${c.phone}`}
                        className="text-primary text-sm font-bold"
                      >
                        {c.phone}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        {c.available}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Dashboard ──────────────────────────────────────────── */
function ProfileDashboard({
  profile,
  onSetupProfile,
}: {
  profile: UserProfile | null;
  onSetupProfile: () => void;
}) {
  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="View and manage your student profile"
        icon={User}
      />
      <div className="p-6">
        {profile ? (
          <div className="max-w-lg space-y-4">
            <Card className="card-shadow">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-black shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.22 0.1 15), oklch(0.4 0.14 15))",
                    }}
                  >
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{profile.name}</h2>
                    <Badge variant="outline" className="text-xs">
                      {profile.department}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Full Name", value: profile.name },
                    { label: "Student ID", value: profile.studentId },
                    { label: "Department", value: profile.department },
                    { label: "Phone", value: profile.phoneNumber },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {label}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Button
              data-ocid="profile.edit.button"
              variant="outline"
              className="w-full"
              onClick={onSetupProfile}
            >
              <User className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        ) : (
          <Card className="card-shadow max-w-lg">
            <CardContent
              data-ocid="profile.setup.panel"
              className="py-12 flex flex-col items-center text-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  No Profile Setup
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete your profile so campus security can identify you.
                </p>
              </div>
              <Button data-ocid="profile.setup.button" onClick={onSetupProfile}>
                <User className="w-4 h-4 mr-2" />
                Set Up Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
