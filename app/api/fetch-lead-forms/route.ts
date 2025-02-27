import { NextResponse } from 'next/server';
import axios from 'axios';
import { getTokens, ANAMIKA_MOCK_FORMS } from '../../lib/tokenStore';

// Special constant for the Anamika page ID
const ANAMIKA_PAGE_ID = '101245016125462';

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
    
    // For all pages, proceed with normal API call
    const tokens = getTokens();
    console.log('Fetching forms with tokens:', {
      hasToken: !!tokens.pageToken,
      pageId: tokens.pageId,
      requestedPageId: pageId || 'not specified'
    });
    
    // If pageId is provided in the query and doesn't match the current token's pageId,
    // we have the wrong token loaded - client needs to get a new page token first
    if (pageId && pageId !== tokens.pageId) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Page ID mismatch. Current: ${tokens.pageId}, Requested: ${pageId}. Please get a new page token first.` 
        }, 
        { status: 400 }
      );
    }
    
    // Get the access token directly from the URL parameter if provided
    const providedToken = searchParams.get('access_token');
    const accessToken = providedToken || tokens.pageToken;
    const targetPageId = tokens.pageId;
    
    // Add a delay before making API request (2 seconds)
    console.log('Adding delay before API request...');
    await delay(2000);
    
    // Make API call to fetch lead forms
    try {
      console.log(`Making API request to Facebook for page ID: ${targetPageId}`);
      const response = await axios.get<FacebookLeadFormsResponse>(
        `https://graph.facebook.com/v18.0/${targetPageId}/leadgen_forms`, 
        { params: { access_token: accessToken }}
      );
      
      console.log(`Successfully retrieved ${response.data.data.length} forms from API`);
      return NextResponse.json({
        success: true,
        forms: response.data.data,
        pageId: targetPageId
      });
    } catch (apiError: any) {
      // Only use mock data if this is the Anamika page and we got an error
      if (targetPageId === ANAMIKA_PAGE_ID) {
        console.log('API: Error fetching Anamika page data, using mock data instead:', apiError.message);
        
        // Add a small delay before returning mock data to simulate API request
        await delay(500);
        
        return NextResponse.json({
          success: true,
          forms: ANAMIKA_MOCK_FORMS,
          pageId: ANAMIKA_PAGE_ID,
          isMockData: true
        });
      }
      
      // For other pages, just return the error
      throw apiError;
    }
  } catch (error: any) {
    console.error('Error fetching lead forms:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: error.response?.data || 'Failed to fetch lead forms' 
      },
      { status: error.response?.status || 500 }
    );
  }
} 