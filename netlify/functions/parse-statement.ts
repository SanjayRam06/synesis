import { Handler } from '@netlify/functions';
import * as pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import busboy from 'busboy';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid content type' }) };
    }

    // Parse multipart form data
    const result: any = await new Promise((resolve, reject) => {
      const bb = busboy({ headers: event.headers });
      let fileBuffer: Buffer | null = null;
      let fileName = '';

      bb.on('file', (name, file, info) => {
        const { filename } = info;
        fileName = filename;
        const chunks: any[] = [];
        file.on('data', (data) => chunks.push(data));
        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      bb.on('finish', () => {
        resolve({ fileBuffer, fileName });
      });

      bb.on('error', (err) => reject(err));
      
      // Use event.isBase64Encoded to decode body
      const body = event.isBase64Encoded ? Buffer.from(event.body!, 'base64') : Buffer.from(event.body!);
      bb.end(body);
    });

    const { fileBuffer, fileName } = result;

    if (!fileBuffer) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No file uploaded' }) };
    }

    let text = '';
    const isCSV = fileName.toLowerCase().endsWith('.csv');

    if (isCSV) {
      text = fileBuffer.toString('utf-8');
    } else {
      const pdfParser = (pdf as any).default || (pdf as any).PDFParse || pdf;
      const data = await pdfParser(fileBuffer);
      text = data.text;
    }

    if (!text || text.trim().length === 0) {
      return { statusCode: 422, body: JSON.stringify({ error: 'No readable text found' }) };
    }

    // Mock logic if no API key (consistent with server.ts)
    let transactions = [];
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('REPLACE_WITH_YOUR_GEMINI_API_KEY')) {
      if (isCSV) {
        const lines = text.split('\n').filter(l => l.trim().length > 0).slice(1);
        transactions = lines.map(line => {
          const parts = line.split(',');
          return {
            date: (parts[0] || '').trim(),
            merchant: (parts[1] || '').trim(),
            amount: parseFloat(parts[2]) || 0,
            type: (parts[3] || 'debit').trim().toLowerCase(),
            category: 'Others',
            originalText: line.substring(0, 50)
          };
        });
      } else {
        transactions = [{ date: '2026-04-01', merchant: 'Mock Grocery', amount: 50, type: 'debit', category: 'Shopping', originalText: 'Mock PDF' }];
      }
    } else {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });
      const prompt = `Extract transactions from this text (JSON format): ${text.substring(0, 30000)}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      transactions = JSON.parse(response.text()).transactions || [];
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions })
    };
  } catch (error: any) {
    console.error('Function error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
