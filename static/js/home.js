// home.js

// window.onerror = function(message, source, lineno, colno, error) {
//     console.log('llfe: window.onerror');

//     let fileName = source.split('/').pop();
//     showMessage('error',  `
//         ${message}<br>
//         &bull; file name: ${fileName}<br>
//         &bull; line: ${lineno}
//     `, 30000, true)

// };

let body = document.querySelector('body');
const header = document.querySelector('header');
let center_content = document.querySelector('.text_container')

let mainOverlay = document.querySelector('.mainOverlay');

// عناصر الDOM
let dom_items = {
    text_container: document.querySelector('.text_container .typing-state .text'),
    words: document.querySelectorAll('.text_container .typing-state .text .word'),
    letters: document.querySelectorAll('.text_container .typing-state .text .letter'),
};

// لحالات واوضاع اللعبة
let state = {
    letter_index: 0,
    word_index: 0,

    currentWord: 0,

    isInGame: false,
    page: 'home',
    isInfinityTest: false,
    quoteSource: '',

    caretPaddingX: 0,
    caretPaddingy: 0,

    hasShortcut: false,

    global_wordId: 0,
};


function getWeakWords(letters, words) {
    // console.log('lffe: getWeakWords');

    let weakWords = [];

    for (const word of words) {
        for (const letter of letters) {
            if (word.includes(letter)) {
                weakWords.push(word);
                break;
            };
        };
    };

    return weakWords;
};

let saved_states = {
    dataList: [],
    quote:  {
        data: [],        
        currentQuoteList: [],
        source: '',

    },
    customText: [],

    sounds: {
        correctLetter: null,
        incorrectLetter: null,
        extraLetter: null,
        correctWord: null,
        incorrectWord: null,
        backspace: null,
    }
};

let current_game_states = [
    {time: 120, elementInner: '120'},
    {punctcuations: false, numbers: true},
    {   
        mode: 'time',
        quoteLong: 'auto', 
        wordsCount: 10, 
        quoteElementInner: 'Auto',
        elementInner: 'time',
        customTextIndex: 0,
        textMode: 'save',
        currentCustomText: null, 
        currentCustomName: null,
    },
];

let timer = {
    default: 5,
    timeLeft: 5,
    interval: null,  
    running: false
};

let canRunTransitionAnimation = true;
let canChangeLanguage = true;
let testSettingsOpened = true;
let language_info;
let letterStatsCurrentOption;

let firstChangeLanguage = true;
async function change_language(fileName, element, spliceNum, languageName, dir) {
    if(state.page != 'home') return;
    if(!canChangeLanguage) return;

    // console.log('lffe: change_language');

    localStorage.setItem('language_info', JSON.stringify({
        fileName,
        element_name: element.innerHTML || element,
        spliceNum,
        languageName,
        dir,
    }))
    language_info = JSON.parse(localStorage.getItem('language_info'))

    letterStatsCurrentOption = language_info.languageName;

    let response = await fetch(`/static/language/json/${fileName}.json`)
    let data = await response.json()

    let language_button = document.querySelector('.language_button')
    
    data = data.splice(0, spliceNum)
    language_button.innerHTML = element.innerHTML || element;
    saved_states.dataList = data;

    hide_languages()


    if(!firstChangeLanguage) {
        change_quotes(current_game_states[2].quoteLong, language_info.languageName)
        await transmissionAnimation('restartGame')  
    }; firstChangeLanguage = false;
};


async function change_quotes(long, language) {
    //console.log('llfe: change_quotes()');

    let response = await fetch(`/data/quotes/${language}/${long}.json`);
    let data = await response.json();

    saved_states.quote.data = data;
};


const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let buffers = {};

async function loadSound(name, url) {
    //console.log('llfe: loadSound()');

    if(url.includes('/off'))  {
        buffers[name] = 'off'
    } else {

        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        buffers[name] = await audioCtx.decodeAudioData(arrayBuffer);        
    }

};  

function playSound(name, volume = 1) {
    if(name == 'off') return;

    //console.log('llfe: playSound()');

    const source = audioCtx.createBufferSource();
    source.buffer = buffers[name];
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode).connect(audioCtx.destination);
    source.start(0);
};


function resizeContainerToWords() {
    //console.log('llfe: resizeContainerToWords()');

    if(!state.isInGame) return;

    if(!dom_items.words.length) {
        console.warn('warning: returned because dom_items.words.length = 0\n');
        
        showMessage('error', `
            An error occurred while loading the word list.<br>
            This may be caused by a language configuration issue or a temporary system problem.<br><br>
            Please try the following:<br>
            &bull; Change the selected language<br>
            &bull; Reload the page<br><br>
            If the problem continues, please <a href="#">report the issue</a> so it can be fixed.
        `, 10000, false);

        return;
    };

    
    let words_height = dom_items.words[0].offsetHeight * 3;
    let typing_line_height = getComputedStyle(document.documentElement).getPropertyValue('--line-height-typing').trim();

    let typingHeightOffset = +typing_line_height.split('px')[0] * 3;
    // واحد بالمية من الطول الاصلي

    let text_container_padding = 0;

    let text_area_height = (words_height + typingHeightOffset + text_container_padding) + 'px';
    document.documentElement.style.setProperty('--text_area_height', text_area_height);
};



let customTextList = [];


let wpm_history = [];
let acc_history = [];
let consistency_history = [];

let adaptiveSettings = {
    minAttempts: {
        type: "home-slider",          
        unit: 'x',
        value: 8,
        defaultValue: 8,
    },
    errorSensitivity: {
        type: "home-slider",          
        unit: 'x',
        value: 0.3,        
        defaultValue: 0.3,        
    },
    focusStrength: {
        type: "home-slider",          
        unit: '%',
        value: 40,
        defaultValue: 40,
    },
    maxWeakLetters: {
        type: "home-slider",          
        unit: 'x',
        value: 3,
        defaultValue: 3,
    },
    // includeSpecialLetters: {
    //     type: "buttons",          
    //     unit: null,
    //     value: 'off',
    //     className: 'off',
    //     defaultValue: 'off',
    // },
    dynamicDifficulty: {
        type: "buttons",
        unit: null,
        value: 'off',
        className: 'off',
        defaultValue: 'off',
    },
};

if(JSON.parse(localStorage.getItem('adaptiveSettings')) == null) {
    localStorage.setItem('adaptiveSettings', JSON.stringify(adaptiveSettings));
} else {
    adaptiveSettings = JSON.parse(localStorage.getItem('adaptiveSettings'));
};

// === onclick for buttons ===
function onclickAdaptiveButtons(element, key, value, className) {
    //console.log('llfe: onclickAdaptiveButtons()');

    const elements = element.parentNode.querySelectorAll('*');
    const k = adaptiveSettings[key];

    elements.forEach(e => {
        e.classList.remove('isActive');
    });  element.classList.add('isActive');


    // if we are in buttons
    if(k.type.includes('buttons')) {
        adaptiveSettings[key].value = value;
        adaptiveSettings[key].className = className;
    };


    localStorage.setItem('adaptiveSettings', JSON.stringify(adaptiveSettings))
};

// === oninput and onchange for sliders ===
function oninputAdaptiveSlider(element, key) {
    //console.log('llfe: oninputAdaptiveSlider()');

    const range_number = element.parentNode.querySelector('.range_number');
    const range_slider = element.parentNode.querySelector('.range_slider');

    const value = range_slider.value;
    const unit = adaptiveSettings[key].unit;

    range_number.innerHTML = `${value}${unit}`
};

function onchangeAdaptiveSlider(element, key) {
    //console.log('llfe: onchangeAdaptiveSlider()');

    const range_number = element.parentNode.querySelector('.range_number');
    const range_slider = element.parentNode.querySelector('.range_slider');

    const k = adaptiveSettings[key];
    const value = range_slider.value;

    adaptiveSettings[key].value = value;
    localStorage.setItem('adaptiveSettings', JSON.stringify(adaptiveSettings))
};
// ===


// === all applies functions ===

// it void from global.js (LOCAL VOID "only settings.js")
function applyAdaptiveButtons() {
    //console.log('llfe: applyAdaptiveButtons()');

    let adaptiveSection = document.querySelector('.adaptiveModeContainer .adaptiveContent');

    // slider key names need to be same slider key names in (settings_states.caret > sliders)
    let domElements = {
        minAttempts: adaptiveSection.querySelector('#minAttempts'),
        errorSensitivity: adaptiveSection.querySelector('#errorSensitivity'),
        focusStrength: adaptiveSection.querySelector('#focusStrength'),
        maxWeakLetters: adaptiveSection.querySelector('#maxWeakLetters'),
        // includeSpecialLetters: adaptiveSection.querySelector('#includeSpecialLetters'),
        dynamicDifficulty: adaptiveSection.querySelector('#dynamicDifficulty'),
    };

    for(const key in adaptiveSettings) {
        const k = adaptiveSettings[key];
        
        if(k.type.includes('buttons')) {
            let adaptiveButtons = domElements[key].querySelectorAll('.global_settings_button > *');
            let adaptiveCurrentButton;

            adaptiveButtons.forEach(e => {
                e.classList.remove('isActive');

                if(e.classList.contains(k.className)) {
                   adaptiveCurrentButton = e;
                };
            });
            adaptiveCurrentButton.classList.add('isActive');
        };

        if(k.type.includes('slider')) {

            // number and slider
            let range_number = domElements[key].querySelector('.range_number');
            let range_slider = domElements[key].querySelector('.range_slider');

            // apply slider values
            range_number.innerHTML = `${k.value}${k.unit}`;
            range_slider.value = k.value;
        };
    };
};

// this function to get all applies like "applyCaretButtons()" and void from settings.js
function applyApdaptiveSettings() {
    //console.log('llfe: applyAdaptiveSettings()');

    applyAdaptiveButtons()
}; applyApdaptiveSettings()

// ===



let maxWordsAdd = 0;
let loopWordsIndex = 0;

let current_time;

let textAreaCustomText = document.getElementById('textAreaCustomText');
let textNameInput = document.getElementById('textNameInput');


showLoader(1, '0', '0', '50vh - 55px', '50% - 55px', 10, 0);


async function initSounds() {
    //console.log('llfe: initSounds()');

    const correctLetterName = settings_state.sound.soundCorrectLetter.value;
    const incorrectLetterName = settings_state.sound.soundIncorrectLetter.value;
    const extraLetterName = settings_state.sound.soundExtraLetter.value;
    const correctWordName = settings_state.sound.soundCorrectWord.value;
    const incorrectWordName = settings_state.sound.soundIncorrectWord.value;
    const backspaceName = settings_state.sound.soundBackspace.value;

    await loadSound(correctLetterName, `/data/audio/correctLetter/${correctLetterName}.wav`);
    await loadSound(incorrectLetterName, `/data/audio/incorrectLetter/${incorrectLetterName}.wav`);
    await loadSound(extraLetterName, `/data/audio/extraLetter/${extraLetterName}.wav`);
    await loadSound(correctWordName, `/data/audio/correctWord/${correctWordName}.wav`);
    await loadSound(incorrectWordName, `/data/audio/incorrectWord/${incorrectWordName}.wav`);
    await loadSound(backspaceName, `/data/audio/backspace/${backspaceName}.wav`);
}


let domLodded = false;
document.addEventListener('DOMContentLoaded', async function() {
    //console.log('llfe: addEventListener("DOMContentLoaded", async funciton() {...})');

    initSounds()

    if(JSON.parse(localStorage.getItem('letterStats')) == null) {
        localStorage.setItem('letterStats', JSON.stringify(letterStats));
    } else {
        letterStats = JSON.parse(localStorage.getItem('letterStats'));
    };
    

    
    
    if(JSON.parse(localStorage.getItem('wpm_history')) == null) {
        localStorage.setItem('wpm_history', JSON.stringify([]))
    } wpm_history = JSON.parse(localStorage.getItem('wpm_history'))


    if(JSON.parse(localStorage.getItem('current_game_states')) == null) {
        localStorage.setItem('current_game_states', JSON.stringify(current_game_states));
    }; current_game_states = JSON.parse(localStorage.getItem('current_game_states'))


    if(JSON.parse(localStorage.getItem('customTextList')) == null) {
        localStorage.setItem('customTextList', JSON.stringify(customTextList));
    }; customTextList = JSON.parse(localStorage.getItem('customTextList'))

    if(customTextList.length > 0) {
        let cleanText = customTextList[current_game_states[2].customTextIndex].text.replace(/\s+/g, ' ').trim();
        let toDataList = cleanText.split(' ');
        saved_states.customText = toDataList;
    }

    await addCurrentTime()

    
    language_info = JSON.parse(localStorage.getItem('language_info')) || null;

    if(language_info == null) {
        await change_language('english_mixed', 'English Mixed 1k (default)', 1000, 'english', 'ltr');
    } else {
        await change_language(language_info.fileName, language_info.element_name, language_info.spliceNum, language_info.languageName, language_info.dir);
    }


    if(current_game_states[2].mode == 'quote') {
        await change_quotes(current_game_states[2].quoteLong, language_info.languageName)
    }

    // اذا مود اللعبة مخصص والمخزون الحالي فارغ
    if(current_game_states[2].mode == 'custom' && current_game_states[2].currentCustomText == null) {
        current_game_states[2].mode = 'time';
    } 
    // اذا لم يتحقق الشرط السابق والمود مخصص
    else if(current_game_states[2].mode == 'custom') {
        saved_states.customText = current_game_states[2].currentCustomText.split(' ');
        textAreaCustomText.value = current_game_states[2].currentCustomText || '';
        textNameInput.value = current_game_states[2].currentCustomName || '';
    }


    randomQuoteToList();
    renderGameModeOptions();
    renderSpecialLetters();

    await transmissionAnimation('hideChart');

    hideLoader();



    domLodded = true;
});




// الملخص
let summary = {
    wordsLength: 0,
    correctWords: 0,
    incorrectWords: 0,

    correctLetters: 0,
    incorrectLetters: 0,

    // الاحرف الصحيحة بالكلمات الصحيحة بالكامل
    CLICW: 0, //Correct Letters In Correct Words
    
    mistakes: 0, // الاخطاء اللي نرتكبها لحظيا 
    mistakesPerSecond: 0,
    extra: 0,   
    missed: 0,

    lastWS: {},

    acc: 0,
    wpm: 0,
    raw: 0,
    consistency: 0,

    current_timer: 0,
};

let word_states = [];
let letterStats = {
    'english': {
        'ing': {correct: 0, incorrect: 10},
    }
};


let myChart;


function formatTime(totalSeconds) {
    //console.log('llfe: formatTime()');

    totalSeconds = Math.floor(totalSeconds); // نتأكد من عدد صحيح

    if (totalSeconds < 60) {
        // أقل من دقيقة → ثواني فقط
        return totalSeconds.toString();
    }

    let h = Math.floor(totalSeconds / 3600);
    let remaining = totalSeconds % 3600;
    let m = Math.floor(remaining / 60);
    let s = remaining % 60;

    // إضافة صفر فقط إذا الوقت >= ساعة
    let mStr = m < 10 && h > 0 ? '0' + m : m;
    let sStr = s < 10 ? '0' + s : s;

    if (h > 0) {
        // ساعة أو أكثر → h:mm:ss
        return `${h}:${mStr}:${sStr}`;
    } else {
        // أقل من ساعة → m:ss
        return `${m}:${sStr}`;
    }
};


let timer_dom = document.querySelector('.timer');
let bigTimer_dom = document.querySelector('.bigTimer');
let liveStats_dom = document.querySelector('.liveStats');
let bigLiveStats_dom = document.querySelector('.bigLiveStats');

