import { NextResponse } from 'next/server';
import { getDashboardStats, getRecentPayments, getUpcomingAndOverdue, getSettings } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getDashboardStats();
    const recentPayments = await getRecentPayments(5);
    const todayDues = await getUpcomingAndOverdue('today');
    const overdueDues = await getUpcomingAndOverdue('overdue');
    const settings = await getSettings();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentPayments,
        todayDues,
        overdueDues,
        settings,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/dashboard:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
