
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Check } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

interface DonationConfirmationProps {
  organizationId: string;
  donationId?: string;
  onConfirmed?: () => void;
}

const DonationConfirmation = ({ organizationId, donationId, onConfirmed }: DonationConfirmationProps) => {
  const [message, setMessage] = useState('');
  const [donationImage, setDonationImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images only)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPG, PNG, GIF, WebP).",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setDonationImage(file);
    }
  };

  const uploadDonationImage = async (file: File): Promise<string> => {
    const fileName = `donations/${organizationId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    setUploadProgress(25);
    await uploadBytes(storageRef, file);
    setUploadProgress(75);
    const downloadURL = await getDownloadURL(storageRef);
    setUploadProgress(100);
    
    return downloadURL;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      let imageUrl = '';
      
      // Upload image if provided
      if (donationImage) {
        imageUrl = await uploadDonationImage(donationImage);
      }
      
      // Save notification to Firestore
      const notificationData = {
        organizationId,
        donationId: donationId || null,
        type: 'donation_confirmation',
        message: message.trim(),
        imageUrl,
        timestamp: new Date(),
        confirmed: true,
        createdAt: new Date(),
      };
      
      await addDoc(collection(db, 'notifications'), notificationData);
      
      toast({
        title: "Confirmation Sent",
        description: "Your donation confirmation has been successfully submitted!",
      });
      
      // Reset form
      setMessage('');
      setDonationImage(null);
      setUploadProgress(0);
      
      // Call callback if provided
      if (onConfirmed) {
        onConfirmed();
      }
      
    } catch (error) {
      console.error('Error submitting confirmation:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your confirmation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl text-center text-[#0da54b] flex items-center justify-center gap-2">
          <Check className="h-5 w-5" />
          Confirm Donation Receipt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Thank you for the donation! Please describe what was received and any additional details..."
              rows={4}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="donationImage">Upload Related Picture (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                id="donationImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="donationImage"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 text-center">
                  {donationImage ? donationImage.name : 'Click to upload a picture of the donation'}
                </span>
                <span className="text-xs text-gray-400 mt-1">Max size: 10MB</span>
              </label>
            </div>
            
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#0da54b] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full bg-[#0da54b] hover:bg-[#0a8f3c]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Confirmation...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Confirm Donation Receipt
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DonationConfirmation;
