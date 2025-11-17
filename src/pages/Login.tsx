import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Upload, Loader2 } from "lucide-react";

interface OrganizationData {
  contactPerson: string;
  organizationName: string;
  contactNumber: string;
  email: string;
  yearFounded: number;
  address: string;
  certificationUrl: string;
  createdAt: Date;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    contactPerson: "",
    organizationName: "",
    contactNumber: "",
    email: "",
    yearFounded: "",
    address: "",
  });
  const [certificationFile, setCertificationFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (email === "admin@farmaid.gov") {
        toast({ title: "Login successful", description: "Welcome to the dashboard!" });
        localStorage.setItem("isAuthenticated", "true");
        navigate("/");
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({ title: "Error", description: "Invalid credentials. Please try again.", variant: "destructive" });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Restrict contactNumber to numbers only and max 11 digits
    if (name === "contactNumber") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length > 11) return;
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept JPEG and PNG
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: "Please upload a JPEG or PNG file.", 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Please upload a file smaller than 5MB.", 
        variant: "destructive" 
      });
      return;
    }

    setCertificationFile(file);
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const currentYear = new Date().getFullYear();
    const year = parseInt(formData.yearFounded);

    if (!formData.contactPerson.trim()) return toast({ title: "Validation Error", description: "Contact person is required.", variant: "destructive" }) || false;
    if (!formData.organizationName.trim()) return toast({ title: "Validation Error", description: "Organization name is required.", variant: "destructive" }) || false;
    if (!formData.contactNumber.trim() || formData.contactNumber.length !== 11) return toast({ title: "Validation Error", description: "Contact number must be 11 digits.", variant: "destructive" }) || false;
    if (!formData.address.trim()) return toast({ title: "Validation Error", description: "Address is required.", variant: "destructive" }) || false;
    if (!emailRegex.test(formData.email)) return toast({ title: "Validation Error", description: "Please enter a valid email address.", variant: "destructive" }) || false;
    if (!year || year < 1900 || year > currentYear) return toast({ title: "Validation Error", description: "Please enter a valid year founded.", variant: "destructive" }) || false;
    if (!certificationFile) return toast({ title: "Validation Error", description: "Organization certification is required.", variant: "destructive" }) || false;

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
      const certificateUrl = await uploadCertification(certificationFile!);
  
      await addDoc(collection(db, "users"), {
        firstname: formData.organizationName.trim(),
        lastname: "",
        email: formData.email.trim(),
        phoneNumber: formData.contactNumber.trim(),
        address: formData.address.trim(),
        certificateUrl,
        dateJoined: new Date(),
        status: "Pending",
        userType: "organization",
      });
  
      // Reset form
      setFormData({ contactPerson: "", organizationName: "", contactNumber: "", email: "", yearFounded: "", address: "" });
      setCertificationFile(null);
      setUploadProgress(0);
      setRegistrationSubmitted(true);
      setShowRegistration(false);
  
      toast({ title: "Registration Successful", description: "Your registration has been submitted and is pending approval." });
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: `There was an error submitting your registration: ${error instanceof Error ? error.message : error}`,
        variant: "destructive",
      });
    } finally {
      // ALWAYS reset isSubmitting, even if error occurs
      setIsSubmitting(false);
    }
  };
  

  const resetToLogin = () => {
    setShowRegistration(false);
    setRegistrationSubmitted(false);
    setFormData({ contactPerson: "", organizationName: "", contactNumber: "", email: "", yearFounded: "", address: "" });
    setCertificationFile(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0da54b]/10 to-white p-4">
      <Card className="w-full max-w-2xl p-6 space-y-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-[#0da54b]">FarmAid</h1>
          <p className="text-gray-500">Central Kitchen Valenzuela - Admin Panel</p>
        </div>

        {registrationSubmitted ? (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-[#0da54b]">Registration Sent!</h2>
            <p className="text-gray-600">Your organization registration is under verification. You will be notified once reviewed.</p>
            <Button onClick={resetToLogin} className="bg-[#0da54b] hover:bg-[#0da54b]/90 text-white">Back to Login</Button>
          </div>
        ) : !showRegistration ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="text-center text-sm text-gray-500"> <p>Demo credentials:</p> <p>Email: admin@farmaid.gov</p> <p>Password: any password</p> </div>
              <Button className="w-full bg-[#0da54b] hover:bg-[#0da54b]/90 text-white" type="submit">
                <LogIn className="mr-2" size={16} /> Login
              </Button>
            </form>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 mb-2">New organization?</p>
              <Button variant="outline" onClick={() => setShowRegistration(true)} className="w-full border-[#0da54b] text-[#0da54b] hover:bg-[#0da54b]/10">
                Register Organization
              </Button>

              
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#0da54b]">Organization Registration</h2>
              <Button variant="outline" onClick={resetToLogin} className="text-gray-600">Back to Login</Button>
            </div>

            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Person *</Label>
                  <Input name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="Enter contact person" required />
                </div>
                <div className="space-y-2">
                  <Label>Organization Name *</Label>
                  <Input name="organizationName" value={formData.organizationName} onChange={handleInputChange} placeholder="Enter organization name" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Number *</Label>
                  <Input name="contactNumber" type="tel" value={formData.contactNumber} onChange={handleInputChange} placeholder="Enter 11-digit number" required />
                </div>
                <div className="space-y-2">
                  <Label>Year Founded *</Label>
                  <Input name="yearFounded" type="number" min="1900" max={new Date().getFullYear()} value={formData.yearFounded} onChange={handleInputChange} placeholder="Enter year founded" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address *</Label>
                <Input name="address" value={formData.address} onChange={handleInputChange} placeholder="Enter organization address" required />
              </div>

              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Enter email address" required />
              </div>

              <div className="space-y-2">
                <Label>Organization Certification *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input 
                    id="certification" 
                    type="file" 
                    accept=".jpeg,.jpg,.png" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  <label htmlFor="certification" className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 text-center">{certificationFile ? certificationFile.name : "Click to upload certification (JPEG, PNG)"}</span>
                    <span className="text-xs text-gray-400 mt-1">Max size: 5MB</span>
                  </label>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#0da54b] h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full bg-[#0da54b] hover:bg-[#0a8f3c]" disabled={isSubmitting}>
                {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting Registration...</>) : 'Submit Registration'}
              </Button>
            </form>
          </div>
        )}

        <div className="text-center text-sm text-gray-500">© 2025 Central Kitchen Valenzuela - Admin</div>
      </Card>
    </div>
  );
};

export default Login;
