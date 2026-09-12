import { NextRequest, NextResponse } from 'next/server';
import { getCustomers, createCustomer } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const customers = await getCustomers(search);
    return NextResponse.json({ success: true, data: customers });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Name and Phone number are required.' },
        { status: 400 }
      );
    }

    const customer = await createCustomer(body);
    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
