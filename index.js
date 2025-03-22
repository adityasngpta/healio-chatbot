// Initialize message history
let conversationHistory = [];

const API_KEY = "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";
const API_URL = "https://api.openai.com/v1/chat/completions";
const SPEECH_API_URL = "https://api.openai.com/v1/audio/speech";
const TRANSCRIPTION_API_URL = "https://api.openai.com/v1/audio/transcriptions";

// Voice options for text-to-speech
const VOICE_OPTIONS = {
  DEFAULT: "coral", // Default voice
  ALTERNATIVES: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
};

const SYSTEM_PROMPT = `You are He@lio, a supportive and empathetic mental health companion for young people. Your responses should be:
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

// Audio feedback settings
let audioEnabled = true; // Can be toggled by user
let currentVoice = VOICE_OPTIONS.DEFAULT; // Current voice selection

// Speech recognition variables
let recognition;
let isRecording = false;

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

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.5-preview",
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
  try {
    console.log('Processing user input:', input);
    const reply = await getLLMResponse(input);
    
    // Check if audio is enabled before speaking
    if (audioEnabled) {
      console.log('Starting text-to-speech for response');
      await textToSpeech(reply);
    } else {
      console.log('Audio output skipped (disabled)');
    }
  } catch (error) {
    console.error('Error in output function:', error);
  }
}

// Text-to-speech implementation using OpenAI API
async function textToSpeech(text) {
  try {
    console.log('Converting text to speech using voice:', currentVoice);
    
    const response = await fetch(SPEECH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: currentVoice,
        input: text,
        instructions: "Speak in a warm, empathetic and caring tone suitable for a mental health companion.",
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Speech API error: ${errorData.error?.message || response.statusText}`);
    }

    // Create audio from the response and play it
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    await new Promise((resolve) => {
      audio.onended = resolve;
      audio.play();
    });
    
    // Clean up the URL object after playing
    URL.revokeObjectURL(audioUrl);
    return true;
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return false;
  }
}

// Initialize speech recognition with OpenAI transcription
function initSpeechRecognition() {
  // Check if the browser supports the MediaRecorder API
  if (!window.MediaRecorder) {
    console.error('MediaRecorder not supported in this browser');
    return;
  }

  let mediaRecorder;
  let audioChunks = [];
  const micButton = document.getElementById("micBtn");
  
  if (!micButton) {
    console.error('Microphone button not found');
    return;
  }

  // Configure microphone button
  micButton.addEventListener("click", () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      
      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });
      
      mediaRecorder.addEventListener("stop", async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const transcription = await transcribeAudio(audioBlob);
        
        if (transcription) {
          const inputField = document.getElementById("input");
          inputField.value = transcription;
          
          // Auto-submit the transcription
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
      
      mediaRecorder.start();
      isRecording = true;
      micButton.innerHTML = '<i class="fas fa-stop"></i>';
      micButton.classList.add("recording");
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      micButton.innerHTML = '<i class="fas fa-microphone"></i>';
      micButton.classList.remove("recording");
      
      // Stop all media tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }
}

// Function to transcribe audio using OpenAI API
async function transcribeAudio(audioBlob) {
  try {
    // Create form data for the API request
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'gpt-4o-transcribe'); 
    formData.append('response_format', 'text');
    
    // Add a loading indicator
    const inputField = document.getElementById("input");
    const originalValue = inputField.value;
    inputField.value = "Transcribing...";
    inputField.disabled = true;
    
    const response = await fetch(TRANSCRIPTION_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: formData
    });
    
    // Reset input field state
    inputField.disabled = false;
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Transcription API error: ${errorData.error?.message || response.statusText}`);
    }
    
    // Get the transcribed text
    const transcribedText = await response.text();
    console.log('Transcription result:', transcribedText);
    return transcribedText;
    
  } catch (error) {
    console.error('Transcription error:', error);
    return null;
  }
}

// Function to change the voice for text-to-speech
function changeVoice(voiceName) {
  if (VOICE_OPTIONS.ALTERNATIVES.includes(voiceName) || voiceName === VOICE_OPTIONS.DEFAULT) {
    currentVoice = voiceName;
    console.log('Voice changed to:', currentVoice);
    return true;
  }
  return false;
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
  initSpeechRecognition();

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
  
  // Add voice selector if available
  const voiceSelector = document.getElementById("voiceSelector");
  if (voiceSelector) {
    // Populate voice options
    const voices = [VOICE_OPTIONS.DEFAULT, ...VOICE_OPTIONS.ALTERNATIVES];
    voices.forEach(voice => {
      const option = document.createElement("option");
      option.value = voice;
      option.textContent = voice.charAt(0).toUpperCase() + voice.slice(1);
      voiceSelector.appendChild(option);
    });
    
    // Add event listener
    voiceSelector.addEventListener("change", (e) => {
      changeVoice(e.target.value);
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