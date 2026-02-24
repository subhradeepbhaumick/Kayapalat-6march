async function testOrdersAPI() {
  try {
    console.log('Testing orders API...\n');

    // Test with a businessBrand user (assuming user_id 1 exists and has orders)
    const response = await fetch('http://localhost:3001/api/businessBrand/orders', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    console.log('Orders API Response:');
    console.log('===================');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));

    if (data.orders) {
      console.log('\nOrders Data:');
      console.log('============');
      console.log(`Number of orders: ${data.orders.length}`);

      if (data.orders.length > 0) {
        console.log('\nFirst order details:');
        const firstOrder = data.orders[0];
        console.log(`Order ID: ${firstOrder.order_id}`);
        console.log(`Product Name: ${firstOrder.product_name}`);
        console.log(`Company Name: ${firstOrder.company_name}`);
        console.log(`Quantity: ${firstOrder.quantity}`);
        console.log(`Final Product Cost: ${firstOrder.final_product_cost}`);
        console.log(`Booking Status: ${firstOrder.booking_status}`);
        console.log(`Created At: ${firstOrder.created_at}`);
      } else {
        console.log('No orders found for this user.');
      }
    } else {
      console.log('No orders data in response');
    }

  } catch (error) {
    console.error('Error testing orders API:', error);
  }
}

testOrdersAPI();
