'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { useCreateCertification } from '@/lib/hooks';

interface CertificationFormData {
  name: string;
  certificateId?: string; // Defaulted in handleSubmit
  certificateType?: string; // Defaulted in handleSubmit
  issueDate: string; // Made required
  expiryDate: string;
  issuingBody: string;
  renewalReminderDays?: number; // Defaulted in handleSubmit
  owner?: string; // Defaulted in handleSubmit
  department?: string; // Defaulted in handleSubmit
  description?: string; // Defaulted in handleSubmit
  logoUrl?: string | null; // Renamed from 'logo' to 'logoUrl'
}

interface AddCertificationDialogProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export default function AddCertificationDialog({ children, onSuccess }: AddCertificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CertificationFormData>({
    name: '',
    issueDate: '',
    expiryDate: '',
    issuingBody: '',
    department: '', // Defaulted in handleSubmit
    description: '', // Defaulted in handleSubmit
    logoUrl: null, // Renamed from 'logo' to 'logoUrl'
  });

  const createCertification = useCreateCertification();
  const isLoading = createCertification.isPending;

  const handleInputChange = (field: keyof CertificationFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.issueDate || !formData.expiryDate || !formData.issuingBody) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }

    // Calculate validity days
    const issueDate = formData.issueDate ? new Date(formData.issueDate) : new Date();
    const expiryDate = new Date(formData.expiryDate);
    const validityDays = Math.floor((expiryDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));

    // Prepare certification data
    const certificationData = {
      name: formData.name,
      certificateId: formData.certificateId || `CERT-${Date.now()}`,
      certificateType: formData.certificateType || 'ISO',
      issueDate: issueDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      validityDays: validityDays,
      renewalReminderDays: formData.renewalReminderDays || 30,
      issuingBody: formData.issuingBody,
      owner: formData.owner || '',
      department: formData.department || '',
      description: formData.description || '',
      logoUrl: formData.logoUrl || null, // Renamed from 'logo' to 'logoUrl'
    };

    createCertification.mutate(certificationData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          name: '',
          issueDate: '',
          expiryDate: '',
          issuingBody: '',
          department: '',
          description: '',
          logoUrl: null, // Renamed from 'logo' to 'logoUrl'
        });
        onSuccess?.();
        alert('Certification added successfully!');
      },
      onError: (error: any) => {
        console.error('Error creating certification:', error);
        const message = error.message === 'Network Error' 
          ? 'Network Error: Cannot reach the server. Please ensure the backend API is running on port 3001 and CORS is configured.' 
          : (error.response?.data?.message || error.message);
        setError(message);
        alert(`Failed to add certification: ${message}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Certification</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Certification Name *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., ISO 27001"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="issuingBody" className="text-sm font-medium">
              Issuing Body *
            </label>
            <Input
              id="issuingBody"
              value={formData.issuingBody}
              onChange={(e) => handleInputChange('issuingBody', e.target.value)}
              placeholder="e.g., Certification Body Inc."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="issueDate" className="text-sm font-medium">
                Issue Date
              </label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => handleInputChange('issueDate', e.target.value)}
                className="text-sm"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="expiryDate" className="text-sm font-medium">
                Expiry Date *
              </label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="e.g., Annual security certification"
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-card text-sm min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="logoUrl" className="text-sm font-medium">
              Certification Logo
            </label>
            <Input
              id="logoUrl"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm cursor-pointer"
            />
            {formData.logoUrl && (
              <div className="mt-2 relative w-16 h-16 border rounded overflow-hidden">
                <img src={formData.logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Certification'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
