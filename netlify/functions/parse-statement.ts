import { Handler } from '@netlify/functions';
import * as pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import busboy from 'busboy';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid content type' }) };
    }

    const result: any = await new Promise((resolve, reject) => {
      const bb = busboy({ headers: event.headers });
      let fileBuffer: Buffer | null = null;
      let fileName = '';
      bb.on('file', (name, file, info) => {
        const { filename } = info;
        fileName = filename;
        const chunks: any[] = [];
        file.on('data', (data) => chunks.push(data));
        file.on('end', () => { fileBuffer = Buffer.concat(chunks); });
      });
      bb.on('finish', () => resolve({ fileBuffer, fileName }));
      bb.on('error', (err) => reject(err));
      const body = event.isBase64Encoded ? Buffer.from(event.body!, 'base64') : Buffer.from(event.body!);
      bb.end(body);
    });

    const { fileBuffer, fileName } = result;
    if (!fileBuffer) return { statusCode: 400, body: JSON.stringify({ error: 'No file uploaded' }) };

    let text = '';
    const isCSV = fileName.toLowerCase().endsWith('.csv');
    if (isCSV) {
      text = fileBuffer.toString('utf-8');
    } else {
      const pdfParser = (pdf as any).default || (pdf as any).PDFParse || pdf;
      const data = await pdfParser(fileBuffer);
      text = data.text;
    }

    if (!text || text.trim().length === 0) return { statusCode: 422, body: JSON.stringify({ error: 'No readable text' }) };

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });
    const prompt = `Extract ALL transactions from this text into JSON format: { "transactions": [...] }. Each object should have date (YYYY-MM-DD), merchant, amount, type (debit/credit), category, and originalText. Text: ${text.substring(0, 30000)}`;
    
    const aiResult = await model.generateContent(prompt);
    const response = await aiResult.response;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: response.text()
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
