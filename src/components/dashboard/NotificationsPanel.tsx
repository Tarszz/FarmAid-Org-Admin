
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

const NotificationsPanel = () => {
  // Sample notifications data
  const sampleNotifications = [
    {
      id: "notif-001",
      message: "New donation received from Metro Food Bank",
      timestamp: "Today, 10:23 AM",
      read: false
    },
    {
      id: "notif-002",
      message: "Donation #DON-002 from Green Agriculture Co. is in transit",
      timestamp: "Yesterday, 2:45 PM",
      read: false
    },
    {
      id: "notif-003",
      message: "Community Helpers confirmed donation receipt",
      timestamp: "May 22, 2025, 9:30 AM",
      read: true
    },
    {
      id: "notif-004",
      message: "System maintenance scheduled for May 25, 2025",
      timestamp: "May 21, 2025, 11:15 AM",
      read: true
    },
    {
      id: "notif-005",
      message: "New feature: Donation image uploads now available",
      timestamp: "May 20, 2025, 3:20 PM",
      read: true
    }
  ];

  return (
    <Card className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded">
          {sampleNotifications.filter(n => !n.read).length} unread
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {sampleNotifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`py-4 ${notification.read ? 'opacity-70' : 'bg-green-50'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${notification.read ? 'text-gray-400' : 'text-green-500'}`}>
                <Bell size={18} />
              </div>
              <div>
                <p className={`${notification.read ? 'font-normal' : 'font-medium'}`}>
                  {notification.message}
                </p>
                <p className="text-gray-500 text-sm mt-1">{notification.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sampleNotifications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No notifications found.
        </div>
      )}
    </Card>
  );
};

export default NotificationsPanel;
