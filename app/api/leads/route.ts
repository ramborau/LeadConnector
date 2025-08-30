import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

// GET /api/leads - Get all leads for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        pages: {
          include: {
            leads: {
              orderBy: { createdAt: 'desc' },
              take: 100 // Limit to 100 most recent leads
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Flatten leads from all pages
    const allLeads = user.pages.flatMap(page => 
      page.leads.map(lead => ({
        ...lead,
        pageName: page.name,
        pageId: page.id
      }))
    );

    // Get query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const pageId = url.searchParams.get('pageId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    let filteredLeads = allLeads;

    // Apply filters
    if (status && status !== 'all') {
      filteredLeads = filteredLeads.filter(lead => lead.status === status.toUpperCase());
    }

    if (pageId) {
      filteredLeads = filteredLeads.filter(lead => lead.pageId === pageId);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredLeads = filteredLeads.filter(lead => new Date(lead.createdAt) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filteredLeads = filteredLeads.filter(lead => new Date(lead.createdAt) <= toDate);
    }

    return NextResponse.json({
      leads: filteredLeads,
      total: filteredLeads.length,
      stats: {
        total: allLeads.length,
        new: allLeads.filter(l => l.status === 'NEW').length,
        processing: allLeads.filter(l => l.status === 'PROCESSING').length,
        delivered: allLeads.filter(l => l.status === 'DELIVERED').length,
        failed: allLeads.filter(l => l.status === 'FAILED').length,
        archived: allLeads.filter(l => l.status === 'ARCHIVED').length,
        today: allLeads.filter(l => {
          const today = new Date();
          const leadDate = new Date(l.createdAt);
          return leadDate.toDateString() === today.toDateString();
        }).length
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}