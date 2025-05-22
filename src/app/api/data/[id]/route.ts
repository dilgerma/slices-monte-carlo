import { NextRequest, NextResponse } from 'next/server';
import { getData } from '@/lib/dataStore';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const data = getData(id);

  if (!data) {
    return NextResponse.json(
      { error: 'Data not found or expired' },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
