import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  const pageToken = process.env.FACEBOOK_PAGE_TOKEN;
  
  if (!pageToken) {
    return NextResponse.json(
      { error: 'Page token missing' },
      { status: 400 }
    );
  }

  try {
    const { formId, onlyYesterday } = await request.json();

    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID missing' },
        { status: 400 }
      );
    }

    let url = `https://graph.facebook.com/${formId}/leads?access_token=${pageToken}`;
    
    if (onlyYesterday) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString().split('T')[0];
      url += `&filter[created_time_min]=${yesterdayISO}T00:00:00&filter[created_time_max]=${yesterdayISO}T23:59:59`;
    }

    const response = await axios.get(url);
    const leads = response.data.data;

    // Format leads for CSV download
    const csvRows = [
      'ID,Created Time,Full Name,Email,Phone Number'
    ];

    leads.forEach((lead: any) => {
      const fields = lead.field_data.reduce((acc: any, field: any) => {
        acc[field.name] = field.values[0] || '';
        return acc;
      }, {});

      csvRows.push(
        `${lead.id},${lead.created_time},${fields.full_name || ''},${fields.email || ''},${fields.phone_number || ''}`
      );
    });

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=leads_${formId}_${onlyYesterday ? 'yesterday' : 'all'}.csv`
      }
    });
  } catch (error: any) {
    console.error('Error downloading leads:', error.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to download leads' },
      { status: 500 }
    );
  }
} 