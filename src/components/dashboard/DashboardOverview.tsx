import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { BellDot, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { app } from "../../firebase";

type NotificationItem = {
  id: string;
  message: string;
  timestamp: Timestamp;
};

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [totalDonations, setTotalDonations] = useState<number>(0);
  const [monthlyDonations, setMonthlyDonations] = useState<number>(0);
  const [activeFarmers, setActiveFarmers] = useState<number>(0);
  const [totalDonors, setTotalDonors] = useState<number>(0);
  const [activeMarkets, setActiveMarkets] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<NotificationItem[]>([]);

  const handleNavigate = (tabId: string) => {
    window.sessionStorage.setItem("activeTab", tabId);
    window.location.href = "/";
  };

  // Helper to format date difference as e.g. "2h ago"
  const timeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    const db = getFirestore(app);

    const fetchData = async () => {
      // Fetch Total Donations (sum of totalAmount in donation transactions)
      const donationsQuery = query(
        collection(db, "transactions"),
        where("transactionType", "==", "donation")
      );
      const donationsSnapshot = await getDocs(donationsQuery);

      let totalDonationAmount = 0;
      let monthlyDonationAmount = 0;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Collect buyerIds for donors
      const donorIds = new Set<string>();

      donationsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.totalAmount) {
          totalDonationAmount += data.totalAmount;
        }
        if (data.timestamp && Array.isArray(data.items)) {
          const date = data.timestamp.toDate();
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            data.items.forEach((item: any) => {
              if (item.price) {
                monthlyDonationAmount += item.price;
              }
            });
          }
        }
        if (data.buyerId) {
          donorIds.add(data.buyerId);
        }
      });

      setTotalDonations(totalDonationAmount);
      setMonthlyDonations(monthlyDonationAmount);

      // Count total donors by checking if users exist for each buyerId
      let donorsCount = 0;
      for (const id of donorIds) {
        const userDocRef = doc(db, "users", id);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const user = userDocSnap.data();
          if (user.firstname && user.lastname) {
            donorsCount++;
          }
        }
      }
      setTotalDonors(donorsCount);

      // Fetch active farmers count
      const farmersQuery = query(collection(db, "users"), where("userType", "==", "Farmer"));
      const farmersSnapshot = await getDocs(farmersQuery);
      setActiveFarmers(farmersSnapshot.size);

      // Fetch active markets count
      const marketsQuery = query(collection(db, "users"), where("userType", "==", "Market"));
      const marketsSnapshot = await getDocs(marketsQuery);
      setActiveMarkets(marketsSnapshot.size);

      // Fetch recent activities (notifications with transactionType "donation")
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("transactionType", "==", "donation")
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);

      const activities: NotificationItem[] = [];

      for (const notifDoc of notificationsSnapshot.docs) {
        const notifData = notifDoc.data();
        let message = notifData.message || "";
        const timestamp = notifData.timestamp;

        // Replace first word "you" with buyer's full name
        if (
          notifData.buyerId &&
          typeof message === "string" &&
          message.trim().toLowerCase().startsWith("you")
        ) {
          const userDocRef = doc(db, "users", notifData.buyerId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const user = userDocSnap.data();
            const fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim();
            // Replace only the first "you" (case insensitive)
            message = message.replace(/^you/i, fullName);
          }
        }

        if (timestamp && timestamp.toDate) {
          activities.push({
            id: notifDoc.id,
            message,
            timestamp,
          });
        }
      }

      // Sort notifications by timestamp descending (most recent first)
      activities.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());

      setRecentActivities(activities);
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleNavigate("transactions")}
        >
          <h3 className="text-xl font-semibold text-[#0da54b] mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold text-gray-800">
            ₱{totalDonations.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">From Donations</p>
        </Card>

        <Card className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-xl font-semibold text-[#0da54b] mb-2">Active Farmers</h3>
          <p className="text-3xl font-bold text-gray-800">{activeFarmers}</p>
          <p className="text-sm text-gray-600">Registered users</p>
        </Card>

        <Card
          className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleNavigate("donations")}
        >
          <h3 className="text-xl font-semibold text-[#0da54b] mb-2">Total Donations</h3>
          <p className="text-3xl font-bold text-gray-800">₱{monthlyDonations.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Current month</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20 hover:shadow-lg transition-shadow cursor-pointer overflow-y-auto max-h-[320px]"
          onClick={() => handleNavigate("notifications")}
        >
          <h3 className="text-xl font-semibold text-[#0da54b] mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.length === 0 && (
              <p className="text-gray-600 text-center">No recent donation notifications</p>
            )}
            {recentActivities.map(({ id, message, timestamp }) => (
              <div
                key={id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-[#4ecdc4] flex items-center justify-center text-white">
                  <BellDot className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium">{message}</p>
                </div>
                <p className="ml-auto text-sm text-gray-500">
                  {timeAgo(timestamp.toDate())}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card
          className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleNavigate("analytics")}
        >
          <h3 className="text-xl font-semibold text-[#0da54b] mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Farmers</p>
              <p className="text-2xl font-bold text-gray-800">{activeFarmers}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Donors</p>
              <p className="text-2xl font-bold text-gray-800">{totalDonors}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Active Markets</p>
              <p className="text-2xl font-bold text-gray-800">{activeMarkets}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
