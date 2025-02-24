// Initialize outside function scope
const GEMINI_API_KEY = "AIzaSyDNf5CReEq_USmxByM3RhTQBaBVXuCSgUM";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// Add conversation history array at the top
const conversationHistory = [];

// Add new state variables
const moodHistory = [];
let isRecording = false;
let darkMode = false;

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
  // Add system message to conversation history
  conversationHistory.push({ role: "system", content: SYSTEM_PROMPT });
  
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

// Add streaming helper function
async function streamText(element, text, speed = 30) {
  for (let i = 0; i < text.length; i++) {
    element.innerText += text[i];
    await new Promise(resolve => setTimeout(resolve, speed));
  }
}

// Update getGeminiResponse to handle streaming
async function getGeminiResponse(input) {
  try {
    conversationHistory.push({ role: "user", content: input });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: conversationHistory,
        stream: true  // Enable streaming
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const reader = response.body.getReader();
    let responseText = '';

    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      
      // Convert the chunk to text
      const chunk = new TextDecoder().decode(value);
      try {
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.includes('[DONE]')) continue;
          const json = JSON.parse(line.replace('data: ', ''));
          if (json.choices[0]?.delta?.content) {
            responseText += json.choices[0].delta.content;
          }
        }
      } catch (e) {
        console.error('Error parsing chunk:', e);
      }
    }

    conversationHistory.push({ role: "assistant", content: responseText });
    return responseText;

  } catch (error) {
    console.error('Error:', error);
    return "Sorry, I'm having trouble connecting right now.";
  }
}

// Update output function to use streaming
async function output(input) {
  const botText = addChat(input, "");
  const reply = await getGeminiResponse(input);
  await streamText(botText, reply);
  await textToSpeech(reply);
}

// Add dark mode toggle
function toggleDarkMode() {
  darkMode = !darkMode;
  document.body.classList.toggle('dark-mode');
}

// Add mood tracking
function trackMood(mood) {
  moodHistory.push({
    mood: mood,
    timestamp: new Date()
  });
  updateMoodVisualization();
}

function updateMoodVisualization() {
  const ctx = document.getElementById('mood-chart').getContext('2d');
  // Implement mood visualization using Chart.js
}

// Add timestamp to messages
function getTimestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Update addChat to return the bot text element and include new features.
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

  // Add timestamp
  const timestamp = document.createElement('span');
  timestamp.className = 'timestamp';
  timestamp.textContent = getTimestamp();
  botDiv.appendChild(timestamp);

  // Add reaction buttons
  const reactionButtons = document.createElement('div');
  reactionButtons.className = 'reaction-buttons';
  reactionButtons.innerHTML = `
    <button class="reaction-button" onclick="handleReaction('helpful')">👍</button>
    <button class="reaction-button" onclick="handleReaction('unhelpful')">👎</button>
  `;
  botDiv.appendChild(reactionButtons);

  messagesContainer.appendChild(botDiv);

  // Keep messages at most recent
  messagesContainer.scrollTop = messagesContainer.scrollHeight - messagesContainer.clientHeight;
  return botText;
}

// Voice input functionality
function toggleVoiceInput() {
  if (!isRecording) {
    startVoiceRecording();
  } else {
    stopVoiceRecording();
  }
}

async function startVoiceRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks);
      // Convert audio to text using Speech-to-Text API
      // Then send to chatbot
    };

    mediaRecorder.start();
    isRecording = true;
    updateVoiceButton();
  } catch (error) {
    console.error('Error accessing microphone:', error);
  }
}

// Handle message reactions
function handleReaction(type) {
  // Log reaction for improving responses
  console.log(`Message rated as ${type}`);
}

// Export chat history
function exportChat() {
  const chat = conversationHistory.map(msg => ({
    role: msg.role,
    content: msg.content,
    timestamp: new Date().toISOString()
  }));
  
  const blob = new Blob([JSON.stringify(chat, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chat-history.json';
  a.click();
}