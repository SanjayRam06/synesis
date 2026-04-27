import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { transactions } = JSON.parse(event.body || '{}');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze these transactions and provide 3 insights, 1 prediction, and a health score (0-100) in JSON: { insights: string[], prediction: string, healthScore: number }. Data: ${JSON.stringify(transactions)}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: response.text().replace(/```json/g, '').replace(/```/g, '').trim()
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
