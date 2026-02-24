async function testProfileAPI() {
  try {
    console.log('Testing profile API...\n');

    // Test with a businessBrand user (assuming user_id 1 exists)
    const response = await fetch('http://localhost:3001/api/businessBrand/profile', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    console.log('Profile API Response:');
    console.log('====================');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));

    if (data.businessBrand) {
      console.log('\nBusiness Brand Data:');
      console.log('===================');
      console.log(`user_id: ${data.businessBrand.user_id}`);
      console.log(`company_name: "${data.businessBrand.company_name}"`);
      console.log(`address: "${data.businessBrand.address}"`);
      console.log(`owner_name: "${data.businessBrand.owner_name}"`);
      console.log(`phone: "${data.businessBrand.phone}"`);
      console.log(`pan: "${data.businessBrand.pan}"`);
      console.log(`gstin: "${data.businessBrand.gstin}"`);
      console.log(`tan: "${data.businessBrand.tan}"`);

      // Check required fields
      const { company_name, address, owner_name, phone, pan } = data.businessBrand;
      const requiredFields = { company_name, address, owner_name, phone, pan };

      console.log('\nRequired Fields Check:');
      console.log('======================');
      let allFilled = true;

      Object.entries(requiredFields).forEach(([field, value]) => {
        const isFilled = value && value.trim() !== '';
        console.log(`${field}: "${value}" - ${isFilled ? '✅' : '❌'}`);
        if (!isFilled) allFilled = false;
      });

      console.log(`\nAll required fields filled: ${allFilled ? '✅ YES' : '❌ NO'}`);

      if (!allFilled) {
        console.log('\nModal should be VISIBLE');
      } else {
        console.log('\nModal should be HIDDEN');
      }
    } else {
      console.log('No businessBrand data in response');
    }

  } catch (error) {
    console.error('Error testing profile API:', error);
  }
}

testProfileAPI();
