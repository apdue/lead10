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

export default function ManualAccess() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchFormsDirectly = async () => {
    if (!accessToken) {
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
      
      const response = await fetch(`/api/direct-fetch-forms?pageId=${ANAMIKA_PAGE_ID}&access_token=${encodeURIComponent(accessToken)}`);
      const data = await response.json();
      
      if (data.success) {
        setForms(data.forms);
        setSuccess(`Successfully fetched ${data.forms.length} forms for ${ANAMIKA_PAGE_NAME}`);
      } else {
        throw new Error(data.error || 'Failed to fetch forms directly');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch forms directly');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-4 text-center text-red-600">Manual Form Access</h1>
        
        <div className="mb-6 text-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Main Page
          </Link>
        </div>
        
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
          <h2 className="text-xl font-bold text-center mb-2">Instructions</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Paste your Facebook access token in the field below</li>
            <li>Click the "FETCH FORMS" button</li>
            <li>The forms will appear in a table below if successful</li>
          </ol>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <p className="font-bold">Success:</p>
            <p>{success}</p>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="token-input" className="block text-sm font-medium text-gray-700 mb-1">
            Facebook Access Token:
          </label>
          <input
            id="token-input"
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Paste your access token here"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="mb-6">
          <button
            onClick={fetchFormsDirectly}
            className="w-full bg-red-600 text-white text-xl font-bold py-3 rounded hover:bg-red-700 transition-colors disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "LOADING..." : "FETCH FORMS"}
          </button>
        </div>

        {forms.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Forms Found:</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => (
                    <tr key={form.id}>
                      <td className="p-2 border">{form.name || 'Unnamed'}</td>
                      <td className="p-2 border">{form.id}</td>
                      <td className="p-2 border">{form.status || 'Unknown'}</td>
                      <td className="p-2 border">{new Date(form.created_time).toLocaleDateString()}</td>
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