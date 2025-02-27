'use client';

import React from 'react';
import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-100 p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Test Page</h1>
        <p className="text-lg mb-6">
          This is a test page created at {new Date().toLocaleTimeString()} to verify that code updates are working correctly.
        </p>
        <div className="bg-green-100 p-4 rounded-lg border border-green-300 mb-6">
          <p className="text-green-800">
            If you can see this page, it means the Next.js server is correctly processing new files and updates.
          </p>
        </div>
        <Link href="/">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition-colors">
            Return to Home Page
          </button>
        </Link>
      </div>
    </div>
  );
} 