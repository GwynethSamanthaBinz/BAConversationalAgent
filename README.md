# BAConversationalAgent

informationen 

Architektur steht:
Frontend → Netlify
Backend → Render
Datenbank → Supabase
LLM → SAIA API

## Lokale Entwicklung

### Voraussetzungen
- Node.js installiert
- `.env` Datei im Projektordner mit allen Keys (siehe `.env.example`)

### Server starten
```bash
cd BAConversationalAgent
npm install        # nur beim ersten Mal oder nach neuen Paketen
node server.js     # Server starten
```
App läuft dann auf: http://localhost:3000

### Server stoppen
Strg+C im Terminal

---
## Workflow: Feature Branch

1. In VSCode neuen Branch erstellen 
2. Änderungen machen & lokal testen:
   - `node server.js` starten
   - Browser: `http://localhost:3000`
   - API-Anfragen gehen automatisch zu Render (kein lokales LLM nötig)
3. Fertig → commit & push
4. In `main` mergen → Netlify deployed automatisch

---

## Live-URLs
- **Frontend:** https://ba-conversational-agent.netlify.app
- **Backend:** https://baconversationalagent.onrender.com

---

## Debugging
| Problem | Wo nachschauen |
|---|---|
| Server-Fehler | Terminal wo `node server.js` läuft |
| Frontend-Fehler | Browser F12 → Console |
| API Key abgelaufen (401) | https://saia.gwdg.de/dashboard |
| Render schläft (erste Anfrage langsam) | Einmal vorher manuell aufrufen |

---

## Wichtige Dateien
- `.env` → API Keys (nicht auf GitHub, nicht committen!)
- `config.js` → Frontend-Konfiguration (Render-URL)
- `server.js` → Backend-Server