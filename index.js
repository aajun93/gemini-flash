import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GEMINI_MODEL = 'gemini-2.5-flash';

const formatText = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```/g, '').trim();
      return `<pre><code>${code}</code></pre>`;
    })
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .split('\n')
    .map((line) => {
      if (line.startsWith('###')) return `<h3>${line.replace(/^###\s/, '')}</h3>`;
      if (line.startsWith('##')) return `<h2>${line.replace(/^##\s/, '')}</h2>`;
      if (line.startsWith('#')) return `<h1>${line.replace(/^#\s/, '')}</h1>`;
      if (line.match(/^-\s/) || line.match(/^\*\s/)) return `<li>${line.replace(/^[-*]\s/, '')}</li>`;
      return line;
    })
    .join('\n')
    .replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>')
    .replace(/<ul><ul>/g, '<ul>')
    .replace(/<\/ul><\/ul>/g, '</ul>');
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt
    });

    const formattedResult = formatText(response.text);
    res.status(200).json({ result: formattedResult });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  const { prompt } = req.body;
  const base64Image = req.file.buffer.toString('base64');

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt, type: 'text' },
        { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
      ]
    });

    const formattedResult = formatText(response.text);
    res.status(200).json({ result: formattedResult });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  const { prompt } = req.body;
  const base64Document = req.file.buffer.toString('base64');

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt, type: 'text' },
        { inlineData: { data: base64Document, mimeType: req.file.mimetype } }
      ]
    });

    const formattedResult = formatText(response.text);
    res.status(200).json({ result: formattedResult });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  const { prompt } = req.body;
  const base64Audio = req.file.buffer.toString('base64');

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt, type: 'text' },
        { inlineData: { data: base64Audio, mimeType: req.file.mimetype } }
      ]
    });

    const formattedResult = formatText(response.text);
    res.status(200).json({ result: formattedResult });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;

  try {
    if (!Array.isArray(conversation)) {
      throw new Error('Messages must be an array');
    }

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents
    });

    const formattedResult = formatText(response.text);
    res.status(200).json({ result: formattedResult });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ready on http://localhost:${PORT}`);
});