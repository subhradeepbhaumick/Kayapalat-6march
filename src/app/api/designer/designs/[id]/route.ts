import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteDesignLocalFile, uploadDesignLocal } from '@/lib/uploadController-local';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    if (!designerId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const designId = (await params).id;
    const formData = await request.formData();
    const client_id = (formData.get('client_id') as string)?.trim();
    const client_name = (formData.get('client_name') as string)?.trim();
    const room_name = (formData.get('room_name') as string)?.trim();
    const product_name = (formData.get('product_name') as string)?.trim();
    const image = formData.get('image') as File;

    // Verify ownership
    const currentDesign = await db.query(
      'SELECT * FROM designer_designs WHERE id = ? AND designer_id = ?',
      [designId, designerId]
    );

    if (currentDesign.length === 0) {
      return NextResponse.json(
        { error: 'Design not found or access denied' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    // Only update fields that are provided and not empty (partial update)
    if (client_id) {
      updateData.client_id = client_id;
    }
    if (client_name) {
      updateData.client_name = client_name;
    }
    if (room_name) {
      updateData.room_name = room_name;
    }
    if (product_name) {
      updateData.product_name = product_name;
    }

    // If new image uploaded, handle it
    if (image) {
      // Delete old image from local storage
      await deleteDesignLocalFile(currentDesign[0].image_path);

      // Upload new image
      const timestamp = Date.now();
      const filename = `clientdesigns/${timestamp}-${image.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_')}`;
      const fileBuffer = Buffer.from(await image.arrayBuffer());

      const uploadResult = await uploadDesignLocal(filename, fileBuffer, image.type);
      if (!uploadResult.success) {
        return NextResponse.json(
          { error: 'Failed to upload new image' },
          { status: 500 }
        );
      }

      updateData.image_path = filename;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes to update'
      });
    }

    // Build dynamic update query based on what fields are provided
    const updates = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);

    console.log('Updating design with:', { updates, values, designId, designerId });

    // Update database
    const updateResult = await db.query(`
      UPDATE designer_designs
      SET ${updates}
      WHERE id = ? AND designer_id = ?
    `, [...values, designId, designerId]);

    console.log('Update result:', updateResult);

    if (!updateResult || (updateResult as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Failed to update design - no rows affected' },
        { status: 500 }
      );
    }

    // If room_name or client_id was updated, also update the design_rooms table
    if (updateData.room_name || updateData.client_id) {
      const roomId = currentDesign[0].room_id;
      if (roomId) {
        // First, check if there are other designs with different room_name or client_id in this room
        // to avoid conflicting updates
        const updateRoomData: any = {};
        if (updateData.room_name) {
          updateRoomData.room_name = updateData.room_name;
        }
        if (updateData.client_id) {
          updateRoomData.client_id = updateData.client_id;
        }

        if (Object.keys(updateRoomData).length > 0) {
          const roomUpdates = Object.keys(updateRoomData).map(key => `${key} = ?`).join(', ');
          const roomValues = Object.values(updateRoomData);
          
          console.log('Updating design_rooms with:', { roomUpdates, roomValues, roomId });

          await db.query(`
            UPDATE design_rooms
            SET ${roomUpdates}
            WHERE room_id = ?
          `, [...roomValues, roomId]);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Design updated successfully'
    });
  } catch (error) {
    console.error('Error updating design:', error);
    return NextResponse.json(
      { error: 'Failed to update design' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    if (!designerId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const designId = (await params).id;

    // Get design details for file deletion
    const design = await db.query(
      'SELECT * FROM designer_designs WHERE id = ? AND designer_id = ?',
      [designId, designerId]
    );

    if (design.length === 0) {
      return NextResponse.json(
        { error: 'Design not found or access denied' },
        { status: 404 }
      );
    }

    // Delete image from local storage
    await deleteDesignLocalFile(design[0].image_path);

    // Soft delete from database
    await db.query(
      'UPDATE designer_designs SET status = "deleted" WHERE id = ? AND designer_id = ?',
      [designId, designerId]
    );

    return NextResponse.json({
      success: true,
      message: 'Design deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting design:', error);
    return NextResponse.json(
      { error: 'Failed to delete design' },
      { status: 500 }
    );
  }
}
