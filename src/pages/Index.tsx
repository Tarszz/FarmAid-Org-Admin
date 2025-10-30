
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardContent from "@/components/DashboardContent";
import { Home, BarChart, ShoppingCart, Gift, Settings, LogOut, Bell } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { fetchUnreadNotifications } from "@/lib/firebaseServices";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch notifications count
  const { data: notificationsCount = 0 } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchUnreadNotifications,
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const isDemo = localStorage.getItem("isAuthenticated") === "true";
      if (!user && !isDemo) {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("isAuthenticated");
      await auth.signOut();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Simplified menuItems with approvals removed and reordered
  const menuItems = [
    { section: "OVERVIEW", items: [
      { title: "Dashboard", icon: Home, id: "dashboard" },
      { title: "Analytics", icon: BarChart, id: "analytics" },
    ]},
    { section: "MANAGEMENT", items: [
      { title: "Transactions", icon: ShoppingCart, id: "transactions" },
      { title: "Donations", icon: Gift, id: "donations" },
      { title: "Notifications", icon: Bell, id: "notifications", badge: notificationsCount.toString() },
    ]},
    { section: "SYSTEM", items: [
      { title: "Settings", icon: Settings, id: "settings" },
      { title: "Logout", icon: LogOut, id: "logout" },
    ]},
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-100 text-gray-800">
        <Sidebar className="bg-green-700 text-white border-none w-72">
          <SidebarContent>
            <div className="p-4">
              <div className="text-2xl font-bold text-white">FarmAid</div>
              <div className="text-sm text-white/70 mt-1">Metro Food Bank</div>
            </div>
            {menuItems.map((section) => (
              <SidebarGroup key={section.section}>
                <SidebarGroupLabel className="text-gray-100 font-medium">{section.section}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          className={`w-full text-gray-100 text-lg py-3 ${activeTab === item.id ? 'bg-green-500 text-white' : 'hover:bg-green-600'}`}
                          onClick={() => item.id === "logout" ? handleLogout() : setActiveTab(item.id)}
                        >
                          <item.icon className="mr-3" size={22} />
                          <span className="font-medium">{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto bg-white text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                              {item.badge}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>
        <DashboardContent activeTab={activeTab} />
      </div>
    </SidebarProvider>
  );
};

export default Index;
