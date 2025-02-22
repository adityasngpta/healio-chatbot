// Initialize outside function scope
const GEMINI_API_KEY = "AIzaSyDNf5CReEq_USmxByM3RhTQBaBVXuCSgUM";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("input");
  inputField.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      let input = inputField.value;
      inputField.value = "";
      await output(input);
    }
  });
});

// Simplified API call using fetch
async function getGeminiResponse(input) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: input }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error:', error);
    return "Sorry, I'm having trouble connecting right now.";
  }
}

async function output(input) {
  // Create both user and bot chat messages;
  const botText = addChat(input, "Typing...");
  // Get Gemini response
  const reply = await getGeminiResponse(input);
  botText.innerText = reply;
  textToSpeech(reply);
}

// Update addChat to return the bot text element.
function addChat(input, placeholder) {
  const messagesContainer = document.getElementById("messages");

  // Create user message
  let userDiv = document.createElement("div");
  userDiv.id = "user";
  userDiv.className = "user response";
  userDiv.innerHTML = `<img src="user.png" class="avatar"><span>${input}</span>`;
  messagesContainer.appendChild(userDiv);

  // Create bot message
  let botDiv = document.createElement("div");
  let botImg = document.createElement("img");
  let botText = document.createElement("span");
  botDiv.id = "bot";
  botImg.src = "bot-mini.png";
  botImg.className = "avatar";
  botDiv.className = "bot response";
  botText.innerText = placeholder;
  botDiv.appendChild(botText);
  botDiv.appendChild(botImg);
  messagesContainer.appendChild(botDiv);

  // Keep messages at most recent
  messagesContainer.scrollTop = messagesContainer.scrollHeight - messagesContainer.clientHeight;
  return botText;
}