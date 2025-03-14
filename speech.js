// Text to Speech

const synth = window.speechSynthesis;

const textToSpeech = (string) => {
  return new Promise((resolve) => {
    const voice = new SpeechSynthesisUtterance(string);
    voice.text = string;
    voice.lang = "en-US";
    voice.volume = 1;
    voice.rate = 1;
    voice.pitch = 1;
    
    voice.onend = () => {
      resolve();
    };
    
    synth.speak(voice);
  });
}

// Speech recognition functionality for Healio

let recognition;

// Initialize speech recognition
function initSpeechRecognition() {
    // Check for browser support
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Set up event handlers
        setupSpeechEvents();
    } else if ('SpeechRecognition' in window) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Set up event handlers
        setupSpeechEvents();
    } else {
        console.error('Speech recognition not supported in this browser.');
        alert('Speech recognition is not supported in your browser. Please try using Chrome or Edge.');
    }
}

function setupSpeechEvents() {
    recognition.onstart = function() {
        console.log('Speech recognition started...');
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        endSpeechRecognition();
    };
    
    recognition.onend = function() {
        console.log('Speech recognition ended.');
        endSpeechRecognition();
    };
    
    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        // If we have a final transcript, add it to the input field
        if (finalTranscript) {
            document.getElementById('input').value = finalTranscript;
        }
    };
}

function startSpeechRecognition() {
    // Initialize if not already done
    if (!recognition) {
        initSpeechRecognition();
    }
    
    if (recognition) {
        try {
            recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            recognition.stop();
            setTimeout(() => {
                recognition.start();
            }, 200);
        }
    }
}

function endSpeechRecognition() {
    // Create and dispatch a custom event when speech recognition ends
    const event = new CustomEvent('speechRecognitionEnd');
    document.dispatchEvent(event);
}

// Text-to-speech functionality
function textToSpeech(text) {
    // Check for browser support
    if ('speechSynthesis' in window) {
        // Create a speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure the utterance
        utterance.lang = 'en-US';
        utterance.rate = 1.0; // Speech rate (0.1 to 10)
        utterance.pitch = 1.0; // Speech pitch (0 to 2)
        
        // Get voices
        let voices = window.speechSynthesis.getVoices();
        
        // If voices array is empty, wait for voices to load
        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = function() {
                voices = window.speechSynthesis.getVoices();
                setVoice();
            };
        } else {
            setVoice();
        }
        
        function setVoice() {
            // Try to find a good voice (preferably a female voice)
            const preferredVoices = ['Samantha', 'Google UK English Female', 'Microsoft Zira'];
            
            for (let name of preferredVoices) {
                const voice = voices.find(v => v.name.includes(name));
                if (voice) {
                    utterance.voice = voice;
                    break;
                }
            }
            
            // Use any voice if preferred ones not found
            if (!utterance.voice && voices.length > 0) {
                utterance.voice = voices[0];
            }
        }
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
        
        return new Promise((resolve) => {
            utterance.onend = resolve;
        });
    } else {
        console.error('Text-to-speech not supported in this browser.');
        return Promise.resolve();
    }
}

// Initialize speech recognition when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initSpeechRecognition();
});