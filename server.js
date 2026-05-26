// ─────────────────────────────────────────────────────────────
// Backend-Server für den Conversational Agent
//
// WARUM dieser Server existiert:
//   Das Frontend (index.html + app.js) läuft im Browser.
//   Der Browser darf aus Sicherheitsgründen keine API-Keys
//   enthalten — jeder könnte sie auslesen (Rechtsklick → Inspect).
//   Dieser Server liegt "in der Mitte" und hält den Key geheim.
//
// DATENFLUSS:
//   Browser → POST /api/chat → server.js → Groq API → Antwort zurück
//
// LOKAL STARTEN:
//   node server.js
//   (oder: npm start)
//
// PHASE 1 – Ollama (aktuell):
//   Noch nicht nötig. Frontend spricht direkt mit Ollama.
//   Wenn du bereit für Phase 2 bist, .env ausfüllen und hier starten.
//
// PHASE 2 – Groq (Studententest):
//   1. GROQ_API_KEY in .env eintragen
//   2. SERVER_MODE=groq in .env setzen
//   3. In config.js → apiUrl auf "http://localhost:3000/api/chat" ändern
//   4. Auf Server deployen (Railway, Render, etc.)
// ─────────────────────────────────────────────────────────────

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ZUERST dotenv laden!
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

// Erlaubt Anfragen vom Browser (CORS)
// In Produktion kannst du hier die genaue URL deiner App eintragen
// z.B.: cors({ origin: "https://deine-app.railway.app" })
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ── Hilfsfunktionen je nach Modus ──────────────────────────────

// Baut den Request für Groq zusammen
// Groq nutzt das OpenAI-kompatible Format
function buildGroqRequest(messages) {
  return {
    url: "https://api.groq.com/openai/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      // Der API-Key kommt aus .env — niemals direkt hier reinschreiben!
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: {
      model: process.env.GROQ_MODEL || "llama3-8b-8192",
      messages,
    },
  };
}

// Baut den Request für Ollama zusammen (lokales Modell)
function buildOllamaRequest(messages) {
  return {
    url: process.env.OLLAMA_URL || "http://localhost:11434/api/chat",
    headers: { "Content-Type": "application/json" },
    body: {
      model: process.env.OLLAMA_MODEL || "llama3.2",
      messages,
      stream: false,
    },
  };
}

// Liest die Antwort je nach API-Format aus
// Groq und Ollama liefern leicht unterschiedliche JSON-Strukturen
function extractReply(data, mode) {
  if (mode === "groq") {
    return data.choices?.[0]?.message?.content ?? "(Keine Antwort)";
  }
  return data.message?.content ?? "(Keine Antwort)";
}

// ── Haupt-Endpunkt ──────────────────────────────────────────────

// Das Frontend schickt hier seine Nachrichten hin
// Body: { messages: [ { role, content }, ... ] }
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages fehlt oder ist kein Array" });
  }

  // Modus aus .env lesen — "groq" oder "ollama" (Standard: ollama)
  const mode = process.env.SERVER_MODE || "ollama";
  const request = mode === "groq"
    ? buildGroqRequest(messages)
    : buildOllamaRequest(messages);

  try {
    const response = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(request.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    const reply = extractReply(data, mode);

    // Chatverlauf in Supabase speichern
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
  const mode = process.env.SERVER_MODE || "ollama";
  console.log(`Server läuft auf http://localhost:${PORT}`);
  console.log(`Modus: ${mode.toUpperCase()}`);
});

