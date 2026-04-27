import { Handler } from '@netlify/functions';
import * as pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import busboy from 'busboy';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handler: Handler = async (event) => {
  console.log('Netlify Function: parse-statement started');
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing Content-Type header' }) };
    }

    console.log('Parsing multipart data...');
    const { fileBuffer, fileName } = await new Promise<{fileBuffer: Buffer | null, fileName: string}>((resolve, reject) => {
      const bb = busboy({ headers: event.headers });
      let buffer: Buffer | null = null;
      let name = '';

      bb.on('file', (fieldname, file, info) => {
        const { filename } = info;
        name = filename;
        const chunks: any[] = [];
        file.on('data', (data) => chunks.push(data));
        file.on('end', () => {
          buffer = Buffer.concat(chunks);
        });
      });

      bb.on('finish', () => resolve({ fileBuffer: buffer, fileName: name }));
      bb.on('error', (err) => reject(err));

      const body = event.isBase64Encoded ? Buffer.from(event.body!, 'base64') : Buffer.from(event.body!);
      bb.end(body);
    });

    if (!fileBuffer) {
      console.error('No file buffer found after parsing');
      return { statusCode: 400, body: JSON.stringify({ error: 'No file found in the request' }) };
    }

    console.log(`Processing file: ${fileName}, size: ${fileBuffer.length} bytes`);

    let text = '';
    const isCSV = fileName.toLowerCase().endsWith('.csv');

    if (isCSV) {
      text = fileBuffer.toString('utf-8');
    } else {
      console.log('Parsing PDF text...');
      const pdfParser = (pdf as any).default || (pdf as any).PDFParse || pdf;
      const data = await pdfParser(fileBuffer);
      text = data.text;
    }

    if (!text || text.trim().length === 0) {
      return { statusCode: 422, body: JSON.stringify({ error: 'Selected file has no readable text.' }) };
    }

    console.log('Calling Gemini AI...');
    if (!process.env.GEMINI_API_KEY) {
       return { statusCode: 500, body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured in Netlify' }) };
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    
    const prompt = `
      Extract transaction records from this ${isCSV ? 'CSV' : 'PDF'} bank statement.
      Return ONLY a JSON object with a key "transactions" which is an array of objects.
      Each object MUST have: date (YYYY-MM-DD), merchant, amount (number), type (debit/credit), category, and originalText.
      Categories: [Food, Transport, Shopping, Bills, Entertainment, Health, Investment, Income, Others]
      Text: ${text.substring(0, 30000)}
    `;

    const aiResult = await model.generateContent(prompt);
    const response = await aiResult.response;
    const transactions = JSON.parse(response.text()).transactions || [];

    console.log(`Successfully parsed ${transactions.length} transactions`);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions })
    };
  } catch (error: any) {
    console.error('Netlify Function Error:', error);
    return { 
      statusCode: 500, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }) 
    };
  }
};
