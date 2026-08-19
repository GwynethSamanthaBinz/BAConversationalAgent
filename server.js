import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { SYSTEM_PROMPT } from "./system_prompt.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function buildSaiaRequest(messages) {
  return {
    url: "https://chat-ai.academiccloud.de/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SAIA_API_KEY}`,
    },
    body: {
      model: process.env.SAIA_MODEL || "qwen2.5-72b-instruct",
      messages,
    },
  };
}

function extractReply(data) {
  return data.choices?.[0]?.message?.content ?? "(Keine Antwort)";
}

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages fehlt oder ist kein Array" });
  }

  const request = buildSaiaRequest(messages);

  try {
    const response = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(request.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Fehler:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json({ reply: extractReply(data) });

  } catch (error) {
    console.error("Fehler beim API-Aufruf:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/scenario", (req, res) => {
  res.json({ system_prompt: SYSTEM_PROMPT });
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
