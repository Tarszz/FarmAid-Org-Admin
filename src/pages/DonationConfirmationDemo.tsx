
import React from 'react';
import DonationConfirmation from '@/components/DonationConfirmation';

const DonationConfirmationDemo = () => {
  const handleConfirmed = () => {
    console.log('Donation confirmed successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <DonationConfirmation
        organizationId="demo-org-id"
        donationId="demo-donation-id"
        onConfirmed={handleConfirmed}
      />
    </div>
  );
};

export default DonationConfirmationDemo;
