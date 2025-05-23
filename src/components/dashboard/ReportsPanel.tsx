
import { Card } from "@/components/ui/card";

const ReportsPanel = () => {
  return (
    <Card className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Impact Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg border-gray-200 bg-white">
          <h3 className="font-semibold text-gray-800 mb-2">Monthly Distribution Report</h3>
          <p className="text-sm text-gray-700">Period: April 2025</p>
          <p className="text-sm text-gray-700">Total Donations: 125kg</p>
          <p className="text-sm text-gray-700">Families Served: 450</p>
        </div>
        <div className="p-4 border rounded-lg border-gray-200 bg-white">
          <h3 className="font-semibold text-gray-800 mb-2">Quarterly Impact Summary</h3>
          <p className="text-sm text-gray-700">Q1 2025</p>
          <p className="text-sm text-gray-700">Total Donations: 375kg</p>
          <p className="text-sm text-gray-700">Families Served: 1,250</p>
        </div>
      </div>
    </Card>
  );
};

export default ReportsPanel;
