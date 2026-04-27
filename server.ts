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
  app.use(express.json());

  app.post('/api/parse-statement', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      let text = '';
      const isCSV = req.file.originalname.toLowerCase().endsWith('.csv') || req.file.mimetype === 'text/csv';

      if (isCSV) {
        text = req.file.buffer.toString('utf-8');
      } else {
        const pdfParser = (pdf as any).default || (pdf as any).PDFParse || pdf;
        const data = await pdfParser(req.file.buffer);
        text = data.text;
      }

      if (!text || text.trim().length === 0) {
        return res.status(422).json({ error: 'No readable text found' });
      }

      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = `
        You are an expert financial analyst. Extract ALL transactions from this ${isCSV ? 'CSV' : 'PDF'} text.
        Return JSON: { "transactions": [...] }
        Each object: { date: "YYYY-MM-DD", merchant: string, amount: number, type: "debit"|"credit", category: string, originalText: string }
        Categories: [Food, Transport, Shopping, Bills, Entertainment, Health, Investment, Income, Others]
        Text: ${text.substring(0, 30000)}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (error) {
      console.error('Parse Error:', error);
      res.status(500).json({ error: 'Failed to parse statement' });
    }
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const { transactions } = req.body;
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Analyze these transactions and provide 3 insights, 1 prediction, and a health score (0-100) in JSON: { insights: string[], prediction: string, healthScore: number }. Data: ${JSON.stringify(transactions)}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let jsonStr = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      res.json(JSON.parse(jsonStr));
    } catch (error) {
      res.status(500).json({ error: 'Failed to analyze' });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { prompt, context } = req.body;
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const fullPrompt = `You are Synesis AI. Context: ${context}. Question: ${prompt}`;
      const result = await model.generateContent(fullPrompt);
      res.json({ response: (await result.response).text() });
    } catch (error) {
      res.status(500).json({ error: 'Chat failed' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
