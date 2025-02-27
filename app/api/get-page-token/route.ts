import { NextResponse } from 'next/server';
import axios from 'axios';
import { getTokens, setTokens } from '../../lib/tokenStore';
import { getCurrentAccount, updateAccountPage } from '../../lib/accountsHandler';

interface FacebookPageResponse {
  data: Array<{
    access_token: string;
    id: string;
    name: string;
  }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const longLivedToken = searchParams.get('longLivedToken') || getTokens().longLivedToken;
  const specificPageId = searchParams.get('pageId');
  const pageIndex = searchParams.get('pageIndex') ? parseInt(searchParams.get('pageIndex')!, 10) : undefined;
  
  const currentAccount = getCurrentAccount();

  // Log initial state for debugging
  console.log('Get-page-token initial state:', {
    hasLongLivedToken: !!longLivedToken,
    specificPageId,
    pageIndex,
    currentAccountId: currentAccount?.id,
    currentAccountName: currentAccount?.name
  });

  if (!longLivedToken) {
    return NextResponse.json(
      { error: 'No long-lived token provided' },
      { status: 400 }
    );
  }

  if (!currentAccount) {
    return NextResponse.json(
      { error: 'No account selected or available' },
      { status: 400 }
    );
  }

  try {
    // Explicitly use v19.0 of the Graph API
    const response = await axios.get<FacebookPageResponse>(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedToken}`
    );
    const pages = response.data.data;

    // Log what pages we found from the API
    console.log('Pages found from Graph API:', {
      count: pages.length,
      pageIds: pages.map(p => p.id),
      pageNames: pages.map(p => p.name)
    });

    if (!pages || pages.length === 0) {
      return NextResponse.json(
        { error: 'No Pages found' },
        { status: 404 }
      );
    }

    // If a specific page ID is provided, use that
    let page;
    if (specificPageId) {
      page = pages.find(p => p.id === specificPageId);
      if (!page) {
        console.error(`Page with ID ${specificPageId} not found in API response`);
        return NextResponse.json(
          { error: `Page with ID ${specificPageId} not found` },
          { status: 404 }
        );
      }
    } 
    // If a page index is provided, use that
    else if (pageIndex !== undefined && pageIndex >= 0 && pageIndex < pages.length) {
      page = pages[pageIndex];
    }
    // Otherwise use the first page
    else {
      page = pages[0];
    }

    const pageToken = page.access_token;
    const pageId = page.id;
    const pageName = page.name;

    // Log the page token details
    console.log('Selected page token details:', {
      pageId,
      pageName,
      tokenLength: pageToken.length
    });

    // Store tokens and page ID
    setTokens({
      pageToken,
      pageId,
      longLivedToken,
      pageIndex: pageIndex !== undefined ? pageIndex : 0
    });
    
    // Also update in the accounts.json
    updateAccountPage(currentAccount.id, {
      id: pageId,
      name: pageName,
      access_token: pageToken
    });
    
    console.log(`Stored page token and ID for "${pageName}" (${pageId}) in account: ${currentAccount.name}`);

    // Test if the token works by making a small request to the Graph API
    try {
      const testResponse = await axios.get(
        `https://graph.facebook.com/v19.0/${pageId}?access_token=${pageToken}&fields=id,name`
      );
      console.log(`Page token validation successful for "${pageName}" (${pageId})`);
    } catch (testError: any) {
      console.warn(`Token validation warning: ${testError.message}`, testError.response?.data);
    }

    return NextResponse.json({
      success: true,
      pageToken,
      pageId,
      pageName
    });
  } catch (error: any) {
    console.error('Error fetching Page token:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Page token', details: error.response?.data },
      { status: 500 }
    );
  }
} 