timer_dom.innerHTML = formatTime(timer.default);
bigTimer_dom.innerHTML = formatTime(timer.default);



let currentGameRaws = [];

let frameTime = 33; // 33ms لكل Frame
let accumulatedTime = 0; // بالملي ثانية

let timeElapsed = 0;
liveStats_dom.innerHTML = Math.round(summary.wpm);
bigLiveStats_dom.innerHTML = Math.round(summary.wpm);



let elapsedPlayingTime = 0; // الوقت الصافي للعب
let lastStartTime = 0;      // وقت آخر بدء لعب
let isPaused = true;


function updateDomTimerInner() {
    if(timer.timeLeft < 0) return;

    //console.log('llfe: updateDomTimerInner()');
    
    if(current_game_states[2].mode == 'time') {
        timer_dom.innerHTML = formatTime(Math.round(timer.timeLeft));
        bigTimer_dom.innerHTML = formatTime(Math.round(timer.timeLeft));
    } else if(current_game_states[2].mode == 'adaptive') {
        timer_dom.innerHTML = formatTime(Math.round(timer.timeLeft));
        bigTimer_dom.innerHTML = formatTime(Math.round(timer.timeLeft));
    } else if(current_game_states[2].mode == 'quote') {
        timer_dom.innerHTML = `${state.currentWord + 1}/${saved_states.quote.currentQuoteList.length}`;
        bigTimer_dom.innerHTML = `${state.currentWord + 1}/${saved_states.quote.currentQuoteList.length}`;
    } else if(current_game_states[2].mode == 'words') {
        timer_dom.innerHTML = `${state.currentWord + 1}/${current_game_states[2].wordsCount}`;
        bigTimer_dom.innerHTML = `${state.currentWord + 1}/${current_game_states[2].wordsCount}`;
    } else if(current_game_states[2].mode == 'custom') {
        timer_dom.innerHTML = `${state.currentWord + 1}/${saved_states.customText.length}`;
        bigTimer_dom.innerHTML = `${state.currentWord + 1}/${saved_states.customText.length}`;
    }

    liveStats_dom.innerHTML = Math.round(summary.wpm);
    bigLiveStats_dom.innerHTML = Math.round(summary.wpm);

     

};


function startTimer() {
    if(timer.running) return; // لا تنشئ interval جديد

    //console.log('llfe: startTimer()');

    timer.running = true;
    isPaused = false;
    state.isPaused = false;
    lastStartTime = performance.now();

    timer.interval = setInterval(() => {
        if(current_game_states[2].mode == 'time' && timer.timeLeft <= 0 && !state.isInfinityTest) {
            endGame();
        } else if(current_game_states[2].mode == 'adaptive' && timer.timeLeft <= 0 && !state.isInfinityTest) {
            endGame();
        }

        accumulatedTime += frameTime;

        if(accumulatedTime >= 1000) {
            updateCounts();
            summary.mistakesPerSecond = 0;
            accumulatedTime = 0;
        }
    }, frameTime);
}


function pauseTimer(reset = false) {
    //console.log('llfe: pauseTimer()');

    if(timer.running) {
        clearInterval(timer.interval); // وقف interval
        timer.running = false;
    }

    state.isPaused = true;

    if(reset) {
        timer.timeLeft = timer.default;
        timer_dom.innerHTML = formatTime(timer.default);
        bigTimer_dom.innerHTML = formatTime(timer.default);
        liveStats_dom.innerHTML = Math.round(summary.wpm);
        bigLiveStats_dom.innerHTML = Math.round(summary.wpm);
    }

    if(!isPaused) {
        isPaused = true;
        elapsedPlayingTime += performance.now() - lastStartTime;
    }
}


function updateCounts() {
    //console.log('llfe: updateCounts()');

    // الوقت الفعلي اللحظي
    let currentElapsed = elapsedPlayingTime;
    if (!isPaused) {
        let now = performance.now();
        currentElapsed += now - lastStartTime // الوقت الصافي اللحظي أثناء اللعب
    }
    let currentTimeToTimer =  currentElapsed / 1000;


    if(timeElapsed <= 0) {
        timeElapsed = 0.1
    }
 
    // تحديث المؤقت الظاهري حسب نوع اللعبة
    if (current_game_states[2].mode == 'time') {
        if(state.isInfinityTest) {
            timer.timeLeft ++;
        } else {
            timer.timeLeft --;
        };        
    } else if (current_game_states[2].mode == 'adaptive') {
        if(state.isInfinityTest) {
            timer.timeLeft ++;
        } else {
            timer.timeLeft --;
        };        
    };

    timeElapsed = currentTimeToTimer; 
    updateDomTimerInner();

    // حساب الإحصائيات بعد ثانية
    summary.wpm = countWPM(timeElapsed) == NaN || countWPM(timeElapsed) == undefined ? 0 : countWPM(timeElapsed);
    summary.acc = countACC() == NaN || countACC() == undefined ? 0 : countACC();
    summary.raw = countRaw(timeElapsed)  == NaN || countRaw(timeElapsed) == undefined ? 0 : countRaw(timeElapsed);
    summary.consistency = countConsistency(summary.raw)  == NaN || countConsistency(summary.raw) == undefined ? 0 : countConsistency(summary.raw);

    // تحديث Chart
    updateChartData(timeElapsed, summary.wpm, summary.acc, summary.raw, summary.mistakesPerSecond);
};


function countWPM(time) {
    if(timeElapsed == 0) return 0;

    //console.log('llfe: countWPM()');

    let lastWS = summary.lastWS;

    let wsCorrectLetters = 0
    
    if(!lastWS.hasIncorrectLetter && !lastWS.extra) {
        wsCorrectLetters = lastWS.correctLetters;
    }

    let correctWordsLength = (summary.CLICW + summary.correctWords + wsCorrectLetters)

    let lettersAverges = correctWordsLength / 5;
    let timeInMinute = time / 60;

    let wpm = (lettersAverges / timeInMinute).toFixed(2);
    return wpm;
};

function countRaw(time) {
    if(timeElapsed == 0) return 0;

    //console.log('llfe: countRaw()');

    let lastWS = summary.lastWS;

    let incorrectLetters = summary.mistakes + summary.incorrectWords;
    let correctLetters = summary.correctWords + summary.correctLetters + lastWS.correctLetters;

    correctAndIncorrect = correctLetters + incorrectLetters;

    let lettersAverges = correctAndIncorrect / 5;
    let timeInMinute = time / 60;

    let raw = (lettersAverges / timeInMinute).toFixed(2)

    return +raw;
};

let correctAcc = 0;
let incorrectAcc = 0;
function countACC() {
    if(timeElapsed == 0) return 0;

    //console.log('llfe: countACC()');

    let lastWS = summary.lastWS;

    let correctLetters = summary.correctWords + summary.correctLetters + lastWS.correctLetters;
    let incorrectLetters = summary.mistakes + summary.incorrectWords;

    correctAcc = correctLetters;
    incorrectAcc = incorrectLetters;

    let acc = (correctLetters / (correctLetters + incorrectLetters) * 100).toFixed(2)

    return acc;
};

function countConsistency(currentRaw) {
    if(timeElapsed == 0) return 0;

    //console.log('llfe: countConsistency()');

    // أضف القيمة الحالية
    currentGameRaws.push(currentRaw);

    // إذا ما في قيم، رجع 0
    if  (currentGameRaws.length === 0) return 0;

    // حساب المتوسط
    const mean = currentGameRaws.reduce((a, b) => a + b, 0) / currentGameRaws.length;

    // حساب الانحراف المعياري
    const variance = currentGameRaws.reduce((sum, wpm) => sum + Math.pow(wpm - mean, 2), 0) / currentGameRaws.length;
    const std = Math.sqrt(variance);

    // حساب الثبات
    let consistency = 100 - (std / mean) * 100;

    // قص القيمة بين 0 و 100
    consistency = Math.max(0, Math.min(100, consistency));

    return +consistency.toFixed(2);
};

function getWeakLetters(lang, options = {}) {
    //console.log('llfe: getWeakLetters()');

    let minAttemptsSet = adaptiveSettings.minAttempts.value;
    let minErrorRateSet = adaptiveSettings.errorSensitivity.value;
    let maxWeakLettersSet = adaptiveSettings.maxWeakLetters.value;

    const {
        minAttempts = minAttemptsSet,
        minErrorRate = minErrorRateSet,
        limit = maxWeakLettersSet
    } = options;

    const langStats = letterStats[lang];

    if (!langStats) return [];

    return Object.entries(langStats)
        .map(([char, stats]) => {
            const total = stats.correct + stats.incorrect;
            const errorRate = total > 0 ? stats.incorrect / total : 0;

            return {
                char,
                total,
                errorRate,
                score: errorRate * Math.log(total || 1)
            };
        })
        .filter(item =>
            item.total >= minAttempts &&
            item.errorRate >= minErrorRate
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.char);
}

function update_resualts() {
    //console.log('llfe: update_resualts()');

    let stat1 = document.querySelector('.text_container .resualt-state .topstats .stats stat1')
    let stat2 = document.querySelector('.text_container .resualt-state .topstats .stats stat2')

    
    // wpm
    let topstat1 = document.querySelector('.text_container .resualt-state .topstats .stats .stat1 .topstat')
    let bottomstat1 = document.querySelector('.text_container .resualt-state .topstats .stats .stat1 .bottomstat')

    // acc
    let topstat2 = document.querySelector('.text_container .resualt-state .topstats .stats .stat2 .topstat')
    let bottomstat2 = document.querySelector('.text_container .resualt-state .topstats .stats .stat2 .bottomstat')

    if(summary.wpm >= 1000) {
        bottomstat1.textContent =  'Overflow';
        bottomstat1.style.fontSize = '45px';
        bottomstat1.style.margin = '5px 0 0 0';
    } else {
        bottomstat1.textContent = `${Math.round(summary.wpm)}`;
        bottomstat1.style.fontSize = '';
        bottomstat1.style.margin = '0';
    }    

    bottomstat2.textContent = `${Math.round(summary.acc)}%`


    
    bottomstat1.setAttribute('data-tooltip', `${summary.wpm} wpm`)
    bottomstat2.setAttribute('data-tooltip', `${summary.acc}% acc<br>correct ${correctAcc}<br>incorrect ${incorrectAcc}`);
};

let navbar_buttons = document.querySelector('.navbar_container .navbar .buttons_container')
let language_button = document.querySelector('.language_button');
let restart_button = document.querySelector('.restart_button svg');
let sidebar_container = document.querySelector('.sidebar_container');
let sidebar_buttons = document.querySelector('.sidebar_buttons');
let test_settings = document.querySelector('header .test_settings')
let footer_container = document.querySelector('footer .footer_container');

let caret = document.getElementById('caret');

function startGame() {
    //console.log('llfe: startGame()');

    timer_dom.style.opacity = 1;
    bigTimer_dom.style.opacity = 1;
    liveStats_dom.style.opacity = 1;
    bigLiveStats_dom.style.opacity = 1;
    language_button.style.opacity = 0;
    restart_button.style.opacity = 0;
    navbar_buttons.style.opacity = 0;
    sidebar_buttons.style.opacity = 0;
    test_settings.style.opacity = 0;
    footer_container.style.opacity = 0;
    body.style.cursor = 'none';

    

    setTimeout(() => {
        language_button.style.visibility = 'hidden';
        restart_button.style.visibility = 'hidden';
        sidebar_buttons.style.visibility = 'hidden';
        test_settings.style.visibility = 'hidden';
        footer_container.style.visibility = 'hidden';
    },200);
    
    startTimer();

    caret.classList.remove('caretBlink');
    caret.classList.remove('caretHide');
};

function pauseGame() {
    //console.log('llfe: pauseGame()');

    language_button.style.visibility = 'visible';
    restart_button.style.visibility = 'visible';
    sidebar_buttons.style.visibility = 'visible';
    test_settings.style.visibility = 'visible';
    footer_container.style.visibility = 'visible';

    timer_dom.style.opacity = 0;
    bigTimer_dom.style.opacity = 0;
    liveStats_dom.style.opacity = 0;
    bigLiveStats_dom.style.opacity = 0;
    language_button.style.opacity = 1;
    restart_button.style.opacity = 1;
    navbar_buttons.style.opacity = 1;
    sidebar_buttons.style.opacity = 1;
    test_settings.style.opacity = 1;
    footer_container.style.opacity = 1;
    pauseTimer(false)
    body.style.cursor = 'default'



    if(!caret.classList.contains('caretHide')) {
        caret.classList.remove('caretHide')
        caret.classList.add('caretBlink')
    }
    
};

function getMedian(arr) {

    arr = arr.map(Number);

    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    };
    
    return sorted[mid];
}

async function endGame() {
    //console.log('llfe: endGame()');

    clearInterval(timer.interval);
    
    updateSummaryLastWs()
    updateCounts()

    timer.running = false;

    state.isInGame = false;
    state.isPaused = true;

    wpm_history.push(summary.wpm)

    pauseGame(); // لاظهار العناصر المخفية
    update_resualts();
    updateMoreStats()

    transmissionAnimation('showChart');


    if(wpm_history.length > 1000) wpm_history.shift(); // عشان لا يتجاوز الحد الاقصى
    localStorage.setItem('wpm_history', JSON.stringify(wpm_history))
    localStorage.setItem('letterStats', JSON.stringify(letterStats))

    let messageWPM = `${summary.wpm} WPM`
    let comparison = summary.wpm > getMedian(wpm_history) ? `above the median`
        : summary.wpm < getMedian(wpm_history) ? "below the median"
        : "equal to the median" ;

    let correctWords = summary.correctWords;
    correctWords += summary.lastWS.isCorrect == true ? 1 
        : 0;
    let correctWordsOrWord = correctWords <= 1 ? 'correct word' : 'correct words'
    

    let incorrectWords = summary.incorrectWords;
    incorrectWords += summary.lastWS.isCorrect == true ? 0
        : summary.lastWS.isCorrect == null ? 0 
        : 1 ;
    let incorrectWordsOrWord = incorrectWords <= 1 ? 'incorrect word' : 'incorrect words'


    showMessage('success', `
        Test completed!<br>
        Your speed was <strong>${messageWPM}</strong>, which is ${comparison}.<br>
        You typed <strong>${correctWords}</strong> ${correctWordsOrWord} and made <strong>${incorrectWords}</strong> ${incorrectWordsOrWord} in <strong>${formatTimeToString(summary.current_timer, true)}</strong>.<br>
        Keep practicing and good luck in the next round!
    `, 10000, true);
    
    // لافراغ قائمة ال raw بكل مرة نعيد
    currentGameRaws = [];

    elapsedPlayingTime = 0;
    timeElapsed = 0;

    closeKeyboard()

};


