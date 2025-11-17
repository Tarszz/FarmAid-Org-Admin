
import { lazy, Suspense, useEffect } from "react";
import { Card } from "@/components/ui/card";

// Import each panel component
import DashboardOverview from "./dashboard/DashboardOverview";
import TransactionsPanel from "./dashboard/TransactionsPanel";
import DonationsPanel from "./dashboard/DonationsPanel";
import CommunicationsPanel from "./dashboard/CommunicationsPanel";
import MediaPanel from "./dashboard/MediaPanel";
import AnalyticsPanel from "./dashboard/AnalyticsPanel";
import SettingsPanel from "./dashboard/SettingsPanel";
import ReportsPanel from "./dashboard/ReportsPanel";
import NotificationsPanel from "./dashboard/NotificationsPanel";
import Complaints from "@/pages/complaints";
interface DashboardContentProps {
  activeTab: string;
}

const DashboardContent = ({ activeTab }: DashboardContentProps) => {
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "analytics":
        return <AnalyticsPanel />;
      case "transactions":
        return <TransactionsPanel />;
      case "donations":
        return <DonationsPanel />;
      case "notifications":
        return <NotificationsPanel />;
      case "communications":
        return <CommunicationsPanel />;
      case "reports":
        return <ReportsPanel />;
      case "media":
        return <MediaPanel />;
      case "settings":
        return <SettingsPanel />;
      case "complaints":
        return <Complaints />;
      default:
        return (
          <Card className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20">
            <p className="text-gray-500">Select a menu item to view content</p>
          </Card>
        );
    }
  };

  return (
    <main className="flex-1 p-8 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </main>
  );
};

export default DashboardContent;
