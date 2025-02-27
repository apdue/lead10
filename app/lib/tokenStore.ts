// Server-side token store for multiple accounts
import { getCurrentAccount, updateAccountTokens, updateAccountPage } from './accountsHandler';
import type { FacebookPage } from './accountsHandler';

interface TokenStore {
  longLivedToken: string;
  pageToken: string;
  pageId: string;
  pageIndex?: number; // For tracking which page is selected
}

// Use global object to persist tokens across hot reloads
declare global {
  var __tokenStore: TokenStore | undefined;
}

if (!global.__tokenStore) {
  global.__tokenStore = {
    longLivedToken: '',
    pageToken: '',
    pageId: ''
  };

  // Initialize with environment variables if available
  if (process.env.FACEBOOK_PAGE_TOKEN && process.env.FACEBOOK_PAGE_ID) {
    global.__tokenStore.pageToken = process.env.FACEBOOK_PAGE_TOKEN;
    global.__tokenStore.pageId = process.env.FACEBOOK_PAGE_ID;
  }
}

// Special override for "आयुर्वेदिक नुस्खे Anamika" page issue
const ANAMIKA_PAGE_ID = '101245016125462';
const ANAMIKA_FRESH_TOKEN = 'EAAjdPT8JxhcBO3ZBuqojRVG1rNSQqdB3jaDo3W5LNZB2hXF7SSP3VDJGa0Ubw61FFa6d8IcEUzuJ8u2XZCphArPOmxciBHLzQEjG8yDGwPzyOdGsQlGQnVBxclvyajqWxUVqzRy4dpIMcq5ZAljY2UW0A5QmAPmzps98ZBJ38n9W0ZAkm2iT6Y4ZAHkSrPEvsuTsvADz5w05yYLpQ5gLbMYcrZBAhNmd1zs5rhgZD';

// Mock form data for Anamika page
export const ANAMIKA_MOCK_FORMS = [
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

export function getTokens(): TokenStore {
  // First, try to get tokens from current account in accounts.json
  const currentAccount = getCurrentAccount();
  
  // Log what we have
  console.log('TokenStore.getTokens called:', {
    hasCurrentAccount: !!currentAccount,
    hasLongLivedToken: currentAccount ? !!currentAccount.longLivedToken : false,
    pagesCount: currentAccount && currentAccount.pages ? currentAccount.pages.length : 0,
    tokenStorePageIndex: global.__tokenStore?.pageIndex
  });
  
  // SPECIAL CASE: If requesting the problematic Anamika page
  // Check both global store and current account pages
  const isAnamikaPageSelected = 
    global.__tokenStore?.pageId === ANAMIKA_PAGE_ID || 
    (currentAccount?.pages && currentAccount.pages.some(p => p.id === ANAMIKA_PAGE_ID && 
      (global.__tokenStore?.pageIndex === undefined || 
       (currentAccount.pages.indexOf(p) === global.__tokenStore?.pageIndex))));
  
  if (isAnamikaPageSelected) {
    console.log('*** DETECTED ANAMIKA PAGE IN TOKEN STORE - USING SPECIAL TOKEN ***');
    return {
      longLivedToken: ANAMIKA_FRESH_TOKEN,
      pageToken: ANAMIKA_FRESH_TOKEN,
      pageId: ANAMIKA_PAGE_ID,
      pageIndex: global.__tokenStore?.pageIndex
    };
  }
  
  if (currentAccount && currentAccount.longLivedToken) {
    // If the account has pages and a selected page, use that page's token
    if (currentAccount.pages.length > 0 && global.__tokenStore?.pageIndex !== undefined) {
      const selectedPageIndex = global.__tokenStore.pageIndex;
      
      if (selectedPageIndex >= 0 && selectedPageIndex < currentAccount.pages.length) {
        const selectedPage = currentAccount.pages[selectedPageIndex];
        console.log(`Using page token for ${selectedPage.name} (${selectedPage.id})`);
        return {
          longLivedToken: currentAccount.longLivedToken,
          pageToken: selectedPage.access_token,
          pageId: selectedPage.id,
          pageIndex: selectedPageIndex
        };
      }
    }
    
    // If no page is selected or index is invalid, just return the account token
    return {
      longLivedToken: currentAccount.longLivedToken,
      pageToken: global.__tokenStore!.pageToken,
      pageId: global.__tokenStore!.pageId
    };
  }
  
  // Fall back to the global token store if no current account is available
  return global.__tokenStore!;
}

export function setTokens(tokens: Partial<TokenStore>) {
  const oldTokens = { ...global.__tokenStore! };
  global.__tokenStore = { ...oldTokens, ...tokens };
  
  // Extra check - if pageId is for Anamika page, override with the new token
  if (tokens.pageId === ANAMIKA_PAGE_ID) {
    console.log('*** DETECTED ANAMIKA PAGE IN setTokens ***');
    global.__tokenStore.pageToken = ANAMIKA_FRESH_TOKEN;
  }
  
  // Log the token changes (safely masking the actual tokens)
  console.log('Token store updated:', {
    longLivedToken: tokens.longLivedToken ? '[updated]' : oldTokens.longLivedToken ? '[unchanged]' : '[empty]',
    pageToken: tokens.pageToken ? '[updated]' : oldTokens.pageToken ? '[unchanged]' : '[empty]',
    pageId: tokens.pageId || oldTokens.pageId || '[empty]',
    pageIndex: tokens.pageIndex !== undefined ? tokens.pageIndex : oldTokens.pageIndex
  });
  
  // Also update the tokens in accounts.json for the current account
  const currentAccount = getCurrentAccount();
  if (currentAccount) {
    if (tokens.longLivedToken) {
      updateAccountTokens(currentAccount.id, {
        longLivedToken: tokens.longLivedToken,
        longLivedTokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days from now
      });
    }
    
    if (tokens.pageToken && tokens.pageId) {
      // Find if the page already exists
      const existingPageIndex = currentAccount.pages.findIndex(p => p.id === tokens.pageId);
      
      if (existingPageIndex !== -1) {
        // Update existing page
        updateAccountPage(currentAccount.id, {
          id: tokens.pageId!,
          name: currentAccount.pages[existingPageIndex].name,
          access_token: tokens.pageId === ANAMIKA_PAGE_ID ? ANAMIKA_FRESH_TOKEN : tokens.pageToken!
        });
      }
    }
  }
} 