const SYSTEM_PROMPT =
  "Du bist ein Gesprächspartner in einem Konfliktgespräch. Reagiere ruhig, sachlich und verständnisvoll.";

const conversationHistory = [
  { role: "system", content: SYSTEM_PROMPT },
];

const chatContainer    = document.getElementById("chat-container");
const userInput        = document.getElementById("user-input");
const sendButton       = document.getElementById("send-button");
const characterStatus  = document.getElementById("character-status");
const robotAvatar      = document.getElementById("robot-avatar");
const mouthLeds        = [
  document.getElementById("mouth-led-1"),
  document.getElementById("mouth-led-2"),
  document.getElementById("mouth-led-3"),
];

// Roboter-Zustand: "idle" oder "speaking"
function setRobotState(state) {
  if (state === "speaking") {
    robotAvatar.classList.add("robot-speaking");
    characterStatus.textContent = "denkt nach …";
    mouthLeds.forEach(led => led.setAttribute("fill", "#f97316"));
  } else {
    robotAvatar.classList.remove("robot-speaking");
    characterStatus.textContent = "wartet auf dich …";
    mouthLeds.forEach(led => led.setAttribute("fill", "#d1d5db"));
  }
}

function appendMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("flex", "mb-3");

  const bubble = document.createElement("div");
  bubble.classList.add(
    "max-w-xs", "lg:max-w-md", "px-4", "py-2", "rounded-2xl", "text-sm", "whitespace-pre-wrap"
  );

  if (role === "user") {
    wrapper.classList.add("justify-end");
    bubble.classList.add("bg-orange-500", "text-white", "rounded-br-sm");
  } else {
    wrapper.classList.add("justify-start");
    bubble.classList.add("bg-white", "text-gray-800", "rounded-bl-sm", "shadow-sm", "border", "border-orange-100");
  }

  bubble.textContent = text;
  wrapper.appendChild(bubble);
  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendTypingIndicator() {
  const wrapper = document.createElement("div");
  wrapper.id = "typing-indicator";
  wrapper.classList.add("flex", "mb-3", "justify-start");

  const bubble = document.createElement("div");
  bubble.classList.add(
    "bg-white", "text-orange-400", "px-4", "py-2", "rounded-2xl", "rounded-bl-sm",
    "text-sm", "shadow-sm", "italic", "border", "border-orange-100"
  );
  bubble.textContent = "tippt …";

  wrapper.appendChild(bubble);
  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById("typing-indicator")?.remove();
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  userInput.style.height = "auto";
  sendButton.disabled = true;

  appendMessage("user", text);
  conversationHistory.push({ role: "user", content: text });

  setRobotState("speaking");
  appendTypingIndicator();

  try {
    const requestBody = CONFIG.useBackend
      ? { messages: conversationHistory }
      : { model: CONFIG.model, messages: conversationHistory, stream: false };

    const response = await fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`HTTP-Fehler: ${response.status}`);

    const data = await response.json();
    const assistantText = CONFIG.useBackend
      ? (data.reply ?? "(Keine Antwort erhalten)")
      : (data.message?.content ?? "(Keine Antwort erhalten)");

    conversationHistory.push({ role: "assistant", content: assistantText });
    removeTypingIndicator();
    appendMessage("assistant", assistantText);
  } catch (error) {
    removeTypingIndicator();
    const isCors = error instanceof TypeError && error.message.includes("fetch");
    const hint = isCors
      ? "CORS-Fehler: Starte Ollama mit OLLAMA_ORIGINS=\"*\" neu."
      : `Fehler: ${error.message}. Läuft Ollama lokal?`;
    appendMessage("assistant", hint);
    console.error("Fehler beim API-Aufruf:", error);
  } finally {
    setRobotState("idle");
    sendButton.disabled = false;
    userInput.focus();
  }
}

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener("click", sendMessage);
