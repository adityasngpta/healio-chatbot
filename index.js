// Initialize message history
let conversationHistory = [];

const GEMINI_API_KEY = "AIzaSyDNf5CReEq_USmxByM3RhTQBaBVXuCSgUM";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

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

async function* streamResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, {stream: true});
    const lines = buffer.split('\n');
    buffer = lines.pop();
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(5);
        if (jsonStr.trim() === '[DONE]') continue;
        try {
          const jsonData = JSON.parse(jsonStr);
          if (jsonData.choices?.[0]?.delta?.content) {
            yield jsonData.choices[0].delta.content;
          }
        } catch (e) {
          console.error('JSON parse error:', e);
        }
      }
    }
  }
}

async function getGeminiResponse(input) {
  try {
    // Add user message to history
    conversationHistory.push({
      role: "user",
      content: input
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: conversationHistory,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    let fullResponse = '';
    const botText = addChat(input, "");

    // Stream the response
    for await (const chunk of streamResponse(response)) {
      fullResponse += chunk;
      botText.innerText = fullResponse;
      // Scroll to bottom as text streams in
      const messagesContainer = document.getElementById("messages");
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Add assistant's response to history
    conversationHistory.push({
      role: "assistant",
      content: fullResponse
    });

    return fullResponse;
  } catch (error) {
    console.error('Error:', error);
    return "Sorry, I'm having trouble connecting right now.";
  }
}

async function output(input) {
  const reply = await getGeminiResponse(input);
  await textToSpeech(reply);
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize with system prompt
  conversationHistory = [{
    role: "system",
    content: SYSTEM_PROMPT
  }];
  
  const welcome = "Hi, I'm Healio! 👋 I'm here to chat, listen, and support you. How are you feeling today?";
  addChat("", welcome, true);
  
  // Add welcome message to history
  conversationHistory.push({
    role: "assistant",
    content: welcome
  });

  const inputField = document.getElementById("input");
  inputField.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && inputField.value.trim() !== "") {
      let input = inputField.value;
      inputField.value = "";
      await output(input);
    }
  });

  const darkModeToggle = document.getElementById("dark-mode-toggle");
  darkModeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode", darkModeToggle.checked);
  });

  const feedbackButton = document.getElementById("submit-feedback");
  feedbackButton.addEventListener("click", () => {
    const feedback = document.getElementById("feedback").value;
    if (feedback.trim() !== "") {
      alert("Thank you for your feedback!");
      document.getElementById("feedback").value = "";
    }
  });
});

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