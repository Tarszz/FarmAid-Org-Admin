
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DonationConfirmation from "../donations/DonationConfirmation";

interface Donation {
  id: string;
  donor: string;
  type: string;
  quantity: string;
  date: string;
  status: string;
}

const DonationsPanel = () => {
  // Sample data for donations with updated categories
  const [donations, setDonations] = useState([
    { id: "DON-001", donor: "Metro Food Bank", type: "Grains", quantity: "500kg", date: "Apr 22, 2025", status: "Delivered" },
    { id: "DON-002", donor: "Green Agriculture Co.", type: "Rootcrops", quantity: "200kg", date: "Apr 20, 2025", status: "In Transit" },
    { id: "DON-003", donor: "Community Helpers", type: "Vegetables", quantity: "300kg", date: "Apr 18, 2025", status: "Processing" },
    { id: "DON-004", donor: "Tech For Farms", type: "Fruits", quantity: "150kg", date: "Apr 15, 2025", status: "Delivered" },
    { id: "DON-005", donor: "Metro Food Bank", type: "Spices", quantity: "50kg", date: "Apr 12, 2025", status: "Delivered" },
  ]);

  const handleConfirmReceipt = (donationId: string) => {
    setDonations(prev => prev.map(donation => 
      donation.id === donationId 
        ? { ...donation, status: "Confirmed" }
        : donation
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "text-green-600";
      case "Confirmed":
        return "text-blue-600";
      case "In Transit":
        return "text-yellow-600";
      case "Processing":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Donations Management</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 text-left text-gray-600">Donor</th>
              <th className="py-3 text-left text-gray-600">Category</th>
              <th className="py-3 text-left text-gray-600">Quantity</th>
              <th className="py-3 text-left text-gray-600">Date</th>
              <th className="py-3 text-left text-gray-600">Status</th>
              <th className="py-3 text-left text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((donation) => (
              <tr key={donation.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-800">{donation.donor}</td>
                <td className="py-3 text-gray-800">{donation.type}</td>
                <td className="py-3 text-gray-800">{donation.quantity}</td>
                <td className="py-3 text-gray-800">{donation.date}</td>
                <td className={`py-3 font-medium ${getStatusColor(donation.status)}`}>
                  {donation.status}
                </td>
                <td className="py-3">
                  {donation.status === "Delivered" && (
                    <DonationConfirmation
                      donationId={donation.id}
                      donorName={donation.donor}
                      onConfirm={() => handleConfirmReceipt(donation.id)}
                    />
                  )}
                  {donation.status === "Confirmed" && (
                    <span className="text-sm text-blue-600 font-medium">✓ Confirmed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default DonationsPanel;
