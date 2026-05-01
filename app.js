// System-Prompt: definiert die Rolle und das Verhalten des CA
const SYSTEM_PROMPT =
  "Du bist ein Gesprächspartner in einem Konfliktgespräch. Reagiere ruhig, sachlich und verständnisvoll.";

// Gesprächsverlauf — wird bei jedem Senden vollständig an die API übergeben
const conversationHistory = [
  { role: "system", content: SYSTEM_PROMPT },
];

// DOM-Elemente
const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

// Fügt eine Chatblase in den Chat ein
// role: "user" oder "assistant"
function appendMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("flex", "mb-3");

  const bubble = document.createElement("div");
  bubble.classList.add(
    "max-w-xs", "lg:max-w-md", "px-4", "py-2", "rounded-2xl", "text-sm", "whitespace-pre-wrap"
  );

  if (role === "user") {
    wrapper.classList.add("justify-end");
    bubble.classList.add("bg-blue-500", "text-white", "rounded-br-sm");
  } else {
    wrapper.classList.add("justify-start");
    bubble.classList.add("bg-white", "text-gray-800", "rounded-bl-sm", "shadow-sm");
  }

  bubble.textContent = text;
  wrapper.appendChild(bubble);
  chatContainer.appendChild(wrapper);

  // Automatisch nach unten scrollen
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Zeigt einen Lade-Indikator während der CA antwortet
function appendTypingIndicator() {
  const wrapper = document.createElement("div");
  wrapper.id = "typing-indicator";
  wrapper.classList.add("flex", "mb-3", "justify-start");

  const bubble = document.createElement("div");
  bubble.classList.add(
    "bg-white", "text-gray-400", "px-4", "py-2", "rounded-2xl", "rounded-bl-sm",
    "text-sm", "shadow-sm", "italic"
  );
  bubble.textContent = "tippt…";

  wrapper.appendChild(bubble);
  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById("typing-indicator");
  if (indicator) indicator.remove();
}

// Sendet die Nutzernachricht an Ollama und zeigt die Antwort an
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // Eingabefeld leeren und Button sperren
  userInput.value = "";
  sendButton.disabled = true;

  // Nutzernachricht anzeigen und in den Verlauf aufnehmen
  appendMessage("user", text);
  conversationHistory.push({ role: "user", content: text });

  appendTypingIndicator();

  try {
    const response = await fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CONFIG.model,
        messages: conversationHistory,
        stream: false, // Antwort als ganzes Objekt, kein Streaming
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP-Fehler: ${response.status}`);
    }

    const data = await response.json();
    const assistantText = data.message?.content ?? "(Keine Antwort erhalten)";

    // Antwort in den Verlauf aufnehmen und anzeigen
    conversationHistory.push({ role: "assistant", content: assistantText });
    removeTypingIndicator();
    appendMessage("assistant", assistantText);
  } catch (error) {
    removeTypingIndicator();
    appendMessage("assistant", `Fehler: ${error.message}. Läuft Ollama lokal?`);
    console.error("Fehler beim API-Aufruf:", error);
  } finally {
    sendButton.disabled = false;
    userInput.focus();
  }
}

// Enter-Taste sendet die Nachricht (Shift+Enter für Zeilenumbruch)
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener("click", sendMessage);
