/**
 * API Route: POST /api/metro/add-lead
 * Description: Add a new lead to metro_property_visit table
 * File Location: src/app/api/metro/add-lead/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

// ============================================================
// MAIN POST HANDLER
// ============================================================
export async function POST(request: NextRequest) {
  try {
    console.log('🔵 [ADD-LEAD] Incoming request');

    // --------------------------------------------------
    // STEP 1: Authentication Check
    // --------------------------------------------------
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.user_id) {
      console.error('🔴 [ADD-LEAD] No token or user_id found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check role-based access
    const allowedRoles = ['sales_admin', 'superadmin', 'metro_client', 'metro','metro-superadmin'];
    if (!allowedRoles.includes(token.role as string)) {
      console.error(`🔴 [ADD-LEAD] Unauthorized role: ${token.role}`);
      return NextResponse.json(
        { error: 'You do not have permission to add leads' },
        { status: 403 }
      );
    }

    const adminId = token.user_id as string;
    console.log(`✅ [ADD-LEAD] Authenticated user: ${adminId} (Role: ${token.role})`);

    // --------------------------------------------------
    // STEP 2: Parse Request Body
    // --------------------------------------------------
    const body = await request.json();
    console.log('📋 [ADD-LEAD] Request body:', JSON.stringify(body, null, 2));

    const {
      clientName,
      clientPhone,
      projectName,
      budget,
      location,
      details,
      propertyType,
    } = body;

    // --------------------------------------------------
    // STEP 3: Validate Required Fields
    // --------------------------------------------------
    if (!clientName || typeof clientName !== 'string' || !clientName.trim()) {
      console.error('🔴 [ADD-LEAD] Validation failed: Client Name is required');
      return NextResponse.json(
        { error: 'Client Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!clientPhone || typeof clientPhone !== 'string' || !clientPhone.trim()) {
      console.error('🔴 [ADD-LEAD] Validation failed: Client Phone is required');
      return NextResponse.json(
        { error: 'Client Phone is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    console.log('✅ [ADD-LEAD] All required fields validated');

    // --------------------------------------------------
    // STEP 4: Generate Next Appointment ID
    // --------------------------------------------------
    console.log('🔍 [ADD-LEAD] Generating appointment ID...');
    const appointmentId = await generateNextAppointmentId();
    console.log(`✅ [ADD-LEAD] Generated appointment ID: ${appointmentId}`);

    // --------------------------------------------------
    // STEP 5: Generate Lead ID
    // --------------------------------------------------
    const leadId = `L${Date.now()}`;
    console.log(`✅ [ADD-LEAD] Generated lead ID: ${leadId}`);

    // --------------------------------------------------
    // STEP 6: Prepare Insert Data
    // --------------------------------------------------
    const insertQuery = `
      INSERT INTO metro_property_visit (
        appointment_id,
        lead_id,
        admin_id,
        client_name,
        client_phone,
        project_name,
        location,
        budget,
        details,
        property_type,
        cold_call_status,
        site_visit_status,
        booking_status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const insertParams = [
      appointmentId,
      leadId,
      adminId,
      clientName.trim(),
      clientPhone.trim(),
      projectName?.trim() || null,
      location?.trim() || null,
      budget ? parseInt(String(budget), 10) : null,
      details?.trim() || null,
      propertyType || 'Residential',
      'Upcoming', // cold_call_status
      'Upcoming', // site_visit_status
      'Upcoming', // booking_status
    ];

    console.log('📝 [ADD-LEAD] Insert query prepared');
    console.log('📝 [ADD-LEAD] Insert params:', JSON.stringify(insertParams, null, 2));

    // --------------------------------------------------
    // STEP 7: Execute Insert Query
    // --------------------------------------------------
    console.log('💾 [ADD-LEAD] Executing insert query...');
    await executeQuery(insertQuery, insertParams);
    console.log('✅ [ADD-LEAD] Lead successfully inserted into database');

    // --------------------------------------------------
    // STEP 8: Return Success Response
    // --------------------------------------------------
    const successResponse = {
      message: 'Lead added successfully',
      appointmentId,
      leadId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      timestamp: new Date().toISOString(),
    };

    console.log('🎉 [ADD-LEAD] Success response:', JSON.stringify(successResponse, null, 2));

    return NextResponse.json(successResponse, { status: 201 });

  } catch (error) {
    console.error('🔴 [ADD-LEAD] Error occurred:', error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error('🔴 [ADD-LEAD] Error message:', error.message);
      console.error('🔴 [ADD-LEAD] Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to add lead. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================
// HELPER FUNCTION: Generate Next Appointment ID
// ============================================================
/**
 * Generates the next appointment ID by querying the latest ID
 * and incrementing the numeric part.
 *
 * Logic:
 * - If no records exist: return 'A0001'
 * - If records exist: increment the numeric part
 *   Example: A0007 → A0008
 *
 * @returns Promise<string> - Next appointment ID (e.g., 'A0008')
 */
