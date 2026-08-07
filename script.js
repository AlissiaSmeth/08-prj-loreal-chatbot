/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestion = document.getElementById("latestQuestion");

// Paste your class Cloudflare Worker URL from the README here.
const WORKER_URL = "https://loreal-chatbot.your-subdomain.workers.dev/";

// Use the model requested by the class project instructions.
const MODEL_NAME = "gpt-4.1";

// System prompt for a L'Oreal-focused beauty assistant.
const SYSTEM_PROMPT =
  "You are a L'Oreal beauty advisor. Your scope is only: L'Oreal products, beauty routines (skincare, haircare, makeup), and product recommendations. If a user asks anything outside this scope (for example: coding, math, general news, politics, sports, medical or legal advice not tied to L'Oreal beauty products), politely refuse. Use this refusal style: 'I can only help with L'Oreal beauty products, routines, and recommendations. Please ask a L'Oreal beauty question.' Keep all answers clear, practical, and concise.";

// Keep a running chat history so the assistant remembers the conversation.
const messages = [{ role: "system", content: SYSTEM_PROMPT }];

// Add a message bubble to the chat window.
function addMessage(role, text) {
  const messageEl = document.createElement("article");
  messageEl.className = `msg ${role}`;

  const labelEl = document.createElement("span");
  labelEl.className = "msg-label";

  const contentEl = document.createElement("span");
  contentEl.className = "msg-content";
  contentEl.textContent = text;

  if (role === "user") {
    labelEl.textContent = "You";
  } else {
    labelEl.textContent = "L'Oreal Advisor";
  }

  messageEl.appendChild(labelEl);
  messageEl.appendChild(contentEl);

  chatWindow.appendChild(messageEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Lock/unlock the form while we wait for the API response.
function setLoadingState(isLoading) {
  userInput.disabled = isLoading;
  sendBtn.disabled = isLoading;
}

// Request an assistant reply from the class-hosted Worker.
async function getAssistantReply() {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Set initial message
chatWindow.innerHTML = "";
addMessage("ai", "Hello! How can I help you with L'Oreal products today?");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) {
    return;
  }

  // Always show only the newest user question above the response box.
  latestQuestion.textContent = text;

  // Show the user's message in the UI.
  addMessage("user", text);

  // Add the user's message to the API conversation history.
  messages.push({ role: "user", content: text });

  // Clear the input for the next message and start loading.
  userInput.value = "";
  setLoadingState(true);

  try {
    const assistantReply = await getAssistantReply();

    // Show and store the assistant response.
    addMessage("ai", assistantReply);
    messages.push({ role: "assistant", content: assistantReply });
  } catch (error) {
    console.error(error);
    addMessage(
      "ai",
      "Sorry, I could not get a response right now. Please check your Worker URL and try again.",
    );
  } finally {
    setLoadingState(false);
    userInput.focus();
  }
});
