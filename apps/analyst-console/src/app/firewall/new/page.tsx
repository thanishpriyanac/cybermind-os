'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Server } from 'lucide-react';
import axios from '@/lib/api';

const VENDORS = [
  { id: 'fortinet', name: 'Fortinet', icon: Shield, color: 'text-green-500' },
  { id: 'paloalto', name: 'Palo Alto', icon: Shield, color: 'text-orange-500' },
  { id: 'sophos', name: 'Sophos', icon: Shield, color: 'text-blue-500' },
  { id: 'cisco', name: 'Cisco', icon: Server, color: 'text-blue-500' },
  { id: 'checkpoint', name: 'Check Point', icon: Shield, color: 'text-red-500' },
];

export default function NewFirewallAssessmentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vendor: '',
    customerName: '',
    siteName: '',
    model: '',
    serialNumber: '',
    firmwareVersion: '',
    assessedBy: 'Analyst',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor || !formData.customerName || !formData.siteName || !formData.model || !formData.firmwareVersion || !formData.assessedBy) {
      alert('Please fill out all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/v1/firewall/assessments', formData);
      router.push(`/firewall/${res.data.id}`);
    } catch (error) {
      console.error('Failed to create assessment', error);
      alert('Failed to create assessment');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">New Assessment</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Vendor Selection</CardTitle>
            <CardDescription>Select the firewall vendor you are assessing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {VENDORS.map((vendor) => {
                const Icon = vendor.icon;
                const isSelected = formData.vendor === vendor.id;
                return (
                  <div
                    key={vendor.id}
                    onClick={() => setFormData({ ...formData, vendor: vendor.id })}
                    className={`border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                  >
                    <Icon className={`h-10 w-10 mb-3 ${vendor.color}`} />
                    <span className="font-medium text-sm">{vendor.name}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Device Details</CardTitle>
            <CardDescription>Enter the specifics of the device being assessed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="customerName" 
                  value={formData.customerName} 
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} 
                  placeholder="ACME Corp" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="siteName" 
                  value={formData.siteName} 
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })} 
                  placeholder="HQ - New York" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Device Model <span className="text-red-500">*</span></Label>
                <Input 
                  id="model" 
                  value={formData.model} 
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })} 
                  placeholder="e.g. FortiGate 100F" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input 
                  id="serialNumber" 
                  value={formData.serialNumber} 
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} 
                  placeholder="Optional" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firmwareVersion">Firmware Version <span className="text-red-500">*</span></Label>
                <Input 
                  id="firmwareVersion" 
                  value={formData.firmwareVersion} 
                  onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })} 
                  placeholder="e.g. v7.2.5" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assessedBy">Assessed By <span className="text-red-500">*</span></Label>
                <Input 
                  id="assessedBy" 
                  value={formData.assessedBy} 
                  onChange={(e) => setFormData({ ...formData, assessedBy: e.target.value })} 
                  required 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t p-6">
            <Button 
              type="button" 
              variant="outline" 
              className="mr-2"
              onClick={() => router.push('/firewall')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.vendor}>
              {isSubmitting ? 'Starting...' : 'Start Assessment'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
