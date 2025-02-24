// Initialize conversation history at the top
const conversationHistory = [];
const MAX_HISTORY_LENGTH = 20; // Prevent context from growing too large

// Initialize outside function scope
const GEMINI_API_KEY = "AIzaSyDNf5CReEq_USmxByM3RhTQBaBVXuCSgUM";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// Initialize conversation with system prompt
const initializeConversation = () => {
  conversationHistory.push({ role: "system", content: SYSTEM_PROMPT });
};

const SYSTEM_PROMPT = `You are Healio, a supportive and empathetic mental health companion for young people. Your responses should be:
- Warm and conversational, but professional
- Non-judgmental and validating of emotions
- Clear and concise (keep responses under 3 sentences when possible)
- Encouraging but never dismissive of serious concerns
- Direct users to professional help for serious issues
- Never give medical advice or try to diagnose

If you sense the user is in crisis, always provide these emergency contacts:
"If you're having thoughts of self-harm, please know you're not alone. Contact these 24/7 support services:
- Crisis Text Line: Text HOME to 741741
- National Suicide Prevention Lifeline: 1-800-273-8255"`;

document.addEventListener("DOMContentLoaded", () => {
  initializeConversation();
  
  // Show welcome message and add to history
  const welcome = "Hi, I'm Healio! 👋 I'm here to chat, listen, and support you. How are you feeling today?";
  addChat("", welcome, true);
  conversationHistory.push({ role: "assistant", content: welcome });

  const inputField = document.getElementById("input");
  inputField.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && inputField.value.trim() !== "") {
      let input = inputField.value;
      inputField.value = "";
      await output(input);
    }
  });
});

// Update getGeminiResponse to include conversation history
async function getGeminiResponse(input) {
  try {
    // Add user's new message to history
    conversationHistory.push({ role: "user", content: input });
    
    // Trim history if it gets too long
    if (conversationHistory.length > MAX_HISTORY_LENGTH) {
      // Keep system prompt and remove oldest messages
      const systemPrompt = conversationHistory[0];
      conversationHistory.splice(1, 2); // Remove oldest Q&A pair
      conversationHistory[0] = systemPrompt;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: conversationHistory
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    
    // Add assistant's reply to history
    conversationHistory.push({ role: "assistant", content: reply });
    
    return reply;
  } catch (error) {
    console.error('Error:', error);
    return "Sorry, I'm having trouble connecting right now.";
  }
}

async function output(input) {
  const botText = addChat(input, "Typing...");
  const reply = await getGeminiResponse(input);
  botText.innerText = reply;
  await textToSpeech(reply);
}

// Update addChat to return the bot text element.
function addChat(input, placeholder, isWelcome = false) {
  const messagesContainer = document.getElementById("messages");

  if (!isWelcome) {
    // Create user message
    let userDiv = document.createElement("div");
    userDiv.id = "user";
    userDiv.className = "user response";
    userDiv.innerHTML = `<img src="user.png" class="avatar"><span>${input}</span>`;
    messagesContainer.appendChild(userDiv);
  }

  // Create bot message
  let botDiv = document.createElement("div");
  let botImg = document.createElement("img");
  let botText = document.createElement("span");
  botDiv.id = "bot";
  botImg.src = "bot-mini.png";
  botImg.className = "avatar";
  botDiv.className = "bot response";
  botText.innerText = placeholder;
  botDiv.appendChild(botImg);
  botDiv.appendChild(botText);
  messagesContainer.appendChild(botDiv);

  // Keep messages at most recent
  messagesContainer.scrollTop = messagesContainer.scrollHeight - messagesContainer.clientHeight;
  return botText;
}