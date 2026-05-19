import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
import admin from 'firebase-admin';

dotenv.config();

// Attempt to initialize Firebase Admin
try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      // Decode Base64 service account from environment on platforms like Render
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Fallback to Application Default Credentials (used in AI Studio preview)
      admin.initializeApp();
    }
  }
} catch (error) {
  console.warn("Could not initialize Firebase Admin:", error);
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key is not configured" });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audio: base64Audio });
      } else {
        res.status(500).json({ error: "No audio generated" });
      }
    } catch (e: any) {
      console.error("TTS Error:", e);
      res.status(500).json({ error: e.message || "Failed to generate speech" });
    }
  });

  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { contents, config, systemInstruction, model } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: model || 'gemini-3-flash-preview',
        contents,
        config,
        systemInstruction
      });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error("AI Gen Error:", e);
      res.status(500).json({ error: e.message || "Failed to generate AI response" });
    }
  });

  app.post("/api/exams/submit", async (req, res) => {
    try {
      const { examId, userId, answers } = req.body;
      if (!examId || !userId || !answers) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!admin.apps.length) {
         // Fallback if Admin not initialized: basic grade (not secure, but prevents crashing)
         return res.json({ score: 0, message: "Admin SDK not initialized. Local grading disabled." });
      }

      const db = admin.firestore();
      
      // Fetch the exam and its secure answer key
      const examDoc = await db.collection("exams").doc(examId).get();
      if (!examDoc.exists) {
        return res.status(404).json({ error: "Exam not found" });
      }

      const keyDoc = await db.collection("exam_keys").doc(examId).get();
      if (!keyDoc.exists) {
        return res.status(404).json({ error: "Answer key not found" });
      }

      const examData = examDoc.data()!;
      const keyData = keyDoc.data()!;
      const correctAnswers = keyData.answers; // array of numbers/strings

      let score = 0;
      const totalQuestions = examData.questions || 1;
      const marksPerQ = (examData.marks || 100) / totalQuestions;
      const negativeMarking = examData.negativeMarking || 0;

      correctAnswers.forEach((correctOpt: any, idx: number) => {
         if (answers[idx] !== undefined) {
            if (answers[idx] === correctOpt) {
               score += marksPerQ;
            } else {
               score -= negativeMarking;
            }
         }
      });

      const finalScore = Math.max(0, score).toFixed(2);

      // Save submission
      await db.collection("exam_participants").add({
        user_id: userId,
        exam_id: examId,
        title: examData.title,
        type: examData.type,
        score: finalScore,
        rank: 'Evaluated',
        submitted_at: admin.firestore.FieldValue.serverTimestamp(),
        date: new Date().toISOString()
      });

      // Update participants count
      await examDoc.ref.update({
        participants: admin.firestore.FieldValue.increment(1)
      });

      res.json({ score: finalScore });
    } catch (e: any) {
      console.error("Exam Submit Error:", e);
      res.status(500).json({ error: e.message || "Failed to submit exam" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
