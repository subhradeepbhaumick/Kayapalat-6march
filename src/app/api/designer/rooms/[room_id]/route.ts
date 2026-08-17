import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteDesignLocalFile } from '@/lib/uploadController-local';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ room_id: string }> }
) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const designerId = session.user.id;
    const roomId = (await params).room_id;
    const formData = await request.formData();
    const client_id = (formData.get('client_id') as string)?.trim();
    const room_name = (formData.get('room_name') as string)?.trim();

    // Verify ownership - check if designer has designs in this room
    const ownershipCheck = await db.query(
      'SELECT COUNT(*) as count FROM designer_designs d JOIN design_revisions rev ON d.revision_id = rev.revision_id WHERE rev.room_id = ? AND d.designer_id = ? AND d.status = "active"',
      [roomId, designerId]
    );

    if (ownershipCheck[0].count === 0) {
      return NextResponse.json(
        { error: 'Room not found or access denied' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    // Only update fields that are provided and not empty
    if (client_id) {
      updateData.client_id = client_id;
    }
    if (room_name) {
      updateData.room_name = room_name;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes to update'
      });
    }

    // Update room
    const updates = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);

    const updateResult = await db.query(`
      UPDATE design_rooms
      SET ${updates}
      WHERE room_id = ?
    `, [...values, roomId]);

    if (!updateResult || (updateResult as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Failed to update room' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Room updated successfully'
    });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ room_id: string }> }
) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const designerId = session.user.id;
    const roomId = (await params).room_id;

    // Verify ownership - check if designer has designs in this room
    const ownershipCheck = await db.query(
      'SELECT COUNT(*) as count FROM designer_designs d JOIN design_revisions rev ON d.revision_id = rev.revision_id WHERE rev.room_id = ? AND d.designer_id = ? AND d.status = "active"',
      [roomId, designerId]
    );

    if (ownershipCheck[0].count === 0) {
      return NextResponse.json(
        { error: 'Room not found or access denied' },
        { status: 404 }
      );
    }

    // Get all designs in the room to delete their files
    const designs = await db.query(
      'SELECT d.* FROM designer_designs d JOIN design_revisions rev ON d.revision_id = rev.revision_id WHERE rev.room_id = ? AND d.designer_id = ? AND d.status = "active"',
      [roomId, designerId]
    );

    // Delete image files
    for (const design of designs) {
  // Delete image if exists
  if (design.image_path) {
    await deleteDesignLocalFile(design.image_path);
  }

  // Delete PDF if exists
  if (design["2d_pdf_path"]) {
    await deleteDesignLocalFile(design["2d_pdf_path"]);
  }
}

    // Soft delete all designs in the room
    await db.query(
      'UPDATE designer_designs d JOIN design_revisions rev ON d.revision_id = rev.revision_id SET d.status = "deleted" WHERE rev.room_id = ? AND d.designer_id = ?',
      [roomId, designerId]
    );

    // Delete the room and its revisions (revisions cascade delete due to FK constraint)
    await db.query(
      'DELETE FROM design_rooms WHERE room_id = ?',
      [roomId]
    );

    return NextResponse.json({
      success: true,
      message: 'Room and all designs deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}
