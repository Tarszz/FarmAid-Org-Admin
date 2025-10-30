
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Check, Loader2 } from "lucide-react";
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

interface DonationConfirmationProps {
  donationId: string;
  donorName: string;
  onConfirm: () => void;
}

const DonationConfirmation = ({ donationId, donorName, onConfirm }: DonationConfirmationProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images only)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a valid image file (JPEG, PNG, GIF, or WebP).",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setImageFile(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `donation-confirmations/${Date.now()}_${file.name}`;
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
      let imageUrl = "";
      
      // Upload image if provided
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      
      // Save notification to Firestore
      const notificationData = {
        donationId,
        donorName,
        message: message.trim(),
        imageUrl,
        type: "donation_confirmation",
        organizationId: "metro-food-bank", // Could be dynamic based on logged in org
        createdAt: new Date(),
        read: false,
      };
      
      await addDoc(collection(db, 'notifications'), notificationData);
      
      // Reset form
      setMessage("");
      setImageFile(null);
      setUploadProgress(0);
      setOpen(false);
      
      toast({
        title: "Confirmation Sent",
        description: "Donation confirmation has been successfully submitted.",
      });
      
      onConfirm();
      
    } catch (error) {
      console.error('Error submitting confirmation:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting the confirmation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[#0da54b] hover:bg-[#0a8f3c]">
          <Check className="mr-1 h-4 w-4" /> Confirm Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Donation Receipt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Donation ID: {donationId}</Label>
            <Label>From: {donorName}</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Confirmation Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Thank you for the donation. We have received..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">Upload Receipt Image (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 text-center">
                  {imageFile ? imageFile.name : 'Click to upload image'}
                </span>
                <span className="text-xs text-gray-400 mt-1">Max size: 5MB</span>
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
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#0da54b] hover:bg-[#0a8f3c]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Confirm Receipt'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DonationConfirmation;
