const axios = require('axios');

// Replace with your actual API URL and token
const API_URL = 'http://localhost:3000/v1';
const TOKEN = 'YOUR_AUTH_TOKEN'; // Replace with a valid token

async function testCreateCampaign() {
  try {
    const response = await axios.post(
      `${API_URL}/campaigns`,
      {
        title: 'Summer Sale Campaign',
        isActive: 'YES',
        promotionId: 1,
        productIds: [1, 2, 3],
        marketplaces: ['US', 'CA', 'GB'],
        claims: 0,
        companyId: 1
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testCreateCampaign();