async function restartGame() {
    //console.log('llfe: restartGame()');

    state.page = 'home';
  
    resetChart();
    pauseGame()

    // إعادة تعيين اعدادات الملخص
    summary = {
        wordsLength: 0,
        correctWords: 0,
        incorrectWords: 0,
        correctLetters: 0,
        incorrectLetters: 0,
        CLICW: 0, // Correct Letters In Correct Words
        mistakes: 0,
        mistakesPerSecond: 0,
        extra: 0,
        missed: 0,
        lastWS: {},
        acc: 0,
        wpm: 0,
        current_timer: 0,
    };

    clearInterval(timer.interval);

    timer.running = false;

    // إعادة ضبط المؤقت
    timer.timeLeft = timer.default;
    timer.duration = timer.default;

    let typing_container = document.querySelector('.text_container .typing-state .text');
    typing_container.innerHTML = ''; // تفريغ الـ DOM
    typing_container.style.direction = language_info.dir;

    if(current_game_states[2].mode == 'quote') randomQuoteToList();
    updateDomTimerInner()

    // إعادة اندكس الكلمات والحروف للصفر
    state.letter_index = 0;
    state.word_index = 0;
    state.currentWord = 0;
    state.global_wordId = 0;
    maxWordsAdd = 0;

    state.isInGame = true;

    word_states = []; // تفريغ word_states
    fillScreenWords(); // إضافة كلمات جديدة

    // إعادة تعيين NodeList بعد إضافة الكلمات
    dom_items.words = document.querySelectorAll('.text_container .typing-state .text .word');
    dom_items.letters = document.querySelectorAll('.text_container .typing-state .text .letter');

    requestAnimationFrame(() => {
        // تحريك المؤشر الآن بعد أن DOM جاهز
        moveCaret(dom_items.letters[state.letter_index]);
    });

};


// جلب جميع معلومات الكلمات المطلوبة
function createWordState(wordText) {
    //console.log('llfe: createWordState()');

    let chars = wordText.split('');

    return {
        char: chars, // الحروف الأصلية
        states: chars.map(() => 'pending'),
        typed: chars.map(() => null),
        word_length: chars.length,
        wordindex: 0,
        errors: 0,
        extra: [],
        isCorrect: null,
        startTime: 0,
        endTime: 0,
        correctLetterLength: 0,
        correctWordLength: 0,
        isNumber: false,
    
    };
};

function getRandomWord(list) {
    //console.log('llfe: getRandomWord()');

    if(current_game_states[2].mode == 'time' || current_game_states[2].mode == 'words') {
        let index = Math.floor(Math.random() * list.length);
        let word = list[index];

        // التحقق من اضافة ارقام أو تعديلات للكلمات
        if(current_game_states[1].punctcuations) {
            word = generatePunctuation(word);
        }
        if(current_game_states[1].numbers) {
            word = generateNumber(word)
        };
        return word;
    } else if(current_game_states[2].mode == 'adaptive') {
        const lang = language_info.languageName;
        const weakLetters = getWeakLetters(lang);
        const focusStrength = adaptiveSettings.focusStrength.value;
        const maxWeakLetters = adaptiveSettings.maxWeakLetters.value;

        let adaptiveWordsList;
        let limitWeakLetters = weakLetters;

        if(weakLetters.length) {
            if(maxWeakLetters <= weakLetters.length) {
                limitWeakLetters = weakLetters.splice(0, maxWeakLetters);
            };
            // هنا نستخدم limitWeakLetters
            adaptiveWordsList = getWeakWords(limitWeakLetters, list);
        } else {
            adaptiveWordsList = list;
        };

        if(!adaptiveWordsList.length) adaptiveWordsList = list;


        let index = Math.floor(Math.random() * list.length);
        let word = adaptiveWordsList[index];
        let rate = Math.random() < (focusStrength / 100);

        if(rate) {
            let adaptiveIndex = Math.floor(Math.random() * adaptiveWordsList.length);
            word = adaptiveWordsList[adaptiveIndex];
        } else {
            word = list[index];
        };

        // التحقق من اضافة ارقام أو تعديلات للكلمات
        if(current_game_states[1].punctcuations) {
            word = generatePunctuation(word);
        }
        if(current_game_states[1].numbers) {
            word = generateNumber(word)
        };
        return word;

    } else {
        console.warn('error undefined game mode');
        return null;
    };
};

function randomQuoteToList() {
    if(current_game_states[2].mode != 'quote') return;

    //console.log('llfe: randomQuoteToList()');

    let data = saved_states.quote.data;
    let randomIndex = Math.floor(Math.random() * data.length);
    let current_quote = data[randomIndex];


    saved_states.quote.currentQuoteList = current_quote.text.split(' ');
    saved_states.quote.source = current_quote.source;
};


function addWord(currentWord) {
    //console.log('llfe: addWord()');

    let typing_container = document.querySelector('.text_container .typing-state .text')
    let words = dom_items.words;


    let wordDiv = document.createElement('div');
    
    state.global_wordId ++;    
    wordDiv.setAttribute('data-wordId', state.global_wordId)
    wordDiv.classList.add('word');
    
    for(let i = 0; i < currentWord.length; i++) {
        let letter = document.createElement('letter');
        letter.classList.add('letter');
        letter.setAttribute('data-original', currentWord[i]);
        letter.innerHTML = currentWord[i];
        wordDiv.appendChild(letter)


    }

  
    typing_container.appendChild(wordDiv);

 
    // dom_items.text_container = typing_container

    dom_items.text_container = document.querySelector('.text_container .typing-state .text');
    dom_items.letters = document.querySelectorAll('.text_container .typing-state .text .letter');
    dom_items.words = document.querySelectorAll('.text_container .typing-state .text .word');

};

//جلب كلمات من الDOM 
function fillScreenWords() {
    if(maxWordsAdd >= current_game_states[2].wordsCount && current_game_states[2].mode == 'words') return;

    //console.log('llfe: fillScreenWords()');

    dom_items.text_container.scrollHeight = 0;

    let wordsCount = current_game_states[2].mode == 'time' ? 50
        : current_game_states[2].mode == 'adaptive' ? 50
        : current_game_states[2].mode == 'words' ? 50
        : current_game_states[2].mode == 'quote' ? saved_states.quote.currentQuoteList.length
        : current_game_states[2].mode == 'custom'? saved_states.customText.length
        : 0 ;

     


    for(let i = 0; i < wordsCount; i++) {
        if(maxWordsAdd >= current_game_states[2].wordsCount && current_game_states[2].mode == 'words') return;

        //جلب ارتفاع الحاوية وارتفاع السكرول
        const containerHeight = dom_items.text_container.offsetHeight;
        const scrollHeight = dom_items.text_container.scrollHeight;
    

        
        //نجيب الكلمة ونضيفها للdom ونضيفها للword_states
        let word = current_game_states[2].mode == 'time' ? getRandomWord(saved_states.dataList)
            : current_game_states[2].mode == 'words' ? getRandomWord(saved_states.dataList)
            : current_game_states[2].mode == 'quote' ? saved_states.quote.currentQuoteList[i]
            : current_game_states[2].mode == 'custom' ? saved_states.customText[i]
            : current_game_states[2].mode == 'adaptive' ? getRandomWord(saved_states.dataList) 
            : 'Error';


        addWord(word);

                 


        word_states.push(createWordState(word));
        word_states[i].wordindex = loopWordsIndex;

        maxWordsAdd ++;

        const wordTop = dom_items.words[i].offsetTop;
        if(current_game_states[2].mode == 'time' || current_game_states[2].mode == 'words' || current_game_states[2].mode == 'adaptive') {
            if(scrollHeight >= containerHeight * 2) break;
        };
    };

             

    //اعادة تعيين جميع البيانات 
 
};

function moveCaret(element, after) {
    if(!element) return;

    //console.log('llfe: moveCaret()');

    const caret = document.getElementById('caret');
    
    const mainContainer = document.querySelector('.text_container')
    const parentContainer = document.querySelector('.text_container .typing-state')
    const container = dom_items.text_container;

    const rect = element.getBoundingClientRect();
    const mainRect = parentContainer.getBoundingClientRect();
    const parentRect = parentContainer.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const topOffset = parentRect.top - containerRect.top ;
    const leftOffset = parentRect.left - containerRect.left;


    const scrollLeft = container.scrollLeft || 0;
    const scrollTop = container.scrollTop || 0;


    // الإحداثيات نسبة للحاوية
    const x = rect.left - containerRect.left + scrollLeft - leftOffset;
    const y = rect.top  - containerRect.top  + scrollTop - topOffset ;


    let dir = language_info.dir;

    const offset_x = state.caretPaddingX;
    const offset_y = state.caretPaddingy;


    if(dir == 'ltr') {
        if(after) {
            caret.style.transform = `translate(${(x + rect.width) + offset_x}px, ${y}px)`;
        } else {
            caret.style.transform = `translate(${(x) - offset_x}px, ${y}px)`;
        };
        timer_dom.style.textAlign = 'start'

    } else {
        if(settings_state.caret.caretShape == 'line')
            if(after) {
                caret.style.transform = `translate(${(x) - offset_x}px, ${y}px)`;
            } else {
                caret.style.transform = `translate(${(x + rect.width) + offset_x}px, ${y}px)`;
            }
        else {
            if(after) {
                caret.style.transform = `translate(${(x - rect.width) - offset_x}px, ${y}px)`;
            } else {
                caret.style.transform = `translate(${(x) + offset_x}px, ${y}px)`;
            };
        }

        timer_dom.style.textAlign = 'end'

    };


    if(rect.width != 0) {
        caret.style.width = rect.width+'px';
        caret.style.height = rect.height+'px';  
    };
};


// لاضافة عناصر لو اللاعب كبر الصفحة وكان فيه مجال
// ولتحريك المؤشر لمكانه الصحيح وبعض الامور الاخرى
function initResizeDom() {
    if(state.page != 'home') return;
    if(!domLodded) return;

    //console.log('llfe: initResizeDom()');
    
    const ws = word_states[state.word_index];
    const word = dom_items.words[state.word_index]
    let letters = dom_items.words[state.word_index].children;

    setTimeout(() => {
        if(ws.typed[ws.word_length - 1] != null) {
            moveCaret(letters[letters.length-1], true);
        }
        else {
            moveCaret(letters[state.letter_index], false);    
        };

        checkAddOrRemove(word);
        resizeContainerToWords();

        // للاضافة بغض النظر عن الشرط
        if(current_game_states[2].mode == 'time' || current_game_states[2].mode == 'words' || current_game_states[2].mode == 'adaptive') fillScreenWords();
    }, 200);
};

// للتحقق اذا الماوس تحرك وعرض العناصر

let typingInterval = null;
let lastX = null;
let lastY = null;
const threshold = 35;

document.addEventListener("mousemove", (e) => {
    if(state.isPaused) return;
    if (lastX === null || lastY === null) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
    };

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const distance = Math.sqrt(dx*dx + dy*dy);

    if (distance >= threshold) {
        
        lastX = e.clientX;
        lastY = e.clientY;

        pauseGame()
    }
});

function getExceptedLetter() {
    //console.log('llfe: getExceptedLetter()');

    return dom_items.words[state.word_index]
           ?.children[state.letter_index]
           ?.getAttribute('data-original') || null;
};


document.addEventListener('keydown', function(event) {
    //console.log('llfe: addEventListener("keydown", function(event) {...})');

    const key = event.key;
    if(state.isInGame) {
        if(event.key == ' ' || key == 'Tab') {
            event.preventDefault();
        };
    } else {
        return;
    }
    if(state.hasShortcut) return;


    let canGetLetter = key.length == 1 ? true
        : key == 'لا' ? true
        : key == 'لآ' ? true
        : false ;

    // الحرف الحالي من الكلمة الحالية
    const excepted = getExceptedLetter()

    if(canGetLetter && key != ' ' && key == excepted) {
        handleOneLetter('correct', key, excepted);
    }
    
    else if(canGetLetter && key != ' ' && key != excepted) {
        handleOneLetter('incorrect', key, excepted)
    }
    
    else if(key == ' ') {
        handleSpace('space', key, excepted, event)
    }
    
    else if(key == 'Backspace') {
        handleBackSpace('backspace', key, excepted)
    }
    
    else if(key == 'Tab') {
     // not important
    }
    else {
        //نقدر نطبع هنا لنعرف شو الزر اللي انضغط 
    };

    renderWords(key, 'correct');
    checkIsCorrect();
    
    updateSummaryLastWs();
    updateDomTimerInner();
});

function handleOneLetter(event, key, excepted) {
    //console.log('llfe: handleOneLetter()');

    startGame()

    const correctLetterPath = settings_state.sound.soundCorrectLetter;
    const incorrectLetterPath = settings_state.sound.soundIncorrectLetter;

    if(event == 'correct') {
        playSound(correctLetterPath.value, correctLetterPath.volume);
    } else if(event == 'incorrect') {
        playSound(incorrectLetterPath.value, correctLetterPath.volume);
    };


    // letterStats
    const ws = word_states[state.word_index];
    let currentChar = ws.char[state.letter_index];
    const lang = language_info.languageName;

    const weak = getWeakLetters(lang);

    if(!specialIncludes.includes(currentChar)) {
        let lowLetter = currentChar.toLowerCase();
        if(!letterStats[lang]) {
            letterStats[lang] = {};
        };      

        if(!letterStats[lang][lowLetter]) {
            letterStats[lang][lowLetter] = {
                correct: 0,
                incorrect: 0,
                history: [],
            };
        };

        const limitHistory = 20;

        if(key === lowLetter) {
            letterStats[lang][lowLetter].correct ++;
        } else {
            letterStats[lang][currentChar].incorrect ++;
        };

        letterStats[lang][lowLetter].history.push(key === lowLetter ? 1 : 0)
        if(letterStats[lang][lowLetter].history.length > limitHistory) {
            letterStats[lang][lowLetter].history.shift();
        }
    };

    

    // end letterStats


    if(!ws.startTime) {
        ws.startTime = Date.now();
    };
    
    // اذا الحرف الحالي فارغ = اكتب فيه
    if(ws.typed[state.letter_index] == null) {
        ws.states[state.letter_index] = event;
        ws.typed[state.letter_index] = key;

        summary.mistakes += event == 'incorrect' ? 1 : 0;
        summary.mistakesPerSecond += event == 'incorrect' ? 1 : 0;

        // نزيد الاندكس فقط في حالة لم نصل لاخر حرف
        if(state.letter_index < ws.word_length - 1) {
            state.letter_index++;
        }
        return;
    };

    // اذا طول الاندكس نفس او اكثر من عدد الحروف بالكلمة واذا عدد الاحرف بالاكسترا اقل من عشرة
    if(state.letter_index >= ws.word_length - 1 && ws.extra.length < 10) {
        ws.extra.push(key);
        summary.mistakes += 1;
        summary.mistakesPerSecond += 1;
    };

};

function handleSpace(event, key, excepted, default_event) {
    //console.log('llfe: handleSpace()');

    // default_event.preventDefault();
    startGame();
    let ws = word_states[state.word_index];
    let letters_not_null = 0 //عدد الاحرف المكتوبة

    const correctWordPath = settings_state.sound.soundCorrectWord;
    const incorrectWordPath = settings_state.sound.soundIncorrectWord;


    //لوب لنتحقق اذا فيه حرف مكتوب
    for(let i = 0; i < ws.word_length; i++) {
        if(ws.typed[i] != null) {
            letters_not_null ++;
        };
    };

    // اذا نحن قبل الكلمة الاخيرة وفيه على الاقل كلمة مكتوبة

    if(letters_not_null > 0) {
        if(state.word_index < dom_items.words.length - 1) {

            // وقت الانتهاء
            ws.endTime = Date.now();

            for(let i = 0; i < ws.states.length; i++) {
                if(ws.states[i] == 'correct') {
                    summary.correctLetters ++;
                } else if(ws.states[i] == 'incorrect') {
                    summary.incorrectLetters ++;
                } else if(ws.states[i] == 'pending') {
                    summary.missed ++;
                }
            };

            if(ws.isCorrect) {
                playSound(correctWordPath.value, correctWordPath.volume)
            } else{
                playSound(incorrectWordPath.value, incorrectWordPath.volume)
            } 

            summary.extra += ws.extra.length;
            summary.CLICW += ws.isCorrect ? ws.word_length : 0;

            summary.correctWords += ws.isCorrect == true ? 1 : 0;
            summary.incorrectWords += ws.isCorrect == false ? 1 : 0;

            summary.wordsLength ++;

            state.word_index ++;
            state.currentWord ++;
            state.letter_index = 0;

        } else {
            endGame()
        }; 
    };

    if(isPhone) {
        const spaceToPhoneEvent = new CustomEvent("space", { detail: { message: "get space to phone" } });
        document.dispatchEvent(spaceToPhoneEvent);
    }
};

function handleBackSpace() {
    //console.log('llfe: handleBackSpace()');
    
    startGame();
    const backspacePath = settings_state.sound.soundBackspace;
    let ws = word_states[state.word_index];

    // حذف أي حروف إضافية أولًا
    if(ws.extra.length > 0) {
        ws.extra.pop();
        return;
    };

    if(state.letter_index == 0 && state.word_index > 0 && !word_states[state.word_index-1].isCorrect) {
        state.word_index--;
        state.currentWord --;
        ws = word_states[state.word_index];
        state.letter_index = ws.word_length;


        for(let i = 0; i < ws.states.length; i++) {
            if(ws.states[i] == 'correct') {
                summary.correctLetters --;
            } else if(ws.states[i] == 'incorrect') {
                summary.incorrectLetters --;
            } else if(ws.states[i] == 'pending') {
                summary.missed --;
            }
        }
        summary.extra -= ws.extra.length;
        summary.incorrectWords--;

        summary.wordsLength --;

        // لوب ليرجع لاخر حرف مكتوب
        for(let i = ws.typed.length - 1; i >= 0; i--) {
            if(ws.typed[i] == null) {
                state.letter_index --;
            }
        };

        playSound(backspacePath.value, backspacePath.volume)

        return;
    };

    //متغير تحديد وين لازم اكون
    let back = state.letter_index - 1;
    // اذا الكلمة null ننقص عشان بالنهاية ننقل للمكان اللي نقصنا منه الnull
    while (back >= 0 && ws.typed[back] == null) {
        back --;
    };

    state.letter_index = back + 1;

    // اذا الاحرف صفر ونحن اكثر من الكلمة الاولى والكلمة السابقة غير صحيحى = رجوع
    if(state.letter_index == 0 && state.word_index > 0 && !word_states[state.word_index-1].isCorrect) {
        state.word_index--;
        state.currentWord --;
        ws = word_states[state.word_index];
        state.letter_index = ws.word_length;

        return;
    };

    // اذا الحرف الحالي ليس فارغ = احذفه مباشرة
    if(ws.typed[state.letter_index] != null) {
        ws.states[state.letter_index] = 'pending';
        ws.typed[state.letter_index] = null;

        playSound(backspacePath.value, backspacePath.volume)

        // قطع لكي لا ننزل للشرط الاخر
        return;
    };

    //اذا الحرف الحالي فارغ وليس في اول حرف = انزل للمؤشر السابق
    if(state.letter_index > 0) {
        state.letter_index--;

        playSound(backspacePath.value, backspacePath.volume)
        
        ws.states[state.letter_index] = 'pending';
        ws.typed[state.letter_index] = null;
    };
};

function checkIsCorrect() {
    //console.log('llfe: checkIsCorrect()');

    let ws = word_states[state.word_index];
    if(ws.typed.join('') == ws.char.join('') && ws.extra.length == 0) {
        ws.isCorrect = true;
    }
    else {
        ws.isCorrect = false;
    };
    let is_null_length = 0;
    for(let i = 0; i < ws.word_length; i++) {
        if(ws.typed[i] == null) {
            is_null_length ++;
        };
    };
    if(is_null_length >= ws.word_length) {
        ws.isCorrect = null;
    };  
    

    wsLastWordIndex = word_states.length - 1;

    if(ws.isCorrect) {
        if(current_game_states[2].mode == 'quote' || current_game_states[2].mode == 'words' || current_game_states[2].mode == 'custom') {
            if(state.word_index == wsLastWordIndex) {
                endGame()
            };
        };
    };
             

};

function renderExtraLetters(key) {
    //console.log('llfe: renderExtraLetters()');

    let words = dom_items.words;

    // انشاء العنصر
    let letterElement = document.createElement('letter');

    // اضافة خواص للعنصر المنشئ
    letterElement.classList.add('letter', 'incorrect_extra');
    letterElement.setAttribute('data-original', key);
    letterElement.innerHTML = key;

    // اضافته بالكلمة الحالية
    words[state.word_index].appendChild(letterElement);
    
};

function updateSummaryLastWs() {
    //console.log('llfe: updateSummaryLastWs()');

    let ws = word_states[state.word_index];

    let currentWS = {
        isCorrect: ws.isCorrect,

        correctLetters: 0,
        incorrectLetters: 0,

        extra: ws.extra.length,
        CLICW: ws.isCorrect ? ws.word_length : 0,

        hasIncorrectLetter: false,
    }

    for(let i = 0; i < ws.word_length; i++) {
        if(ws.states[i] == 'correct') {
            currentWS.correctLetters ++;
        } else if(ws.states[i] == 'incorrect') {
            currentWS.incorrectLetters ++;
            currentWS.hasIncorrectLetter = true;
        };
     };

    summary.lastWS = currentWS;
    summary.current_timer = timer.default;
};

function renderWords(key, event) {
    //console.log('llfe: renderWords()');

    const ws = word_states[state.word_index];
    const word = dom_items.words[state.word_index];
    let words = dom_items.words;
    let letters = dom_items.words[state.word_index].children;

    //لوب عكسي لحذف واعادة تعيين جميع الاحرف الاكسترا
    for(let i = letters.length - 1; i >= 0; i--) {
        if(letters[i].classList.contains('incorrect_extra')) {
            letters[i].remove();
        };
    };

    // لوب لوضع احرف الاكسترا بالكلمة الحالية بمكانهم الصحيح
    for(let i = 0; i < ws.extra.length; i++) {
        renderExtraLetters(ws.extra[i]);
    };

    //لوب لاعادة تعيين جميع حالات الحروف بالكلمة الحالية
    for(let i = 0; i < ws.word_length; i++) {
        letters[i].classList.remove('incorrect', 'correct');
    };

    for(let i = 0; i < words.length; i++) {
        words[state.word_index].classList.remove('error_under_word')
    };

    //لوب لاضافة لون الحالة لون الحالة من الخاصة بالحرف من جديد
    for(let i = 0; i < ws.word_length; i++) {
        if(ws.states[i] == 'correct') {
            letters[i].classList.add('correct');
        }

        else if(ws.states[i] == 'incorrect') {
            letters[i].classList.add('incorrect');
        };
    };

    if(ws.typed[ws.word_length - 1] != null) {
        moveCaret(letters[letters.length-1], true);
    }
    else {
        moveCaret(letters[state.letter_index], false);    
    };


    if(state.word_index > 0 && !word_states[state.word_index - 1].isCorrect) {
        words[state.word_index - 1].classList.add('error_under_word');
    };

    checkAddOrRemove(word);
};

function removeFirstRow() {
    //console.log('llfe: removeFirstRow()');

    let words = dom_items.words;
    let topWordsPosition = words[0].offsetTop;
    let firstRowWords = [];
    let removedCount = 0;


    for(let i = 0; i < words.length; i++) {
        if(Math.abs(words[i].offsetTop - topWordsPosition) < 5) {
            firstRowWords.push(words[i]);
        };
    };


    for(let i = 0; i < firstRowWords.length; i++) {
        words[i].remove();
        word_states.splice(0, 1);
        removedCount ++;
    };

    dom_items.words = document.querySelectorAll('.word');
    state.word_index -= removedCount;

    if (state.word_index < 0) state.word_index = 0;
    state.letter_index = 0;

    const currentWord = dom_items.words[state.word_index];
    const currentLetter = currentWord?.children[state.letter_index] || currentWord?.children[0];
    if (currentLetter) moveCaret(currentLetter);
};

function checkAddOrRemove(word) {
    //console.log('llfe: checkAddOrRemove()');

    const container = dom_items.text_container;

    const wordRect = word.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // موقع الحرف بالنسبة للحاوية
    const wordTopRelative = wordRect.top - containerRect.top;

    const containerMiddle = container.clientHeight / 2;

    if(wordTopRelative > containerMiddle) {
        removeFirstRow();

    
        if(current_game_states[2].mode == 'time' || current_game_states[2].mode == 'adaptive') {
            fillScreenWords();
        } else if(current_game_states[2].mode == 'words') {
            if(current_game_states[2].wordsCount >= maxWordsAdd) {
                fillScreenWords();
            };

        };

         
    };


};


let language_select = document.querySelector('.language_select')
let overlay_languages = document.querySelector('.overlay_languages')

let search_language_input = document.getElementById("search_language_input");



function show_languages() {
    //console.log('llfe: show_languages()');

    state.isInGame = false;
    overlay_languages.style.visibility = 'visible';
    language_select.style.visibility = 'visible';

    requestAnimationFrame(() => {
        overlay_languages.style.opacity = '1';
        language_select.style.opacity = '1';
        canChangeLanguage = true;
    });
    search_language_input.value = '';
    searchLanguage()
}

function hide_languages() {
    if(firstChangeLanguage) return;

    //console.log('llfe: hide_languages()');

    state.isInGame = true;
    canChangeLanguage = false;
    overlay_languages.style.opacity = '0';
    language_select.style.opacity = '0';

    setTimeout(() => {
        overlay_languages.style.visibility = 'hidden';
        language_select.style.visibility = 'hidden';

    }, 300)
};

function searchLanguage() {
    //console.log('llfe: searchLanguage()');

    const filter = search_language_input.value.toLowerCase();

    const noResult = document.querySelector('.languageNoResult')

    const ul = document.querySelector(".languages_list ul");
    const li = ul.getElementsByTagName("li");

    let resultLength = 0;

    for (let i = 0; i < li.length; i++) {
        const text = li[i].textContent.toLowerCase();

        if (text.includes(filter)) {
            li[i].style.display = "";
            resultLength ++;
        } else {
            li[i].style.display = "none";
        }
    }
    if(resultLength <= 0) {
        noResult.style.display = 'block'
    } else {
        noResult.style.display = 'none'
    }
};


let informations = document.querySelectorAll('.information');
let three_points_svg = document.querySelector('.three_points_svg');
let hide_informations = true;

function hideInformations() { 
    //console.log('llfe: hideInformation()');

    if(hide_informations) {
        for(let i = 0; i < informations.length; i++) {
            informations[i].style.opacity = 0;
        }
        three_points_svg.style.opacity = 1;

    } else {
        for(let i = 0; i < informations.length; i++) {
            informations[i].style.opacity = 1;
        }
        three_points_svg.style.opacity = 0;
    }
    hide_informations = !hide_informations;

};

let typing_correct_color = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
let typing_incorrect_color = getComputedStyle(document.documentElement).getPropertyValue('--typing-incorrect').trim();
let typing_extra_color = getComputedStyle(document.documentElement).getPropertyValue('--typing-extra').trim();
let core_muted = getComputedStyle(document.documentElement).getPropertyValue('--core-muted').trim();
let core_text = getComputedStyle(document.documentElement).getPropertyValue('--core-text').trim();


const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');

function clearCanvas() {
    //console.log('llfe: clearCanvas()');

    // مسح فعلي كامل مهما كان في scale أو transform
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
};

function colorWithOpacity(color, alpha) {

    // #RGB or #RGBA
    if (/^#([0-9a-f]{3,4})$/i.test(color)) {
        const hex = color.substring(1);
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // #RRGGBB or #RRGGBBAA
    if (/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) {
        const r = parseInt(color.slice(1,3),16);
        const g = parseInt(color.slice(3,5),16);
        const b = parseInt(color.slice(5,7),16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // rgb() or rgba()
    if (color.startsWith('rgb')) {
        const nums = color.match(/\d+/g).slice(0,3);
        return `rgba(${nums.join(',')}, ${alpha})`;
    }

    // fallback
    return color;
};



document.addEventListener("themeChanged", (e) => {
    typing_correct_color = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
    typing_incorrect_color = getComputedStyle(document.documentElement).getPropertyValue('--typing-incorrect').trim();
    core_muted = getComputedStyle(document.documentElement).getPropertyValue('--core-muted').trim();
    core_text = getComputedStyle(document.documentElement).getPropertyValue('--core-text').trim();


    data.datasets[0].borderColor = typing_correct_color;
    data.datasets[0].backgroundColor = colorWithOpacity(typing_correct_color, 0.1);
    
    data.datasets[1].borderColor = core_text;
    data.datasets[1].backgroundColor = colorWithOpacity(core_text, 0.1);
    
    data.datasets[2].borderColor = core_muted;
    data.datasets[2].backgroundColor = colorWithOpacity(core_muted, 0.1);
    
    data.datasets[3].borderColor = typing_incorrect_color;
    data.datasets[3].backgroundColor = colorWithOpacity(typing_incorrect_color, 0.1);

    myChart.update('none'); 

});


const data = {
    labels: [],
    datasets: [
        {
            label: "wpm",
            data: [],

            borderColor: typing_correct_color,
            backgroundColor: colorWithOpacity(typing_correct_color, 0.1),
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.5,
            fill: true,
            order: 4,

            legend: {
                pointStyle: 'square',
                pointRadius: 2,
                
            }
        },
        {
            label: "acc",
            data: [],
            borderColor: core_text,
            backgroundColor: colorWithOpacity(core_text, 0.1),
            borderWidth: 2,
            tension: 0.5,
            fill: false,
            order: 1,

            legend: {
                pointStyle: 'square',
                pointRadius: 14
            }

        },
        {
            label: "raw",
            data: [],
            borderColor: typing_extra_color,
            backgroundColor: colorWithOpacity(typing_extra_color, 0.1),
            borderWidth: 2.6,
            borderDash: [8, 8],  // يجعل الخط متقطع
            tension: 0.5,
            fill: false,
            order: 2,

            legend: {
                pointStyle: 'square',
                pointRadius: 14
            }

        },
        {
            label: "Mistakes",
            data: [],
            borderColor: colorWithOpacity(typing_incorrect_color, 0.5),
            backgroundColor: typing_incorrect_color,
            borderWidth: 2,
            tension: 0.5,
            showLine: false,
            borderDash: [6,7],

            pointStyle: 'crossRot',
    
        
            fill: false,
            order: 3,

            yAxisID: 'yMistakes',


            pointStyle: (ctx) => {
                const v = ctx?.parsed?.y;
                return v > 0 ? 'crossRot' : 'circle';
            },

            pointRadius: (ctx) => {
                const v = ctx?.parsed?.y;
                return v > 0 ? 4 : 0;
            },

            pointHoverRadius: (ctx) => {
                const v = ctx?.parsed?.y;
                return v > 0 ? 5 : 0;
            },

            legend: {
                pointStyle: 'square',
                pointRadius: 14,
            }
        },
    ],
};

function createLegendCross(size = 16, color = '#fff', lineWidth = 2) {
    //console.log('llfe: createLegendCross()');

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    const pad = 3;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(size - pad, size - pad);
    ctx.moveTo(size - pad, pad);
    ctx.lineTo(pad, size - pad);
    ctx.stroke();

    return canvas;
};

let hoveredLegendIndex = null;

const config = {
    type: 'line',
    data,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        devicePixelRatio: window.devicePixelRatio+0.5,

        
        animation: {
            duration: 300,          // سرعة الحركة (ms)
            easing: 'easeOutQuart', // إحساس ناعم
        },

        interaction: {
            intersect: false,
            mode: 'index'
        },

        elements: {
            line: {
                tension: 0.35       // نعومة المنحنى
            },
            point: {
                radius: 0,          // بدون نقاط مزعجة
                hoverRadius: 6
            }
        },

        // لاضافة % للدقة
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        //console.log('llfe: label: function()');

                        if(context.dataset.label === "acc") {
                            return context.dataset.label + ": " + context.parsed.y + "%";
                        }
                        return context.dataset.label + ": " + context.parsed.y;
                    }
                }
            },
            legend: {  // <-- داخل plugins
                position: 'bottom',
                align: 'end',

                

                onHover: (e, legendItem, legend) => {
                    body.style.cursor = 'pointer'
                    hoveredLegendIndex = legendItem.datasetIndex;
                    legend.chart.update();
                    
                },
    
                onLeave: (e, legendItem, legend) => {
                    body.style.cursor = 'unset'
                    hoveredLegendIndex = null;
                    legend.chart.update();
                },

                            
                labels: {
                    filter: (legendItem, chartData) => {
                        return legendItem.text !== 'wpm';
                    },
                    font: {
                        size: 10,
                        family: 'Arial',
                        weight: '300',
                    },
      
                    usePointStyle: true,
                    generateLabels: function(chart) {
                        //console.log('llfe: generateLabels: function()');

                        return chart.data.datasets.map((dataset, i) => {
                            let pointStyle = 'square';
                            let radius = 8;

                            // تخصيص لكل dataset حسب اسمه
                            if (dataset.label === 'Mistakes') {
                                pointStyle = createLegendCross(12, typing_incorrect_color);
                                radius = 10;
                            } else if (dataset.label === 'wpm') {
                                pointStyle = 'line'
                                radius= 10;
                            } else if (dataset.label === 'raw') {
                                pointStyle = 'line';
                                radius= 10;
                            } else if (dataset.label === 'acc') {
                                pointStyle = 'line';
                                radius= 10;
                            }

                            return {
                            text: dataset.label,
                            fillStyle: dataset.borderColor,
                            strokeStyle: dataset.borderColor,
                            lineWidth: dataset.borderWidth || 2,
                            hidden: !chart.isDatasetVisible(i),
                            datasetIndex: i,
                            pointStyle: pointStyle,
                            rotation: 0,
                            radius: radius,

                            fontColor: hoveredLegendIndex === i
                                ? '#fffd'
                                : '#ffffff55',

                            font: {
                                    size: 1,        // حجم النص
                                    family: 'Arial',
                                    weight: 100
                                },
                            };
                        });
                    }
                },
            }
        },


        scales: {
                x: {
                    
                    grid: {
                        display: true,
                        color: colorWithOpacity(core_muted, 0.4),
                        lineWidth: 2,
                        drawBorder: false,
                        drawTicks: false
                    },
                    ticks: {
                        color: core_muted,
                        maxTicksLimit: 11,
                    },
                },

                y: {
                    grid: {
                        type: 'linear',
                        position: 'left',
                        display: true,
                        color: colorWithOpacity(core_muted, 0.4), // أوضح شوي من X
                        lineWidth: 2,
                        drawBorder: false,
                        drawTicks: false
                    },
                    ticks: {
                        color: core_muted,
                        maxTicksLimit: 6,
                        padding: 8
                    },
                
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'More data',
                        color: '#fff4',
                        font: {
                            size: 12,
                            family: 'sans-serif'

                        },

                        align: 'center',   // محاذاة النص أسفل المحور
                    },
                },
                
                yMistakes: {  // المحور الثانوي على اليمين
                    type: 'linear',
                    position: 'right',
                    grid: {
                        drawOnChartArea: false, // منع رسم خطوط الشبكة على الرسم الرئيسي
                    },
                    ticks: {
                        color: core_muted,
                        maxTicksLimit: 5,
                        padding: 8
                    },

                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Mistakes',
                        color: '#fff4',
                        font: {
                            size: 12,
                        },

                        align: 'center',
                    },
                },
        },
    },
};
myChart = new Chart(ctx, config);


