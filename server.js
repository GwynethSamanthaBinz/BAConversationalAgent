// ─────────────────────────────────────────────────────────────
// Backend-Server für den Conversational Agent
//
// DATENFLUSS:
//   Browser → POST /api/chat → server.js → SAIA API → Antwort zurück
//
// LOKAL STARTEN:
//   node server.js  (oder: npm start)
// ─────────────────────────────────────────────────────────────

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// Lädt den aktiven Systemprompt aus Supabase
async function loadActiveSystemPrompt() {
  const { data, error } = await supabase
    .from("scenarios")
    .select("id, system_prompt")
    .eq("active", true)
    .single();
  if (error || !data) return null;
  return data;
}

// Speichert den Chatverlauf in Supabase
async function saveConversation(sessionId, scenarioId, messages) {
  await supabase.from("conversations").insert({
    session_id: sessionId,
    scenario_id: scenarioId,
    messages: messages,
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ── Hilfsfunktionen ────────────────────────────────────────────

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

// ── Haupt-Endpunkt ─────────────────────────────────────────────

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
    const reply = extractReply(data);

    const scenario = await loadActiveSystemPrompt();
    await saveConversation(
      req.body.sessionId ?? "anonymous",
      scenario?.id ?? null,
      messages
    );

    res.json({ reply });

  } catch (error) {
    console.error("Fehler beim API-Aufruf:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/scenario", async (req, res) => {
  const scenario = await loadActiveSystemPrompt();
  if (!scenario) return res.status(404).json({ error: "Kein aktives Szenario" });
  res.json(scenario);
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});