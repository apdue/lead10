'use client';

import React, { useState, useEffect } from 'react';
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

// Anamika page mock forms - duplicated here to ensure frontend has access regardless of API
const ANAMIKA_MOCK_FORMS = [
  { 
    id: '824698349386177', 
    name: 'आयुर्वेद फॉर्म', 
    status: 'ACTIVE',
    created_time: '2023-10-15T12:30:45+0000'
  },
  {
    id: '824698349186190',
    name: 'स्वास्थ्य सलाह फॉर्म',
    status: 'ACTIVE',
    created_time: '2023-11-20T09:15:30+0000'
  }
];

export default function Home() {
  const [longLivedToken, setLongLivedToken] = useState<string | null>(null);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedPage, setSelectedPage] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [customAccessToken, setCustomAccessToken] = useState<string>('');
  const [showCustomTokenInput, setShowCustomTokenInput] = useState<boolean>(false);
  const [manualFormId, setManualFormId] = useState<string>('');
  const [showManualFetch, setShowManualFetch] = useState<boolean>(false);
  const [manualLeads, setManualLeads] = useState<any[]>([]);
  const [manualFetchSuccess, setManualFetchSuccess] = useState<boolean>(false);

  // Setup tokens and get initial page info
  useEffect(() => {
    async function setupTokens() {
      setLoading(true);
      setLoadingStage('Initializing...');
      setStatus('Converting short-lived token...');
      
      try {
        // Add a small delay before the first API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 1: Convert short-lived to long-lived token
        setLoadingStage('Converting token...');
        const tokenResponse = await fetch('/api/convert-token');
        const tokenData = await tokenResponse.json();
        
        if (tokenData.success) {
          setLongLivedToken(tokenData.longLivedToken);
          setStatus('Getting page token...');
          
          // Add a small delay between API requests
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Step 2: Get Page token
          setLoadingStage('Getting page token...');
          const pageResponse = await fetch(`/api/get-page-token?longLivedToken=${tokenData.longLivedToken}`);
          const pageData = await pageResponse.json();
          
          if (pageData.success) {
            setPageToken(pageData.pageToken);
            setCurrentPageId(pageData.pageId); // Store the current page ID
            setStatus('Tokens setup complete');
          } else {
            setError(pageData.error);
            setStatus('Failed to get page token');
          }
        } else {
          setError(tokenData.error);
          setStatus('Failed to convert token');
        }
      } catch (err) {
        setError('Failed to set up tokens');
        setStatus('Error in setup');
      } finally {
        setLoadingStage('');
        setLoading(false);
      }
    }

    setupTokens();
  }, []);

  // Fetch forms when we have a page token
  useEffect(() => {
    if (pageToken) {
      async function fetchForms() {
        setLoading(true);
        setLoadingStage('Loading forms...');
        setStatus('Fetching lead forms...');
        
        try {
          // Add a small delay before making the API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Make normal API call for all pages
          const response = await fetch('/api/fetch-lead-forms');
          const data = await response.json();
          
          if (data.success) {
            setForms(data.forms);
            setStatus(data.isMockData ? 'Forms loaded successfully (mock data)' : 'Forms loaded successfully');
          } else {
            setError(data.error);
            setStatus('Failed to load forms');
          }
        } catch (err) {
          setError('Failed to fetch forms');
          setStatus('Error loading forms');
        } finally {
          setLoading(false);
          setLoadingStage('');
        }
      }
      fetchForms();
    }
  }, [pageToken, currentPageId]);

  const handleDownloadLeads = async (onlyYesterday: boolean) => {
    if (!selectedPage) {
      setError('Please select a form');
      return;
    }

    setStatus(`Downloading ${onlyYesterday ? "yesterday's" : 'all'} leads...`);
    try {
      const response = await fetch('/api/download-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: selectedPage.id, onlyYesterday }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `leads_${selectedPage.id}_${onlyYesterday ? 'yesterday' : 'all'}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setStatus('Download complete');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to download leads');
        setStatus('Download failed');
      }
    } catch (err) {
      setError('Error downloading leads');
      setStatus('Download error');
    }
  };

  const fetchForms = async () => {
    if (!selectedPage) return;

    setLoading(true);
    setLoadingStage('Switching page...');
    setError('');
    
    try {
      // Get page token first
      setStatus('Getting page token...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pageTokenRes = await fetch(`/api/get-page-token?pageId=${selectedPage.id}`);
      const pageTokenData = await pageTokenRes.json();
      
      if (!pageTokenData.success) {
        throw new Error('Failed to get page token');
      }
      
      // Update current page ID
      setCurrentPageId(pageTokenData.pageId);
      
      // Add a delay between API requests
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Then fetch forms
      setLoadingStage('Loading forms...');
      setStatus('Fetching forms...');
      
      const formsRes = await fetch(`/api/fetch-lead-forms?pageId=${selectedPage.id}`);
      const formsData = await formsRes.json();
      
      if (!formsData.success) {
        throw new Error('Failed to fetch forms');
      }

      setForms(formsData.forms);
      setStatus(formsData.isMockData ? 'Forms loaded successfully (mock data)' : 'Forms loaded successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch forms');
      setStatus('Error loading forms');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const fetchAnamikaFormsDirectly = async () => {
    if (!customAccessToken) {
      setError('Please enter a valid access token');
      return;
    }

    setLoading(true);
    setLoadingStage('Directly fetching Anamika forms...');
    setError('');
    setStatus('Making direct API call to Facebook...');
    
    try {
      // Add a small delay before making the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(`/api/direct-fetch-forms?pageId=${ANAMIKA_PAGE_ID}&access_token=${encodeURIComponent(customAccessToken)}`);
      const data = await response.json();
      
      if (data.success) {
        setForms(data.forms);
        setCurrentPageId(ANAMIKA_PAGE_ID);
        setStatus('Anamika forms loaded successfully via direct API call');
      } else {
        throw new Error(data.error || 'Failed to fetch Anamika forms directly');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Anamika forms directly');
      setStatus('Error in direct API call');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleManualFetchLeads = async () => {
    if (!manualFormId) {
      setError('Please enter a valid form ID');
      return;
    }

    setLoading(true);
    setLoadingStage('Manually fetching leads...');
    setError('');
    setStatus('Making direct API call to fetch leads...');
    setManualLeads([]);
    setManualFetchSuccess(false);
    
    try {
      // Add a small delay before making the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch('/api/download-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          formId: manualFormId,
          timeFilter: 'all',
          format: 'json'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setManualLeads(data.leads || []);
        setManualFetchSuccess(true);
        setStatus(`Successfully fetched ${data.leads?.length || 0} leads for form ID: ${manualFormId}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch leads manually');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leads manually');
      setStatus('Error in manual fetch');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      {/* UPDATE CONFIRMATION BANNER */}
      <div className="fixed top-0 left-0 right-0 bg-green-500 text-white text-center py-4 z-50 shadow-lg">
        <p className="text-2xl font-bold">CODE UPDATED SUCCESSFULLY!</p>
        <p>The application has been updated at {new Date().toLocaleTimeString()}</p>
      </div>
      
      {/* MANUAL ACCESS LINK - Very prominent */}
      <div className="fixed top-4 right-4 left-4 z-50">
        <Link href="/manual" className="block w-full">
          <button
            className="w-full bg-red-600 text-white text-xl font-bold py-4 px-6 rounded-lg shadow-lg border-4 border-yellow-400 hover:bg-red-700 transition-all duration-200"
          >
            🔴 CLICK HERE FOR MANUAL ACCESS TO ANAMIKA PAGE 🔴
          </button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-20">
        <h1 className="text-5xl font-bold mb-8 text-purple-600 animate-bounce">SANDEEP FINAL</h1>
        
        {/* Manual Fetch Leads Section */}
        <div className="mb-8 p-6 bg-blue-100 border-4 border-blue-500 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-blue-800 mb-3">Manual Lead Fetch</h2>
          <p className="text-lg text-blue-800 mb-4">
            Enter a form ID to manually fetch leads directly.
          </p>
          
          <button 
            onClick={() => setShowManualFetch(!showManualFetch)}
            className="bg-blue-600 text-white px-6 py-3 text-xl rounded-md hover:bg-blue-700 transition-colors duration-200 font-bold shadow-md mb-4 w-full"
          >
            {showManualFetch ? 'Hide Manual Fetch' : 'Show Manual Fetch Form'}
          </button>
          
          {showManualFetch && (
            <div className="space-y-4 mt-4 p-4 bg-white rounded-lg border border-blue-300">
              <div>
                <label htmlFor="manual-form-id" className="block text-sm font-medium text-gray-700 mb-2">
                  Form ID
                </label>
                <input
                  id="manual-form-id"
                  type="text"
                  value={manualFormId}
                  onChange={(e) => setManualFormId(e.target.value)}
                  placeholder="Enter form ID here"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                onClick={handleManualFetchLeads}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-bold"
              >
                {loading ? 'Fetching...' : 'Fetch Leads Manually'}
              </button>
              
              {manualFetchSuccess && manualLeads.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    Fetched Leads ({manualLeads.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {manualLeads.slice(0, 10).map((lead, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lead.id || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lead.created_time ? new Date(lead.created_time).toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="max-h-20 overflow-y-auto">
                                {lead.field_data ? (
                                  <ul className="list-disc pl-5">
                                    {lead.field_data.map((field: any, fieldIndex: number) => (
                                      <li key={fieldIndex}>
                                        <strong>{field.name}:</strong> {field.values.join(', ')}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  'No data'
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {manualLeads.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Showing 10 of {manualLeads.length} leads. Download for complete data.
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manualLeads, null, 2));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", `leads_${manualFormId}.json`);
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                    className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    Download All Leads as JSON
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Direct Access Link - Also add it here */}
        <div className="mb-8 p-6 bg-yellow-100 border-4 border-red-500 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-3">Need Direct Access to Anamika Page?</h2>
          <p className="text-lg text-yellow-800 mb-4">
            We've created a dedicated page for accessing Anamika forms directly with your access token.
          </p>
          
          <Link href="/direct-access">
            <button 
              className="text-white bg-red-600 px-6 py-3 text-xl rounded-md hover:bg-red-700 transition-colors duration-200 font-bold shadow-md"
            >
              GO TO DIRECT ACCESS PAGE
            </button>
          </Link>
        </div>
        
        {/* Status Display */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">Status: {status}</p>
          {loading && (
            <div className="mt-2">
              <p className="text-xs text-blue-600 mb-1">{loadingStage}</p>
              <div className="animate-pulse bg-blue-200 h-1 w-full rounded"></div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Form Selection */}
        {forms.length > 0 ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="form-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select a Lead Form
              </label>
              <select
                id="form-select"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => {
                  const form = forms.find(f => f.id === e.target.value);
                  setSelectedPage(form || null);
                }}
                value={selectedPage?.id || ''}
                disabled={loading}
              >
                <option value="">Select a Form</option>
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name || `Form ID: ${form.id}`} {form.status ? `(${form.status})` : ''} (Created: {new Date(form.created_time).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {selectedPage && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Selected Form: {selectedPage.name || selectedPage.id}
                </h2>
                <div className="space-x-4">
                  <button
                    onClick={() => handleDownloadLeads(false)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                    disabled={loading}
                  >
                    Download All Leads
                  </button>
                  <button
                    onClick={() => handleDownloadLeads(true)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                    disabled={loading}
                  >
                    Download Yesterday's Leads
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {loading ? 'Loading forms...' : 'No forms found. Please make sure you have the correct permissions and tokens.'}
            </p>
            {loading && (
              <div className="mt-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 