import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import * as pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function startServer() {
  // API Routes
  app.use(express.json());

  app.post('/api/parse-statement', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      let text = '';
      const isCSV = req.file.originalname.toLowerCase().endsWith('.csv') || req.file.mimetype === 'text/csv';

      if (isCSV) {
        console.log('Processing CSV statement...');
        text = req.file.buffer.toString('utf-8');
      } else {
        console.log('Processing PDF statement...');
        // Robust check for the pdf function
        const pdfParser = (pdf as any).default || (pdf as any).PDFParse || pdf;
        let data;
        try {
          data = await pdfParser(req.file.buffer);
        } catch (err) {
          if (err instanceof TypeError && err.message.includes("cannot be invoked without 'new'")) {
            data = await new (pdfParser as any)(req.file.buffer);
          } else {
            throw err;
          }
        }
        text = data.text;
      }

      if (!text || text.trim().length === 0) {
        return res.status(422).json({ error: 'Selected file appears to have no readable text.' });
      }

      // Use Gemini to structure the data
      let transactions = [];
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('REPLACE_WITH_YOUR_GEMINI_API_KEY')) {
        console.log('Mocking Gemini response (No valid API key found)...');
        if (isCSV) {
          const lines = text.split('\n').filter(l => l.trim().length > 0).slice(1);
          transactions = lines.map(line => {
            const parts = line.split(',');
            return {
              date: (parts[0] || '').trim(),
              merchant: (parts[1] || '').trim(),
              amount: parseFloat(parts[2]) || 0,
              type: (parts[3] || 'debit').trim().toLowerCase() as 'debit' | 'credit',
              category: 'Others',
              originalText: line.substring(0, 50)
            };
          });
        } else {
          transactions = [
            { date: '2026-04-01', merchant: 'Mock Grocery', amount: 50, type: 'debit', category: 'Shopping', originalText: 'Mock PDF transaction' }
          ];
        }
      } else {
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });
        
        const prompt = `
          You are an expert financial data analyst. Extract ALL transaction records from the following bank statement / payment app statement text (PDF or CSV).
          Return ONLY a JSON object with a key "transactions" which is an array of objects.
          
          Each object MUST have:
          - date: ISO 8601 format (YYYY-MM-DD). If year is missing in text, assume 2026 based on statement header if available.
          - merchant: Cleaned vendor/payee name.
          - amount: Positive number.
          - type: String, either 'debit' or 'credit'.
          - category: One of [Food, Transport, Shopping, Bills, Entertainment, Health, Investment, Income, Others].
          - originalText: A 50-character snippet from the original line for verification.

          Special Instructions:
          - For App Statements (like PhonePe, GPay, Paytm):
            - "Received from [Name]" means type is 'credit'.
            - "Paid to [Name]" or "Transfer to [Name/VPA]" means type is 'debit'.
            - "Credited to [Account]" refers to the destination account, ignore as merchant name.
            - "UTR No" or "Transaction ID" labels should be skipped for merchant name choice.
          - Clean common prefixes like "UPI-", "POS-", "NEFT-", "IB-".

          Text to parse:
          ${text.substring(0, 30000)}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonResponse = JSON.parse(response.text());
        transactions = jsonResponse.transactions || [];
      }
      
      console.log(`Successfully parsed ${transactions.length} transactions.`);
      res.json({ transactions });
    } catch (error) {
      console.error('Statement Parse Error:', error);
      res.status(500).json({ error: 'Failed to parse statement' });
    }
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const { transactions } = req.body;
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('REPLACE_WITH_YOUR_GEMINI_API_KEY')) {
        return res.json({
          insights: ["Spend less on coffee", "Save more for rent", "Investment potential found"],
          prediction: "Next month's spending looks stable",
          healthScore: 75
        });
      }

      const prompt = `
        Analyze these financial transactions and provide:
        1. Three key spending insights.
        2. One prediction for next month's categories.
        3. A brief financial health score (0-100).
        Return as JSON: { insights: string[], prediction: string, healthScore: number }

        Transactions: ${JSON.stringify(transactions)}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let jsonStr = response.text();
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      res.json(JSON.parse(jsonStr));
    } catch (error) {
      console.error('Analyze Error:', error);
      res.status(500).json({ error: 'Failed to analyze' });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { prompt, context } = req.body;
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('REPLACE_WITH_YOUR_GEMINI_API_KEY')) {
        return res.json({ response: "I'm Synesis AI. (Mock Mode: Please configure your Gemini API key for real assistance)." });
      }

      const fullPrompt = `
        You are Synesis AI, a helpful financial assistant. 
        Answer the user's question based on their recent transactions provided in the context.
        Be concise, friendly, and accurate.
        
        Context:
        ${context}
        
        User Question: ${prompt}
      `;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      res.json({ response: response.text() });
    } catch (error) {
      console.error('Chat Error:', error);
      res.status(500).json({ error: 'Chat failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
