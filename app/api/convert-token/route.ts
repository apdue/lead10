import { NextResponse } from 'next/server';
import axios from 'axios';
import { setTokens } from '@/app/lib/tokenStore';

interface FacebookTokenResponse {
  access_token: string;
}

export async function GET() {
  const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_SHORT_LIVED_TOKEN } = process.env;

  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !FACEBOOK_SHORT_LIVED_TOKEN) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get<FacebookTokenResponse>(
      `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${FACEBOOK_SHORT_LIVED_TOKEN}`
    );

    const longLivedToken = response.data.access_token;
    
    // Store the token
    setTokens({ longLivedToken });
    console.log('Stored long-lived token:', longLivedToken);

    return NextResponse.json({ success: true, longLivedToken });
  } catch (error: any) {
    console.error('Error converting token:', error.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to convert token' },
      { status: 500 }
    );
  }
} 