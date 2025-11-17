
import { Card } from "@/components/ui/card";
import { BarChart, PieChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";

const AnalyticsPanel = () => {
  const [donationData, setDonationData] = useState([
    { name: 'Jan', value: 200 },
    { name: 'Feb', value: 700 },
    { name: 'Mar', value: 400 },
    { name: 'Apr', value: 1550 },
    { name: 'May', value: 890 },
    { name: 'Jun', value: 100 },
  ]);
  
  const [transactionData, setTransactionData] = useState([
    { name: 'Rootcrops', value: 400 },
    { name: 'Grains', value: 300 },
    { name: 'Vegetables', value: 350 },
    { name: 'Fruits', value: 250 },
    { name: 'Spices', value: 150 },
  ]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Summary statistics
  const totalDonations = "₱13,380";
  const totalDonors = 12;
  const avgDonationSize = "₱3,770";
  const donationGrowth = "+15%";

  return (
    <Card className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6 h-64">
          <h3 className="text-lg font-semibold mb-2 text-[#0da54b]">Donation Trends</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={donationData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0da54b" name="Donation Amount (₱)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 h-64">
          <h3 className="text-lg font-semibold mb-2 text-[#0da54b]">Donation Summary</h3>
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="flex flex-col justify-center items-center bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">Total Donations (Last Month)</p>
              <p className="text-2xl font-bold text-[#0da54b]">{totalDonations}</p>
              <p className="text-xs text-green-600">{donationGrowth} from previous month</p>
            </div>
            <div className="flex flex-col justify-center items-center bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">Total Donors</p>
              <p className="text-2xl font-bold text-[#0da54b]">{totalDonors}</p>
            </div>
            <div className="flex flex-col justify-center items-center bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">Avg. Donation Size</p>
              <p className="text-2xl font-bold text-[#0da54b]">{avgDonationSize}</p>
            </div>
            <div className="flex flex-col justify-center items-center bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">Donations This Week</p>
              <p className="text-2xl font-bold text-[#0da54b]">47</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 h-64 md:col-span-2">
          <h3 className="text-lg font-semibold mb-2 text-[#0da54b]">Transaction Volume by Crop Categories</h3>
          <div className="flex items-center h-full">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transactionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {transactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 pl-6">
              <h4 className="font-medium text-gray-800 mb-2">Top Performing Categories</h4>
              <ul className="space-y-2">
                {transactionData.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="ml-auto text-sm text-gray-600">{item.value} transactions</span>
                  </li>
                )).slice(0, 3)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AnalyticsPanel;
