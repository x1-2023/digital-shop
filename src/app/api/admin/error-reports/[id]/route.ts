import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { status, adminNote, resolution } = body;

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'RESOLVED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update error report
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (adminNote !== undefined) updateData.adminNote = adminNote;
    if (resolution !== undefined) updateData.resolution = resolution;
    if (status === 'RESOLVED') updateData.resolvedAt = new Date();

    const errorReport = await prisma.errorReport.update({
      where: { id },
      data: updateData,
    });

    // Log admin action
    await prisma.systemLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'ADMIN_SETTINGS_UPDATE',
        targetType: 'ERROR_REPORT',
        targetId: errorReport.id,
        description: `Admin updated error report status to ${status || 'updated'}`,
        metadata: JSON.stringify({
          reportId: errorReport.id,
          orderId: errorReport.orderId,
          newStatus: status,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      report: errorReport,
    });
  } catch (error) {
    console.error('Error updating error report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
