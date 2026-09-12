import { NextRequest, NextResponse } from 'next/server';
import { getLoanById } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid loan ID' }, { status: 400 });
    }

    const loan = await getLoanById(id);
    if (!loan) {
      return NextResponse.json({ success: false, error: 'Loan not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: loan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
