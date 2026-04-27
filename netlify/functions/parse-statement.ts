import { Handler } from '@netlify/functions';
import * as pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import parser from 'lambda-multipart-parser';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('Function started. Parsing multipart body...');
    const result = await parser.parse(event);
    
    if (!result.files || result.files.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No file found in request' }) };
    }

    const file = result.files[0];
    const fileBuffer = file.content;
    const fileName = file.filename;

    console.log(`File received: ${fileName}, size: ${fileBuffer.length} bytes`);

    let text = '';
    const isCSV = fileName.toLowerCase().endsWith('.csv');

    if (isCSV) {
      text = fileBuffer.toString('utf-8');
    } else {
      console.log('Parsing PDF...');
      const pdfParser = (pdf as any).default || (pdf as any).PDFParse || pdf;
      const data = await pdfParser(fileBuffer);
      text = data.text;
    }

    if (!text || text.trim().length === 0) {
      return { statusCode: 422, body: JSON.stringify({ error: 'Could not read any text from the file.' }) };
    }

    if (!process.env.GEMINI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'GEMINI_API_KEY is not set in Netlify Environment Variables.' }) };
    }

    console.log('Calling Gemini...');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    
    const prompt = `Extract all transactions from this bank statement text. Return JSON: { "transactions": [...] }. Each object: { date: "YYYY-MM-DD", merchant: string, amount: number, type: "debit"|"credit", category: string, originalText: string }. Text: ${text.substring(0, 30000)}`;

    const aiResult = await model.generateContent(prompt);
    const response = await aiResult.response;
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: response.text()
    };
  } catch (error: any) {
    console.error('Function Crash:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }) 
    };
  }
};
