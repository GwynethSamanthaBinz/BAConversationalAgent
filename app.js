// ── Popup-Logik ───────────────────────────────────────────────

const kuerzelInput = document.getElementById("kuerzel-input");
const kuerzelError = document.getElementById("kuerzel-error");

kuerzelInput.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 4);
});

kuerzelInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") document.getElementById("btn-kuerzel-ok").click();
});

document.getElementById("btn-kuerzel-ok").addEventListener("click", function () {
  const val = kuerzelInput.value.trim();
  if (/^\d{4}$/.test(val)) {
    kuerzelError.classList.add("hidden");
    window.teilnehmerKuerzel = val;
    document.getElementById("popup-kuerzel").classList.add("hidden");
    document.getElementById("popup-briefing").classList.remove("hidden");
  } else {
    kuerzelError.classList.remove("hidden");
    kuerzelInput.focus();
  }
});

document.getElementById("btn-datenschutz-ok").addEventListener("click", function () {
  document.getElementById("popup-datenschutz").classList.add("hidden");
  document.getElementById("popup-kuerzel").classList.remove("hidden");
  document.getElementById("kuerzel-input").focus();
});

document.getElementById("briefing-button").addEventListener("click", function () {
  document.getElementById("popup-briefing").classList.remove("hidden");
});

document.getElementById("aufgaben-szenario-btn").addEventListener("click", function () {
  document.getElementById("popup-briefing").classList.remove("hidden");
});

// ── Countdown-Timer ───────────────────────────────────────────

let triggerFeedback = null;

const TIMER_TOTAL = 10 * 60;
let timerInterval = null;
let timerSeconds  = TIMER_TOTAL;

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function stopCountdownTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  const display = document.getElementById("timer-display");
  if (display) display.textContent = "0:00";
}

function startCountdownTimer() {
  const display = document.getElementById("timer-display");
  display.classList.remove("hidden");
  timerSeconds = TIMER_TOTAL;
  display.textContent = formatTime(timerSeconds);

  timerInterval = setInterval(function () {
    timerSeconds--;
    display.textContent = formatTime(timerSeconds);
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      display.textContent = "0:00";
      if (typeof triggerFeedback === "function") triggerFeedback();
    }
  }, 1000);
}

document.getElementById("btn-briefing-ok").addEventListener("click", function () {
  document.getElementById("popup-briefing").classList.add("hidden");
  startCountdownTimer();
});

// ── Chat-Logik ────────────────────────────────────────────────

async function loadSystemPrompt() {
  const response = await fetch(`${CONFIG.apiUrl.replace("/api/chat", "")}/api/scenario`);
  const data = await response.json();
  return data.system_prompt ?? "Du bist ein Gesprächspartner.";
}

(async () => {
  const SYSTEM_PROMPT = await loadSystemPrompt();
  const conversationHistory = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  const chatContainer   = document.getElementById("chat-container");
  const userInput       = document.getElementById("user-input");
  const sendButton      = document.getElementById("send-button");
  const robotBg         = document.getElementById("robot-bg");
  const robotAvatar     = document.getElementById("robot-avatar");
  const characterStatus = document.getElementById("character-status");
  const mouthLeds       = [
    document.getElementById("mouth-led-1"),
    document.getElementById("mouth-led-2"),
    document.getElementById("mouth-led-3"),
  ];

  function setRobotState(state) {
    if (state === "speaking") {
      robotBg.classList.add("active");
      robotAvatar.classList.add("robot-speaking");
      characterStatus.textContent = "denkt nach …";
      mouthLeds.forEach(led => led && led.setAttribute("fill", "#f97316"));
    } else {
      robotBg.classList.remove("active");
      robotAvatar.classList.remove("robot-speaking");
      characterStatus.textContent = "Luca wartet auf dich …";
      mouthLeds.forEach(led => led && led.setAttribute("fill", "#d1d5db"));
    }
  }

  function createBubble(role) {
    const wrapper = document.createElement("div");
    const alignment = role === "user" ? "justify-end" : "justify-center";
    wrapper.classList.add("flex", "mb-4", "bubble-rise", "px-2", alignment);

    const bubble = document.createElement("div");
    bubble.classList.add(role === "user" ? "user-bubble" : "assistant-bubble");

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return bubble;
  }

  function appendMessage(role, text) {
    const bubble = createBubble(role);
    bubble.textContent = text;
    return bubble;
  }

  async function streamOllamaResponse() {
    const bubble = createBubble("assistant");
    bubble.textContent = "…";

    const response = await fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CONFIG.model,
        messages: conversationHistory,
        stream: true,
      }),
    });

    if (!response.ok) throw new Error(`HTTP-Fehler: ${response.status}`);

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText  = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      for (const line of decoder.decode(value).split("\n").filter(Boolean)) {
        try {
          const chunk = JSON.parse(line);
          if (chunk.message?.content) {
            fullText += chunk.message.content;
            bubble.textContent = fullText.trimStart();
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        } catch { /* unvollständiges JSON-Fragment, überspringen */ }
      }
    }

    return fullText;
  }

  async function fetchBackendResponse() {
    const bubble = createBubble("assistant");
    bubble.textContent = "…";

    const response = await fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory, sessionId: window.teilnehmerKuerzel ?? "anonymous" }),
    });

    if (!response.ok) throw new Error(`HTTP-Fehler: ${response.status}`);

    const data = await response.json();
    const text = (data.reply ?? "(Keine Antwort erhalten)").trim();
    bubble.textContent = text;
    return text;
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

    try {
      const assistantText = CONFIG.useBackend
        ? await fetchBackendResponse()
        : await streamOllamaResponse();

      conversationHistory.push({ role: "assistant", content: assistantText });
    } catch (error) {
      const isNetworkError = error instanceof TypeError;
      appendMessage("assistant", isNetworkError
        ? "Verbindungsfehler: Ist der Backend-Server gestartet? (node server.js)"
        : `Fehler: ${error.message}`);
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

  triggerFeedback = function () {
    stopCountdownTimer();
    userInput.value = "Kannst du mir bitte Feedback zu meinem Gesprächsverhalten geben?";
    userInput.style.height = "auto";
    userInput.style.height = userInput.scrollHeight + "px";
    if (!sendButton.disabled) {
      sendMessage();
    } else {
      const wait = setInterval(() => {
        if (!sendButton.disabled) {
          clearInterval(wait);
          sendMessage();
        }
      }, 300);
    }
  };

  const feedbackButton = document.getElementById("feedback-button");
  feedbackButton.addEventListener("click", triggerFeedback);
})();
