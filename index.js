import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import { connect } from 'http2';
import { resourceLimits } from 'worker_threads';

const app = express ();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY});

const GEMINI_MODEL = "gemini-2.5-flash";

app.use(express.json());

app.post('/generate-text', async (req, res) => {
    const {prompt} = req.body;
    
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });

        res.status(200).json({result: response.text});
    }   catch (e) {
        console.log (e);
        res.status(500).json({message: e.message});
    }
});

app.post('/generate-from-image',upload.single('image'), async (req, res)=>{
    const {prompt} = req.body;
    const base64Image = req.file.buffer.toString('base64');

    try {
        const response = await ai.models.generateContent({
            model:GEMINI_MODEL,
            contents: [
                {text: prompt, type: "text"},
                {inlineData:{data:base64Image, mimeType: req.file.mimetype}}
            ],
        });

        res.status(200).json({result:response.text});
    } catch (e) {
        console.log(e);
        res.status(500).json({message: e.message})
    }
});

app.post('/generate-from-document', upload.single("document"), async(req, res) => {
    const {prompt} = req.body;
    const base64Document = req.file.buffer.toString('base64');

    try {
        const response = await ai.models.generateContent({
            model : GEMINI_MODEL,
            contents: [
                {text: prompt, type: "text"},
                {inlineData:{data:base64Document, mimeType: req.file.mimetype}}
            ],
        });

        res.status(200).json({result:response.text});
    } catch (e) {
        console.log(e);
        res.status(500).json({message: e.message})
    }
});

app.post('/generate-from-audio',upload.single('audio'), async (req, res)=>{
    const {prompt} = req.body;
    const base64Audio = req.file.buffer.toString('base64');

    try {
        const response = await ai.models.generateContent({
            model:GEMINI_MODEL,
            contents: [
                {text: prompt, type: "text"},
                {inlineData:{data:base64Audio, mimeType: req.file.mimetype}}
            ],
        });

        res.status(200).json({result:response.text});
    } catch (e) {
        console.log(e);
        res.status(500).json({message: e.message})
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log('Server ready  on http://localhost:${PORT}'));