import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  console.log('Netlify Function: parse-statement started');
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Dynamic imports to prevent crash during cold start
    const { default: parser } = await import('lambda-multipart-parser');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    console.log('Parsing multipart body...');
    const result = await (parser as any).parse(event);
    
    if (!result.files || result.files.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No file found' }) };
    }

    const file = result.files[0];
    const fileName = file.filename;
    const isCSV = fileName.toLowerCase().endsWith('.csv');
    let text = '';

    if (isCSV) {
      text = file.content.toString('utf-8');
    } else {
      console.log('Importing pdf-parse...');
      const { default: pdf } = await import('pdf-parse');
      const data = await (pdf as any)(file.content);
      text = data.text;
    }

    if (!text || text.trim().length === 0) {
      return { statusCode: 422, body: JSON.stringify({ error: 'Empty file text' }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'GEMINI_API_KEY missing in Netlify' }) };
    }

    console.log('Initializing Gemini...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    
    const prompt = `Extract transactions from this text. Return JSON: { "transactions": [...] }. Text: ${text.substring(0, 30000)}`;
    const aiResult = await model.generateContent(prompt);
    const responseText = aiResult.response.text();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: responseText
    };
  } catch (error: any) {
    console.error('CRITICAL FUNCTION ERROR:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message || 'Function crashed' }) 
    };
  }
};
