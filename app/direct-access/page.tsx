'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Form {
  id: string;
  name: string;
  status?: string;
  created_time: string;
}

// Constants
const ANAMIKA_PAGE_ID = '101245016125462';
const ANAMIKA_PAGE_NAME = "आयुर्वेदिक नुस्खे Anamika";

export default function DirectAccess() {
  const [customAccessToken, setCustomAccessToken] = useState<string>('');
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAnamikaFormsDirectly = async () => {
    if (!customAccessToken) {
      setError('Please enter a valid access token');
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Add a small delay before making the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(`/api/direct-fetch-forms?pageId=${ANAMIKA_PAGE_ID}&access_token=${encodeURIComponent(customAccessToken)}`);
      const data = await response.json();
      
      if (data.success) {
        setForms(data.forms);
        setSuccess(`Successfully fetched ${data.forms.length} forms for ${ANAMIKA_PAGE_NAME}`);
      } else {
        throw new Error(data.error || 'Failed to fetch Anamika forms directly');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Anamika forms directly');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
            ← Back to Main Page
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-gray-800">Direct Access for Anamika Page</h1>
        
        <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Instructions</h2>
          <p className="text-gray-700 mb-2">
            This page allows you to directly fetch lead forms for the Anamika page using your Facebook access token.
          </p>
          <p className="text-gray-700">
            Enter your access token below and click the button to fetch forms.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <p>{success}</p>
          </div>
        )}

        {/* Access Token Input */}
        <div className="mb-6">
          <label htmlFor="access-token" className="block text-sm font-medium text-gray-700 mb-2">
            Facebook Access Token
          </label>
          <input
            id="access-token"
            type="text"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Paste your Facebook access token here"
            value={customAccessToken}
            onChange={(e) => setCustomAccessToken(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Fetch Button */}
        <div className="mb-8">
          <button
            onClick={fetchAnamikaFormsDirectly}
            className="w-full bg-red-600 text-white text-xl font-bold py-4 px-6 rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                FETCHING FORMS...
              </span>
            ) : (
              "FETCH ANAMIKA FORMS DIRECTLY"
            )}
          </button>
        </div>

        {/* Forms Display */}
        {forms.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Forms for {ANAMIKA_PAGE_NAME}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Name</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form ID</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => (
                    <tr key={form.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b border-gray-200">{form.name || 'Unnamed Form'}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{form.id}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{form.status || 'Unknown'}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{new Date(form.created_time).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 