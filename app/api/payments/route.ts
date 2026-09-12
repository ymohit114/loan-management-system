import { NextRequest, NextResponse } from 'next/server';
import { recordPayment, getRecentPayments } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const payments = await getRecentPayments(limit);
    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.loan_id || !body.amount || !body.payment_date) {
      return NextResponse.json(
        { success: false, error: 'Loan ID, Amount, and Payment Date are required.' },
        { status: 400 }
      );
    }

    const result = await recordPayment({
      loan_id: Number(body.loan_id),
      amount: Number(body.amount),
      payment_date: body.payment_date,
      payment_method: body.payment_method || 'cash',
      reference_no: body.reference_no,
      notes: body.notes,
      penalty: Number(body.penalty || 0),
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
