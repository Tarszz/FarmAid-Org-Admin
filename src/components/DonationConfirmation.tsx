import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { UploadCloud } from 'lucide-react';

interface DonationConfirmationProps {
  donationId: string;
  donorName: string;
  buyerId?: string; // the user id of the donor (chat id)
  onClose?: () => void;
  onCompleted?: () => void; // callback after successful confirm & send
  openModalTrigger?: () => void; // optional trigger if needed
}

/**
 * DonationConfirmation:
 * - Shows a modal with image upload (accepts jpeg/png)
 * - Uploads image to storage, then:
 *   - updates transactions/{donationId} status -> Completed
 *   - sends a message to donationOrgChats/{buyerId}/messages with message + imageUrl
 *   - updates donationOrgChats/{buyerId} doc lastMessage, lastMessageFrom, lastMessageTime
 */
const DonationConfirmation: React.FC<DonationConfirmationProps> = ({
  donationId,
  donorName,
  buyerId,
  onClose,
  onCompleted,
}) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => {
    setOpen(false);
    setFile(null);
    setPreviewUrl(null);
    setNote('');
    setUploadProgress(0);
    if (onClose) onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(f.type)) {
      alert('Only JPEG and PNG files are allowed.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.');
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!buyerId) {
      alert('Missing buyer id. Cannot send message.');
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl: string | null = null;

      if (file) {
        // upload file to storage with resumable upload to allow progress
        const storageRef = ref(storage, `receipts/${donationId}_${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadProgress(percent);
            },
            (err) => reject(err),
            async () => {
              imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      // 1) Update transaction status to 'Completed'
      await updateDoc(doc(db, 'transactions', donationId), {
        status: 'Completed',
      });

      // 2) Update/add message in donationOrgChats/{buyerId}/messages
      const chatDocRef = doc(db, 'donationOrgChats', buyerId);
      const messagesRef = collection(chatDocRef, 'messages');

      // Update chat doc metadata
      await setDoc(
        chatDocRef,
        {
          donorName,
          lastMessage: note || (imageUrl ? 'Sent a receipt image' : 'Donation confirmed'),
          lastMessageFrom: 'admin',
          lastMessageTime: serverTimestamp(),
          readByAdmin: true,
        },
        { merge: true }
      );

      // Add message document (contains message text and optionally imageUrl)
      await addDoc(messagesRef, {
        message: note || (imageUrl ? 'Sent a receipt image' : 'Donation confirmed'),
        senderId: 'admin',
        senderName: 'Admin',
        imageUrl: imageUrl || null,
        timestamp: serverTimestamp(),
      });

      // callback to parent to reflect change (if needed)
      if (onCompleted) onCompleted();

      // close
      closeModal();
      setSubmitting(false);
    } catch (err) {
      console.error('Error confirming donation:', err);
      alert('There was an error confirming the donation. Check console for details.');
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Button to open modal */}
      <Button onClick={openModal} size="sm" className="bg-[#0da54b] hover:bg-[#0a8f3c] text-white">
        Confirm Receipt
      </Button>

      <Dialog open={open} onOpenChange={(val) => setOpen(val)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Receipt — {donorName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Optional note to donor</Label>
              <Input
                placeholder="e.g., Thank you — we received the donation"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div>
              <Label>Attach receipt image (JPEG or PNG)</Label>
              <div className="mt-2 flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded">
                  <UploadCloud />
                  <span className="text-sm">Choose file</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {previewUrl && (
                  <div className="w-24 h-16 rounded overflow-hidden border">
                    <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Confirming...' : 'Confirm & Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DonationConfirmation;
