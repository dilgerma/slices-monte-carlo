import { NextRequest, NextResponse } from 'next/server';
import { storeData } from '@/lib/dataStore';

export async function POST(request: NextRequest) {
    try {
        // Get the JSON data from the request
        const body = await request.json();

        // Store the data and get a UUID
        const dataId = storeData(body);

        // Redirect to the main page with just the UUID
        return NextResponse.redirect(new URL(`/?id=${dataId}`, request.url));
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