async function generateNextAppointmentId(): Promise<string> {
  try {
    console.log('🔍 [GENERATE-ID] Querying latest appointment_id from database...');

    // Query to find the latest appointment_id
    // Extracts numeric part and sorts in descending order
    const query = `
      SELECT appointment_id
      FROM metro_property_visit
      WHERE appointment_id LIKE 'A%'
      ORDER BY CAST(SUBSTRING(appointment_id, 2) AS UNSIGNED) DESC
      LIMIT 1
    `;

    const [rows] = await executeQuery(query, []);

    // Case 1: No appointment_id exists yet
    if (!rows || (rows as any[]).length === 0) {
      console.log('📭 [GENERATE-ID] No existing appointment_ids found. Starting with A0001');
      return 'A0001';
    }

    // Case 2: Appointment_ids exist - increment the latest one
    const lastAppointmentId = (rows as any[])[0].appointment_id;
    console.log(`📊 [GENERATE-ID] Latest appointment_id found: ${lastAppointmentId}`);

    // Extract numeric part (remove 'A' prefix)
    const numericPartStr = lastAppointmentId.substring(1);
    const numericPart = parseInt(numericPartStr, 10);

    if (isNaN(numericPart)) {
      console.error(`🔴 [GENERATE-ID] Invalid numeric part: ${numericPartStr}`);
      // Fallback to timestamp-based ID
      const fallbackId = `A${Date.now()}`;
      console.log(`⚠️ [GENERATE-ID] Using fallback ID: ${fallbackId}`);
      return fallbackId;
    }

    // Increment numeric part
    const nextNumericPart = numericPart + 1;
    console.log(`➕ [GENERATE-ID] Incrementing: ${numericPart} + 1 = ${nextNumericPart}`);

    // Format with leading zeros (4-digit padding)
    // Examples: 1 → 0001, 8 → 0008, 100 → 0100, 1000 → 1000
    const nextAppointmentId = `A${String(nextNumericPart).padStart(4, '0')}`;
    console.log(`✅ [GENERATE-ID] Generated next appointment_id: ${nextAppointmentId}`);

    return nextAppointmentId;

  } catch (error) {
    console.error('🔴 [GENERATE-ID] Error generating appointment_id:', error);

    if (error instanceof Error) {
      console.error('🔴 [GENERATE-ID] Error message:', error.message);
    }

    // Fallback to timestamp-based ID if query fails
    const fallbackId = `A${Date.now()}`;
    console.warn(`⚠️ [GENERATE-ID] Query failed. Using fallback ID: ${fallbackId}`);
    return fallbackId;
  }
}

// ============================================================
// Example Request Body (for reference)
// ============================================================
/*
POST /api/metro/add-lead

Request Body (JSON):
{
  "clientName": "John Doe",
  "clientPhone": "+91-9876543210",
  "projectName": "Metro Residency",
  "budget": 50000000,
  "location": "Shyamnagar, Kolkata",
  "details": "Residential apartment with 3 BHK",
  "propertyType": "Residential"
}

Response (Success - 201):
{
  "message": "Lead added successfully",
  "appointmentId": "A0008",
  "leadId": "L1719561234567",
  "clientName": "John Doe",
  "clientPhone": "+91-9876543210",
  "timestamp": "2024-06-28T10:30:45.123Z"
}

Response (Error - 400):
{
  "error": "Client Name is required and must be a non-empty string"
}

Response (Error - 500):
{
  "error": "Failed to add lead. Please try again later.",
  "details": "Database connection failed"
}
*/

// ============================================================
// Appointment ID Generation Examples
// ============================================================
/*
Scenario 1: Empty Table
- Query result: 0 rows
- Generated ID: A0001

Scenario 2: Some records exist
- Latest ID in DB: A0007
- Query result: [{ appointment_id: 'A0007' }]
- Extracted numeric: 7
- Incremented: 8
- Generated ID: A0008 (with padStart(4, '0'))

Scenario 3: Multiple digits
- Latest ID in DB: A0099
- Extracted numeric: 99
- Incremented: 100
- Generated ID: A0100

Scenario 4: Larger numbers
- Latest ID in DB: A1234
- Extracted numeric: 1234
- Incremented: 1235
- Generated ID: A1235

Sequence Example:
No records → A0001 (first lead)
After 1st → A0002
After 9th → A0010
After 99th → A0100
After 9999th → A10000
*/