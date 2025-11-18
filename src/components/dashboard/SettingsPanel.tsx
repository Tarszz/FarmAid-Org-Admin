import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Download } from "lucide-react";
import { toast } from "sonner";
import { collection, getDocs, doc, getDoc, setDoc, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";

interface OrganizationSettings {
  orgName: string;
  contactEmail: string;
  contactPhone: string;
}

interface AuditLog {
  id: string;
  action: string;
  details?: string;
  user: string;
  timestamp: string;
}

const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<OrganizationSettings>({
    orgName: "Default Organization",
    contactEmail: "admin@organization.org",
    contactPhone: "09123456789",
  });
  const [prevSettings, setPrevSettings] = useState<OrganizationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Log organization admin actions
  const logOrgAdminAction = async (action: string, details?: string) => {
    try {
      const logRef = doc(collection(db, "auditLogs"));
      await setDoc(logRef, {
        action,
        details: details || "",
        user: "Organization Admin",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to log admin action:", err);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "organizationSettings", "main");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as OrganizationSettings;
        setSettings(data);
        setPrevSettings(data);
      } else {
        await setDoc(docRef, settings);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch settings");
    }
    setLoading(false);
  };

  const fetchAuditLogs = async () => {
    try {
      const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const logsData: AuditLog[] = snapshot.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as AuditLog) }))
        .filter((log) => log.user === "Organization Admin");
      setLogs(logsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAuditLogs();
  }, []);

  const generateChangeDetails = (prev: OrganizationSettings, curr: OrganizationSettings) => {
    const changes: string[] = [];
    if (prev.orgName !== curr.orgName)
      changes.push(`Organization Name changed from "${prev.orgName}" to "${curr.orgName}"`);
    if (prev.contactEmail !== curr.contactEmail)
      changes.push(`Contact Email changed from "${prev.contactEmail}" to "${curr.contactEmail}"`);
    if (prev.contactPhone !== curr.contactPhone)
      changes.push(`Contact Phone changed from "${prev.contactPhone}" to "${curr.contactPhone}"`);
    return changes.join("; ");
  };

  const validateFields = () => {
    // Validate phone number
    if (!/^\d{11}$/.test(settings.contactPhone)) {
      toast.error("Contact Phone must be exactly 11 digits.");
      return false;
    }
    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail)) {
      toast.error("Contact Email must be a valid email address.");
      return false;
    }
    return true;
  };

  const handleSaveSettings = async () => {
    if (!prevSettings) return;
    if (!validateFields()) return; // stop if validation fails

    setSaving(true);
    try {
      const changes = generateChangeDetails(prevSettings, settings);
      if (changes) {
        await setDoc(doc(db, "organizationSettings", "main"), settings);
        await logOrgAdminAction("Updated organization settings", changes);
        toast.success("Settings saved successfully!");
        setPrevSettings(settings);
      } else {
        toast("No changes detected");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    }
    setSaving(false);
    fetchAuditLogs();
  };

  const handleBackup = async () => {
    try {
      const collections = ["organizationSettings", "users", "transactions", "donations"];
      const backupData: Record<string, any> = {};

      for (const col of collections) {
        const snapshot = await getDocs(collection(db, col));
        backupData[col] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      }

      const structuredBackup = {
        timestamp: new Date().toISOString(),
        data: backupData,
      };

      const blob = new Blob([JSON.stringify(structuredBackup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `organization_backup_${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      await logOrgAdminAction("Downloaded organization backup");
      toast.success("Backup downloaded successfully!");
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to download backup");
    }
  };

  return (
    <Card className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Organization Settings</h2>

      <div className="space-y-6">
        {/* Organization Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Organization Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={settings.orgName}
                onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="text"
                maxLength={11}
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value.replace(/\D/g, "") })}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-4">
            <Button
              onClick={handleSaveSettings}
              disabled={saving || loading}
              className="flex items-center gap-2 bg-[#0da54b] hover:bg-[#0a8f3c] text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              onClick={handleBackup}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <Download className="h-4 w-4" /> Download Backup
            </Button>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Audit Logs */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Audit Logs</h3>
          <Card className="max-h-64 overflow-y-auto">
            <CardContent className="space-y-2">
              {logs.length === 0 && <p className="text-gray-500 text-center py-4">No logs yet</p>}
              {logs.map((log) => (
                <div key={log.id} className="p-3 border-b border-gray-200 rounded-md bg-gray-50">
                  <p className="text-sm font-medium text-gray-800">{log.action}</p>
                  {log.details && <p className="text-xs text-gray-600 mt-1">{log.details}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {log.user} • {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Card>
  );
};

export default SettingsPanel;
