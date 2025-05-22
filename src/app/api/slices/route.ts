import { NextRequest, NextResponse } from 'next/server';
import { storeData } from '@/lib/dataStore';

export async function POST(request: NextRequest) {

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

    try {
        // Get the JSON data from the request
        const body = await request.json();

        // Store the data and get a UUID
        const dataId = storeData(body);

        // Redirect to the main page with just the UUID
        return NextResponse.redirect(new URL(`/?id=${dataId}`, request.url),{headers, status: 200});
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { headers,status: 500 });
    }
}
