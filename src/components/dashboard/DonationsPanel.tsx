import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import DonationConfirmation from '../donations/DonationConfirmation';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Donation {
  id: string;
  donorName: string;
  buyerId?: string; // user id of the donor (used for chats)
  type: string;
  quantity: number;
  unit: string;
  date: Timestamp | null;
  status: string;
}

const DonationsPanel: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingDonationId, setConfirmingDonationId] = useState<string | null>(null);
  const [confirmingBuyerId, setConfirmingBuyerId] = useState<string | undefined>(undefined);
  const [confirmingDonorName, setConfirmingDonorName] = useState<string>('');

  // REAL-TIME FETCHING of donation transactions
  useEffect(() => {
    const q = query(collection(db, 'transactions'), where('transactionType', '==', 'donation'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const donationsData: Donation[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const transactionId = docSnap.id;

        // Fetch donor info (buyerId -> users collection)
        let donorName = 'Unknown Donor';
        let buyerId: string | undefined = undefined;
        if (data.buyerId) {
          buyerId = data.buyerId;
          const userDoc = await getDoc(doc(db, 'users', data.buyerId));
          if (userDoc.exists()) {
            const u = userDoc.data();
            donorName = `${u.firstname || ''} ${u.lastname || ''}`.trim();
          }
        }

        donationsData.push({
          id: transactionId,
          donorName,
          buyerId,
          type: data.item || '',
          quantity: data.quantity || 0,
          unit: data.unit || '',
          date: data.timestamp || null,
          status: (data.status as string) || 'Pending', // Fallback to Pending
        });
      }

      setDonations(donationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // When the confirm modal triggers, this will be called by DonationConfirmation after successful send
  const handleConfirmReceiptCompleted = async (donationId: string) => {
    // Update UI state: modal will close from child by calling onClose
    // We update the transaction status here (for optimistic UI, but DonationConfirmation also updates)
    try {
      await updateDoc(doc(db, 'transactions', donationId), {
        status: 'Completed',
      });
    } catch (error) {
      console.error('Error updating transaction status after confirm:', error);
    }
  };

  // When user clicks confirm button, open modal with donation info
  const openConfirmModal = (donationId: string, buyerId: string | undefined, donorName: string) => {
    setConfirmingDonationId(donationId);
    setConfirmingBuyerId(buyerId);
    setConfirmingDonorName(donorName);
  };

  const closeConfirmModal = () => {
    setConfirmingDonationId(null);
    setConfirmingBuyerId(undefined);
    setConfirmingDonorName('');
  };

  // status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'text-green-600';
      case 'Pending':
        return 'text-yellow-600';
      case 'Processing':
        return 'text-orange-600';
      case 'Completed':
        return 'text-gray-500';
      case 'Confirmed':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (timestamp: Timestamp | null) => {
    if (timestamp?.toDate) return timestamp.toDate().toLocaleString();
    return 'N/A';
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
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Loading donations...
                </td>
              </tr>
            ) : donations.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No donations found.
                </td>
              </tr>
            ) : (
              donations.map((donation) => (
                <tr key={donation.id} className="border-b border-gray-100">
                  <td className="py-3 text-gray-800">{donation.donorName}</td>
                  <td className="py-3 text-gray-800">{donation.type}</td>
                  <td className="py-3 text-gray-800">{donation.quantity} {donation.unit}</td>
                  <td className="py-3 text-gray-800">{formatDate(donation.date)}</td>

                  <td className={`py-3 font-medium ${getStatusColor(donation.status)}`}>
                    {donation.status}
                  </td>

                  <td className="py-3">
                    {donation.status === 'Pending' && (
                      <DonationConfirmation
                        donationId={donation.id}
                        donorName={donation.donorName}
                        buyerId={donation.buyerId}
                        onClose={closeConfirmModal}
                        onCompleted={() => handleConfirmReceiptCompleted(donation.id)}
                        openModalTrigger={() => openConfirmModal(donation.id, donation.buyerId, donation.donorName)}
                        // We don't actually render the modal here; clicking a button will open it. For simplicity we'll render the modal directly:
                      />
                    )}

                    {donation.status === 'Completed' && (
                      <span className="text-sm text-gray-500 font-medium">No action required</span>
                    )}

                    {/* fallback */}
                    {!['Pending', 'Completed'].includes(donation.status) && (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Render a hidden modal trigger: DonationConfirmation component internally shows modal when used.
          Note: DonationConfirmation shows its own button by default for the confirm action.
      */}
    </Card>
  );
};

export default DonationsPanel;
