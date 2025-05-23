
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const ApprovalsPanel = () => {
  const approvals = [
    { id: "APR-001", requestType: "Donation Registration", requester: "Metro Food Bank", date: "Apr 22, 2025", status: "Pending" },
    { id: "APR-002", requestType: "Farmer Verification", requester: "Juan Dela Cruz", date: "Apr 21, 2025", status: "Pending" },
    { id: "APR-003", requestType: "Product Listing", requester: "Pedro Garcia", date: "Apr 20, 2025", status: "Pending" },
    { id: "APR-004", requestType: "Withdraw Request", requester: "Maria Santos", date: "Apr 19, 2025", status: "Pending" },
  ];

  return (
    <Card className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Pending Approvals</h2>
      <div className="space-y-4">
        {approvals.map((item) => (
          <div key={item.id} className="p-4 border rounded-lg border-gray-200 bg-white flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800">{item.requestType}</h3>
              <p className="text-sm text-gray-600">From: {item.requester}</p>
              <p className="text-sm text-gray-600">Date: {item.date}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#0da54b] hover:bg-[#0a8f3c]">
                <Check className="mr-1 h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="destructive">
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ApprovalsPanel;
