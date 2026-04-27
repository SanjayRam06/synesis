import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { default: parser } = await import('lambda-multipart-parser');
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
      const { default: pdf } = await import('pdf-parse');
      const data = await (pdf as any)(file.content);
      text = data.text;
    }

    if (!text || text.trim().length === 0) {
      return { statusCode: 422, body: JSON.stringify({ error: 'File is empty' }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash-lite',
          generationConfig: { responseMimeType: 'application/json' }
        });
        
        const prompt = `Extract transactions from this text. 
        Categories: [Online Shopping, Bills & Recharges, Peer-to-Peer, Food & Dining, Travel, Health & Wellness, Entertainment, Investments, Others, Income]
        Return JSON: { "transactions": [...] }. Text: ${text.substring(0, 20000)}`;
        
        const aiResult = await model.generateContent(prompt);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: aiResult.response.text()
        };
      } catch (aiError: any) {
        console.error('Gemini AI Error:', aiError.message);
      }
    }

    // Fallback Mock Logic with new categories
    let transactions = [];
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
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions })
    };

  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
