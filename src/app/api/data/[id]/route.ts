import { NextRequest, NextResponse } from 'next/server';
import { getData } from '@/lib/dataStore';

export async function GET(
  request: NextRequest,
  params: any
) {

  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return NextResponse.json(null, {
      headers,
      status: 204,
    });
  }

  const id = params.id;
  const data = getData(id);

  if (!data) {
    return NextResponse.json(
      { error: 'Data not found or expired' },
      { headers, status: 404 }
    );
  }

  return NextResponse.json(data,{headers, status: 200});
}
