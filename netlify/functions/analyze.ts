import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { transactions } = JSON.parse(event.body || '{}');
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        const result = await model.generateContent(`Analyze these transactions: ${JSON.stringify(transactions)}. Provide insights, prediction, healthScore in JSON.`);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: result.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
        };
      } catch (e) {
        console.error('Analyze AI Error:', e);
      }
    }

    // Fallback Mock Insights
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        insights: ["Focus on reducing food delivery", "Good saving on transport", "Consider investing surplus"],
        prediction: "Stable spending next month",
        healthScore: 80
      })
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
