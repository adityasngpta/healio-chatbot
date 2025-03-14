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
    const activitiesBtn = document.getElementById('activitiesBtn');
    const goalsBtn = document.getElementById('goalsBtn');
    const sections = document.querySelectorAll('.section');
    
    // Journal Elements
    const journalTitle = document.getElementById('journalTitle');
    const journalContent = document.getElementById('journalContent');
    const saveJournalBtn = document.getElementById('saveJournalBtn');
    const journalEntries = document.getElementById('journalEntries');
    const journalDateEl = document.getElementById('journalDate');
    
    // AI Journal Elements
    const journalPromptBtn = document.getElementById('journalPromptBtn');
    const journalAnalyzeBtn = document.getElementById('journalAnalyzeBtn');
    const journalExpandBtn = document.getElementById('journalExpandBtn');
    const journalAiResponse = document.getElementById('journalAiResponse');

    // Quick Response Elements
    const quickResponses = document.getElementById('quickResponses');
    
    // Activity Elements
    const startBreathingBtn = document.querySelector('#breathingExercise .start-activity-btn');
    const breathingCircle = document.querySelector('.breathing-circle');
    const breathingInstruction = document.querySelector('.breathing-instruction');
    const saveGratitudeBtn = document.querySelector('.save-gratitude-btn');
    const gratitudeInputs = document.querySelectorAll('.gratitude-input');
    const reframeBtn = document.querySelector('.reframe-btn');
    
    // Goal Elements
    const goalInput = document.getElementById('goalInput');
    const goalCategory = document.getElementById('goalCategory');
    const addGoalBtn = document.getElementById('addGoalBtn');
    const goalsList = document.getElementById('goalsList');
    
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
    activitiesBtn.addEventListener('click', () => setActiveSection('activities'));
    goalsBtn.addEventListener('click', () => {
        setActiveSection('goals');
        displayGoals();
    });
    
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
    
    // 5. AI Journal Assistant
    function showJournalAiResponse(response) {
        journalAiResponse.textContent = response;
        journalAiResponse.classList.add('active');
    }
    
    // Journal Prompts
    const journalPrompts = [
        "What made you smile today?",
        "What's something challenging you're facing right now?",
        "What are three things you're grateful for today?",
        "How are you feeling about school this week?",
        "Describe a recent interaction that had an impact on you.",
        "What's something you're looking forward to?",
        "What's one thing you'd like to improve about yourself?",
        "Describe a recent accomplishment, no matter how small.",
        "How did you take care of yourself today?",
        "What's something you learned recently?",
    ];
    
    journalPromptBtn.addEventListener('click', () => {
        const randomPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
        showJournalAiResponse(`Journal Prompt: ${randomPrompt}`);
    });
    
    journalAnalyzeBtn.addEventListener('click', () => {
        const content = journalContent.value.trim();
        if (!content) {
            alert('Please write something in your journal before analyzing.');
            return;
        }
        
        // Simple sentiment analysis (would be replaced by actual AI in a real implementation)
        let sentiment = 'neutral';
        const positiveWords = ['happy', 'good', 'great', 'excellent', 'love', 'joy', 'excited', 'wonderful', 'enjoy'];
        const negativeWords = ['sad', 'bad', 'awful', 'terrible', 'hate', 'angry', 'upset', 'stressed', 'worried', 'anxious'];
        
        const words = content.toLowerCase().split(/\W+/);
        let positiveCount = 0;
        let negativeCount = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
        });
        
        if (positiveCount > negativeCount) sentiment = 'positive';
        else if (negativeCount > positiveCount) sentiment = 'negative';
        
        // Create analysis response
        let response = `I notice your entry has a generally ${sentiment} tone. `;
        
        if (sentiment === 'positive') {
            response += "It seems you're in a good mindset! Consider reflecting on what contributed to these positive feelings so you can repeat these experiences.";
        } else if (sentiment === 'negative') {
            response += "It seems you might be going through something difficult. Remember that acknowledging your feelings is an important first step. Would talking to someone you trust help?";
        } else {
            response += "Your entry seems balanced. Is there anything specific you'd like to explore further about what you wrote?";
        }
        
        showJournalAiResponse(response);
    });
    
    journalExpandBtn.addEventListener('click', () => {
        const content = journalContent.value.trim();
        if (!content) {
            alert('Please write something in your journal before expanding.');
            return;
        }
        
        const lastSentence = content.split(/[.!?]/).filter(s => s.trim().length > 0).pop();
        
        if (!lastSentence) {
            showJournalAiResponse("Try adding more details to your journal entry. What were you feeling in that moment?");
            return;
        }
        
        // Generate follow-up questions based on the last sentence
        const followUpQuestions = [
            `You wrote "${lastSentence}." How did this make you feel?`,
            `When you mention "${lastSentence}", what thoughts come to mind?`,
            `Consider exploring more about "${lastSentence}". What led to this situation?`,
            `Regarding "${lastSentence}", how might this affect your decisions moving forward?`
        ];
        
        const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
        showJournalAiResponse(randomQuestion);
    });
    
    // 6. Mood Tracking
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
    
    // 7. Quick Response Buttons
    document.querySelectorAll('.quick-response-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const responseText = this.getAttribute('data-response');
            input.value = responseText;
            
            // Trigger the enter key event to send the message
            const event = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            input.dispatchEvent(event);
        });
    });
    
    // 8. Breathing Exercise
    let breathingInterval;
    
    startBreathingBtn.addEventListener('click', function() {
        if (this.textContent === 'Start') {
            this.textContent = 'Stop';
            startBreathingExercise();
        } else {
            this.textContent = 'Start';
            stopBreathingExercise();
        }
    });
    
    function startBreathingExercise() {
        let phase = 'inhale';
        updateBreathingUI(phase);
        
        breathingInterval = setInterval(() => {
            if (phase === 'inhale') {
                phase = 'hold';
                updateBreathingUI(phase);
                
                setTimeout(() => {
                    phase = 'exhale';
                    updateBreathingUI(phase);
                }, 2000); // Hold for 2 seconds
            } else {
                phase = 'inhale';
                updateBreathingUI(phase);
            }
        }, 10000); // Full cycle is about 10 seconds
    }
    
    function stopBreathingExercise() {
        clearInterval(breathingInterval);
        breathingCircle.className = 'breathing-circle';
        breathingInstruction.textContent = 'Breathe in...';
    }
    
    function updateBreathingUI(phase) {
        breathingCircle.className = 'breathing-circle';
        
        switch(phase) {
            case 'inhale':
                breathingInstruction.textContent = 'Breathe in slowly...';
                breathingCircle.classList.add('inhale');
                break;
            case 'hold':
                breathingInstruction.textContent = 'Hold...';
                break;
            case 'exhale':
                breathingInstruction.textContent = 'Breathe out slowly...';
                breathingCircle.classList.add('exhale');
                break;
        }
    }
    
    // 9. Gratitude Practice
    saveGratitudeBtn.addEventListener('click', () => {
        let hasEntry = false;
        
        gratitudeInputs.forEach(input => {
            if (input.value.trim()) {
                hasEntry = true;
            }
        });
        
        if (!hasEntry) {
            alert('Please enter at least one thing you are grateful for.');
            return;
        }
        
        // Save gratitude entries
        const gratitudeList = [];
        gratitudeInputs.forEach(input => {
            if (input.value.trim()) {
                gratitudeList.push(input.value.trim());
            }
        });
        
        const date = new Date();
        const gratitudeEntry = {
            date: date.toISOString(),
            items: gratitudeList
        };
        
        // Get existing entries or initialize empty array
        const entries = JSON.parse(localStorage.getItem('healioGratitudeEntries') || '[]');
        entries.push(gratitudeEntry);
        localStorage.setItem('healioGratitudeEntries', JSON.stringify(entries));
        
        // Clear inputs
        gratitudeInputs.forEach(input => {
            input.value = '';
        });
        
        alert('Your gratitude practice has been saved!');
    });
    
    // 10. Thought Reframing
    reframeBtn.addEventListener('click', () => {
        const negativeThought = document.querySelector('.negative-thought').value.trim();
        const positiveReframe = document.querySelector('.positive-reframe');
        
        if (!negativeThought) {
            alert('Please enter a negative thought to reframe.');
            return;
        }
        
        // Simple reframing examples (would be replaced with AI in a real implementation)
        const reframes = {
            "I can't do this": "I haven't figured out how to do this yet, but I can learn.",
            "I always mess up": "I'm learning from my mistakes and improving.",
            "Nobody likes me": "Some people may not connect with me, but there are others who appreciate me for who I am.",
            "I'm going to fail": "This is challenging, but I can prepare and do my best."
        };
        
        let reframedThought = "Try reframing this negative thought into something more balanced and realistic. For example:\n\n";
        
        // Check if we have a direct match
        if (reframes[negativeThought]) {
            reframedThought += `"${negativeThought}" → "${reframes[negativeThought]}"`;
        } else {
            // Otherwise give a general reframe
            reframedThought += `Instead of focusing on what's wrong, try thinking about what you can learn from this situation or what small steps you can take to improve things.`;
        }
        
        positiveReframe.value = reframedThought;
    });
    
    // 11. Goals Functionality
    function addGoal() {
        const goalText = goalInput.value.trim();
        const category = goalCategory.value;
        
        if (!goalText) {
            alert('Please enter a goal.');
            return;
        }
        
        const goal = {
            id: Date.now(),
            text: goalText,
            category: category,
            completed: false,
            date: new Date().toISOString()
        };
        
        // Get existing goals or initialize empty array
        const goals = JSON.parse(localStorage.getItem('healioGoals') || '[]');
        goals.push(goal);
        
        // Save to localStorage
        localStorage.setItem('healioGoals', JSON.stringify(goals));
        
        // Clear input
        goalInput.value = '';
        
        // Display goals
        displayGoals();
    }
    
    function displayGoals() {
        const goals = JSON.parse(localStorage.getItem('healioGoals') || '[]');
        
        if (goals.length === 0) {
            goalsList.innerHTML = '<p class="empty-state">No goals yet. Add your first wellness goal above!</p>';
            return;
        }
        
        goalsList.innerHTML = '';
        goals.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = `goal-item ${goal.category}`;
            goalElement.dataset.id = goal.id;
            
            const checkbox = document.createElement('div');
            checkbox.className = `goal-checkbox${goal.completed ? ' completed' : ''}`;
            if (goal.completed) {
                checkbox.innerHTML = '<i class="fas fa-check"></i>';
            }
            
            checkbox.addEventListener('click', () => {
                toggleGoalCompletion(goal.id);
            });
            
            const goalContent = document.createElement('div');
            goalContent.className = 'goal-content';
            
            const goalText = document.createElement('div');
            goalText.className = 'goal-text';
            goalText.textContent = goal.text;
            if (goal.completed) {
                goalText.style.textDecoration = 'line-through';
                goalText.style.opacity = '0.7';
            }
            
            const categoryText = document.createElement('div');
            categoryText.className = 'goal-category';
            let categoryName = '';
            switch(goal.category) {
                case 'physical': categoryName = 'Physical Health'; break;
                case 'mental': categoryName = 'Mental Wellbeing'; break;
                case 'social': categoryName = 'Social Connection'; break;
                case 'academic': categoryName = 'Academic Success'; break;
                default: categoryName = 'Other';
            }
            categoryText.textContent = categoryName;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'goal-delete';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteGoal(goal.id);
            });
            
            goalContent.appendChild(goalText);
            goalContent.appendChild(categoryText);
            
            goalElement.appendChild(checkbox);
            goalElement.appendChild(goalContent);
            goalElement.appendChild(deleteBtn);
            
            goalsList.appendChild(goalElement);
        });
    }
    
    function toggleGoalCompletion(goalId) {
        const goals = JSON.parse(localStorage.getItem('healioGoals') || '[]');
        
        const updatedGoals = goals.map(goal => {
            if (goal.id == goalId) {
                goal.completed = !goal.completed;
            }
            return goal;
        });
        
        localStorage.setItem('healioGoals', JSON.stringify(updatedGoals));
        displayGoals();
    }
    
    function deleteGoal(goalId) {
        const goals = JSON.parse(localStorage.getItem('healioGoals') || '[]');
        const updatedGoals = goals.filter(goal => goal.id != goalId);
        localStorage.setItem('healioGoals', JSON.stringify(updatedGoals));
        displayGoals();
    }
    
    addGoalBtn.addEventListener('click', addGoal);
    
    // 12. Voice Input Integration
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
