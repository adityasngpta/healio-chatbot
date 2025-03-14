// Features.js - Additional functionality for Healio

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const welcomeModal = document.getElementById('welcomeModal');
    const closeButton = document.querySelector('.close-button');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    const sendBtn = document.getElementById('sendBtn');
    const input = document.getElementById('input');
    
    // Navigation Elements
    const chatBtn = document.getElementById('chatBtn');
    const journalBtn = document.getElementById('journalBtn');
    const resourcesBtn = document.getElementById('resourcesBtn');
    const sections = document.querySelectorAll('.section');
    
    // Journal Elements
    const journalTitle = document.getElementById('journalTitle');
    const journalContent = document.getElementById('journalContent');
    const saveJournalBtn = document.getElementById('saveJournalBtn');
    const journalEntries = document.getElementById('journalEntries');
    const journalDateEl = document.getElementById('journalDate');
    
    // Mood tracking
    const moodOptions = document.querySelectorAll('.mood');
    
    // Initialize Features

    // 1. Welcome Modal
    // Show welcome modal if it's the first visit
    if (!localStorage.getItem('healioWelcomeSeen')) {
        welcomeModal.style.display = 'flex';
    }

    // Close welcome modal
    closeButton.addEventListener('click', () => {
        welcomeModal.style.display = 'none';
        localStorage.setItem('healioWelcomeSeen', 'true');
    });

    getStartedBtn.addEventListener('click', () => {
        welcomeModal.style.display = 'none';
        localStorage.setItem('healioWelcomeSeen', 'true');
    });
    
    // 2. Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        // Update icon
        const icon = themeToggleBtn.querySelector('i');
        if (document.body.classList.contains('dark-theme')) {
            icon.className = 'fas fa-sun';
            localStorage.setItem('healioTheme', 'dark');
        } else {
            icon.className = 'fas fa-moon';
            localStorage.setItem('healioTheme', 'light');
        }
    });
    
    // Load saved theme
    if (localStorage.getItem('healioTheme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggleBtn.querySelector('i').className = 'fas fa-sun';
    }
    
    // 3. Navigation
    function setActiveSection(sectionId) {
        // Remove active class from all buttons and sections
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Add active class to clicked button and corresponding section
        document.getElementById(sectionId + 'Btn').classList.add('active');
        document.getElementById(sectionId + 'Section').classList.add('active');
    }
    
    chatBtn.addEventListener('click', () => setActiveSection('chat'));
    journalBtn.addEventListener('click', () => {
        setActiveSection('journal');
        updateJournalDate();
    });
    resourcesBtn.addEventListener('click', () => setActiveSection('resources'));
    
    // 4. Journal Functionality
    function updateJournalDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        journalDateEl.textContent = now.toLocaleDateString(undefined, options);
    }
    
    function saveJournalEntry() {
        const title = journalTitle.value.trim();
        const content = journalContent.value.trim();
        
        if (!title || !content) {
            alert('Please provide both a title and content for your journal entry.');
            return;
        }
        
        const date = new Date();
        const entry = {
            id: Date.now(),
            title,
            content,
            date: date.toISOString(),
            mood: document.querySelector('.mood.selected')?.dataset.mood || 'neutral'
        };
        
        // Get existing entries or initialize empty array
        const entries = JSON.parse(localStorage.getItem('healioJournalEntries') || '[]');
        entries.push(entry);
        
        // Save to localStorage
        localStorage.setItem('healioJournalEntries', JSON.stringify(entries));
        
        // Clear form
        journalTitle.value = '';
        journalContent.value = '';
        
        // Reload entries display
        displayJournalEntries();
        
        alert('Journal entry saved successfully!');
    }
    
    function displayJournalEntries() {
        const entries = JSON.parse(localStorage.getItem('healioJournalEntries') || '[]');
        
        if (entries.length === 0) {
            journalEntries.innerHTML = '<p class="empty-state">No entries yet. Start writing today!</p>';
            return;
        }
        
        // Sort entries by date (newest first)
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        journalEntries.innerHTML = '';
        entries.forEach(entry => {
            const entryDate = new Date(entry.date);
            const formattedDate = entryDate.toLocaleDateString();
            
            const entryElement = document.createElement('div');
            entryElement.className = 'journal-entry-card';
            entryElement.dataset.id = entry.id;
            
            let moodEmoji = '';
            switch(entry.mood) {
                case 'great': moodEmoji = '😄'; break;
                case 'good': moodEmoji = '🙂'; break;
                case 'okay': moodEmoji = '😐'; break;
                case 'sad': moodEmoji = '😔'; break;
                case 'terrible': moodEmoji = '😢'; break;
                default: moodEmoji = '';
            }
            
            entryElement.innerHTML = `
                <div class="journal-entry-title">${entry.title} ${moodEmoji}</div>
                <div class="journal-entry-date">${formattedDate}</div>
            `;
            
            entryElement.addEventListener('click', () => {
                // Load entry for viewing/editing
                journalTitle.value = entry.title;
                journalContent.value = entry.content;
                updateJournalDate();
            });
            
            journalEntries.appendChild(entryElement);
        });
    }
    
    // Initialize journal
    updateJournalDate();
    displayJournalEntries();
    
    saveJournalBtn.addEventListener('click', saveJournalEntry);
    
    // 5. Mood Tracking
    moodOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all moods
            moodOptions.forEach(m => m.classList.remove('selected'));
            
            // Add selected class to clicked mood
            this.classList.add('selected');
            
            // Store selected mood
            localStorage.setItem('healioCurrentMood', this.dataset.mood);
            
            // Provide feedback based on mood
            const messages = document.getElementById('messages');
            const messageElement = document.createElement('div');
            messageElement.className = 'message bot-message';
            
            let responseText = '';
            switch(this.dataset.mood) {
                case 'great':
                    responseText = "I'm so happy you're feeling great today! That's awesome!";
                    break;
                case 'good':
                    responseText = "Good to hear you're doing well today!";
                    break;
                case 'okay':
                    responseText = "Feeling okay is perfectly fine. Let me know if there's anything on your mind.";
                    break;
                case 'sad':
                    responseText = "I'm sorry you're feeling down. Would you like to talk about what's bothering you?";
                    break;
                case 'terrible':
                    responseText = "I'm really sorry you're feeling terrible. I'm here for you - would it help to share what's going on?";
                    break;
            }
            
            messageElement.textContent = responseText;
            messages.appendChild(messageElement);
            messages.scrollTop = messages.scrollHeight;
            
            // Switch to chat section to show the response
            setActiveSection('chat');
        });
    });
    
    // Load saved mood
    const savedMood = localStorage.getItem('healioCurrentMood');
    if (savedMood) {
        document.querySelector(`.mood[data-mood="${savedMood}"]`)?.classList.add('selected');
    }
    
    // 6. Voice Input Integration
    voiceInputBtn.addEventListener('click', () => {
        // Check if speech recognition is defined in speech.js
        if (typeof startSpeechRecognition === 'function') {
            startSpeechRecognition();
            voiceInputBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            // Visual feedback that voice is being recorded
            voiceInputBtn.classList.add('recording');
            
            // Add event listener to stop recording if not already added
            if (!window.speechRecognitionStopListener) {
                window.speechRecognitionStopListener = true;
                
                document.addEventListener('speechRecognitionEnd', () => {
                    voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                    voiceInputBtn.classList.remove('recording');
                });
            }
        } else {
            alert('Speech recognition not available. Please make sure speech.js is properly loaded.');
        }
    });
    
    // Add send button functionality
    sendBtn.addEventListener('click', () => {
        if (input.value.trim() !== '') {
            // Trigger the enter key event to use existing message sending logic
            const event = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            input.dispatchEvent(event);
        }
    });
});
