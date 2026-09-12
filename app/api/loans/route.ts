import { NextRequest, NextResponse } from 'next/server';
import { getLoans, createLoan } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const customerIdStr = searchParams.get('customer_id');
    const customer_id = customerIdStr ? parseInt(customerIdStr, 10) : undefined;

    const loans = await getLoans({ status, search, customer_id });
    return NextResponse.json({ success: true, data: loans });
  } catch (error: any) {
    console.error('Error fetching loans:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customer_id,
      principal,
      interest_rate,
      rate_type,
      calculation_type,
      frequency,
      tenure_value,
      tenure_unit,
      disbursal_date,
      first_payment_date,
    } = body;

    if (!customer_id || !principal || interest_rate === undefined || !tenure_value || !disbursal_date || !first_payment_date) {
      return NextResponse.json(
        { success: false, error: 'Customer, Principal, Interest Rate, Tenure, and Dates are required.' },
        { status: 400 }
      );
    }

    const loan = await createLoan({
      customer_id: Number(customer_id),
      principal: Number(principal),
      interest_rate: Number(interest_rate),
      rate_type: rate_type || 'monthly',
      calculation_type: calculation_type || 'flat',
      frequency: frequency || 'monthly',
      tenure_value: Number(tenure_value),
      tenure_unit: tenure_unit || 'months',
      disbursal_date,
      first_payment_date,
      processing_fee: Number(body.processing_fee || 0),
      collateral_details: body.collateral_details || '',
      notes: body.notes || '',
    });

    return NextResponse.json({ success: true, data: loan }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating loan:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
