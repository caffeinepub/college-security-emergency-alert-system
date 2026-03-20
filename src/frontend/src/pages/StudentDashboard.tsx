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
  FileText,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Phone,
  Shield,
  Upload,
  User,
} from "lucide-react";
import { motion } from "motion/react";
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

type Tab = "home" | "dashboard" | "alerts" | "reports" | "contacts";

interface Props {
  profile: UserProfile | null;
}

export default function StudentDashboard({ profile }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showProfileModal, setShowProfileModal] = useState(!profile);
  const [reportForm, setReportForm] = useState({
    incidentType: "",
    location: "",
    description: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      await submitReport.mutateAsync({
        ...reportForm,
        photoBlobId,
      });
      toast.success("Report submitted successfully!");
      setReportForm({ incidentType: "", location: "", description: "" });
      setPhotoFile(null);
    } catch {
      toast.error("Failed to submit report");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Hero Section */}
      <div
        className="relative h-44 md:h-56 flex items-end"
        style={{
          backgroundImage:
            "url('/assets/generated/campus-hero.dim_1200x500.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.5)" }}
        />
        <div className="relative z-10 px-6 pb-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Welcome back, {profile?.name || "Student"}.
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Your safety is our priority at GHRCEM, Pune.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <Card className="card-shadow mb-4">
              <CardContent className="pt-5">
                <div className="flex flex-col items-center text-center mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.22 0.1 15), oklch(0.35 0.12 15))",
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
                      <User className="w-7 h-7" />
                    )}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Guardian Campus Safety
                  </div>
                  <div className="font-semibold text-foreground">
                    {profile?.name || "—"}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      className="bg-success-bg text-success text-xs"
                      variant="outline"
                    >
                      Secure
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student ID</span>
                    <span className="font-mono text-xs font-medium">
                      {profile?.studentId || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dept.</span>
                    <span className="text-xs font-medium text-right max-w-[120px] truncate">
                      {profile?.department || "—"}
                    </span>
                  </div>
                </div>
                {!profile && (
                  <Button
                    data-ocid="sidebar.profile.button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => setShowProfileModal(true)}
                  >
                    <User className="w-3.5 h-3.5 mr-1" />
                    Complete Profile
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="card-shadow">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold">
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <ul className="space-y-1">
                  {[
                    { icon: Bell, label: "My Alerts", tab: "alerts" as Tab },
                    {
                      icon: FileText,
                      label: "My Reports",
                      tab: "reports" as Tab,
                    },
                    {
                      icon: Phone,
                      label: "Emergency Contacts",
                      tab: "contacts" as Tab,
                    },
                  ].map(({ icon: Icon, label, tab }) => (
                    <li key={tab}>
                      <button
                        type="button"
                        data-ocid={`quicklinks.${tab}.link`}
                        onClick={() => setActiveTab(tab)}
                        className="flex items-center gap-2.5 w-full text-sm py-1.5 px-2 rounded hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </aside>

          {/* Main column */}
          <div className="flex-1 min-w-0">
            {(activeTab === "home" || activeTab === "dashboard") && (
              <DashboardView
                alerts={alerts}
                alertsLoading={alertsLoading}
                reports={reports}
                reportsLoading={reportsLoading}
                reportForm={reportForm}
                setReportForm={setReportForm}
                photoFile={photoFile}
                setPhotoFile={setPhotoFile}
                fileInputRef={fileInputRef}
                uploadingPhoto={uploadingPhoto}
                handleSOS={handleSOS}
                handleReportSubmit={handleReportSubmit}
                sosPending={submitSOS.isPending}
                reportPending={submitReport.isPending || uploadingPhoto}
              />
            )}

            {activeTab === "alerts" && (
              <AlertsView alerts={alerts} isLoading={alertsLoading} />
            )}

            {activeTab === "reports" && (
              <ReportsView reports={reports} isLoading={reportsLoading} />
            )}

            {activeTab === "contacts" && <ContactsView />}
          </div>
        </div>
      </main>

      <AppFooter />

      <ProfileSetupModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}

/* ─── DashboardView ─────────────────────────────────────────────────── */
interface DashboardViewProps {
  alerts: any[] | undefined;
  alertsLoading: boolean;
  reports: any[] | undefined;
  reportsLoading: boolean;
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
  handleSOS: () => void;
  handleReportSubmit: (e: React.FormEvent) => void;
  sosPending: boolean;
  reportPending: boolean;
}

function DashboardView({
  alerts,
  alertsLoading,
  reports,
  reportsLoading,
  reportForm,
  setReportForm,
  photoFile,
  setPhotoFile,
  fileInputRef,
  handleSOS,
  handleReportSubmit,
  sosPending,
  reportPending,
}: DashboardViewProps) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-foreground">Dashboard</h2>

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* SOS Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="overflow-hidden border-0 sos-gradient text-white">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">
                  Emergency SOS
                </span>
              </div>
              <p className="text-xs opacity-75">
                Press the button below to send an immediate emergency alert with
                your location to campus security.
              </p>
              <button
                type="button"
                data-ocid="sos.primary_button"
                onClick={handleSOS}
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
              <p className="text-[11px] opacity-60">
                Tap once to send emergency alert
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-shadow h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-destructive" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div data-ocid="alerts.loading_state" className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : alerts && alerts.length > 0 ? (
                <ul className="space-y-2">
                  {alerts.slice(0, 3).map((alert, i) => (
                    <li
                      key={`a-${String(alert.timestamp)}-${i}`}
                      data-ocid={`alerts.item.${i + 1}`}
                      className="flex items-start gap-2 p-2.5 rounded-md bg-destructive/5 border border-destructive/20"
                    >
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">
                          {alert.message}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {alert.location}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatTimestamp(alert.timestamp)}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          alert.status
                            ? "text-xs text-success border-success"
                            : "text-xs"
                        }
                      >
                        {alert.status ? "Resolved" : "Active"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  data-ocid="alerts.empty_state"
                  className="text-center py-8 text-muted-foreground"
                >
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No active alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Report Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Quick Incident Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleReportSubmit}
                className="space-y-3"
                data-ocid="report.panel"
              >
                <div className="space-y-1">
                  <Label className="text-xs">Incident Type *</Label>
                  <Select
                    value={reportForm.incidentType}
                    onValueChange={(v) =>
                      setReportForm((f) => ({ ...f, incidentType: v }))
                    }
                  >
                    <SelectTrigger
                      data-ocid="report.select"
                      className="h-9 text-sm"
                    >
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
                <div className="space-y-1">
                  <Label className="text-xs">Location *</Label>
                  <Input
                    data-ocid="report.input"
                    className="h-9 text-sm"
                    placeholder="e.g. Block A, Ground Floor"
                    value={reportForm.location}
                    onChange={(e) =>
                      setReportForm((f) => ({ ...f, location: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description *</Label>
                  <Textarea
                    data-ocid="report.textarea"
                    className="text-sm resize-none"
                    rows={3}
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
                <div className="space-y-1">
                  <Label className="text-xs">Photo (optional)</Label>
                  <button
                    type="button"
                    data-ocid="report.dropzone"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-md p-3 text-center cursor-pointer hover:bg-muted/50 transition-colors"
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
                    <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {photoFile ? photoFile.name : "Click to upload photo"}
                    </p>
                  </button>
                </div>
                <Button
                  data-ocid="report.submit_button"
                  type="submit"
                  className="w-full h-9 text-sm"
                  disabled={reportPending}
                >
                  {reportPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Reports */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="card-shadow h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Your Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div data-ocid="reports.loading_state" className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : reports && reports.length > 0 ? (
                <ul className="space-y-2">
                  {reports.slice(0, 4).map((r, i) => (
                    <li
                      key={`r-${String(r.timestamp)}-${i}`}
                      data-ocid={`reports.item.${i + 1}`}
                      className="flex items-start justify-between gap-2 p-2.5 rounded-md bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold">
                          {r.incidentType}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {r.location}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {r.description}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground text-right shrink-0">
                        {formatTimestamp(r.timestamp)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  data-ocid="reports.empty_state"
                  className="text-center py-8 text-muted-foreground"
                >
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No reports yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── AlertsView ────────────────────────────────────────────────────── */
function AlertsView({
  alerts,
  isLoading,
}: { alerts: any[] | undefined; isLoading: boolean }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">My SOS Alerts</h2>
      {isLoading ? (
        <div data-ocid="alerts_page.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((a, i) => (
            <Card
              key={`ap-${String(a.timestamp)}-${i}`}
              data-ocid={`alerts_page.item.${i + 1}`}
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
            data-ocid="alerts_page.empty_state"
            className="py-12 text-center text-muted-foreground"
          >
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No SOS alerts sent yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── ReportsView ───────────────────────────────────────────────────── */
function ReportsView({
  reports,
  isLoading,
}: { reports: any[] | undefined; isLoading: boolean }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">My Incident Reports</h2>
      {isLoading ? (
        <div data-ocid="reports_page.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((r, i) => (
            <Card
              key={`rpp-${String(r.timestamp)}-${i}`}
              data-ocid={`reports_page.item.${i + 1}`}
              className="card-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2 text-xs">
                      {r.incidentType}
                    </Badge>
                    <p className="text-sm text-foreground">{r.description}</p>
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
            data-ocid="reports_page.empty_state"
            className="py-12 text-center text-muted-foreground"
          >
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No incident reports submitted yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── ContactsView ──────────────────────────────────────────────────── */
function ContactsView() {
  const contacts = [
    {
      name: "Campus Security Control Room",
      phone: "020-1234-5678",
      available: "24/7",
    },
    { name: "Police Control Room", phone: "100", available: "24/7" },
    { name: "Fire Brigade", phone: "101", available: "24/7" },
    { name: "Ambulance", phone: "108", available: "24/7" },
    { name: "Women Helpline", phone: "1091", available: "24/7" },
    {
      name: "GHRCEM Admin Office",
      phone: "020-2765-1111",
      available: "Mon–Sat 9AM–5PM",
    },
    {
      name: "Student Welfare Cell",
      phone: "020-2765-1122",
      available: "Mon–Fri 10AM–4PM",
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Emergency Contacts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {contacts.map((c, i) => (
          <Card
            key={c.name}
            data-ocid={`contacts.item.${i + 1}`}
            className="card-shadow"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{c.name}</div>
                <a
                  href={`tel:${c.phone}`}
                  className="text-primary text-sm font-semibold"
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
  );
}
