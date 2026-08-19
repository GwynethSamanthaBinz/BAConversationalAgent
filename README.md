# BAConversationalAgent

informationen 

Architektur 
Frontend: HTML, CSS (Tailwind), JS → Netlify
Backend: Node.js / Express → Render
Datenbank: Supabase
LLM: Qwen3.6-35b-a3b über SAIA Academic Cloud API

## Lokale Entwicklung

### Voraussetzungen
- Node.js installiert
- `.env` Datei im Projektordner mit den Keys (SAIA_API_KEY, SAIA_MODEL, SERVER_MODE)

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

---

## Alternative Darstellung: Roboter-Avatar (SVG)

Der folgende SVG-Code kann in `index.html` innerhalb von `<div id="robot-avatar">` eingesetzt werden (aktuell auskommentiert):

```html
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(0, 10)">
    <line x1="50" y1="4" x2="50" y2="17" stroke="#d1d5db" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="50" cy="4" r="4" fill="#f97316"/>
    <rect x="14" y="17" width="72" height="54" rx="16" fill="#f3f4f6"/>
    <rect x="14" y="17" width="72" height="54" rx="16" fill="none" stroke="#e5e7eb" stroke-width="1.5"/>
    <rect x="6"  y="30" width="8" height="14" rx="4" fill="#d1d5db"/>
    <rect x="86" y="30" width="8" height="14" rx="4" fill="#d1d5db"/>
    <circle cx="34" cy="37" r="11" fill="white"/>
    <circle cx="66" cy="37" r="11" fill="white"/>
    <g class="robot-eye">
      <circle cx="34" cy="37" r="7" fill="#f97316"/>
      <circle cx="36" cy="35" r="2.5" fill="white" opacity="0.8"/>
      <circle cx="34" cy="37" r="3" fill="#c2410c"/>
    </g>
    <g class="robot-eye">
      <circle cx="66" cy="37" r="7" fill="#f97316"/>
      <circle cx="68" cy="35" r="2.5" fill="white" opacity="0.8"/>
      <circle cx="66" cy="37" r="3" fill="#c2410c"/>
    </g>
    <rect x="30" y="52" width="40" height="9" rx="4.5" fill="#e5e7eb"/>
    <circle id="mouth-led-1" cx="38" cy="56.5" r="2.5" fill="#d1d5db"/>
    <circle id="mouth-led-2" cx="50" cy="56.5" r="2.5" fill="#d1d5db"/>
    <circle id="mouth-led-3" cx="62" cy="56.5" r="2.5" fill="#d1d5db"/>
  </g>
</svg>
```