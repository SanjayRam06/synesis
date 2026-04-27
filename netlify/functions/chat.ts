import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { prompt, context } = JSON.parse(event.body || '{}');

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('REPLACE_WITH_YOUR_GEMINI_API_KEY')) {
      return {
        statusCode: 200,
        body: JSON.stringify({ response: "I'm Synesis AI. (Mock Mode: Configure API key for real help)." })
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const fullPrompt = `You are Synesis AI. Context: ${context}. Question: ${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: response.text() })
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
