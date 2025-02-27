import { NextResponse } from 'next/server';
import axios from 'axios';
import { ANAMIKA_MOCK_FORMS } from '../../lib/tokenStore';

// Type for the Facebook API response
interface FacebookLeadFormsResponse {
  data: Array<{
    id: string;
    name: string;
    status?: string;
    created_time: string;
  }>;
}

// Add a delay function to prevent rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const accessToken = searchParams.get('access_token');
    
    if (!pageId || !accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required parameters: pageId and access_token are required" 
        }, 
        { status: 400 }
      );
    }
    
    console.log(`Direct fetch API called for page ID: ${pageId}`);
    
    // Add a delay before making API request (2 seconds)
    console.log('Adding delay before direct API request...');
    await delay(2000);
    
    try {
      // Make direct API call to Facebook Graph API
      const response = await axios.get<FacebookLeadFormsResponse>(
        `https://graph.facebook.com/v18.0/${pageId}/leadgen_forms`, 
        { params: { access_token: accessToken }}
      );
      
      console.log(`Successfully retrieved ${response.data.data.length} forms directly from API`);
      return NextResponse.json({
        success: true,
        forms: response.data.data,
        pageId: pageId,
        directFetch: true
      });
    } catch (apiError: any) {
      console.log('API Error in direct fetch:', apiError.message);
      
      // Wait a moment before responding with the error
      await delay(500);
      
      return NextResponse.json(
        { 
          success: false, 
          error: apiError.response?.data || apiError.message || 'Failed to fetch forms directly'
        },
        { status: apiError.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in direct-fetch-forms API:', error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
} 