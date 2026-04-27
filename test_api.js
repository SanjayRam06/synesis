import fs from 'fs';
import path from 'path';

async function testApi() {
  const filePath = path.join(process.cwd(), 'new_transactions.csv');
  const fileContent = fs.readFileSync(filePath);
  
  const formData = new FormData();
  const blob = new Blob([fileContent], { type: 'text/csv' });
  formData.append('file', blob, 'new_transactions.csv');

  console.log('Sending request to /api/parse-statement...');
  try {
    const response = await fetch('http://localhost:3000/api/parse-statement', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.ok && data.transactions && data.transactions.length > 0) {
      console.log('SUCCESS: Transactions parsed correctly.');
    } else {
      console.error('FAILURE: Transactions not parsed or error returned.');
    }
  } catch (error) {
    console.error('Error during API test:', error);
  }
}

testApi();
