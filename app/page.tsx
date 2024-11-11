'use client'

import React, { useState } from 'react';
import { Upload, Printer, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PrintShopUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mpesaRef, setMpesaRef] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  // Add customer information state
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      setError('No file selected');
      return;
    }
    const selectedFile = files[0];
    if (selectedFile) {
      if (selectedFile.size > 25 * 1024 * 1024) { // 25MB in bytes
        setError('File size must be less than 25MB');
        setFile(null);
      } else {
        setError('');
        setFile(selectedFile);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!file || !mpesaRef || !customerInfo.name || !customerInfo.email) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mpesaRef', mpesaRef);
      formData.append('customerName', customerInfo.name);
      formData.append('customerEmail', customerInfo.email);
      formData.append('customerPhone', customerInfo.phone);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess(true);
      setOrderId(data.orderId);
      
      // Reset form
      setFile(null);
      setMpesaRef('');
      setCustomerInfo({
        name: '',
        email: '',
        phone: ''
      });
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick Print Services</h1>
          <p className="text-gray-600">Upload your document and we&apos;ll have it ready for pickup</p>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Your Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({...prev, name: e.target.value}))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({...prev, email: e.target.value}))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Your email address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <label 
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-12 w-12 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-600">
                    Click to upload your document
                  </span>
                  <span className="mt-1 text-sm text-gray-500">
                    Max file size: 25MB
                  </span>
                </label>
                {file && (
                  <div className="mt-4 text-sm text-gray-600">
                    Selected: {file.name}
                  </div>
                )}
              </div>

              {/* MPesa Reference Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MPesa Payment Message + instructions *
                </label>
                <input
                  type="text"
                  value={mpesaRef}
                  onChange={(e) => setMpesaRef(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter MPesa Message + Instructions"
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>
                    Document uploaded successfully! Your order ID is: {orderId}. 
                    We&apos;ll email you when your prints are ready.
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                {loading ? 'Uploading...' : 'Submit for Printing'}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-gray-600">
                  Monday - Friday: 8:00 AM - 6:00 PM<br />
                  Saturday: 9:00 AM - 3:00 PM<br />
                  Sunday: Closed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pickup Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-gray-600 space-y-2">
                <li>• Save your order ID and MPesa reference</li>
                <li>• Most orders ready within 1-2 hours</li>
                <li>• We&apos;ll email you when your prints are ready</li>
                <li>• Bring your order ID for pickup</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrintShopUpload;