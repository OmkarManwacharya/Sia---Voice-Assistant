const mic = document.getElementById('mic-animation');
const status = document.getElementById('status');
const responseContainer = document.getElementById('response-container');

const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;
let isListening = false;

// Mock device state
let deviceState = { brightness: 50, volume: 50, wifi: true, lights: false, thermostat: 22 };

// Local storage for tasks
const tasks = JSON.parse(localStorage.getItem('siaTasks')) || { reminders: [], todos: [], alarms: [] };

// Skills registry
const skills = {
    trivia: () => `Question: What is the capital of France? Answer: Paris.`,
    joke: () => `Why did the scarecrow become a motivational speaker? Because he was outstanding in his field!`,
    fact: () => `Did you know? The shortest war in history lasted 38 minutes.`,
    news: () => `Headlines: Scientists discover new species in the Pacific Ocean.`,
    timer: (seconds) => {
        setTimeout(() => {
            speak('Timer finished!');
            updateResponse('<strong>Sia:</strong> Timer finished!');
        }, seconds * 1000);
        return `Timer set for ${seconds} seconds.`;
    }
};

// Check Web Speech API support
if (!recognition) {
    updateStatus('Sorry, your browser does not support speech recognition.', true);
    updateResponse('<strong>Sia:</strong> Speech recognition is not supported. Please use Chrome or Edge.');
    speak('Speech recognition is not supported.');
    throw new Error('SpeechRecognition API not supported');
}

const recognizer = new recognition();
recognizer.lang = 'en-US';
recognizer.interimResults = false;
recognizer.maxAlternatives = 1;

function saveTasks() {
    try {
        localStorage.setItem('siaTasks', JSON.stringify(tasks));
    } catch (e) {
        updateResponse('<strong>Sia:</strong> Error saving tasks: Storage full or disabled.');
        speak('Error saving tasks.');
    }
}

function speak(text) {
    try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.volume = deviceState.volume / 100;
        utterance.rate = 1;
        utterance.pitch = 1;
        synth.speak(utterance);
    } catch (e) {
        updateResponse('<strong>Sia:</strong> Error with speech synthesis: ' + e.message);
    }
}

function updateStatus(message, isError = false) {
    status.textContent = message;
    status.className = isError ? 'error' : '';
}

function updateResponse(message) {
    responseContainer.innerHTML += `<p>${message}</p>`;
    responseContainer.scrollTop = responseContainer.scrollHeight;
}

function createCalculator() {
    const calculatorHTML = `
        <div id="calculator" style="margin-top: 20px; padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <input id="calc-input" type="text" readonly style="width: 100%; padding: 10px; font-size: 1.2rem; margin-bottom: 10px;">
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;">
                <button onclick="document.getElementById('calc-input').value = ''">C</button>
                <button onclick="document.getElementById('calc-input').value += '7'">7</button>
                <button onclick="document.getElementById('calc-input').value += '8'">8</button>
                <button onclick="document.getElementById('calc-input').value += '9'">9</button>
                <button onclick="document.getElementById('calc-input').value += '4'">4</button>
                <button onclick="document.getElementById('calc-input').value += '5'">5</button>
                <button onclick="document.getElementById('calc-input').value += '6'">6</button>
                <button onclick="document.getElementById('calc-input').value += '+'">+</button>
                <button onclick="document.getElementById('calc-input').value += '1'">1</button>
                <button onclick="document.getElementById('calc-input').value += '2'">2</button>
                <button onclick="document.getElementById('calc-input').value += '3'">3</button>
                <button onclick="document.getElementById('calc-input').value += '-'">-</button>
                <button onclick="document.getElementById('calc-input').value += '0'">0</button>
                <button onclick="document.getElementById('calc-input').value += '.'">.</button>
                <button onclick="try { document.getElementById('calc-input').value = eval(document.getElementById('calc-input').value) } catch(e) { document.getElementById('calc-input').value = 'Error' }">=</button>
                <button onclick="document.getElementById('calc-input').value += '*'">×</button>
                <button onclick="document.getElementById('calc-input').value += '/'">÷</button>
            </div>
        </div>`;
    responseContainer.innerHTML += calculatorHTML;
}

function createNotepad() {
    const notepadHTML = `
        <div id="notepad" style="margin-top: 20px; padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <textarea id="notepad-text" style="width: 100%; height: 150px; padding: 10px; font-size: 1rem;" aria-label="Notepad for text input"></textarea>
            <button onclick="document.getElementById('notepad-text').value = ''" style="margin-top: 10px;">Clear</button>
        </div>`;
    responseContainer.innerHTML += notepadHTML;
}

function createFileReader() {
    const fileReaderHTML = `
        <div id="file-reader" style="margin-top: 20px; padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <input type="file" id="file-input" accept=".txt" style="margin-bottom: 10px;" aria-label="Upload a text file">
            <button onclick="readFile()" style="padding: 5px 10px;">Read File</button>
            <div id="file-content" style="margin-top: 10px; max-height: 150px; overflow-y: auto;"></div>
        </div>`;
    responseContainer.innerHTML += fileReaderHTML;
}

window.readFile = function() {
    const fileInput = document.getElementById('file-input');
    if (!fileInput) {
        updateResponse('<strong>Sia:</strong> File reader not initialized. Say "read file" to open it.');
        speak('File reader not initialized.');
        return;
    }
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (!file.type.includes('text') || file.size > 1024 * 1024) {
            updateResponse('<strong>Sia:</strong> Please select a valid text file under 1MB.');
            speak('Please select a valid text file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('file-content').textContent = e.target.result;
            updateResponse('<strong>Sia:</strong> File content loaded.');
            speak('File content loaded.');
        };
        reader.onerror = () => {
            updateResponse('<strong>Sia:</strong> Error reading file.');
            speak('Error reading file.');
        };
        reader.readAsText(file);
    } else {
        updateResponse('<strong>Sia:</strong> Please select a text file first.');
        speak('Please select a text file first.');
    }
};

async function fetchWeather(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=your_api_key&units=metric`);
        if (!response.ok) throw new Error('Weather API error');
        const data = await response.json();
        return `The weather in ${data.name} is ${data.weather[0].description} with a temperature of ${data.main.temp}°C.`;
    } catch (e) {
        return `Sorry, I couldn't fetch the weather for ${city}. Please check your connection or try another city.`;
    }
}

async function fetchNews() {
    try {
        const response = await fetch('https://newsapi.org/v2/top-headlines?country=us&apiKey=your_api_key');
        if (!response.ok) throw new Error('News API error');
        const data = await response.json();
        return `Top headline: ${data.articles[0].title}.`;
    } catch (e) {
        return skills.news(); // Fallback to mock news
    }
}

function checkAlarms() {
    try {
        const now = new Date();
        tasks.alarms.forEach(alarm => {
            const alarmTime = new Date(alarm.time);
            if (now >= alarmTime && !alarm.triggered) {
                speak(`Alarm: ${alarm.label || 'Time’s up!'}`);
                updateResponse(`<strong>Sia:</strong> Alarm: ${alarm.label || 'Time’s up!'}`);
                alarm.triggered = true;
                saveTasks();
            }
        });
    } catch (e) {
        updateResponse('<strong>Sia:</strong> Error checking alarms: ' + e.message);
    }
}

setInterval(checkAlarms, 1000);

function processCommand(command) {
    command = command.toLowerCase().trim().replace(/\s+/g, ' ');
    let response = '';

    // Hindi command mapping
    const hindiCommands = {
        'कैलकुलेटर खोलो': 'open calculator',
        'नोटपैड खोलो': 'open notepad',
        'यूट्यूब खोलो': 'open youtube',
        'वॉल्यूम बढ़ाओ': 'increase volume',
        'वॉल्यूम कम करो': 'decrease volume',
        'खोजो': 'search'
    };
    if (hindiCommands[command]) command = hindiCommands[command];

    const appMappings = {
        'youtube': 'https://www.youtube.com',
        'spotify': 'https://open.spotify.com',
        'whatsapp': 'https://web.whatsapp.com',
        'google': 'https://www.google.com',
        'netflix': 'https://www.netflix.com',
        'gmail': 'https://mail.google.com',
        'twitter': 'https://x.com',
        'facebook': 'https://www.facebook.com',
        'calculator': () => {
            createCalculator();
            return 'Opening calculator...';
        },
        'notepad': () => {
            createNotepad();
            return 'Opening notepad...';
        },
        'filereader': () => {
            createFileReader();
            return 'Opening file reader...';
        }
    };

    try {
        if (command.match(/(general|general queries)/)) {
            response = 'I can answer general questions or perform internet tasks. Try searching or opening a website!';
        } else if (command.match(/(realtime|realtime queries)/)) {
            response = `The current time is ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}. What's next?`;
        } else if (command.match(/(automate|automate queries)/)) {
            response = 'I can automate internet tasks. Try opening a website, searching, or setting a reminder.';
        } else if (command.match(/(search|find|look up)\s+(.+)/)) {
            const query = command.match(/(search|find|look up)\s+(.+)/)[2].trim();
            response = `Searching for ${query}...`;
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        } else if (command.match(/(open|go to|start|launch|visit)\s+(.+)/)) {
            const match = command.match(/(open|go to|start|launch|visit)\s+(.+)/);
            const app = match[2].trim().replace(/\s+/g, '');
            if (appMappings[app]) {
                if (typeof appMappings[app] === 'string') {
                    response = `Opening ${app}...`;
                    window.open(appMappings[app], '_blank');
                } else {
                    response = appMappings[app]();
                }
            } else {
                response = `Trying to open ${app}...`;
                window.open(`https://www.${app}.com`, '_blank');
            }
        } else if (command.match(/(check|show) weather (in )?(.+)/)) {
            const city = command.match(/(check|show) weather (in )?(.+)/)[3].trim();
            response = `Fetching weather for ${city}...`;
            updateResponse(`<strong>Sia:</strong> ${response}`);
            fetchWeather(city).then(weather => {
                updateResponse(`<strong>Sia:</strong> ${weather}`);
                speak(weather);
            });
        } else if (command.match(/(check|show) news/)) {
            response = 'Fetching top news...';
            updateResponse(`<strong>Sia:</strong> ${response}`);
            fetchNews().then(news => {
                updateResponse(`<strong>Sia:</strong> ${news}`);
                speak(news);
            });
        } else if (command.match(/(post|tweet|share) (.+)/)) {
            const content = command.match(/(post|tweet|share) (.+)/)[2].trim();
            response = `Opening Twitter to post: "${content}"...`;
            window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(content)}`, '_blank');
        } else if (command.match(/(check|open) (email|mail)/)) {
            response = 'Opening Gmail...';
            window.open('https://mail.google.com', '_blank');
        } else if (command.match(/(play|watch) (.+) (video|movie)/)) {
            const query = command.match(/(play|watch) (.+) (video|movie)/)[2].trim();
            response = `Searching for ${query} on YouTube...`;
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
        } else if (command.match(/(translate) (.+) (to|into) (.+)/)) {
            const text = command.match(/(translate) (.+) (to|into) (.+)/)[2].trim();
            const lang = command.match(/(translate) (.+) (to|into) (.+)/)[4].trim();
            response = `Translating "${text}" to ${lang}...`;
            window.open(`https://translate.google.com/?sl=auto&tl=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}`, '_blank');
        } else if (command.match(/turn (on|off) lights/)) {
            deviceState.lights = command.includes('on');
            response = `Turning ${command.includes('on') ? 'on' : 'off'} the lights...`;
        } else if (command.match(/set thermostat to (\d+)/)) {
            const temp = parseInt(command.match(/set thermostat to (\d+)/)[1]);
            deviceState.thermostat = temp;
            response = `Setting thermostat to ${temp} degrees...`;
        } else if (command.match(/(increase|turn up) brightness/)) {
            deviceState.brightness = Math.min(deviceState.brightness + 10, 100);
            response = `Brightness increased to ${deviceState.brightness}%.`;
        } else if (command.match(/(decrease|turn down) brightness/)) {
            deviceState.brightness = Math.max(deviceState.brightness - 10, 0);
            response = `Brightness decreased to ${deviceState.brightness}%.`;
        } else if (command.match(/(increase|turn up) volume/)) {
            deviceState.volume = Math.min(deviceState.volume + 10, 100);
            response = `Volume increased to ${deviceState.volume}%.`;
        } else if (command.match(/(decrease|turn down) volume/)) {
            deviceState.volume = Math.max(deviceState.volume - 10, 0);
            response = `Volume decreased to ${deviceState.volume}%.`;
        } else if (command.match(/turn (on|off) wifi/)) {
            deviceState.wifi = command.includes('on');
            response = `Wi-Fi turned ${command.includes('on') ? 'on' : 'off'}.`;
        } else if (command.match(/set reminder (.+)/)) {
            const reminderText = command.match(/set reminder (.+)/)[1].trim();
            tasks.reminders.push({ text: reminderText, time: new Date().toISOString() });
            saveTasks();
            response = `Reminder set: ${reminderText}`;
        } else if (command.match(/add (to do|todo) (.+)/)) {
            const todoText = command.match(/add (to do|todo) (.+)/)[2].trim();
            tasks.todos.push({ text: todoText });
            saveTasks();
            response = `Added to your to-do list: ${todoText}`;
        } else if (command.match(/set alarm (.+?) (in (\d+) minutes|at (.+))/)) {
            const match = command.match(/set alarm (.+?) (in (\d+) minutes|at (.+))/);
            const label = match[1].trim();
            let time;
            if (match[3]) {
                time = new Date(Date.now() + parseInt(match[3]) * 60000);
            } else {
                time = new Date(match[4]);
                if (isNaN(time)) {
                    response = 'Invalid time format. Please say "set alarm [label] in [X] minutes".';
                    updateResponse(`<strong>Sia:</strong> ${response}`);
                    speak(response);
                    return;
                }
            }
            tasks.alarms.push({ label, time: time.toISOString(), triggered: false });
            saveTasks();
            response = `Alarm set for ${label} ${match[2]}.`;
        } else if (command.match(/(play music|play song)/)) {
            response = 'Opening Spotify web player...';
            window.open('https://open.spotify.com', '_blank');
        } else if (command.match(/good morning/)) {
            deviceState.lights = true;
            response = `Good morning! The time is ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}. Lights are on.`;
        } else if (command.match(/set timer for (\d+) seconds/)) {
            const seconds = parseInt(command.match(/set timer for (\d+) seconds/)[1]);
            response = skills.timer(seconds);
        } else if (command.match(/(play trivia|trivia)/)) {
            response = skills.trivia();
        } else if (command.match(/(tell joke|joke)/)) {
            response = skills.joke();
        } else if (command.match(/(tell fact|fact)/)) {
            response = skills.fact();
        } else if (command.match(/(get news|news)/)) {
            response = skills.news();
        } else if (command.match(/(read file|open file)/)) {
            response = appMappings['filereader']();
        } else {
            response = `I didn't understand "${command}". Searching for it...`;
            window.open(`https://www.google.com/search?q=${encodeURIComponent(command)}`, '_blank');
        }
        updateResponse(`<strong>Sia:</strong> ${response}`);
        speak(response);
    } catch (e) {
        updateResponse(`<strong>Sia:</strong> Error processing command: ${e.message}`);
        speak('Error processing command.');
    }
}

