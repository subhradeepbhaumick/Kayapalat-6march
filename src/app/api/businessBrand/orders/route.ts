import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'businessBrand') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const businessBrandId = token.user_id;

    // Fetch orders from buy_product table where dealer_id matches and booking_status is 'booked'
    // Join with bought_product to get group details and product_details for commission
    const [ordersResult] = await executeQuery(`
      SELECT
        bp.id,
        bp.order_id,
        bp.product_id,
        bp.dealer_id,
        bp.company_name,
        bp.category,
        bp.product_name,
        bp.product_type,
        bp.product_mrp,
        bp.discount_percentage,
        bp.discount,
        bp.gst,
        bp.gst_amount,
        bp.changed_price,
        bp.quantity,
        bp.discounted_ammount,
        bp.transport_exclude,
        bp.billed_date,
        bp.delivery_date,
        bp.booking_status,
        bp.client_name,
        bp.client_phone,
        bp.action,
        bp.agent_id,
        bp.created_at,
        bp.updated_at,
        bp.o_id,
        bt.o_id as bt_o_id,
        bt.dealer_id as bt_dealer_id,
        bt.client_name as bt_client_name,
        bt.client_phone as bt_client_phone,
        bt.client_gstin as bt_client_gstin,
        bt.order_list,
        bt.payment_type,
        bt.total_amount,
        bt.advance,
        bt.due,
        bt.transaction_id,
        bt.delivery_type,
        bt.site_address AS bt_site_address,
        bt.extra_trsnsport_cost,
        bt.status,
        bt.company_total_payment,
        bt.company_paid,
        bt.company_due,
        bt.created_at as group_created_at,
        bt.updated_at as bt_updated_at,
        pd.commission_percentage,
        pd.commission_amount,
        pd.transport_exclude as product_transport_exclude
      FROM buy_product bp
      LEFT JOIN \`bought-product\` bt ON bp.o_id = bt.o_id
      LEFT JOIN product_details pd ON bp.product_id = pd.product_id
      WHERE bp.dealer_id = ? AND bp.booking_status != 'pending'
      ORDER BY bt.created_at DESC, bp.created_at DESC
    `, [businessBrandId]);

    // 🔹 Fetch all bought-product (group orders) for this businessBrand
    const [boughtProductResult] = await executeQuery(
      `
  SELECT
    o_id,
    dealer_id,
    client_name,
    client_phone,
    client_gstin,
    order_list,
    payment_type,
    total_amount,
    advance,
    due,
    transaction_id,
    delivery_type,
    site_address,
    extra_trsnsport_cost,
    status,
    company_total_payment,
    company_paid,
    company_due,
    created_at,
    updated_at
  FROM \`bought-product\`
  WHERE dealer_id = ?
  ORDER BY created_at DESC
  `,
      [businessBrandId]
    );

    // 🔹 Fetch manufacturer details for logged-in businessBrand
    const [manufacturerResult] = await executeQuery(
      `
      SELECT
        dealer_id,
        company_logo,
        user_name,
        phone,
        whatsapp,
        email,
        composite_gst_scheme,
        company_name,
        owner_name,
        address,
        gstin,
        pan,
        tan,
        created_at
      FROM manufacturer
      WHERE dealer_id = ?
      `,
      [businessBrandId]
    );

    // 🔹 Fetch all product_details for this businessBrand
    const [productDetailsResult] = await executeQuery(
      `
      SELECT
        product_id,
        dealer_id,
        category,
        product_name,
        product_type,
        short_description,
        about_product,
        mrp,
        commission_percentage,
        commission_amount,
        gst_percentage,
        gst_exclude,
        gst_amount,
        transportation_cost,
        transport_exclude,
        base_mrp,
        final_product_cost,
        is_active,
        created_at,
        updated_at
      FROM product_details
      WHERE dealer_id = ?
      ORDER BY created_at DESC
      `,
      [businessBrandId]
    );


    return NextResponse.json({
      orders: ordersResult,
      manufacturer: manufacturerResult?.[0] || null,
      boughtProducts: boughtProductResult,
      productDetails: productDetailsResult
    });

  } catch (error) {
    console.error('Error fetching businessBrand orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'businessBrand') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessBrandId = token.user_id;
    const body = await request.json();
    const { order_id, delivery_date, booking_status, action, o_id, company_total_payment, company_due } = body;

    if (order_id) {
      if (delivery_date === undefined && booking_status === undefined && action === undefined) {
        return NextResponse.json(
          { error: 'Either delivery_date, booking_status, or action is required' },
          { status: 400 }
        );
      }

      let query = 'UPDATE buy_product SET updated_at = NOW()';
      const params: any[] = [];

      if (delivery_date) {
        query += ', delivery_date = ?';
        params.push(delivery_date);
      }

      if (booking_status) {
        query += ', booking_status = ?';
        params.push(booking_status);
      }

      if (action !== undefined) {
        query += ', action = ?';
        params.push(action);
      }

      query += ' WHERE order_id = ? AND dealer_id = ?';
      params.push(order_id, businessBrandId);

      const [result] = await executeQuery(query, params);

      const updateResult = result as any;

      if (!updateResult || updateResult.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Order not found or unauthorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Order updated successfully'
      });
    } else if (o_id) {
      if (company_total_payment === undefined && company_due === undefined) {
        return NextResponse.json(
          { error: 'company_total_payment or company_due is required' },
          { status: 400 }
        );
      }

      let query = 'UPDATE `bought-product` SET updated_at = NOW()';
      const params: any[] = [];

      if (company_total_payment !== undefined) {
        query += ', company_total_payment = ?';
        params.push(company_total_payment);
      }
      if (company_due !== undefined) {
        query += ', company_due = ?';
        params.push(company_due);
      }

      query += ' WHERE o_id = ?';
      params.push(o_id);

      await executeQuery(query, params);

      return NextResponse.json({ message: 'Group payment details updated successfully' });
    } else {
      return NextResponse.json({ error: 'Order ID or Group ID (o_id) is required' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
