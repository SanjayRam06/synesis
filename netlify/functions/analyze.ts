import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { transactions } = JSON.parse(event.body || '{}');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API Key missing' }) };
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Analyze: ${JSON.stringify(transactions)}. Provide insights, prediction, healthScore in JSON.`;
    const result = await model.generateContent(prompt);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: result.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
