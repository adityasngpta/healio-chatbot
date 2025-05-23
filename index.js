// Initialize message history
let conversationHistory = [];

const LLM_API_KEY = "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";
const API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `
You are He@lio, an empathetic and supportive digital companion dedicated to guiding young people through struggles related to mental health, emotional wellbeing, self-discovery, and life's challenges. Your responses should consistently embody the following principles:

Warmth and Empathy: Adopt a compassionate, approachable, and conversational tone, clearly showing genuine care and understanding.
Non-Judgmental Validation: Create a safe, accepting environment by consistently affirming users' emotions, thoughts, and experiences without judgment.
Encouraging and Empowering: Offer optimism, gentle reassurance, practical tools, coping strategies, and resources when appropriate. Always encourage users toward seeking help from trusted adults or mental health professionals for serious concerns.
Professional yet Approachable: Balance professional insights derived from psychological principles with approachable, relatable language appropriate for youth.
Concise and Clear: Prioritize clarity and precision by keeping your responses concise and focused (ideally under 5 sentences); avoid overwhelming users with lengthy explanations.
Sensitivity and Awareness: Show sensitivity to cultural backgrounds, gender identities, orientations, disabilities, and other individual experiences, ensuring inclusivity and respectful language at all times.
Safety Emphasis: Regularly remind users of the importance of speaking with trusted people or mental health professionals and gently provide crisis resources if users indicate immediate or serious distress.
Your ultimate goal is to create a comforting environment where young people feel heard, supported, and gently guided toward improved emotional wellbeing.
`;

// Audio feedback settings
let audioEnabled = true; // Can be toggled by user

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

async function getLLMResponse(input) {
  try {
    // Add user message to history
    conversationHistory.push({
      role: "user",
      content: input
    });

    // Insert a more detailed system prompt at the start
    const systemPrompt = `
    You are a caring, empathetic mental health companion focused on helping youth 
    navigate stress, anxiety, and school-related challenges. Offer non-judgmental 
    support, helpful suggestions, and understanding Encourage healthy coping strategies and 
    self-care.Respond with kindness and positivity. Use a gentle tone and help the user feel safe. 
    `;

    conversationHistory.unshift({
      role: "system",
      content: systemPrompt
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: conversationHistory,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    // Helper to convert basic Markdown to HTML
    function formatMarkdown(text) {
        return text
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/gim, '<em>$1</em>')
          .replace(/`([^`]+)`/gim, '<code>$1</code>')
          .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
          .replace(/\n/g, '<br/>');
    }

    let fullResponse = '';
    const botText = addChat(input, "");

    // Stream the response
    for await (const chunk of streamResponse(response)) {
      fullResponse += chunk;
      // Render Markdown instead of plain text
      botText.innerHTML = formatMarkdown(fullResponse);
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
  try {
    console.log('Processing user input:', input);
    const reply = await getLLMResponse(input);
    
    // Check if audio is enabled before speaking
    if (audioEnabled && typeof textToSpeech === 'function') {
      console.log('Starting text-to-speech for response');
      await textToSpeech(reply);
    } else {
      console.log('Audio output skipped (disabled or not available)');
    }
  } catch (error) {
    console.error('Error in output function:', error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize with system prompt
  conversationHistory = [{
    role: "system",
    content: SYSTEM_PROMPT
  }];
  
  const welcome = "Hi, I'm He@lio! 👋 I'm here to chat, listen, and support you. How are you feeling today?";
  addChat("", welcome, true);
  
  // Add welcome message to history
  conversationHistory.push({
    role: "assistant",
    content: welcome
  });

  // Initialize speech capabilities
  if (typeof initSpeechRecognition === 'function') {
    initSpeechRecognition();
  }

  const inputField = document.getElementById("input");
  inputField.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && inputField.value.trim() !== "") {
      let input = inputField.value;
      inputField.value = "";
      await output(input);
    }
  });

  // Add audio toggle button if available
  const audioToggleBtn = document.getElementById("audioToggleBtn");
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener("click", () => {
      audioEnabled = !audioEnabled;
      audioToggleBtn.innerHTML = audioEnabled ? 
        '<i class="fas fa-volume-up"></i>' : 
        '<i class="fas fa-volume-mute"></i>';
      audioToggleBtn.title = audioEnabled ? "Mute Audio" : "Enable Audio";
    });
  }
  
  // Add send button functionality
  const sendBtn = document.getElementById("sendBtn");
  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      if (inputField.value.trim() !== "") {
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        });
        inputField.dispatchEvent(event);
      }
    });
  }
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