function updateChartData(time, wpm, acc, raw, mistakes) {
    //console.log('llfe: updateChartData()');

    // add time to labels
    myChart.data.labels.push(+time.toFixed(0));

    // add the new value
    myChart.data.datasets[0].data.push(wpm);
    myChart.data.datasets[1].data.push(acc);
    myChart.data.datasets[2].data.push(raw);
    myChart.data.datasets[3].data.push(mistakes)

    // max points to chart
    const maxPoints = 3600; // 1h
    if (myChart.data.labels.length > maxPoints) {
        myChart.data.labels.shift();  // إزالة أول عنصر
        for(let i = 0; i < myChart.data.datasets.length; i++) {
            myChart.data.datasets[i].data.shift()
        }
    }

    // update chart
    myChart.update('none');
};

function resetChart() {
    //console.log('llfe: resetChart()');

    // مسح كل الـ labels
    myChart.data.labels = [];


    // مسح كل البيانات لكل dataset
    myChart.data.datasets.forEach(dataset => {
        dataset.data = [];
    });

    // تحديث الشارت
    myChart.update('none');
};

// typing-state and result-state
let typing_state = document.querySelectorAll('.typing-state');
let resualt_state = document.querySelectorAll('.resualt-state');

function showChart() {
    //console.log('llfe: showChart()');

    state.page = 'chart';
    state.isInGame = false;

    document.documentElement.style.setProperty('--text_container-margin', '0px')
    document.documentElement.style.setProperty('--grid_space_height', '80px')
    document.documentElement.style.setProperty('--header_space_width', '22px')

    for(let i = 0; i < typing_state.length; i++) {
        typing_state[i].style.display = 'none';
    };

    for(let i = 0; i < resualt_state.length; i++) {
        resualt_state[i].style.display = '';
    };

    scroll({
        top: 0,
    });

    resizeChartHeader();
    resizeTextContainer();
    pauseGame()
};
let type = document.querySelector('.type');

function hideChart() {
    //console.log('llfe: hideChart()');

    if(state.page == 'chart') {
        setTimeout(() => {
            dom_items.text_container.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }, 400);
    };

    state.page = 'home';    
    document.documentElement.style.setProperty('--text_container-margin', '10px 5%')
    document.documentElement.style.setProperty('--grid_space_height', '80px')
    document.documentElement.style.setProperty('--header-height', '120px')
    document.documentElement.style.setProperty('--header_space_width', '30px')

    for(let i = 0; i < typing_state.length; i++) {
        typing_state[i].style.display = 'block';
    };

    for(let i = 0; i < resualt_state.length; i++) {
        resualt_state[i].style.display = 'none';
    };

    restartGame()

    resizeContainerToWords()
};

async function transmissionAnimation(action) {
    if(!canRunTransitionAnimation) return;

    //console.log('llfe: transmissionAnimation()');

    let fade = document.querySelectorAll('.fade');

    // 1️⃣ إظهار الـ fade
    for (let i = 0; i < fade.length; i++) {
        fade[i].style.display = 'block';
    }

    // 2️⃣ ضمان تشغيل الانتقال
    requestAnimationFrame(() => {
        for (let i = 0; i < fade.length; i++) {
            // fade[i].style.opacity = '1';
            center_content.style.opacity = '0';
            if(state.page == 'chart') {
                header.style.opacity = '0';
            }
        }
    });

    // 3️⃣ بعد انتهاء fade-in
    setTimeout(() => {
        center_content.style.opacity = '1';
        header.style.opacity = '1';


        // تنفيذ الدالة
        if (action === 'restartGame') restartGame();
        else if (action === 'showChart') showChart();
        else if (action === 'hideChart') hideChart();

        // showChart()

        
        resizeChartHeader()
        resizeTextContainer()

        for (let i = 0; i < fade.length; i++) {
            fade[i].style.opacity = '0';
        }

        // إخفاء نهائي
        setTimeout(() => {
            for (let i = 0; i < fade.length; i++) {
                fade[i].style.display = 'none';
            }
        }, 200);

    }, 200);
    
    // لمنع التكرار بشكل سريع
    canRunTransitionAnimation = false;
    let time_to_run = 400;

    let runInterval = setInterval(() => {
        time_to_run -= 100;

        if(time_to_run <= 0) {
            canRunTransitionAnimation = true;
            clearInterval(runInterval)
        }
    }, 100) 
};

addEventListener('resize', () => {
    resizeChartHeader();
    resizeTextContainer();
    resizeContainerToWords();
 
    updateTooltipPosition()

    config.options.devicePixelRatio = window.devicePixelRatio + 0.5;
    myChart.update('none');    
    
    requestAnimationFrame(() => {
        const ws = word_states[state.word_index];
        let letters = dom_items.words[state.word_index].children;

        if(ws.typed[ws.word_length - 1] != null) {
            moveCaret(dom_items.letters[dom_items.letters.length-1], true);
        }
        else {
            moveCaret(letters[state.letter_index], false);    
        };

    }) 
});


function resizeChartHeader() {
    //console.log('llfe: resizeChartHeader()');

    if(state.page == 'chart') {
        let headerHeight = window.devicePixelRatio <= 1 && window.devicePixelRatio > 0.9 ? '0px'
            :window.devicePixelRatio <= 0.9 && window.devicePixelRatio > 0.8 ? '20px'
            :window.devicePixelRatio <= 0.8 && window.devicePixelRatio > 0.7 ? '60px'
            :window.devicePixelRatio <= 0.7 && window.devicePixelRatio > 0.6 ? '120px'
            :window.devicePixelRatio <= 0.6 && window.devicePixelRatio > 0.5 ? '245px'
            :window.devicePixelRatio <= 0.5 && window.devicePixelRatio > 0.4 ? '360px'
            :window.devicePixelRatio <= 0.4 && window.devicePixelRatio > 0.3 ? '500px'
            :window.devicePixelRatio <= 0.3 && window.devicePixelRatio > 0.2 ? '900px'
            : '0px'

        let footerHeight = window.devicePixelRatio <= 1 && window.devicePixelRatio > 0.9 ? '120px'
            :window.devicePixelRatio <= 0.9 && window.devicePixelRatio > 0.8 ? '280px'
            :window.devicePixelRatio <= 0.8 && window.devicePixelRatio > 0.7 ? '100px'
            :window.devicePixelRatio <= 0.7 && window.devicePixelRatio > 0.6 ? '150px'
            :window.devicePixelRatio <= 0.6 && window.devicePixelRatio > 0.5 ? '325px'
            :window.devicePixelRatio <= 0.5 && window.devicePixelRatio > 0.4 ? '400px'
            :window.devicePixelRatio <= 0.4 && window.devicePixelRatio > 0.3 ? '600px'
            :window.devicePixelRatio <= 0.3 && window.devicePixelRatio > 0.2 ? '900px'
            : '120px'


        document.documentElement.style.setProperty('--header-height', headerHeight);
        document.documentElement.style.setProperty('--footer-height', footerHeight);
    }
    if(state.page == 'home') {
        let headerHeight = window.devicePixelRatio <= 1 && window.devicePixelRatio > 0.9 ? '100px'
            :window.devicePixelRatio <= 0.9 && window.devicePixelRatio > 0.8 ? '132px'
            :window.devicePixelRatio <= 0.8 && window.devicePixelRatio > 0.7 ? '160px'
            :window.devicePixelRatio <= 0.7 && window.devicePixelRatio > 0.6 ? '200px'
            :window.devicePixelRatio <= 0.6 && window.devicePixelRatio > 0.5 ? '250px'
            :window.devicePixelRatio <= 0.5 && window.devicePixelRatio > 0.4 ? '340px'
            :window.devicePixelRatio <= 0.4 && window.devicePixelRatio > 0.3 ? '390px'
            :window.devicePixelRatio <= 0.3 && window.devicePixelRatio > 0.2 ? '900px'
            : '160px'
    
        document.documentElement.style.setProperty('--header-height', headerHeight);

        let footerHeight = window.devicePixelRatio <= 1 && window.devicePixelRatio > 0.9 ? '160px'
            :window.devicePixelRatio <= 0.9 && window.devicePixelRatio > 0.8 ? '190px'
            :window.devicePixelRatio <= 0.8 && window.devicePixelRatio > 0.7 ? '250px'
            :window.devicePixelRatio <= 0.7 && window.devicePixelRatio > 0.6 ? '300px'
            :window.devicePixelRatio <= 0.6 && window.devicePixelRatio > 0.5 ? '340px'
            :window.devicePixelRatio <= 0.5 && window.devicePixelRatio > 0.4 ? '400px'
            :window.devicePixelRatio <= 0.4 && window.devicePixelRatio > 0.3 ? '600px'
            :window.devicePixelRatio <= 0.3 && window.devicePixelRatio > 0.2 ? '900px'
            : '160px'


        document.documentElement.style.setProperty('--footer-height', footerHeight);
        document.documentElement.style.setProperty('--text_area-margin-x', '5%');
        document.documentElement.style.setProperty('--text_area-margin-y', '0');   
    }
};

function resizeTextContainer() {
    //console.log('llfe: resizeTextContainer()');

    if(state.page == 'chart') {
        document.documentElement.style.setProperty('--text_container_height', '10px')

        let containerHeight = window.innerWidth < 1150 && window.innerWidth >= 850 ? 550
            : window.innerWidth < 850 && window.innerWidth >= 720 ? 1000
            : window.innerWidth < 720 && window.innerWidth >= 425 ? 1100
            : window.innerWidth < 425 ? 1150
            : 450

        document.documentElement.style.setProperty('--text_area_height', containerHeight + 'px')
    };
};

function updateMoreStats() {
    //console.log('llfe: updateMoreStats()');

    let game_type_bottom = document.querySelector('.text_container .resualt-state .morestats .game-type .bottom');
    let characters_bottom = document.querySelector('.text_container .resualt-state .morestats .characters .bottom');
    let raw_bottom = document.querySelector('.text_container .resualt-state .morestats .raw .bottom');
    let wpm_bottom = document.querySelector('.text_container .resualt-state .morestats .wpm .bottom');
    let consistency_bottom = document.querySelector('.text_container .resualt-state .morestats .consistency .bottom');
    let personal_best_bottom = document.querySelector('.text_container .resualt-state .morestats .personal-best .bottom');

    let correctLetters = summary.correctLetters + summary.lastWS.incorrectLetters;
    let incorrectLetters = summary.incorrectLetters + summary.lastWS.incorrectLetters;
    let extra = summary.extra + summary.lastWS.extra;
    let missed = summary.missed;
    let mistakes = summary.mistakes

    let language_type = language_info.element_name.split(' ')[0];
   

    if(current_game_states[2].mode == 'time') {
        game_type_bottom.innerHTML = `
            <p class="round_time">time</p>
            <p class="round_language">${language_type}</p>
            <p class="round_time">${formatTime(summary.current_timer)}</p>
        `; game_type_bottom.setAttribute('data-tooltip', `mode<br>language<br>time`);
  
    } else if(current_game_states[2].mode == 'quote') {
        game_type_bottom.innerHTML = `
            <p class="round_time">quote ${current_game_states[2].quoteLong} ${saved_states.quote.currentQuoteList.length}</p>
            <p class="round_language">${language_info.languageName}</p>
            <p class="round_language">${saved_states.quote.source}</p>
        `; game_type_bottom.setAttribute('data-tooltip', `mode<br>language<br>source`);
    } else if(current_game_states[2].mode == 'words') {
        game_type_bottom.innerHTML = `
            <p class="round_time">words ${current_game_states[2].wordsCount}</p>
            <p class="round_language">${language_info.languageName}</p>
        `; game_type_bottom.setAttribute('data-tooltip', `mode<br>language`);
    } else if(current_game_states[2].mode == 'custom') {
        game_type_bottom.innerHTML = `
            <p class="round_time">custom</p>
            <p class="round_language">${saved_states.customText.length}</p>
        `; game_type_bottom.setAttribute('data-tooltip', `mode<br>length<br>`);
    } else if(current_game_states[2].mode == 'adaptive') {
        game_type_bottom.innerHTML = `
            <p class="round_time">adaptive</p>
            <p class="round_language">${language_type}</p>
            <p class="round_time">${formatTime(summary.current_timer)}</p>
        `; game_type_bottom.setAttribute('data-tooltip', `mode<br>language<br>time`);       
    }

    
    characters_bottom.innerHTML = `
        ${correctLetters}/${incorrectLetters}/${extra}/${missed}/${mistakes}
    `; characters_bottom.setAttribute('data-tooltip', `correct<br>incorrect<br>extra<br>missed<br>mistake`);

    wpm_bottom.innerHTML = `
        ${Math.round(summary.wpm)}
    `; wpm_bottom.setAttribute('data-tooltip', `${summary.wpm} wpm`);

    raw_bottom.innerHTML = `
        ${Math.round(Math.round(summary.raw))}
    `; raw_bottom.setAttribute('data-tooltip', `${summary.raw} raw`);

    consistency_bottom.innerHTML = `
        ${Math.round(summary.consistency)}%
    `; consistency_bottom.setAttribute('data-tooltip', `${summary.consistency}% consitency`);

    let best_wpm = wpm_history.length ? Math.round(getMedian(wpm_history)) : Math.round(+summary.wpm);
    personal_best_bottom.innerHTML = `
      ${best_wpm}
    `;personal_best_bottom.setAttribute('data-tooltip', `${getMedian(wpm_history)} median wpm`)
};


