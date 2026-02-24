const { executeQuery } = require('./src/lib/db');

async function checkManufacturerTable() {
  try {
    console.log('Checking manufacturer table data...\n');

    // Get all manufacturer records
    const [manufacturers] = await executeQuery('SELECT * FROM manufacturer LIMIT 10');

    console.log('Manufacturer table records:');
    console.log('==========================');

    if (manufacturers.length === 0) {
      console.log('No records found in manufacturer table');
      return;
    }

    manufacturers.forEach((manufacturer, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`dealer_id: ${manufacturer.dealer_id}`);
      console.log(`company_name: "${manufacturer.company_name}"`);
      console.log(`address: "${manufacturer.address}"`);
      console.log(`owner_name: "${manufacturer.owner_name}"`);
      console.log(`phone: "${manufacturer.phone}"`);
      console.log(`pan: "${manufacturer.pan}"`);
      console.log(`gstin: "${manufacturer.gstin}"`);
      console.log(`tan: "${manufacturer.tan}"`);
      console.log(`password_hash: "${manufacturer.password_hash}"`);

      // Check if required fields are filled
      const requiredFields = ['company_name', 'address', 'owner_name', 'phone', 'pan'];
      const missingFields = requiredFields.filter(field =>
        !manufacturer[field] || manufacturer[field].trim() === ''
      );

      if (missingFields.length === 0) {
        console.log('✅ All required fields are filled');
      } else {
        console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      }
    });

  } catch (error) {
    console.error('Error checking manufacturer table:', error);
  }
}

checkManufacturerTable();
