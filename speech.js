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