let last_settings_container = 'none';
let canRunTestSettings = true;
let isInCustomTime = false;
let isInCustomQuote = false;
let isInCustomWords = false;
let isInCustomText = false;
let isInAdaptiveMode = false;
let canOpenSavedTexts = true;

let time_container = document.querySelector('header .test_settings .settings_container #time');
let mode_container = document.querySelector('header .test_settings .settings_container #mode');
let special_letters_container = document.querySelector('header .test_settings .settings_container #special_letters');

let setting_buttons = document.querySelectorAll('header .test_settings .container .buttons > *');

function testSettings(container, element) {
    if(!canRunTestSettings) return;

    //console.log('llfe: testSettings()');

    canRunTestSettings = false

    for(let i = 0; i < setting_buttons.length; i++) {
        setting_buttons[i].classList.remove('show')
    }
    state.isInGame = false;
    
    if(container == last_settings_container) {
        time_container.classList.remove('show');
        mode_container.classList.remove('show');
        special_letters_container.classList.remove('show');
        last_settings_container = 'none';

        
        setTimeout(() => {
            canRunTestSettings = true;
            state.isInGame = true;            
        }, 100);

        return;
    }
    
    else if(container == 'time') {
        mode_container.style.display = 'none';
        special_letters_container.style.display = 'none';
        time_container.style.display = '';

        setTimeout(() => {
            mode_container.classList.remove('show');
            special_letters_container.classList.remove('show'); 
            time_container.classList.add('show');            
        }, 120)

    }
    
    else if(container == 'mode') {
        special_letters_container.style.display = 'none';
        time_container.style.display = 'none';
        mode_container.style.display = '';

        setTimeout(() => {
            special_letters_container.classList.remove('show');
            time_container.classList.remove('show');
            mode_container.classList.add('show');            
        }, 100)

    }
    
    else if(container == 'special_letters') {
        mode_container.style.display = 'none';
        time_container.style.display = 'none';
        special_letters_container.style.display = '';

        setTimeout(() => {
            time_container.classList.remove('show');
            mode_container.classList.remove('show');
            special_letters_container.classList.add('show');              
        }, 100)   
    }

    element.classList.add('show')
    last_settings_container = container;

    setTimeout(() => {
        canRunTestSettings = true;
    }, 100)
};

// للتحقق اذا نقر اللاعب خارج مجال الاعدادات
let setting_buttons_container = document.querySelector('header .test_settings .container .buttons')
let settings_container = document.querySelectorAll('header .test_settings .container .settings_container > *')

document.addEventListener("click", function (event) {
    //console.log('llfe: addEventListener("click", function (event) {...})');

    if(isInCustomTime || isInCustomQuote || isInCustomWords || isInCustomText || isInAdaptiveMode) return;

    if (!setting_buttons_container.contains(event.target)) {
        for(let i = 0; i < settings_container.length; i++) {
            if(settings_container[i].offsetHeight > 0) {

                if(!settings_container[i].contains(event.target)) {  
                    for(let i = 0; i < setting_buttons.length; i++) {
                        setting_buttons[i].classList.remove('show');
                    };      
                    time_container.classList.remove('show');
                    mode_container.classList.remove('show');
                    special_letters_container.classList.remove('show');
                    last_settings_container = 'none';


                    setTimeout(() => {
                        canRunTestSettings = true;
                        state.isInGame = true;                    
                    }, 200);

                    return;
                };
            };
        };
    };

    if(dom_items.text_container.contains(event.target)) {
        caret.classList.remove('caretHide');
        caret.classList.add('caretBlink')

        if(!isPhone) {
            dom_items.text_container.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }

    } else {
        if(!state.isInGame) return;

        caret.classList.add('caretHide');
        caret.classList.remove('caretBlink')
        document.activeElement.blur();
    }
});


// custom time part
let settingButtonsContainer = document.querySelectorAll('header .test_settings .settings_container .container .time_choice_button')
function changeTime(time, element) {
    //console.log('llfe: changeTime()');

    element.classList.add('isActive')
    timer.default = time;
    timer.timeLeft = time;

    transmissionAnimation('restartGame')
    state.isInGame = false;

    current_game_states[0].time = time;
    current_game_states[0].elementInner = element.innerHTML;

    localStorage.setItem('current_game_states', JSON.stringify(current_game_states));

    current_game_states = JSON.parse(localStorage.getItem('current_game_states'))


    addCurrentTime();
};

let customTimeContainer = document.querySelector('.customTimeContainer');
let timeInput = document.querySelector('.customTimeContainer #timeInput');

let customTimeOverlay = document.querySelector('.custom_time_overlay')
function showCustomTime() {
    //console.log('llfe: showCustomTime()');

    isInCustomTime = true;
    customTimeOverlay.style.visibility = 'visible'
    customTimeContainer.style.visibility = 'visible';
    customTimeContainer.style.opacity = 1;
    customTimeOverlay.style.opacity = 1;

    setTimeout(() => {
        timeInput.focus();   // نركز على الـ input
        timeInput.select();  // نحدد النص بالكامل
    }, 50); // يمكن استخدام 50ms إذا 0 لم يعمل

};
function hideCustomTime() {
    //console.log('llfe: hideCustomTime()');

    customTimeContainer.style.opacity = 0;
    customTimeOverlay.style.opacity = 0;


    setTimeout(() => {
        customTimeContainer.style.visibility = 'hidden';      
        customTimeOverlay.style.visibility = 'hidden';  
        isInCustomTime = false;    
    }, 300);
};
let domResualtTime = document.querySelector('.customTimeContainer .resualt_time');
function formatTimeToString(totalSeconds, isMessage) {
    if(totalSeconds == 0) return 'Infinite';
    if(totalSeconds < 0) return isMessage ? '' : 'You must enter a number greater than 0';
    
    //console.log('llfe: formatTimeToString()');

    let remaining = totalSeconds % 3600;
    
    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor(remaining / 60);
    let s = remaining % 60;

    h = h > 0 ? h : '';
    m = m > 0 ? m : '';
    s = s > 0 ? s : '';
    
    let hasHours = h > 1 ? 'hours'
        : h == 1 ? 'hour'
        : '' ;
    let hasMinutes = m > 1 ? 'minutes'
        : m == 1 ? 'minute'
        : '' ;
    let hasSeconds = s > 1 ? 'seconds'
        : s == 1 ? 'second'
        : '' ;

    let text = `${h} ${hasHours} ${m} ${hasMinutes} ${s} ${hasSeconds}`

    let cleanText = text.replace(/\s+/g, ' ').trim();

    return cleanText;
};
let timeToTimer = 0;
function updateCustomTime(char) {
    //console.log('llfe: updateCustomTime()');

    // استبدال أي فاصلة بمسافة لتقسيم النص
    char = char.replace(/,/g, ' ');

    // تقسيم النص إلى أجزاء حسب المسافات
    const parts = char.trim().split(/\s+/);

    let total = 0;

    for (let part of parts) {
        // نبحث عن رقم + وحدة
        const match = part.match(/(-?\d+)([hms])?/i);
        if (!match) continue;

        let num = Number(match[1]);
        let unit = match[2] ? match[2].toLowerCase() : 's'; // افتراضي ثانية

        total += unit === 'h' ? num * 3600
               : unit === 'm' ? num * 60
               : num;
    }

    domResualtTime.textContent = formatTimeToString(total, false);
    timeToTimer = +total;

    return +total;
};
let customTimeButton = document.querySelector('.settings_container .container #custom_time_button');
function submitCustomTime() {
    if(+timeInput.value < 0) return;

    //console.log('llfe: submitCustomTime()');
    
    current_game_states[0].time = timeToTimer;
    current_game_states[0].elementInner = customTimeButton.innerHTML;

    localStorage.setItem('current_game_states', JSON.stringify(current_game_states)); 
    current_game_states = JSON.parse(localStorage.getItem('current_game_states'))

    timer.default = timeToTimer;
    timer.timeLeft = timeToTimer;
    timer_dom.innerHTML = formatTime(timeToTimer);
    bigTimer_dom.innerHTML = formatTime(timeToTimer);
    
    liveStats_dom.innerHTML = Math.round(summary.wpm);
    bigLiveStats_dom.innerHTML = Math.round(summary.wpm);


    state.isInfinityTest = timeToTimer <= 0 ? true
        : false ;

    hideCustomTime()

    transmissionAnimation('restartGame')
    state.isInGame = false;

    addCurrentTime()
    
};
async function addCurrentTime() {
    //console.log('llfe: addCurrentTime()');

    for(let i = 0; i < settingButtonsContainer.length; i++) {
        settingButtonsContainer[i].classList.remove('isActive')
    };

    for(let i = 0; i < settingButtonsContainer.length; i++) {
        if(settingButtonsContainer[i].innerHTML == current_game_states[0].elementInner) {
            settingButtonsContainer[i].classList.add('isActive')
            if(settingButtonsContainer[i].innerHTML == 'custom') {
                timeInput.value = current_game_states[0].time;
                updateCustomTime(String(current_game_states[0].time))                
            }
        }
    }

    timer.default = current_game_states[0].time;
    timer.timeLeft = current_game_states[0].time;

    timer_dom.innerHTML = formatTime(current_game_states[0].time);
    bigTimer_dom.innerHTML = formatTime(current_game_states[0].time);

    liveStats_dom.innerHTML = Math.round(summary.wpm);
    bigLiveStats_dom.innerHTML = Math.round(summary.wpm);

    state.isInfinityTest = current_game_states[0].time <= 0 ? true : false;

}
// end custom time part


// game mode

let modeOptions = document.querySelectorAll('.settings_container #mode > *')
function changeMode(modeName, element) {
    //console.log('llfe: changeMode()');

    for(let i = 0; i < modeOptions.length; i++) {
        modeOptions[i].classList.remove('isActive')
    } element.classList.add('isActive')

    current_game_states[2].mode = modeName;
    current_game_states[2].elementInner = element.innerHTML;
    localStorage.setItem('current_game_states', JSON.stringify(current_game_states))
    transmissionAnimation('restartGame')
}


let customQuoteOverlay = document.querySelector('.custom_quote_overlay')
let customQuoteLongContainer = document.querySelector('.customQuoteLongContainer')
function showCustomQuote() {
    //console.log('llfe: showCustomQuote()');

    isInCustomQuote = true;
    customQuoteOverlay.style.visibility = 'visible';
    customQuoteOverlay.style.opacity = 1   

    customQuoteLongContainer.style.visibility = 'visible';
    customQuoteLongContainer.style.opacity = 1     
};

function hideCustomQuote() {
    //console.log('llfe: hideCustomQuote()');

    customQuoteOverlay.style.opacity = 0
    customQuoteLongContainer.style.opacity = 0   


    setTimeout(() => {
        customQuoteOverlay.style.visibility = 'hidden';        
        customQuoteLongContainer.style.visibility = 'hidden';  
        
        isInCustomQuote = false;
    }, 300)
};


let customQuoteOptions = document.querySelectorAll('.customQuoteLongContainer .options > *')
let quoteModeOption = document.querySelector('.settings_container #mode #mode2')

function changeQuoteLong(long, element) {
    if(!isInCustomQuote) return;

    //console.log('llfe: changeQuoteLong()');

    for(let i = 0; i < modeOptions.length; i++) {
        modeOptions[i].classList.remove('isActive')
    }; quoteModeOption.classList.add('isActive')


    for(let i = 0; i < customQuoteOptions.length; i++) {
        customQuoteOptions[i].classList.remove('isActive')
    }; element.classList.add('isActive')


    current_game_states[2].mode = 'quote';
    current_game_states[2].quoteLong = long;
    current_game_states[2].quoteElementInner = element.innerHTML;
    current_game_states[2].elementInner = 'quote';

    localStorage.setItem('current_game_states', JSON.stringify(current_game_states))
    change_quotes(long, language_info.languageName)


    transmissionAnimation('restartGame')
    hideCustomQuote()
};

let gameModeOption = document.querySelectorAll('.settings_container #mode > *')
let quoteLongOptions = document.querySelectorAll('.customQuoteLongContainer .options > *')


function renderGameModeOptions() {
    //console.log('llfe: renderGameModeOptions()');

    for(let i = 0; i < gameModeOption.length; i++) {
        if(gameModeOption[i].innerHTML == current_game_states[2].elementInner) {
            gameModeOption[i].classList.add('isActive')
        };
    };

    for(let i = 0; i < quoteLongOptions.length; i++) {
        if(quoteLongOptions[i].innerHTML == current_game_states[2].quoteElementInner) {
            quoteLongOptions[i].classList.add('isActive')
        };
    };
};


// game mode > words

let custom_words_overlay = document.querySelector('.custom_words_overlay')
let customWordsLong = document.querySelector('.customWordsLongContainer')
let wordsModeOption = document.querySelector('.settings_container #mode #mode3')
let wordsInput = document.querySelector('.customWordsLongContainer #wordsInput')

function showCustomWords() {
    //console.log('llfe: showCustomWords()');

    state.isInGame = false;
    isInCustomWords = true;
    wordsInput.value = current_game_states[2].wordsCount;
    custom_words_overlay.style.visibility = 'visible';
    custom_words_overlay.style.opacity = 1;

    customWordsLong.style.visibility = 'visible';
    customWordsLong.style.opacity = 1;

    setTimeout(() => {
        wordsInput.focus();   // نركز على الـ input
        wordsInput.select();  // نحدد النص بالكامل
    }, 50); // يمكن استخدام 50ms إذا 0 لم يعمل
};


function hideCustomWords() {
    //console.log('llfe: hideCustomWords()');

    custom_words_overlay.style.opacity = 0;
    customWordsLong.style.opacity = 0;

    setTimeout(() => {
        custom_words_overlay.style.visibility = 'hidden';        
        customWordsLong.style.visibility = 'hidden';
        isInCustomWords = false;
    }, 300)
};

