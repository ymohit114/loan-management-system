import { NextRequest, NextResponse } from 'next/server';
import { getPaymentById, getSettings } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid payment ID' }, { status: 400 });
    }

    const payment = await getPaymentById(id);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    const settings = await getSettings();

    return NextResponse.json({
      success: true,
      data: {
        payment,
        settings,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
