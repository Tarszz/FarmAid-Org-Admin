
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SettingsPanel = () => {
  return (
    <Card className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Account Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Admin User" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="admin@farmaid.org" />
            </div>
          </div>
          <Button className="bg-[#0da54b] hover:bg-[#0a8f3c]">Save Changes</Button>
        </div>
        
        <hr className="border-gray-200" />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notifications">SMS Notifications</Label>
              <Switch id="sms-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="app-notifications">In-App Notifications</Label>
              <Switch id="app-notifications" defaultChecked />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SettingsPanel;
