import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testV1() {
  // Try to force v1
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  
  // Actually, let's just try to list models to see what we CAN see
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log('Available models:', data.models?.map(m => m.name));
  } catch (e) {
    console.error('Failed to list models:', e.message);
  }
}

testV1();
