
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { LogIn, Upload, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Registration form state
  const [formData, setFormData] = useState({
    contactPerson: '',
    organizationName: '',
    contactNumber: '',
    email: '',
    yearFounded: '',
  });
  const [certificationFile, setCertificationFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check for demo credentials
      if (email === "admin@farmaid.gov") {
        // For demo credentials, bypass the actual Firebase authentication
        toast({
          title: "Login successful",
          description: "Welcome to the dashboard!",
        });
        // Store a simple auth state in localStorage for demo purposes
        localStorage.setItem("isAuthenticated", "true");
        navigate("/");
        return;
      }
      
      // Regular authentication
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, JPG, PNG)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, JPG, or PNG file.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setCertificationFile(file);
    }
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.contactPerson.trim()) {
      toast({
        title: "Validation Error",
        description: "Contact person is required.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.organizationName.trim()) {
      toast({
        title: "Validation Error",
        description: "Organization name is required.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.contactNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Contact number is required.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }
    
    const year = parseInt(formData.yearFounded);
    const currentYear = new Date().getFullYear();
    if (!year || year < 1900 || year > currentYear) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid year founded.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!certificationFile) {
      toast({
        title: "Validation Error",
        description: "Organization certification is required.",
        variant: "destructive",
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

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // Upload certification file
      const certificationUrl = await uploadCertification(certificationFile!);
      
      // Save organization data to Firestore
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
      
      // Reset form
      setFormData({
        contactPerson: '',
        organizationName: '',
        contactNumber: '',
        email: '',
        yearFounded: '',
      });
      setCertificationFile(null);
      setUploadProgress(0);
      setRegistrationSubmitted(true);
      setShowRegistration(false);
      
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Registration Failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToLogin = () => {
    setShowRegistration(false);
    setRegistrationSubmitted(false);
    setFormData({
      contactPerson: '',
      organizationName: '',
      contactNumber: '',
      email: '',
      yearFounded: '',
    });
    setCertificationFile(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0da54b]/10 to-white p-4">
      <Card className="w-full max-w-2xl p-6 space-y-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-[#0da54b]">FarmAid</h1>
          <p className="text-gray-500">Metro Food Bank - Admin Panel</p>
        </div>

        {registrationSubmitted ? (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-[#0da54b]">Registration Sent!</h2>
            <p className="text-gray-600">Your organization registration has been submitted and is now under verification. You will be notified once the review is complete.</p>
            <Button 
              onClick={resetToLogin}
              className="bg-[#0da54b] hover:bg-[#0da54b]/90 text-white"
            >
              Back to Login
            </Button>
          </div>
        ) : !showRegistration ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>
              <Button className="w-full bg-[#0da54b] hover:bg-[#0da54b]/90 text-white" type="submit">
                <LogIn className="mr-2" size={16} />
                Login
              </Button>
            </form>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">New organization?</p>
              <Button 
                variant="outline" 
                onClick={() => setShowRegistration(true)}
                className="w-full border-[#0da54b] text-[#0da54b] hover:bg-[#0da54b]/10"
              >
                Register Organization
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>Demo credentials:</p>
              <p>Email: admin@farmaid.gov</p>
              <p>Password: any password</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#0da54b]">Organization Registration</h2>
              <Button 
                variant="outline" 
                onClick={() => setShowRegistration(false)}
                className="text-gray-600"
              >
                Back to Login
              </Button>
            </div>
            
            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
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
                    type="tel"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="Enter contact number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yearFounded">Year Founded *</Label>
                  <Input
                    id="yearFounded"
                    name="yearFounded"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.yearFounded}
                    onChange={handleInputChange}
                    placeholder="Enter year founded"
                    required
                  />
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
                      {certificationFile ? certificationFile.name : 'Click to upload certification (PDF, JPG, PNG)'}
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
                    Submitting Registration...
                  </>
                ) : (
                  'Submit Registration'
                )}
              </Button>
            </form>
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          © 2025 Metro Food Bank - FarmAid Admin
        </div>
      </Card>
    </div>
  );
};

export default Login;
