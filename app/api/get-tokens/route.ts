import { NextResponse } from 'next/server';
import { getTokens } from '../../lib/tokenStore';

export async function GET() {
  const tokens = getTokens();
  
  // Return only necessary information, not actual tokens
  return NextResponse.json({
    pageId: tokens.pageId,
    hasPageToken: !!tokens.pageToken,
    hasLongLivedToken: !!tokens.longLivedToken,
    pageIndex: tokens.pageIndex
  });
} 