mic.addEventListener('click', () => {
    if (!isListening) {
        try {
            recognizer.start();
            mic.classList.add('listening');
            updateStatus('Listening...');
            isListening = true;
        } catch (error) {
            updateStatus('Error starting recognition: ' + error.message, true);
            updateResponse('<strong>Sia:</strong> Failed to start speech recognition. Check microphone permissions.');
            speak('Failed to start speech recognition.');
        }
    } else {
        recognizer.stop();
        mic.classList.remove('listening');
        updateStatus('Microphone is off. Click to start listening...');
        isListening = false;
    }
});

recognizer.onresult = (event) => {
    try {
        const transcript = event.results[0][0].transcript;
        updateResponse(`<strong>You:</strong> ${transcript}`);
        processCommand(transcript);
    } catch (e) {
        updateResponse(`<strong>Sia:</strong> Error processing speech result: ' + e.message`);
        speak('Error processing speech result.');
    }
};

recognizer.onerror = (event) => {
    mic.classList.remove('listening');
    isListening = false;
    let errorMessage = '';
    switch (event.error) {
        case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.';
            break;
        case 'audio-capture':
            errorMessage = 'Microphone not found or not accessible. Please check your device.';
            break;
        case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone permissions.';
            break;
        case 'network':
            errorMessage = 'Network error with speech recognition. Please check your connection.';
            break;
        default:
            errorMessage = `Speech recognition error: ${event.error}`;
    }
    updateStatus(errorMessage, true);
    updateResponse(`<strong>Sia:</strong> ${errorMessage}`);
    speak(errorMessage);
};

recognizer.onend = () => {
    if (isListening) {
        try {
            recognizer.start();
        } catch (e) {
            mic.classList.remove('listening');
            isListening = false;
            updateStatus('Error restarting recognition: ' + e.message, true);
            updateResponse('<strong>Sia:</strong> Failed to restart speech recognition.');
            speak('Failed to restart speech recognition.');
        }
    } else {
        mic.classList.remove('listening');
        updateStatus('Microphone is off. Click to start listening...');
    }
};

// Handle video errors
mic.addEventListener('error', () => {
    mic.style.display = 'none';
    const fallbackImg = document.createElement('img');
    fallbackImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"><path fill="#007bff" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm0-10l-4 4h3v4h2v-4h3l-4-4z"/></svg>';
    fallbackImg.alt = 'Microphone icon (video failed)';
    fallbackImg.style.width = '100px';
    fallbackImg.style.height = '100px';
    mic.parentNode.appendChild(fallbackImg);
    updateResponse('<strong>Sia:</strong> Error loading microphone animation. Using fallback icon.');
    speak('Error loading microphone animation.');
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        mic.click();
    }
});

// Initial greeting
updateResponse('Hello! I am Sia, your voice assistant. Try saying "Search for cats", "Open YouTube", "Check weather in Delhi", "Post hello world", or "Set timer for 10 seconds".');
speak('Hello! I am Sia, your voice assistant. Click the microphone to start.');