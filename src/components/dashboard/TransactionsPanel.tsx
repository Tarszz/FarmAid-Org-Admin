import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  id: string;
  farmer: string;
  buyerDonor: string;
  crop: string;
  quantity: string;
  amount: string;

  status: string;
}

const TransactionsPanel = () => {
  // Sample data for demonstration
  const allTransactions: Transaction[] = [
    { id: "TRX-001", farmer: "Ash Ketchup", buyerDonor: "Karl Amin", crop: "Rice", quantity: "75kg", amount: "₱5,000", status: "Completed" },
    { id: "TRX-002", farmer: "Leovino Ramos", buyerDonor: "Karl Amin", crop: "Vegetables", quantity: "50kg", amount: "₱2,500", status: "Pending" },
    { id: "TRX-003", farmer: "Angelo Roble", buyerDonor: "Maria Ofelia", crop: "Fruits", quantity: "50kg", amount: "₱3,750", status: "Pending" },
    { id: "TRX-004", farmer: "Khel Amin", buyerDonor: "Jose Reye", crop: "Rice", quantity: "100kg", amount: "₱10,000", status: "Completed" },
    { id: "TRX-005", farmer: "Jose Dela Cruz", buyerDonor: "Community Helpers", crop: "Vegetables", quantity: "30kg", amount: "₱1,500", status: "Cancelled" },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | undefined>("all-types");
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>("all-statuses");

  // Filter transactions based on search, type, and status filters
  const filteredTransactions = allTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.buyerDonor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.crop.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      !selectedStatus || selectedStatus === "all-statuses" ? true : transaction.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Get unique transaction types and statuses

  const transactionStatuses = [...new Set(allTransactions.map((t) => t.status))];

  return (
    <div className="space-y-6 flex">
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
        </div>
        <p className="text-gray-600">View and manage all transactions</p>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search transactions..."
              className="pl-10 bg-white border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>


          <div className="w-full md:w-40">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-statuses">All Statuses</SelectItem>
                {transactionStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="bg-white border-2 shadow-md border-[#0da54b]/20">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Transaction ID</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Farmer</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Buyer/Donor</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Crop</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Quantity</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Amount</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-800">{transaction.id}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{transaction.farmer}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{transaction.buyerDonor}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{transaction.crop}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{transaction.quantity}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{transaction.amount}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{transaction.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-500">
                      No transactions found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Transparent 20px space on the right */}
      <div style={{ width: "20px", backgroundColor: "transparent" }} />
    </div>
  );
};

export default TransactionsPanel;
