import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingAndOverdue, getSettings } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'all') as 'all' | 'today' | 'overdue' | 'upcoming';
    const items = await getUpcomingAndOverdue(type);
    const settings = await getSettings();

    return NextResponse.json({
      success: true,
      data: {
        items,
        settings,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
