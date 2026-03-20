import { Button } from "@/components/ui/button";
import { AlertTriangle, BookOpen, Loader2, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex-1 flex flex-col justify-between p-8 md:p-12 text-white overflow-hidden"
      >
        {/* College building background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url('/assets/uploads/3df64438-ad54-4fe0-8cf8-1a8a54442ae8-1.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Dark overlay for text readability */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.55)" }}
        />

        <div className="relative z-10">
          {/* College crest + brand */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-black uppercase tracking-widest leading-none">
                Guardian
              </div>
              <div className="text-xs font-medium uppercase tracking-widest opacity-75">
                Campus Safety
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            GH Raisoni College of
            <br />
            Engineering & Management
          </h1>
          <p className="text-base opacity-80 max-w-sm">
            Pune's trusted campus security & emergency alert system. Keeping our
            community safe, together.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 grid grid-cols-1 gap-3 mt-8">
          {[
            {
              icon: AlertTriangle,
              label: "SOS Emergency Alerts",
              desc: "One-tap emergency signal with live location",
            },
            {
              icon: BookOpen,
              label: "Incident Reporting",
              desc: "Document incidents with photos & descriptions",
            },
            {
              icon: Shield,
              label: "Admin Monitoring",
              desc: "Real-time oversight by security personnel",
            },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs opacity-70">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right Panel - Login form */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 bg-card"
      >
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.22 0.1 15), oklch(0.14 0.07 15))",
              }}
            >
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Student Login
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in with your Internet Identity to access the system
            </p>
          </div>

          <div className="space-y-4">
            <Button
              data-ocid="login.primary_button"
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="w-full h-12 text-base font-semibold"
              style={{ background: "oklch(var(--primary))", color: "white" }}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Login Securely
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Secure authentication powered by Internet Identity.
              <br />
              No passwords required.
            </p>
          </div>

          <div className="mt-8 p-4 rounded-lg bg-muted border border-border">
            <p className="text-xs text-muted-foreground text-center">
              <strong>GHRCEM Pune</strong> — Emergency Helpline:{" "}
              <strong>020-1234-5678</strong>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
