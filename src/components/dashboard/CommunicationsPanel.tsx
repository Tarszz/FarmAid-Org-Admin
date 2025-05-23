
import { Card } from "@/components/ui/card";

interface Communication {
  id: string;
  subject: string;
  donor: string;
  date: string;
  status: string;
}

const CommunicationsPanel = () => {
  // Sample data for communications
  const sampleCommunications = [
    { id: "COM-001", subject: "Monthly Donation Update", donor: "Metro Food Bank", date: "Apr 22, 2025", status: "Unread" },
    { id: "COM-002", subject: "Farming Equipment Offer", donor: "Tech For Farms", date: "Apr 20, 2025", status: "Read" },
    { id: "COM-003", subject: "Seasonal Seeds Donation", donor: "Green Agriculture Co.", date: "Apr 18, 2025", status: "Replied" },
    { id: "COM-004", subject: "Community Farming Day", donor: "Community Helpers", date: "Apr 15, 2025", status: "Read" },
  ];

  return (
    <Card className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Donor Communications</h2>
      <div className="space-y-4">
        {sampleCommunications.map((comm) => (
          <div key={comm.id} className="p-4 border rounded-lg border-gray-200 bg-white">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">{comm.subject}</h3>
              <span className={`text-sm ${comm.status === "Unread" ? "text-[#4ecdc4] font-semibold" : "text-gray-500"}`}>{comm.status}</span>
            </div>
            <p className="text-sm text-gray-700">From: {comm.donor}</p>
            <p className="text-sm text-gray-700">Date: {comm.date}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CommunicationsPanel;