function submitCustomWords() {
    if(+wordsInput.value <= 0) return;

    //console.log('llfe: submitCustomWords()');

    for(let i = 0; i < gameModeOption.length; i++) {
        gameModeOption[i].classList.remove('isActive');
    }; wordsModeOption.classList.add('isActive')

    let count = +wordsInput.value;

    current_game_states[2].mode = 'words';
    current_game_states[2].elementInner = wordsModeOption.innerHTML;
    current_game_states[2].wordsCount = count;


    localStorage.setItem('current_game_states', JSON.stringify(current_game_states))
    transmissionAnimation('restartGame')


    hideCustomWords()
};
// end game mode > words


// special letters

let specialIncludes = `(){}[]'",.!?0123456789`;

function generatePunctuation(word) {
    //console.log('llfe: generatePunctuation()');

    if(current_game_states[1].punctcuations) {
        if(word_states.length == 0 || Math.random() < 0.4) {
            word = word.charAt(0).toUpperCase() + word.slice(1);
        };

        if(Math.random() < 0.1) {
            word = word.toUpperCase();
        };

        const patterns = [
            (w) => `(${w})`,
            (w) => `{${w}}`,
            (w) => `[${w}]`,
            (w) => `"${w}"`,
            (w) => `'${w}'`,
            (w) => `${w},`,
            (w) => `${w}.`,
            (w) => `${w}!`,
            (w) => `${w}?`,
            (w) => `${w}...`,
        ];

        if(Math.random() < 0.4) {
            let pattern = patterns[Math.floor(Math.random() * patterns.length)]
            word = pattern(word)
        };
    };
    

    return word;
};

function generateNumber(word) {
    if(word_states.length <= 1) return word;

    let lastWS = word_states[word_states.length - 2]
    if(lastWS.isNumber) return word;

    //console.log('llfe: generateNumber()');



    if(Math.random() < 0.3) {
        let length = Math.ceil(Math.random() * 3);
        let numList = [];

        for(let i = 0; i < length; i++) {
            numList.push(Math.floor(Math.random() * 10));
        };
        let finalNum = numList.join('');
        word = finalNum;

        word_states[word_states.length - 1].isNumber = true;
    };
    return word;
};

let canAddSpecialLetters = true;
function addPuntcuations(element) {
    if(!canAddSpecialLetters) return;

    //console.log('llfe: addPuntcuations()');

    canAddSpecialLetters = false;

    current_game_states[1].punctcuations = !current_game_states[1].punctcuations;
    localStorage.setItem('current_game_states', JSON.stringify(current_game_states))
    renderSpecialLetters()
    transmissionAnimation('restartGame')

    setTimeout(() => {
        canAddSpecialLetters = true;
    }, 400)
};

function addNumbers(element) {
    if(!canAddSpecialLetters) return;

    //console.log('llfe: addNumbers()');

    canAddSpecialLetters = false;

    current_game_states[1].numbers = !current_game_states[1].numbers;
    localStorage.setItem('current_game_states', JSON.stringify(current_game_states))
    renderSpecialLetters()
    transmissionAnimation('restartGame')

    setTimeout(() => {
        canAddSpecialLetters = true;
    }, 400)
};

let specialLettersOptions  = document.querySelectorAll('header .test_settings .settings_container #special_letters > *')
let specialLettersNumbers  = document.querySelector('header .test_settings .settings_container #special_letters #numbers')
let specialLettersPunctuations  = document.querySelector('header .test_settings .settings_container #special_letters #punctuations')
function renderSpecialLetters() {
    //console.log('llfe: renderSpecialLetter()');

    for(let i = 0; i < specialLettersOptions.length; i++) {
        specialLettersOptions[i].classList.remove('isActive')
    };
    if(current_game_states[1].punctcuations) specialLettersPunctuations.classList.add('isActive');
    if(current_game_states[1].numbers) specialLettersNumbers.classList.add('isActive');
};
// end game mode



// add custom text 
let customTextContainer = document.querySelector('.customTextContainer');
let customTextOverlay = document.querySelector('.custom_text_overlay');

let submitTextButton = document.querySelector('.customTextContainer .inputes #save')



function checkSaveButton() {
    //console.log('llfe: checkSaveButton()');

    submitTextButton.classList.add('disable');
    submitTextButton.disabled = true;

    let uniqueName = true;

    for(let i = 0; i < customTextList.length; i++) {
        let mainInputName = customTextList[i].name;

        if(current_game_states[2].textMode == 'update' 
        && textNameInput.value == customTextList[current_game_states[2].customTextIndex].name
        ) {
            uniqueName = true;
            break;
        };

        if(textNameInput.value == mainInputName) {
            uniqueName = false;
            break;
        } else {
            uniqueName = true;
        };
    };
    if(uniqueName && textAreaCustomText.value != '' && textNameInput.value != '') {
        submitTextButton.classList.remove('disable');
        submitTextButton.disabled = false;
    };
    textAreaCustomText.dir = language_info.dir
};

function showCustomText() {
    //console.log('llfe: showCustomText()');

    state.isInGame = false;
    isInCustomText = true;
    canOpenSavedTexts = true;

    customTextContainer.style.visibility = 'visible';
    customTextContainer.style.opacity = 1;

    customTextOverlay.style.visibility = 'visible';
    customTextOverlay.style.opacity = 1;

    checkSaveButton()
};

function hideCustomText() {
    //console.log('llfe: hideCustomText()');

    canOpenSavedTexts = false;

    customTextContainer.style.opacity = 0;
    customTextOverlay.style.opacity = 0;

    setTimeout(() => {
        customTextContainer.style.visibility = 'hidden';    
        customTextOverlay.style.visibility = 'hidden';
        isInCustomText = false;        
    }, 300)


};

let customTextInfo = {
    'name': null,
    'text': null,
};


function saveText() {
    if(textNameInput.value == '' || textAreaCustomText.value == '') return;
    if(!canOpenSavedTexts) return;

    //console.log('llfe: saveText()');

    if(current_game_states[2].textMode == 'save') {
        customTextInfo.name = textNameInput.value;
        customTextInfo.text = textAreaCustomText.value
        customTextList.push(customTextInfo)
    } else if(current_game_states[2].textMode == 'update') {
        customTextList[current_game_states[2].customTextIndex].name = textNameInput.value;
        customTextList[current_game_states[2].customTextIndex].text = textAreaCustomText.value;
        
        submitTextButton.value = 'save new';
        current_game_states[2].textMode = 'save';
    };

    localStorage.setItem("current_game_states", JSON.stringify(current_game_states))
    localStorage.setItem('customTextList', JSON.stringify(customTextList));
    customTextList = JSON.parse(localStorage.getItem('customTextList'))

    textNameInput.value = '';
    textAreaCustomText.value = '';

    checkSaveButton()


};

function updateText(element, index) {
    if(!canOpenSavedTexts) return;

    //console.log('llfe: updateText()');


    current_game_states[2].customTextIndex = index;
    current_game_states[2].textMode = 'update'
    localStorage.setItem('current_game_states', JSON.stringify(current_game_states))
    current_game_states = JSON.parse(localStorage.getItem('current_game_states'))

    textNameInput.value = customTextList[current_game_states[2].customTextIndex].name;
    textAreaCustomText.value = customTextList[current_game_states[2].customTextIndex].text;
    submitTextButton.value = 'update';
 
    hideSavedTexts()
};

function deleteText(element, index) {
    if(!canOpenSavedTexts) return;

    //console.log('llfe: deleteText()');


    customTextList.splice(index, 1)

    localStorage.setItem('customTextList', JSON.stringify(customTextList))
    showSavedTexts()
};


let deleteAllSavedTextButton = document.querySelector('.savedTextsContainer #deleteAllButton')

let sureDeleteAllTexts = document.querySelector('.sureDeleteAllTexts')
let sureDeleteAllTextsOverlay = document.querySelector('.sureDeleteAllTextsOverlay')

let isDeleteAllOpen = false;
function showSureDeleteTexts() {
    //console.log('llfe: showSureDeleteTexts()');

    isDeleteAllOpen = true;
    sureDeleteAllTexts.style.visibility = 'visible';
    sureDeleteAllTextsOverlay.style.visibility = 'visible';    
    
    sureDeleteAllTexts.style.opacity = 1;
    sureDeleteAllTextsOverlay.style.opacity = 1;
};

function hideSureDeleteTexts() { 
    //console.log('llfe: hideSureDeleteTexts()');

    isDeleteAllOpen = false;
    sureDeleteAllTexts.style.opacity = 0;
    sureDeleteAllTextsOverlay.style.opacity = 0;
    
    setTimeout(() => {
        sureDeleteAllTexts.style.visibility = 'hidden';
        sureDeleteAllTextsOverlay.style.visibility = 'hidden';
    }, 300)
};


function deleteAllTexts() {
    if(!isDeleteAllOpen) return;

    //console.log('llfe: deleteAllTexts()');

    customTextList = [];
    localStorage.setItem('customTextList', JSON.stringify(customTextList))

    showSavedTexts()
    hideSureDeleteTexts()    
};

function startText() {
    if(textAreaCustomText.value == '') return;
    if(!canOpenSavedTexts) return;

    //console.log('llfe: startText()');
    
    let cleanText = textAreaCustomText.value.replace(/\s+/g, ' ').trim();
    let toDataList = cleanText.split(' ');

    current_game_states[2].currentCustomName = textNameInput.value;
    current_game_states[2].currentCustomText = cleanText;
    saved_states.customText = toDataList;

    current_game_states[2].mode = 'custom'; 
    current_game_states[2].elementInner = 'custom'
    localStorage.setItem('current_game_states', JSON.stringify(current_game_states))
    current_game_states = JSON.parse(localStorage.getItem('current_game_states'))
    
    hideCustomText()
    transmissionAnimation('restartGame')

    for(let i = 0; i < gameModeOption.length; i++) {
        gameModeOption[i].classList.remove('isActive');
    }
    for(let i = 0; i < gameModeOption.length; i++) {
        if(gameModeOption[i].innerHTML == current_game_states[2].elementInner) {
            gameModeOption[i].classList.add('isActive');            
        }
    }
};


let savedTextsContainer = document.querySelector('.savedTextsContainer')
let tableOrNoResult = document.querySelector('.savedTextsContainer .tableOrNoResult')
let savedTextsOverlay = document.querySelector('.saved_texts_overlay')
let savedTextsTbody = document.querySelector('.savedTextsContainer table tbody')

let savedTextsSearchInput = document.querySelector('.savedTextsContainer #searchButton')


function showSavedTexts() {
    //console.log('llfe: showSavedTexts()');

    if(!canOpenSavedTexts) return;
    
    if(customTextList.length <= 0) {
        deleteAllSavedTextButton.classList.add('disable');
        deleteAllSavedTextButton.disabled = true;
    } else {
        deleteAllSavedTextButton.classList.remove('disable');
        deleteAllSavedTextButton.disabled = false;
    };


    savedTextsContainer.style.visibility = 'visible';
    savedTextsContainer.style.opacity = 1;

    savedTextsOverlay.style.visibility = 'visible';
    savedTextsOverlay.style.opacity = 1;

    if(customTextList.length <= 0) {
        tableOrNoResult.innerHTML = `
            <div id="noSavedTextsResult">no result</div>
        `;
    } else {
        tableOrNoResult.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>id</th>
                        <th>name</th>
                        <th>length</th>
                    </tr>
                </thead>
                
                <tbody>
                </tbody>
        `;
        savedTextsTbody = document.querySelector('.savedTextsContainer table tbody');
        savedTextsSearchInput.value = '';
    }


    savedTextsTbody.innerHTML = ``;
    for(let i = customTextList.length - 1; i >= 0; i--) {
        savedTextsTbody.innerHTML += `
            <tr id="${i}">
                <td onclick="chooseText(this, ${i})">${i+1}</td>
                <td onclick="chooseText(this, ${i})">${customTextList[i].name}</td>
                <td onclick="chooseText(this, ${i})">${customTextList[i].text.length}</td>
                <td class="update" onclick="updateText(this, ${i})" onclick="chooseText(this, ${i})">update</td>
                <td class="delete" onclick="deleteText(this, ${i})">delete</td>
            </tr>
        `
    }

};

function searchText(element) {
    //console.log('llfe: searchText()');
    
    let resultLength = 0;

    for(let i = customTextList.length - 1; i >= 0; i--) {
        if(customTextList[i].name.toLowerCase().includes(element.value.toLowerCase())) {
            resultLength ++;
        };
    };

    if(customTextList.length <= 0 || resultLength <= 0) {
    tableOrNoResult.innerHTML = `
        <div id="noSavedTextsResult">no result</div>
    `;
    return;
    } else {
        tableOrNoResult.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>id</th>
                        <th>name</th>
                        <th>length</th>
                    </tr>
                </thead>
                
                <tbody>
                </tbody>
        `;
    };

    savedTextsTbody = document.querySelector('.savedTextsContainer table tbody');

    savedTextsTbody.innerHTML = ``;
    for(let i = customTextList.length - 1; i >= 0; i--) {
        if(customTextList[i].name.toLowerCase().includes(element.value.toLowerCase())) {
        savedTextsTbody.innerHTML += `
                <tr id="${i}">
                    <td onclick="chooseText(this, ${i})">${i+1}</td>
                    <td onclick="chooseText(this, ${i})">${customTextList[i].name}</td>
                    <td onclick="chooseText(this, ${i})">${customTextList[i].text.length}</td>
                    <td class="update" onclick="updateText(this, ${i})" onclick="chooseText(this, ${i})">update</td>
                    <td class="delete" onclick="deleteText(this, ${i})">delete</td>
                </tr>
            `;
        };
    };
};

function chooseText(element, index) {
    //console.log('llfe: chooseText()');

    current_game_states[2].customTextIndex = index;
    localStorage.setItem('current_game_states', JSON.stringify(current_game_states))
    current_game_states = JSON.parse(localStorage.getItem('current_game_states'))

    textNameInput.value = customTextList[current_game_states[2].customTextIndex].name;
    textAreaCustomText.value = customTextList[current_game_states[2].customTextIndex].text;
    
    hideSavedTexts()
};

function hideSavedTexts() {
    //console.log('llfe: hideSavedTexts()');

    savedTextsContainer.style.opacity = 0;
    savedTextsOverlay.style.opacity = 0;

    setTimeout(() => {
        savedTextsContainer.style.visibility = 'hidden';         
        savedTextsOverlay.style.visibility = 'hidden'; 
    }, 300);
    checkSaveButton()
};


let chooseTextInput = document.querySelector('.customTextContainer #chooseFileText');


function openFileText() {
    //console.log('llfe: openFileText()');

    chooseTextInput.click();
};

chooseTextInput.addEventListener("change", () => {
    const file = chooseTextInput.files[0]; // << هنا 'files' وليس 'file'
    if (!file) return; // لو لم يختار المستخدم ملفاً

    const reader = new FileReader();

    reader.onload = function(e) {
        //console.log('llfe: render.onload()');

        textAreaCustomText.value = e.target.result; // محتوى الملف
    };

    reader.readAsText(file);
});

let adaptiveModeContainer = document.querySelector('.adaptiveModeContainer');
let adaptiveModeOverlay = document.querySelector('.adaptiveModeOverlay');

