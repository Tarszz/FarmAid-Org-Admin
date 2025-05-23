import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

interface OrganizationData {
  contactPerson: string;
  organizationName: string;
  contactNumber: string;
  email: string;
  yearFounded: number;
  certificationUrl: string;
  createdAt: Date;
}

const OrganizationRegistration = () => {
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    contactPerson: '',
    organizationName: '',
    contactNumber: '+63',
    email: '',
    yearFounded: '',
  });
  const [errors, setErrors] = useState({
    contactNumber: '',
    email: '',
    yearFounded: '',
  });

  const [certificationFile, setCertificationFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'contactNumber') {
      if (!value.startsWith('+63')) return;

      const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
      const formatted = `+63${digitsOnly.slice(2)}`;
      setFormData(prev => ({ ...prev, [name]: formatted }));

      if (digitsOnly.length !== 11) {
        setErrors(prev => ({
          ...prev,
          contactNumber: 'Contact number must be exactly 11 digits including +63',
        }));
      } else {
        setErrors(prev => ({ ...prev, contactNumber: '' }));
      }

      return;
    }

    if (name === 'email') {
      setFormData(prev => ({ ...prev, [name]: value }));
      const isValid = value.includes('@') && value.includes('.com');
      setErrors(prev => ({
        ...prev,
        email: isValid ? '' : 'Email must include "@" and ".com"',
      }));
      return;
    }

    if (name === 'yearFounded') {
      setFormData(prev => ({ ...prev, [name]: value }));
      const year = parseInt(value);
      setErrors(prev => ({
        ...prev,
        yearFounded:
          !year || year < 1900 || year > currentYear
            ? `Year must be between 1900 and ${currentYear}`
            : '',
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF, JPG, or PNG file.',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }

      setCertificationFile(file);
    }
  };

  const validateForm = () => {
    const { contactPerson, organizationName, contactNumber, email, yearFounded } = formData;
    if (
      !contactPerson.trim() ||
      !organizationName.trim() ||
      !contactNumber ||
      !email ||
      !yearFounded ||
      Object.values(errors).some(err => err !== '') ||
      !certificationFile
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please fix all errors and complete required fields.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const uploadCertification = async (file: File): Promise<string> => {
    const fileName = `certifications/${Date.now()}_${file.name}`;
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

    if (!validateForm()) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const certificationUrl = await uploadCertification(certificationFile!);

      const organizationData: OrganizationData = {
        contactPerson: formData.contactPerson.trim(),
        organizationName: formData.organizationName.trim(),
        contactNumber: formData.contactNumber.trim(),
        email: formData.email.trim(),
        yearFounded: parseInt(formData.yearFounded),
        certificationUrl,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'organizations'), organizationData);

      toast({
        title: 'Registration Successful',
        description: 'Your organization has been successfully registered!',
      });

      setFormData({
        contactPerson: '',
        organizationName: '',
        contactNumber: '+63',
        email: '',
        yearFounded: '',
      });
      setCertificationFile(null);
      setUploadProgress(0);
      setErrors({ contactNumber: '', email: '', yearFounded: '' });
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Registration Failed',
        description: 'There was an error creating your account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-[#0da54b]">
            Organization Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  placeholder="Enter contact person name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  placeholder="Enter organization name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="+63XXXXXXXXXX"
                  required
                />
                {errors.contactNumber && (
                  <p className="text-sm text-red-500">{errors.contactNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearFounded">Year Founded *</Label>
                <Input
                  id="yearFounded"
                  name="yearFounded"
                  type="number"
                  value={formData.yearFounded}
                  onChange={handleInputChange}
                  placeholder="Enter year founded"
                  required
                />
                {errors.yearFounded && (
                  <p className="text-sm text-red-500">{errors.yearFounded}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="certification">Organization Certification *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  id="certification"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="certification"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 text-center">
                    {certificationFile
                      ? certificationFile.name
                      : 'Click to upload certification (PDF, JPG, PNG)'}
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

            <Button
              type="submit"
              className="w-full bg-[#0da54b] hover:bg-[#0a8f3c]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Organization Account'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationRegistration;
