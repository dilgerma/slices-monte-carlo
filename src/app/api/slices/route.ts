import { NextRequest, NextResponse } from 'next/server';
import { storeData } from '@/lib/dataStore';

// Helper function to add CORS headers
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

// Handle OPTIONS requests (preflight)
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export async function GET() {
    return NextResponse.json({ message: 'GET method supported' }, {
        headers: corsHeaders(),
        status: 200,
    });
}

export async function POST(request: NextRequest) {
    try {
        // Get the JSON data from the request
        const body = await request.json();

        // Store the data and get a UUID
        const dataId = storeData(body);

        // Instead of redirecting, return JSON with the ID and URL
        // This avoids CORS issues with redirects
        return NextResponse.json(
            {
                success: true,
                dataId,
                url: `/?id=${dataId}`
            },
            { headers: corsHeaders(), status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { headers: corsHeaders(), status: 500 }
        );
    }
}