function showAdaptiveMode(element) {
    //console.log('llfe: showAdaptiveMode()');

    isInAdaptiveMode = true;
    adaptiveModeContainer.classList.add('show');
    adaptiveModeOverlay.classList.add('show');
};
function hideAdaptiveMode() {
    //console.log('llfe: hideAdaptiveMode()');

    adaptiveModeContainer.classList.remove('show');
    adaptiveModeOverlay.classList.remove('show');

    setTimeout(() => {
        isInAdaptiveMode = false;
    }, 200)
};

let adaptiveModeButton = document.querySelector('.settings_container #mode > #mode5')
function submitAdaptiveMode(mode) {
    //console.log('llfe: submitAdapptiveMode()');

    hideAdaptiveMode();
    changeMode('adaptive', adaptiveModeButton)
};

// end add custom text 
let customLetterStatsContainer = document.querySelector('.customLetterStatsContainer');
let customLetterStatsOverlay = document.querySelector('.customLetterStatsOverlay');


let customLetterStatsCustomSelect = document.querySelector('.customLetterStatsContent .custom-select');
let customLetterStatsSelected = document.querySelector('.customLetterStatsContent .custom-select .selected');
let customLetterStatsSelectOptions = document.querySelectorAll('.customLetterStatsContent .custom-select .options .options-content > *');
let letterStatsMainOptions = document.querySelector('.customLetterStatsContent .custom-select .options');

let isMakingLetterStatsOptionScroll = false;
let letterStatsOptionOs;
let letterStatsOptionViewPort;

function renderLetterStatsSelect() {
    //console.log('llfe: renderLetterStatsSelect()');

    if(domLodded) {
        if(!isMakingLetterStatsOptionScroll) {
            let optionsContent = letterStatsMainOptions.querySelector('.options-content');


            const { OverlayScrollbars } = window.OverlayScrollbarsGlobal;

            letterStatsOptionOs = OverlayScrollbars(optionsContent, {
                overflow: { x: 'hidden', y: 'scroll' },
                scrollbars: {
                    autoHide: 'leave',
                    autoHideDelay: 1100,
                    clickScroll: true,
                    dragScroll: true
                },            
            });
            letterStatsOptionViewPort = letterStatsOptionOs.elements().viewport;
            
            letterStatsOptionViewPort.addEventListener('scroll', () => {
                if(letterStatsOptionViewPort.scrollTop > 0) {
                    optionsContent.classList.add('withShadow')
                } else {
                    optionsContent.classList.remove('withShadow')
                };
            });

        };
        isMakingLetterStatsOptionScroll = true;
    };

    customLetterStatsSelectOptions.forEach(e => e.style.display = '');
    for(let i = 0; i < customLetterStatsSelectOptions.length; i++) {
        let e = customLetterStatsSelectOptions[i];

        let optionValue = e.getAttribute('data-value');
        let currentSelected = customLetterStatsSelected.getAttribute('data-selected');

        if(optionValue == currentSelected) {
            e.style.display = 'none';

            let selectedName = customLetterStatsSelected.querySelector('.name');
            selectedName.innerHTML = e.innerHTML;
            break;
        }        
    };
}; renderLetterStatsSelect();

function changeLetterStatsOption(element) {
    //console.log('llfe: changeLetterStatsOption()');

    let elementValue = element.getAttribute('data-value');
    customLetterStatsSelected.setAttribute('data-selected', elementValue);
    letterStatsCurrentOption = elementValue;
    renderLetterStatsSelect();
    
    updateLetterStatsTbody();
};

function openOrCloseLetterStatsOption(element, force, action) {
    //console.log('llfe: openOrCloseLetterStatsOption()');

    let option = element.parentNode;
    
    if(force) {
        option.classList.remove('open');
        if(action == 'open') {
            option.classList.add('open');
        };
    } else {
        if(option.classList.contains('open')) {
            option.classList.remove('open')
        } else {
            option.classList.add('open')
        };        
    };



}; openOrCloseLetterStatsOption(customLetterStatsSelected, true, 'close')


let letterStatsTableWrapper = document.querySelector('.customLetterStatsContent .tableWrapper');
let customLetterStatsThead = document.querySelector('.customLetterStatsContent .tableWrapper .stats thead')
let customLetterStatsTbody = document.querySelector('.customLetterStatsContent .tableWrapper .stats tbody')

let letterStatsTableOs;
let letterStatsOsViewPort;
let isMakingTableWrapperScroll = false;

let letterStatsChangesMap = {};

function showCustomLetterStats() {
    //console.log('llfe: ');

    if(!domLodded) return;

    let selectedOption = document.querySelector(`.customLetterStatsContent .custom-select .options .options-content li[data-value="${letterStatsCurrentOption}"]`);
    changeLetterStatsOption(selectedOption);
        


    customLetterStatsContainer.classList.add('show');
    customLetterStatsOverlay.classList.add('show');

    updateLetterStatsTbody();
    renderLetterStatsSelect();
};

function hideCustomLetterStats() {
    //console.log('llfe: hideCustomLetterStats()');

    customLetterStatsContainer.classList.remove('show');
    customLetterStatsOverlay.classList.remove('show');
    
    letterStatsChangesMap = {};
};

function updateLetterStatsTbody() {
    //console.log('llfe: updateLetterStatsTbody()');

    customLetterStatsTbody.innerHTML = ``;
    let lettersIndex = 0;
    for(const letter in letterStats[letterStatsCurrentOption]) {
        const l = letterStats[letterStatsCurrentOption][letter];

        // for rate
        let rate = 0;
        const rateTotal = l.correct + l.incorrect
        if(rateTotal === 0) {
            rate = 0;
        } else {
            const countRate = (l.correct / rateTotal) * 100;
            rate = Math.round(countRate);            
        };
        
        // for last rate
        let lastRate = 0;
        if(!l.history || l.history.length === 0) {
            lastRate = 0
        } else {
            const sum = l.history.reduce((a,b)=>a+b,0);
            lastRate =  Math.round((sum / l.history.length) * 100);            
        };

        customLetterStatsTbody.innerHTML += `
            <tr data-ls-letter="${letter}">
                <td><input type="number" value="${lettersIndex}" readonly></td>
                <td><input class="letterStatsCheckAvailable" type="text" value="${letter}" minLength="1" maxLength="6" oninput="oninputLetterStats(this, 'char', '${letter}')"></td>
                <td><input class="letterStatsCheckAvailable" type="number" value="${l.correct}" min="0" max="99999" oninput="oninputLetterStats(this, 'correct', '${letter}')"></td>
                <td><input class="letterStatsCheckAvailable" type="number" value="${l.incorrect}" min="0" max="99999" oninput="oninputLetterStats(this, 'incorrect', '${letter}')"></td>
                <td><input type="text" value="${rate}%" readonly></td>
                <td><input type="text" value="${lastRate}%" readonly></td>
            </tr>
        `;

        lettersIndex++;
    };
};


function oninputLetterStats(element, type, key) {
    //console.log('llfe: oninputLetterStats()');

    letterStatsChangesMap[key] = {
        element: element,
        type: type,
        key: key,
    };
};

function submitLetterStats() {
    //console.log('llfe: submitLetterStats()');

    for(const key in letterStatsChangesMap) {
        let k = letterStatsChangesMap[key];

        if(k.type == 'char') {
            for(const letter in letterStats[letterStatsCurrentOption]) {

                if(letter == k.element.value) {
                    let letterStatsTooltip = document.querySelector('.dangerTooltip');
                    let tooltipErrorMSG = letterStatsTooltip.querySelector('.content .err');
                    
                    tooltipErrorMSG.innerHTML = `This text "${letter}" already exists; you cannot repeat it in the same language.`;
                    showLetterStatsTooltip(k.element);
                    return;
                };
            };
 
            letterStats[letterStatsCurrentOption][k.element.value] = 
                letterStats[letterStatsCurrentOption][k.key];
            delete letterStats[letterStatsCurrentOption][k.key];

        } else {
            letterStats[letterStatsCurrentOption][k.key][k.type] = +k.element.value;
        };
    };

    letterStatsChangesMap = {};
    localStorage.setItem('letterStats', JSON.stringify(letterStats))
};


let letterStatsForm = document.getElementById('letterStatsForm').addEventListener('submit', (e) => {
    e.preventDefault();
});


let letterStatsButton = document.getElementById('letterStatsButton')
let letterStatsTooltip = document.querySelector('.dangerTooltip');
let letterStatsLastTooltipInput;
let letterStatsLastPosition = 'top';
let letterStatsTooltipTimeout = 3000;
let letterStatsRunnerTooltip;
let letterStatsDisplayTimeout;


function showLetterStatsTooltip(input) {
    //console.log('llfe: showLetterStatsTooltip()');

    if(letterStatsRunnerTooltip) clearTimeout(letterStatsRunnerTooltip);
    if(letterStatsDisplayTimeout) clearTimeout(letterStatsDisplayTimeout);
    
    letterStatsTooltip.style.display = "";

    let tooltipX;
    let tooltipY;

    const scrollbarWidth = 10;

    const inputRect = input.getBoundingClientRect();
    const tooltipRect = letterStatsTooltip.getBoundingClientRect();
    const viewRight = window.innerWidth;
    
    let position = inputRect.left + (tooltipRect.width / 2) + (inputRect.width / 2) + scrollbarWidth > viewRight ? 'left'
    : inputRect.left - (tooltipRect.width / 2) + (inputRect.width / 2) <= 0 ? 'right'
    : inputRect.top - tooltipRect.height <= 0 ? 'bottom'
    : 'top' ;


    if(position == 'left') {
        tooltipX = inputRect.left - tooltipRect.width;
        tooltipY = inputRect.top - (inputRect.height / 2);
    }
    if(position == 'right') {
        tooltipX = inputRect.right;
        tooltipY = inputRect.top - (inputRect.height / 2);
    }
    if(position == 'bottom') {
        tooltipX = inputRect.left - (tooltipRect.width / 2) + (inputRect.width / 2);
        tooltipY = inputRect.top + inputRect.height;
    }
    if(position == 'top') {
        tooltipX = inputRect.left - (tooltipRect.width / 2) + (inputRect.width / 2);
        tooltipY = inputRect.top - tooltipRect.height;
    };

    letterStatsTooltip.classList.remove('top', 'right', 'bottom', 'left');
    
    requestAnimationFrame(() => {
        letterStatsTooltip.classList.remove('hidden');        
    });

    void letterStatsTooltip.offsetWidth; // force reflow
    
    requestAnimationFrame(() => {
        if(tooltipY < 0) tooltipY = 0;
        if(tooltipY + tooltipRect.height > window.innerHeight) tooltipY = window.innerHeight - tooltipRect.height;
        letterStatsTooltip.style.top = tooltipY+'px';
        letterStatsTooltip.style.left = tooltipX+'px';    
    });

    if(tooltipY < 0) tooltipY = 0;
    if(tooltipY + tooltipRect.height > window.innerHeight) tooltipY = window.innerHeight - tooltipRect.height;
    letterStatsTooltip.style.top = tooltipY+'px';
    letterStatsTooltip.style.left = tooltipX+'px';

    
    requestAnimationFrame(() => {
        letterStatsTooltip.classList.add(position);         
    });

    letterStatsLastTooltipInput = input;
    letterStatsLastPosition = position;

    letterStatsRunnerTooltip = setTimeout(() => {
        letterStatsTooltip.classList.add('hidden');
        letterStatsDisplayTimeout = setTimeout(() => letterStatsTooltip.style.display = "none", 700);
    }, letterStatsTooltipTimeout);

};

function setupLetterStatsTooltip() { 
    if(!letterStatsLastTooltipInput) return;

    //console.log('llfe: setupLetterStatsTooltip()');

    let letterStatsTooltip = document.querySelector('.dangerTooltip');
    let tooltipX
    let tooltipY    

    const inputRect = letterStatsLastTooltipInput.getBoundingClientRect();
    const tooltipRect = letterStatsTooltip.getBoundingClientRect();


    if(letterStatsLastPosition == 'left') {
        tooltipX = inputRect.left - tooltipRect.width;
        tooltipY = inputRect.top - (inputRect.height / 2);
    }
    if(letterStatsLastPosition == 'right') {
        tooltipX = inputRect.right;
        tooltipY = inputRect.top - (inputRect.height / 2);
    }
    if(letterStatsLastPosition == 'bottom') {
        tooltipX = inputRect.left - (tooltipRect.width / 2) + (inputRect.width / 2);
        tooltipY = inputRect.top + inputRect.height;
    }
    if(letterStatsLastPosition == 'top') {
        tooltipX = inputRect.left - (tooltipRect.width / 2) + (inputRect.width / 2);
        tooltipY = inputRect.top - tooltipRect.height;
    }

    requestAnimationFrame(() => {
        if(tooltipY < 0) tooltipY = 0;
        if(tooltipY + tooltipRect.height > window.innerHeight) tooltipY = window.innerHeight - tooltipRect.height;
        letterStatsTooltip.style.top = tooltipY+'px';
        letterStatsTooltip.style.left = tooltipX+'px';
    });

}

let letterStatsTooltipTicking = false;

// function updateLetterStatsTooltipPosition(){
//     //console.log('llfe: updateLetterStatsTooltipPosition()');

//     if(!letterStatsTooltipTicking){
//         requestAnimationFrame(()=>{
//             setupLetterStatsTooltip()
//             letterStatsTooltipTicking = false
//         })
//         letterStatsTooltipTicking = true
//     };
// };

function hideLetterStatsTooltip(){
    //console.log('llfe: hideLetterStatsTooltip()');

    letterStatsTooltip.classList.add('hidden');
    letterStatsDisplayTimeout = setTimeout(() => letterStatsTooltip.style.display = "none", 700);
};

// window.addEventListener("scroll", updateLetterStatsTooltipPosition, true)
// window.addEventListener("resize", updateLetterStatsTooltipPosition)


function checkLetterStatsInputsAvailable() {
    //console.log('llfe: checkLetterStatsInputsAvailable()')

    let letterStatsTooltip = document.querySelector('.dangerTooltip');
    let tooltipErrorMSG = letterStatsTooltip.querySelector('.content .err');
    let inputsToCheck = document.querySelectorAll('.letterStatsCheckAvailable');

    let isAvailable = true;
    for(let i = 0; i < inputsToCheck.length; i++) {
        let itc = inputsToCheck[i];

        if(itc.type == 'number') {
            let min = Number(itc.min);
            let max = Number(itc.max);

            // check is valid number

            if(!/^\d+$/.test(itc.value)) {
                tooltipErrorMSG.innerHTML = 'Please enter a valid number';
                showLetterStatsTooltip(itc);
                isAvailable = false; break;
            }
            else if(itc.value > max) {
                tooltipErrorMSG.innerHTML = `Value must be less than or equal to ${max}`;
                showLetterStatsTooltip(itc);
                isAvailable = false; break;
            }
            else if(itc.value < min) {
                tooltipErrorMSG.innerHTML = `Value must be greater than or equal to ${min}`;
                showLetterStatsTooltip(itc);
                isAvailable = false; break;
            }
        } else if(itc.type == 'text') {
            let minLength = itc.minLength;
            let maxLength = itc.maxLength;

            if(itc.value.length > maxLength) {
                tooltipErrorMSG.innerHTML = `Please lengthen this text to ${maxLength} characters or less (you are currently ${itc.value.length} characters).`;
                showLetterStatsTooltip(itc);
                isAvailable = false; break;
            } else if(itc.value.length < minLength) {
                tooltipErrorMSG.innerHTML = `Please lengthen this text to ${minLength} characters or less (you are currently ${itc.value.length} characters).`;
                showLetterStatsTooltip(itc);
                isAvailable = false; break;
            }
        }

    };

    if(isAvailable) {
        submitLetterStats();
        updateLetterStatsTbody();
    };
};


