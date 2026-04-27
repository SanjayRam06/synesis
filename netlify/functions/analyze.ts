import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { transactions } = JSON.parse(event.body || '{}');

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('REPLACE_WITH_YOUR_GEMINI_API_KEY')) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          insights: ["Spend less on coffee", "Save more for rent", "Investment potential found"],
          prediction: "Next month's spending looks stable",
          healthScore: 75
        })
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze these transactions and provide 3 insights, a prediction, and a health score (0-100) in JSON: ${JSON.stringify(transactions)}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonStr = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: jsonStr
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
