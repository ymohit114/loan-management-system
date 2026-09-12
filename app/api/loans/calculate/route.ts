import { NextRequest, NextResponse } from 'next/server';
import { calculateLoan } from '@/lib/loan-calculator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = calculateLoan({
      principal: Number(body.principal || 0),
      interestRate: Number(body.interest_rate || 0),
      rateType: body.rate_type || 'monthly',
      calculationType: body.calculation_type || 'flat',
      frequency: body.frequency || 'monthly',
      tenureValue: Number(body.tenure_value || 1),
      tenureUnit: body.tenure_unit || 'months',
      firstPaymentDate: body.first_payment_date || new Date().toISOString().split('T')[0],
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
