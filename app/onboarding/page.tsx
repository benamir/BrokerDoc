'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, CheckCircle } from "lucide-react";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    brokerageName: '',
    licenseNumber: '',
    yearsExperience: '',
    specialization: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update user metadata with the brokerage information
      if (user) {
        await user.update({
          unsafeMetadata: {
            brokerageName: formData.brokerageName,
            licenseNumber: formData.licenseNumber,
            yearsExperience: formData.yearsExperience,
            specialization: formData.specialization,
            onboardingCompleted: true
          }
        });
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating user metadata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">BrokerDoc</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
              <CardDescription>
                Tell us about your real estate business to get the most out of BrokerDoc
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="brokerageName" className="block text-sm font-medium text-gray-700 mb-2">
                      Brokerage Name *
                    </label>
                    <Input
                      id="brokerageName"
                      type="text"
                      required
                      placeholder="e.g., Coldwell Banker"
                      value={formData.brokerageName}
                      onChange={(e) => handleInputChange('brokerageName', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Real Estate License Number *
                    </label>
                    <Input
                      id="licenseNumber"
                      type="text"
                      required
                      placeholder="e.g., 02012345"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <Input
                      id="yearsExperience"
                      type="number"
                      min="0"
                      max="50"
                      placeholder="e.g., 5"
                      value={formData.yearsExperience}
                      onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization (Optional)
                    </label>
                    <Input
                      id="specialization"
                      type="text"
                      placeholder="e.g., Residential, Commercial, Luxury Homes"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading || !formData.brokerageName || !formData.licenseNumber}
                >
                  {isLoading ? 'Setting up your account...' : 'Complete Setup'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  This information helps us customize BrokerDoc for your specific needs and ensures compliance with real estate regulations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}