// Speech functionality for Healio
const synth = window.speechSynthesis;
let recognition;
let voices = [];

// Text-to-speech functionality
function textToSpeech(text) {
    return new Promise((resolve) => {
        // Skip empty text
        if (!text || typeof text !== 'string' || text.trim() === '') {
            console.warn('Empty text provided to text-to-speech');
            resolve();
            return;
        }
        
        // Check for browser support
        if (!('speechSynthesis' in window)) {
            console.error('Text-to-speech not supported in this browser.');
            resolve();
            return;
        }

        // Create and configure utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.volume = 1;
        utterance.rate = 1;
        utterance.pitch = 1;
        
        // Set a voice if available
        if (voices.length > 0) {
            // Try to find preferred voices
            const preferredVoices = ['Samantha', 'Google US English', 'Microsoft Zira', 'Google UK English Female'];
            let selectedVoice = null;
            
            for (const name of preferredVoices) {
                const voice = voices.find(v => v.name.includes(name));
                if (voice) {
                    selectedVoice = voice;
                    break;
                }
            }
            
            // If no preferred voice found, use the first available one
            utterance.voice = selectedVoice || voices[0];
        }
        
        // Set up resolution
        utterance.onend = () => {
            console.log('Speech synthesis finished');
            resolve();
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            resolve();
        };
        
        // Reset any ongoing speech before starting new one
        synth.cancel();
        
        // Start speaking
        synth.speak(utterance);
        
        // Safari sometimes doesn't trigger onend, so add a timeout safety
        setTimeout(() => {
            if (synth.speaking) {
                console.warn('Speech synthesis timeout - resolving anyway');
                resolve();
            }
        }, 10000); // 10 seconds timeout
    });
}

// Initialize speech recognition
function initSpeechRecognition() {
    // Get available voices for speech synthesis
    voices = synth.getVoices();
    if (voices.length === 0) {
        // Chrome loads voices asynchronously
        synth.onvoiceschanged = () => {
            voices = synth.getVoices();
            console.log(`Loaded ${voices.length} voices for speech synthesis`);
        };
    }
    
    // Check for browser support for speech recognition
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        setupRecognition(recognition);
    } else if ('SpeechRecognition' in window) {
        recognition = new SpeechRecognition();
        setupRecognition(recognition);
    } else {
        console.error('Speech recognition not supported in this browser.');
    }
}

function setupRecognition(recognition) {
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Set up event handlers
    recognition.onstart = function() {
        console.log('Speech recognition started...');
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            alert('Microphone access denied. Please enable microphone permissions to use voice input.');
        }
        endSpeechRecognition();
    };
    
    recognition.onend = function() {
        console.log('Speech recognition ended.');
        endSpeechRecognition();
    };
    
    recognition.onresult = function(event) {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        
        // If we have a final transcript, add it to the input field and submit
        if (finalTranscript) {
            const inputField = document.getElementById('input');
            inputField.value = finalTranscript;
            
            // Wait a moment to make sure the user sees what was transcribed
            setTimeout(() => {
                // Submit the form by simulating Enter key press
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                });
                inputField.dispatchEvent(enterEvent);
            }, 500);
        }
    };
}

function startSpeechRecognition() {
    // Initialize if not already done
    if (!recognition) {
        initSpeechRecognition();
        
        // If still not initialized, show error
        if (!recognition) {
            alert('Speech recognition is not supported in your browser. Please try using Chrome or Edge.');
            return;
        }
    }
    
    try {
        recognition.start();
    } catch (error) {
        console.error('Error starting speech recognition:', error);
        
        // If already started, stop and restart
        if (error.name === 'InvalidStateError') {
            recognition.stop();
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (err) {
                    console.error('Failed to restart speech recognition:', err);
                }
            }, 300);
        }
    }
}

function endSpeechRecognition() {
    // Create and dispatch a custom event when speech recognition ends
    const event = new CustomEvent('speechRecognitionEnd');
    document.dispatchEvent(event);
}

// Test audio capability on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize speech recognition
    initSpeechRecognition();
    
    // Test speech synthesis
    if ('speechSynthesis' in window) {
        console.log('Speech synthesis is supported on this browser.');
    } else {
        console.warn('Speech synthesis is NOT supported on this browser.');
    }
    
    // Add debug button event listener for audio testing if it exists
    const debugButton = document.getElementById('debugAudio');
    if (debugButton) {
        debugButton.addEventListener('click', function() {
            testAudioCapabilities();
        });
    }
});

// Function for testing audio capabilities (can be called from console for debugging)
function testAudioCapabilities() {
    console.log('Testing audio capabilities...');
    
    // Test speech synthesis
    if ('speechSynthesis' in window) {
        console.log('Speech synthesis supported. Available voices:');
        const voices = synth.getVoices();
        console.log(voices);
    } else {
        console.error('Speech synthesis not supported');
    }
    
    // Test speech recognition
    if (recognition) {
        console.log('Speech recognition appears to be initialized');
    } else {
        console.error('Speech recognition not initialized');
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            console.log('Speech recognition is supported but not initialized properly');
        } else {
            console.error('Speech recognition not supported by this browser');
        }
    }
    
    // Test microphone access
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            console.log('Microphone access granted');
            // Stop all tracks to release the microphone
            stream.getTracks().forEach(track => track.stop());
        })
        .catch(function(err) {
            console.error('Microphone access error:', err);
        });
}