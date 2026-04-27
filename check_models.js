import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('Testing gemini-1.5-flash...');
    const result = await model.generateContent('Hi');
    console.log('Success with gemini-1.5-flash!');
  } catch (e) {
    console.error('Failed with gemini-1.5-flash:', e.message);
    
    console.log('Trying gemini-1.5-flash-latest...');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
      await model.generateContent('Hi');
      console.log('Success with gemini-1.5-flash-latest!');
    } catch (e2) {
      console.error('Failed with gemini-1.5-flash-latest:', e2.message);
    }
  }
}

listModels();
