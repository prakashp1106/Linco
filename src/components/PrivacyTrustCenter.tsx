/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  Eye,
  Trash2,
  Download,
  CheckCircle,
  HelpCircle,
  Mail,
  FileText,
  UserCheck,
  Smartphone,
  Globe,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Info,
  Sliders,
  Database,
  Calendar,
  X,
  Compass,
  FileCheck2,
  ChevronRight,
  ShieldAlert,
  UserX,
  Linkedin,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PrivacyTrustCenterProps {
  onClose?: () => void;
  initialSection?: string;
  addToast: (msg: string, type: "success" | "info" | "warn" | "error") => void;
}

export const PrivacyTrustCenter: React.FC<PrivacyTrustCenterProps> = ({
  onClose,
  initialSection = "privacy",
  addToast
}) => {
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const [consentTracking, setConsentTracking] = useState(true);
  const [consentVisualAI, setConsentVisualAI] = useState(true);
  const [consentLocation, setConsentLocation] = useState(true);

  // Simulated active sessions
  const [sessions, setSessions] = useState([
    { id: 1, device: "Apple iPhone 15 Pro", location: "Kolkata, WB, India", active: true, time: "Current Session" },
    { id: 2, device: "MacBook Pro (Chrome/macOS)", location: "Kolkata, WB, India", active: false, time: "2 hours ago" },
    { id: 3, device: "iPad Air Safari", location: "Mumbai, MH, India", active: false, time: "3 days ago" }
  ]);

  // Simulated security log
  const [securityLogs, setSecurityLogs] = useState([
    { id: 1, action: "PIN Verification Passed", date: "2026-07-07 11:24:05", status: "success" },
    { id: 2, action: "Recovery Room Activated", date: "2026-07-07 09:12:15", status: "success" },
    { id: 3, action: "Consent Settings Updated", date: "2026-07-06 18:44:12", status: "success" }
  ]);

  // Account controls states
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDownloadingData, setIsDownloadingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactEmail, setContactEmail] = useState("user@linco.community");
  const [contactPhone, setContactPhone] = useState("+91 98765 43210");

  const handleDownloadData = () => {
    setIsDownloadingData(true);
    addToast("Preparing secure data export archive...", "info");
    setTimeout(() => {
      setIsDownloadingData(false);
      // Simulate real download by triggering a small JSON file download
      const userData = {
        app: "LINCO Lost & Found Platform",
        user_identifier: "lincoindia00@gmail.com",
        timestamp: "2026-07-07T09:43:47-07:00",
        rights_claimed: "GDPR / CCPA Data Access Right",
        active_consent_modes: {
          essential_cookies: true,
          analytical_scanners: consentTracking,
          location_precision: consentLocation,
          visual_comparative_models: consentVisualAI
        },
        recent_activity_sessions: sessions,
        recent_security_logs: securityLogs
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `LINCO_My_Personal_Data_Export.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      addToast("Your personal data archive (.json) has been compiled and downloaded.", "success");
    }, 2000);
  };

  const handleDeleteData = () => {
    setIsDeletingData(true);
    addToast("Initializing permanent local data purging cascade...", "info");
    setTimeout(() => {
      setIsDeletingData(false);
      addToast("Successfully deleted all personal data caches, active cookies, and local identifiers.", "success");
    }, 2500);
  };

  const handleDeleteAccount = () => {
    setIsDeletingAccount(true);
    addToast("Processing account deactivation request...", "info");
    setTimeout(() => {
      setIsDeletingAccount(false);
      addToast("Account deactivation requested. The Grievance Officer will clear database indexes within 14 business days.", "success");
    }, 3000);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingContact(false);
    addToast("Contact information securely updated on active session tokens.", "success");
  };

  const handleRevokeSession = (id: number) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    addToast("Session revoked. Authentication token invalidated successfully.", "success");
  };

  const handleLogoutAll = () => {
    setSessions(prev => prev.filter(s => s.active));
    addToast("All other remote session keys have been invalidated.", "success");
  };

  // Nav categories
  const categories = [
    { id: "privacy", label: "Privacy Policy", icon: <FileText size={14} /> },
    { id: "terms", label: "Terms & Conditions", icon: <FileCheck2 size={14} /> },
    { id: "privacy-center", label: "Privacy Center", icon: <Shield size={14} /> },
    { id: "security", label: "Security & Sessions", icon: <Lock size={14} /> },
    { id: "retention", label: "Data Retention", icon: <Calendar size={14} /> },
    { id: "rights", label: "Your Rights & Controls", icon: <UserCheck size={14} /> },
    { id: "contact-team", label: "Contact Us", icon: <Mail size={14} /> }
  ];

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-left" id="privacy-compliance-root">
      
      {/* HEADER HERO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#1c1c26] pb-6">
        <div>
          <span className="text-[10px] font-mono font-black text-indigo-400 tracking-[0.2em] uppercase flex items-center gap-1.5">
            <Shield size={10} className="text-indigo-400" />
            COMPLIANCE, PRIVACY &amp; TRUST PROTOCOLS
          </span>
          <h2 className="text-3xl font-sans font-extrabold text-white tracking-tight mt-1">
            Trust &amp; Compliance Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            We hold ourselves to the highest standards of user safety, extreme privacy isolation, and radical transparency.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <X size={14} />
            Exit Section
          </button>
        )}
      </div>

      {/* CORE TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side Navigation (Span 3) */}
        <aside className="md:col-span-3 space-y-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveSection(cat.id)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border text-left ${
                activeSection === cat.id
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                  : "bg-[#07070a]/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#12121a]/60"
              }`}
            >
              {cat.icon}
              <span className="truncate">{cat.label}</span>
              {activeSection === cat.id && <ChevronRight size={12} className="ml-auto text-indigo-400" />}
            </button>
          ))}
        </aside>

        {/* Right Side Content Pane (Span 9) */}
        <main className="md:col-span-9 bg-[#07070a]/60 border border-[#161621] rounded-3xl p-6 sm:p-8 space-y-8 backdrop-blur-xl min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              
              {/* SECTION 1: PRIVACY POLICY */}
              {activeSection === "privacy" && (
                <div className="space-y-6">
                  <div className="border-b border-[#1c1c26] pb-4">
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <FileText size={18} className="text-indigo-400" />
                      Privacy Policy
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Last Updated: July 7, 2026. Built with extreme data minimization as our baseline.
                    </p>
                  </div>

                  <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed space-y-4">
                    <p>
                      At LINCO, we believe privacy is a fundamental human right. Unlike legacy lost &amp; found forums, we have engineered our architecture from the ground up to prevent data hoarding, reverse identification, and tracking of lost property owners.
                    </p>

                    <h4 className="text-sm font-bold text-white mt-4">1. What Information We Collect</h4>
                    <p>
                      We strictly limit data acquisition to parameters necessary to locate and match your lost belongings:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Item Classification:</strong> Category description, physical traits, optional visual photographs.</li>
                      <li><strong>Coarse Spatiotemporal Tags:</strong> The approximate geographical area, date, and time bounds where the event transpired.</li>
                      <li><strong>Encrypted Connection Channels:</strong> Masked contact telephone numbers or email references, locked behind decentralized, self-selected 4-digit PINs.</li>
                    </ul>

                    <h4 className="text-sm font-bold text-white mt-4">2. Why We Collect It</h4>
                    <p>
                      Information collected is mapped purely to execute matching queries (such as nearby spatial and keyword overlap calculations). We never build marketing or advertising profiles, monetize user behaviors, or retain behavioral traces.
                    </p>

                    <h4 className="text-sm font-bold text-white mt-4">3. Isolation &amp; Security Measures</h4>
                    <p>
                      Contact information is completely masked and unexposed to index crawlers. Inquirers can only request contact handshakes by entering their verified owner matching code or solving security claims, creating an air-gapped system that prevents robotic harvest of citizen telephone numbers.
                    </p>

                    <h4 className="text-sm font-bold text-white mt-4">4. Third-Party Integrations</h4>
                    <p>
                      We utilize Google Gemini APIs purely for on-demand description enhancements. Your coordinates and personal contact digits are never processed, shared, or indexed by external language models.
                    </p>

                    <h4 className="text-sm font-bold text-white mt-4">5. Your Digital Sovereignty</h4>
                    <p>
                      You retain complete, real-time control to modify, inspect, export, or completely expunge your records from our databases. Once a lost item is resolved, all associated coordinates, details, and photos are purged from our active lookup arrays automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 2: TERMS & CONDITIONS */}
              {activeSection === "terms" && (
                <div className="space-y-6">
                  <div className="border-b border-[#1c1c26] pb-4">
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <FileCheck2 size={18} className="text-indigo-400" />
                      Terms &amp; Conditions
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Last Updated: July 7, 2026. Simple human agreements for safe community retrieval.
                    </p>
                  </div>

                  <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed space-y-4">
                    <p>
                      Welcome to LINCO. By utilizing this community coordination network, you agree to follow our code of conduct, designed purely to maximize safe item recovery and prevent bad-faith behavior.
                    </p>

                    <h4 className="text-sm font-bold text-white mt-4">1. Trustworthy Reporting &amp; Ownership Verification</h4>
                    <p>
                      Users reporting lost or found property must provide accurate spatiotemporal anchors and physical traits. Under no circumstances may users claim items that are not their legal property, or insert deliberate false identifiers to intercept rewards.
                    </p>

                    <h4 className="text-sm font-bold text-white mt-4">2. Zero-Tolerance Misuse Policy</h4>
                    <p>
                      Any form of extortion, harassment, fraudulent reward claim, or bait-and-switch behavior will result in an immediate, permanent ban of associated network IP ranges and session certificates, with relevant audit files forwarded directly to law enforcement authorities.
                    </p>

                    <h4 className="text-sm font-bold text-white mt-4">3. Citizen Rewards System</h4>
                    <p>
                      Rewards are offered as voluntary incentives by lost item owners. LINCO does not process financial assets directly, does not take finder commissions, and is not a financial intermediary. Handshakes and reward handovers should always be executed in safe, public coordination areas (e.g., local police stations or crowded transit centers).
                    </p>

                    <h4 className="text-sm font-bold text-white mt-4">4. Liability Limitations</h4>
                    <p>
                      While our matching tools optimize search grids, LINCO is not liable for actual item recovery success, meeting safety, or physical disputes between members. We urge all users to prioritize personal safety during any exchange.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 3: PRIVACY CENTER */}
              {activeSection === "privacy-center" && (
                <div className="space-y-6">
                  <div className="border-b border-[#1c1c26] pb-4">
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Shield size={18} className="text-indigo-400" />
                      Privacy Center
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage real-time cookie preferences, consent policies, and data processing toggles.
                    </p>
                  </div>

                  {/* Consent Management Switches */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-4">
                      <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Active Consent Management
                      </h4>

                      {/* Switch 1: Analytical Scanners */}
                      <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-900">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white block">Analytical Performance Scanners</span>
                          <span className="text-[10px] text-slate-400 block leading-relaxed">
                            Allows us to monitor platform speeds, image compressions, and query load balances locally.
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={consentTracking}
                            onChange={(e) => {
                              setConsentTracking(e.target.checked);
                              addToast(`Analytical scanners ${e.target.checked ? "enabled" : "disabled"}.`, "info");
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white"></div>
                        </label>
                      </div>

                      {/* Switch 2: Location precision */}
                      <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-900">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white block">Fine GPS Coordinates Mapping</span>
                          <span className="text-[10px] text-slate-400 block leading-relaxed">
                            Allows PIN-verified mapping, coarse neighborhood lookup, and match accuracy calculations.
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={consentLocation}
                            onChange={(e) => {
                              setConsentLocation(e.target.checked);
                              addToast(`GPS coarse mapping ${e.target.checked ? "enabled" : "disabled"}.`, "info");
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white"></div>
                        </label>
                      </div>

                      {/* Switch 3: Visual AI Models */}
                      <div className="flex items-center justify-between gap-4 py-2">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white block">Visual Feature Extractor Models</span>
                          <span className="text-[10px] text-slate-400 block leading-relaxed">
                            Utilizes Gemini computer vision modeling to process matching details inside photos.
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={consentVisualAI}
                            onChange={(e) => {
                              setConsentVisualAI(e.target.checked);
                              addToast(`Visual feature models ${e.target.checked ? "enabled" : "disabled"}.`, "info");
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white"></div>
                        </label>
                      </div>

                    </div>

                    {/* Collected Data Box */}
                    <div className="p-4 rounded-2xl bg-[#030304]/60 border border-slate-800/40 space-y-3">
                      <div className="flex items-center gap-2">
                        <Database size={14} className="text-cyan-400" />
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          Your Active Data Blueprint
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        To fulfill our radical transparency mandate, we disclose the exact size of data stored in this browser session. There are no secondary shadow cookies tracking you outside of waitlisted items.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Active Posts</span>
                          <span className="text-base font-bold text-white">Local Storage</span>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Decrypted Contact Cache</span>
                          <span className="text-base font-bold text-white">RAM isolated</span>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Session Keys</span>
                          <span className="text-base font-bold text-white">Non-persistent</span>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Telemetry Trace</span>
                          <span className="text-base font-bold text-white">0 bytes</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* SECTION 4: SECURITY */}
              {activeSection === "security" && (
                <div className="space-y-6">
                  <div className="border-b border-[#1c1c26] pb-4">
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Lock size={18} className="text-indigo-400" />
                      Security Center
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Monitor active secure sessions, connected devices, and localized auditing records.
                    </p>
                  </div>

                  <div className="space-y-4">
                    
                    {/* Active Sessions */}
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                          Active Secured Sessions
                        </span>
                        <button
                          onClick={handleLogoutAll}
                          className="text-[10px] font-mono font-black text-rose-400 hover:text-rose-300 uppercase tracking-wide cursor-pointer flex items-center gap-1"
                        >
                          <LogOut size={10} />
                          Terminate Remote Sessions
                        </button>
                      </div>

                      <div className="space-y-2">
                        {sessions.map((sess) => (
                          <div
                            key={sess.id}
                            className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <Smartphone size={14} className={sess.active ? "text-emerald-400 animate-pulse" : "text-slate-500"} />
                              <div>
                                <p className="font-bold text-slate-200">{sess.device}</p>
                                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Globe size={10} />
                                  {sess.location} • {sess.time}
                                </p>
                              </div>
                            </div>

                            {sess.active ? (
                              <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">
                                Current
                              </span>
                            ) : (
                              <button
                                onClick={() => handleRevokeSession(sess.id)}
                                className="text-[10px] font-bold text-slate-400 hover:text-rose-400 cursor-pointer transition px-2 py-1 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Security Activity Logs */}
                    <div className="p-4 rounded-2xl bg-[#030304]/60 border border-slate-800/40 space-y-3">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Localized Security Audit Logs
                      </span>

                      <div className="space-y-2">
                        {securityLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between text-[11px] font-mono border-b border-slate-900/60 pb-2 last:border-0 last:pb-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="text-slate-300">{log.action}</span>
                            </div>
                            <span className="text-slate-500 text-[10px]">{log.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* SECTION 5: DATA RETENTION */}
              {activeSection === "retention" && (
                <div className="space-y-6">
                  <div className="border-b border-[#1c1c26] pb-4">
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Calendar size={18} className="text-indigo-400" />
                      Data Retention &amp; Auto-Purging
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Our automated lifecycle management guarantees your data is never archived indefinitely.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                      <span className="text-xs font-bold text-cyan-400 block">Active Claims</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Reports actively seeking matches are retained in RAM/Database loops up to <strong>90 Days</strong> maximum before automatic cold storage archiving.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                      <span className="text-xs font-bold text-emerald-400 block">Recovered Items</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Once an item is marked as "Resolved" by the owner, all associated metadata is permanently expunged within <strong>48 Hours</strong>.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                      <span className="text-xs font-bold text-violet-400 block">Dormant Logs</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Telemetry and match records of expired items are wiped completely. No persistent cold backups or backup reels are maintained.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#030304]/60 border border-slate-800/40 text-xs text-slate-400 space-y-2">
                    <span className="font-bold text-white block">Auto-Purging Schedule Notice:</span>
                    <p className="leading-relaxed">
                      We do not believe in hoarding records. If an item is unclaimed and receives no coordination handshakes for 90 days, it triggers our automatic deletion cascade.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 6: RIGHTS & CONTROLS */}
              {activeSection === "rights" && (
                <div className="space-y-6">
                  <div className="border-b border-[#1c1c26] pb-4">
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <UserCheck size={18} className="text-indigo-400" />
                      Your Rights &amp; Sovereignty Controls
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Direct spatiotemporal sovereign controls in full compliance with GDPR, CCPA, and global privacy standards.
                    </p>
                  </div>

                  {/* Real interactive Account/Data Controls */}
                  <div className="space-y-4">
                    
                    {/* Control Row 1: Contact info */}
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white block">Edit Personal Information</span>
                          <span className="text-[11px] text-slate-400 block">
                            Modify contact credentials used for match alerts and verified claimant notifications.
                          </span>
                        </div>
                        {!isEditingContact && (
                          <button
                            onClick={() => setIsEditingContact(true)}
                            className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Edit Information
                          </button>
                        )}
                      </div>

                      {isEditingContact && (
                        <form onSubmit={handleSaveContact} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Secure Email</label>
                            <input
                              type="email"
                              required
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              className="w-full px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Secure Mobile</label>
                            <input
                              type="text"
                              required
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              className="w-full px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                            />
                          </div>
                          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingContact(false)}
                              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Save Updates
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Control Row 2: Download Data */}
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">Download My Personal Data</span>
                        <span className="text-[11px] text-slate-400 block">
                          Download a portable, structured JSON archive containing your coordinates, active lookups, and session audit history.
                        </span>
                      </div>
                      <button
                        onClick={handleDownloadData}
                        disabled={isDownloadingData}
                        className="px-3.5 py-2 bg-[#030304] border border-slate-800 hover:border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                      >
                        <Download size={13} className={isDownloadingData ? "animate-spin" : ""} />
                        {isDownloadingData ? "Exporting..." : "Download Data"}
                      </button>
                    </div>

                    {/* Control Row 3: Delete My Personal Data */}
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">Delete My Personal Data</span>
                        <span className="text-[11px] text-slate-400 block">
                          Instantly purge active cookies, locally cached coordinates, matching indices, and file previews from this local browser instance.
                        </span>
                      </div>
                      <button
                        onClick={handleDeleteData}
                        disabled={isDeletingData}
                        className="px-3.5 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                      >
                        <Trash2 size={13} className={isDeletingData ? "animate-spin" : ""} />
                        {isDeletingData ? "Purging..." : "Purge Data Cache"}
                      </button>
                    </div>

                    {/* Control Row 4: Delete Account */}
                    <div className="p-4 rounded-2xl bg-red-950/10 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-red-400 block">Delete My Account</span>
                        <span className="text-[11px] text-slate-400 block">
                          Completely de-register your secure identity and notify the Grievance Officer to remove all cloud indices permanently.
                        </span>
                      </div>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount}
                        className="px-3.5 py-2 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                      >
                        <UserX size={13} className={isDeletingAccount ? "animate-spin" : ""} />
                        {isDeletingAccount ? "Deactivating..." : "Delete Account"}
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* SECTION 7: CONTACT US & SUPPORT HUB */}
              {activeSection === "contact-team" && (
                <div className="space-y-8" id="contact-support-hub">
                  {/* Header Introduction Card */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#07070a]/90 border border-slate-800/80 relative overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                    <div className="relative space-y-4">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400">
                        Help &amp; Assistance
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        We're here to help.
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                        Whether you've lost something, found something, or simply have a question, our team is ready to assist.
                      </p>
                    </div>
                  </div>

                  {/* Contact Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Option 1: Email Support */}
                    <div className="p-6 rounded-3xl bg-slate-950/40 border border-slate-800/80 space-y-4 flex flex-col justify-between focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                      <div className="space-y-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Mail size={18} />
                        </div>
                        <h4 className="text-base font-bold text-white">Email Support</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Reach our dedicated support team directly. We are happy to help resolve claims, questions, or issues.
                        </p>
                      </div>
                      <div className="pt-4">
                        <a
                          href="mailto:lincoindia00@gmail.com?subject=LINCO%20Support%20Request&body=Hello%20LINCO%20Team%2C%0A%0AI%20need%20assistance%20regarding%3A%0A%0A_____________________%0A%0AThank%20you."
                          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-[#030304] border border-slate-800 hover:border-indigo-500 hover:text-white text-slate-300 font-mono font-semibold text-xs rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          aria-label="Email support at lincoindia00@gmail.com"
                        >
                          lincoindia00@gmail.com
                        </a>
                      </div>
                    </div>

                    {/* Option 2: LinkedIn Connection */}
                    <div className="p-6 rounded-3xl bg-slate-950/40 border border-slate-800/80 space-y-4 flex flex-col justify-between focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all">
                      <div className="space-y-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                          <Linkedin size={18} />
                        </div>
                        <h4 className="text-base font-bold text-white">LinkedIn Support</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Connect directly with our founder on our official professional network profile for escalation, feedback, or partnerships.
                        </p>
                      </div>
                      <div className="pt-4">
                        <a
                          href="https://www.linkedin.com/in/prakashpathak1306"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-[#030304] border border-slate-800 hover:border-cyan-500 hover:text-white text-slate-300 font-semibold text-xs rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          aria-label="Connect with Prakash Pathak on LinkedIn"
                        >
                          Connect on LinkedIn
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Expected Response Time Card */}
                  <div className="p-5 rounded-3xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Clock size={18} />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                        Response Guarantee
                      </span>
                      <h4 className="text-xs font-bold text-white">Expected Response Time</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Our support team reviews every request and guarantees a response in <strong className="text-white">Under 24 Hours</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>

      </div>

    </div>
  );
};
