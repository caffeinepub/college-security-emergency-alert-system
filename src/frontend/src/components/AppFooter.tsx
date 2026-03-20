import { Mail, Phone, Shield } from "lucide-react";

export default function AppFooter() {
  const year = new Date().getFullYear();
  const utm = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`;

  return (
    <footer className="bg-foreground text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-black uppercase tracking-widest">
                  Guardian
                </div>
                <div className="text-[10px] uppercase tracking-widest opacity-60">
                  Campus Safety
                </div>
              </div>
            </div>
            <p className="text-xs opacity-60 max-w-xs">
              GH Raisoni College of Engineering and Management, Pune. Keeping
              students safe with real-time alerts and incident reporting.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3 opacity-70">
              Links
            </h3>
            <ul className="space-y-2 text-sm opacity-70">
              <li>Dashboard</li>
              <li>SOS Alerts</li>
              <li>Incident Reports</li>
              <li>Admin Panel</li>
            </ul>
          </div>

          {/* Emergency Contacts */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3 opacity-70">
              Emergency Contacts
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 opacity-80">
                <Phone className="w-3.5 h-3.5" />
                <span>Campus Security: 020-1234-5678</span>
              </li>
              <li className="flex items-center gap-2 opacity-80">
                <Phone className="w-3.5 h-3.5" />
                <span>Police: 100</span>
              </li>
              <li className="flex items-center gap-2 opacity-80">
                <Phone className="w-3.5 h-3.5" />
                <span>Ambulance: 108</span>
              </li>
              <li className="flex items-center gap-2 opacity-80">
                <Mail className="w-3.5 h-3.5" />
                <span>security@ghrcem.edu.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-4 text-center text-xs opacity-50">
          © {year}. Built with ❤️ using{" "}
          <a
            href={utm}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
