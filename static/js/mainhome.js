// home.js


// عناصر الDOM
let dom_items = {
    text_container: document.querySelector('.text_container'),
    words: document.querySelectorAll('.word'),
    letters: document.querySelectorAll('.letter'),
};

// لحالات واوضاع اللعبة
let state = {
    letter_index: 0,
    word_index: 0,
    isInGame: true,
    page: 'home',
};

let saved_states = {
    mode: 'time',
    current_timer: 0,
    punctuations: [],
    numbers: [],
    dataList: [],

};

let timer = {
    default: 10,
    timeLeft: 10,
    interval: null,  
    running: false
};

// لموقع الموشر
async function change_language(language_name, element, spliceNum) {
    if(state.page != 'home') return;

    localStorage.setItem('language_info', JSON.stringify({
        language_name,
        element_name: element.innerHTML || element,
        spliceNum,
    }))
   


    let response = await fetch(`/static/language/json/${language_name}.json`)
    let data = await response.json()

    let language_button = document.querySelector('.language_button')
    
    data = data.splice(0, spliceNum)
    language_button.innerHTML = element.innerHTML || element;
    saved_states.dataList = data;

    hide_languages()
    await restartGame()
}


function resizeContainerToWords() {
    let words_height = dom_items.words[0].offsetHeight * 3;
    let text_container_padding = 30;

    let text_container_height = (words_height + text_container_padding) + 'px';

    document.documentElement.style.setProperty('--text_container_height', text_container_height)
}

let language_info;
let wpm_history = [];
let acc_history = [];
let consistency_history = [];

let domLodded = false;
document.addEventListener('DOMContentLoaded', async function() {
        
    if(JSON.parse(localStorage.getItem('wpm_history')) == null) {
        localStorage.setItem('wpm_history', JSON.stringify([]))
    } wpm_history = JSON.parse(localStorage.getItem('wpm_history'))

    
    language_info = JSON.parse(localStorage.getItem('language_info')) || null;
    if(language_info == null) {
        await change_language('english_mixed', 'English Mixed 1k (default)', 1000);
    } else {
        await change_language(language_info.language_name, language_info.element_name, language_info.spliceNum);
    }

    await transmissionAnimation('restartGame');
    transmissionAnimation('showChart');
    resizeContainerToWords()

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

    currrent_timer: 0,
};

let word_states = [];

let myChart;


function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let secs = seconds % 60;

    if (minutes > 0 && secs < 10) {
        secs = "0" + secs;
    }

    return minutes > 0 ? minutes + ":" + secs : secs.toString();
};

let timer_dom = document.querySelector('.timer');
timer_dom.innerHTML = formatTime(timer.default);



let currentGameRaws = [];

let frameTime = 33; // 33ms لكل Frame
let accumulatedTime = 0; // بالملي ثانية

let timeElapsed = 0;

function startTimer() {
    if(timer.running) return;

    state.isPaused = false;
    timer.running = true;

    timer.interval = setInterval(function() {
        timer.timeLeft -= frameTime / 1000; // بالثواني

        accumulatedTime += frameTime;

        // بعد مرور ثانية كاملة (~1000ms)
        if(accumulatedTime >= 1000) {
            updateCounts()

            summary.mistakesPerSecond = 0;

            accumulatedTime -= 1000;
        }

        if(timer.timeLeft <= 0) {
            endGame();
        }

    }, frameTime);
};

function updateCounts() {
    timer_dom.innerHTML = formatTime(Math.ceil(timer.timeLeft));
    timeElapsed = timer.default - timer.timeLeft;

    // حساب الإحصائيات بعد ثانية
    summary.wpm = countWPM(timeElapsed);
    summary.acc = countACC();
    summary.raw = countRaw(timeElapsed);
    summary.consistency = countConsistency(summary.raw);

    // تحديث Chart
    updateChartData(timeElapsed, summary.wpm, summary.acc, summary.raw, summary.mistakesPerSecond);
}


function pauseTimer(reset) {
    if(timer.running) {
        clearInterval(timer.interval);
        timer.running = false;
        state.isPaused = true;
    }

    if(reset) {
        timer.timeLeft = timer.default;
        timer_dom.innerHTML = formatTime(timer.default);
    }
};


function countWPM(time) {
    if(timeElapsed == 0) return;
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
    if(timeElapsed == 0) return;
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
    if(timeElapsed == 0) return;
    let lastWS = summary.lastWS;

    let correctLetters = summary.correctWords + summary.correctLetters + lastWS.correctLetters;
    let incorrectLetters = summary.mistakes + summary.incorrectWords;

    correctAcc = correctLetters;
    incorrectAcc = incorrectLetters;

    let acc = (correctLetters / (correctLetters + incorrectLetters) * 100).toFixed(2)

    return acc;
};

function countConsistency(currentRaw) {
    if(timeElapsed == 0) return;

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
}

function update_resualts() {
    let stat1 = document.querySelector('header .resualt-state .stats stat1')
    let stat2 = document.querySelector('header .resualt-state .stats stat2')
    
    let topstat1 = document.querySelector('header .resualt-state .stats .stat1 .topstat')
    let bottomstat1 = document.querySelector('header .resualt-state .stats .stat1 .bottomstat')

    let topstat2 = document.querySelector('header .resualt-state .stats stat2 .topstat')
    let bottomstat2 = document.querySelector('header .resualt-state .stats .stat2 .bottomstat')

    bottomstat1.textContent = `${Math.round(summary.wpm)}`
    bottomstat2.textContent = `${Math.round(summary.acc)}%`
    
    bottomstat1.setAttribute('data-tooltip', `${summary.wpm} wpm`)
    bottomstat2.setAttribute('data-tooltip', `${summary.acc}% acc<br>correct ${correctAcc}<br>incorrect ${incorrectAcc}`)

    // console.log(`WPM: ${summary.wpm}`)
    // console.log(`ACC: ${summary.acc}%`)


}

let language_button = document.querySelector('.language_button');
let restart_button = document.querySelector('.restart_button');
let sidebar_container = document.querySelector('.sidebar_container');
let sidebar_buttons = document.querySelector('.sidebar_buttons');


function startGame() {
    timer_dom.style.opacity = 1;
    language_button.style.opacity = 0;
    restart_button.style.opacity = 0;
    sidebar_buttons.style.opacity = 0;
    startTimer()
};

function pauseGame() {
    timer_dom.style.opacity = 0;
    language_button.style.opacity = 1;
    restart_button.style.opacity = 1;
    sidebar_buttons.style.opacity = 1;
    pauseTimer(false)
};

async function endGame() {
    clearInterval(timer.interval);

    timer.running = false;

    state.isInGame = false;
    state.isPaused = true;

    wpm_history.push(summary.wpm)

    pauseGame(); // لاظهار العناصر المخفية
    update_resualts();
    updateMoreStats()

    transmissionAnimation('showChart')


    if(wpm_history.length > 1000) wpm_history.shift(); // عشان لا يتجاوز الحد الاقصى
    localStorage.setItem('wpm_history', JSON.stringify(wpm_history))

    // لافراغ قائمة ال raw بكل مرة نعيد
    currentGameRaws = []
};

// let is_running_restart = false;
// function restartAnimation() {
//     let restartSvg = document.getElementById('restartSvg')
//     if(is_running_restart) return;    
    
//     dom_items.text_container.style.opacity = 0;
//     restartSvg.style.transform = 'rotate(180deg)'

//     is_running_restart = true;
//     let ms = 150;

//     let opacity_animation = setInterval(function() {
//         ms -= 100;
//         if(ms <= 0) {
//             clearInterval(opacity_animation)
//             dom_items.text_container.style.opacity = 1;
//             restartSvg.style.transform = 'rotate(0deg)'
//             restartGame()
//             is_running_restart = false;
//         }
//     }, 100)
// };


async function restartGame() {
    state.page = 'home'
    state.isInGame = true;
    transmissionAnimation('hideChart')
    resetChart()

    // اعادة تعيين اعدادات الملخص
    summary = {
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
        currrent_timer: 0,
    };

    fillScreenWords()
    setTimeout(() => {
    moveCaret(
        dom_items.letters[state.letter_index]);
    }, 200); // بعد الأنيميشن


    clearInterval(timer.interval);

    pauseGame();  //لعرض عناصر الdom وتوقيف اللعبة مؤقتا

    timer.running = false;


    // اعادة ضبط المؤقت
    timer.timeLeft = timer.default;
    timer_dom.innerHTML = formatTime(timer.default);
    timer.duration = timer.default;

    
    let container = dom_items.text_container;
    let typing_container = document.querySelector('.text_container .typing-state');
    typing_container.innerHTML = '<div id="caret"></div>'; // تفرغة الdom

    //اعادة اندكس الكلمات والاحرف للصفر
    state.letter_index = 0;
    state.word_index = 0;


    word_states = [] // تفرغة الword_states
    
    fillScreenWords();  // لجلب كلمات جديدة
    renderWords();  // لاعادة ضبط الرندر

    hideChart()
    
};

// جلب جميع معلومات الكلمات المطلوبة
function createWordState(wordText) {
    let chars = wordText.split('');

    return {
        char: chars, // الحروف الأصلية
        states: chars.map(() => 'pending'),
        typed: chars.map(() => null),
        word_length: chars.length,
        errors: 0,
        extra: [],
        isCorrect: null,
        startTime: 0,
        endTime: 0,
        correctLetterLength: 0,
        correctWordLength: 0,
    
    };
};

function getRandomWord(list) {
    let index = Math.floor(Math.random() * list.length);
    return list[index];
};

function addWord(currentWord) {
    let text_container = dom_items.text_container;

    let typing_container = document.querySelector('.text_container .typing-state')

    let words = dom_items.words;

    let wordindex = 0;
    wordindex = words.length > 0 ? words.length - 1
        : words.length;

    let wordDiv = document.createElement('div');
    wordDiv.classList.add('word');

    for(let i = 0; i < currentWord.length; i++) {
        let letter = document.createElement('letter');
        letter.classList.add('letter');
        letter.setAttribute('data-original', currentWord[i]);
        letter.innerHTML = currentWord[i];
        wordDiv.appendChild(letter)
    }


    typing_container.appendChild(wordDiv)
};

//جلب كلمات من الDOM 
function fillScreenWords() {
    
    //اكثر شي يقدر يضيف 50 لتجنب المشاكل المحتملة 
    for(let i = 0; i < 50; i++) {
        
        //جلب ارتفاع الحاوية وارتفاع السكرول
        const containerHeight = dom_items.text_container.offsetHeight;
        const scrollHeight = dom_items.text_container.scrollHeight;
        
        // التحقق اذا ارتفاع الحاوية اصغر من ارتفاع الكونتينر مع ضرب 2 لاحتياط
        if(scrollHeight >= containerHeight * 2) break;
        
        //نجيب الكلمة ونضيفها للdom ونضيفها للword_states
        let word = getRandomWord(saved_states.dataList);
        addWord(word);
        word_states.push(createWordState(word));
    };

    //اعادة تعيين جميع البيانات 
    dom_items.text_container = document.querySelector('.text_container');
    dom_items.letters = document.querySelectorAll('.letter');
    dom_items.words = document.querySelectorAll('.word');
    
};

function moveCaret(element, after) {
    if(!element) return;

    const caret = document.getElementById('caret');
    const container = dom_items.text_container;

    const rect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const scrollLeft = container.scrollLeft || 0;
    const scrollTop = container.scrollTop || 0;

    // الإحداثيات نسبة للحاوية
    const x = rect.left - containerRect.left + scrollLeft;
    const y = rect.top - containerRect.top + scrollTop;

    const offset_x = 3
    const offset_y = 3

    if(after) {
        caret.style.transform = `translate(${x+rect.width - offset_x}px, ${y + offset_y}px)`;
    }
    else {
        caret.style.transform = `translate(${x - offset_x}px, ${y + offset_y}px)`;  
    }
};

window.addEventListener("resize", function() {
    if(state.page != 'home') return;
    if(!domLodded) return;
    
    const ws = word_states[state.word_index];
    const word = dom_items.words[state.word_index]
    let letters = dom_items.words[state.word_index].children;

    if(ws.typed[ws.word_length - 1] != null) {
        moveCaret(letters[letters.length-1], true);
    }
    else {
        moveCaret(letters[state.letter_index], false);    
    };

    checkAddOrRemove(word)

    // للاضافة بغض النظر عن الشرط
    fillScreenWords()

});

// للتحقق اذا الماوس تحرك وعرض العناصر
let typingInterval = null;
let lastX = null;
let lastY = null;
const threshold = 15;

document.addEventListener("mousemove", (e) => {
    if(state.isPaused) return;
    if (lastX === null || lastY === null) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
    }

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
    return dom_items.words[state.word_index]
           ?.children[state.letter_index]
           ?.getAttribute('data-original') || null;
};

document.addEventListener('keydown', function(event) {
    event.preventDefault(); 

    if(!state.isInGame) return;

    const key = event.key;

    // الحرف الحالي من الكلمة الحالية
    const excepted = getExceptedLetter()

    if(key.length == 1 && key != ' ' && key == excepted) {
        handleOneLetter('correct', key, excepted)
    }
    
    else if(key.length == 1 && key != ' ' && key != excepted) {
        handleOneLetter('incorrect', key, excepted)
    }
    
    else if(key == ' ') {
        handleSpace('space', key, excepted, event)
    }
    
    else if(key == 'Backspace') {
        handleBackSpace('backspace', key, excepted)
    }
    
    else if(key == 'Tab') {
        handleWordState('tab', key, excepted); // not important
    }
    else {
        //نقدر نطبع هنا لنعرف شو الزر اللي انضغط 
    };

    renderWords(key, 'correct')
    checkIsCorrect()
    
    updateSummaryLastWs()
});

function handleOneLetter(event, key, excepted) {
    startGame()
    
    const ws = word_states[state.word_index];

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
    default_event.preventDefault();
    let ws = word_states[state.word_index];
    let letters_not_null = 0 //عدد الاحرف المكتوبة

    //لوب لنتحقق اذا فيه حرف مكتوب
    for(let i = 0; i < ws.word_length; i++) {
        if(ws.typed[i] != null) {
            letters_not_null ++;
        };
    };

    // اذا نحن قبل الكلمة الاخيرة وفيه على الاقل كلمة مكتوبة
    if(state.word_index < dom_items.words.length - 1 && letters_not_null > 0) {

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
        summary.extra += ws.extra.length;
        summary.CLICW += ws.isCorrect ? ws.word_length : 0;

        summary.correctWords += ws.isCorrect == true ? 1 : 0;
        summary.incorrectWords += ws.isCorrect == false ? 1 : 0;

        summary.wordsLength ++;


        state.word_index ++;
        state.letter_index = 0;

    };

};

function handleBackSpace() {
    let ws = word_states[state.word_index];

    // حذف أي حروف إضافية أولًا
    if(ws.extra.length > 0) {
        ws.extra.pop();
        return;
    }

    if(state.letter_index == 0 && state.word_index > 0 && !word_states[state.word_index-1].isCorrect) {
        state.word_index--;
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
        }
        return;
    }


    //متغير تحديد وين لازم اكون
    let back = state.letter_index - 1;
    // اذا الكلمة null ننقص عشان بالنهاية ننقل للمكان اللي نقصنا منه الnull
    while (back >= 0 && ws.typed[back] == null) {
        back --;
    }
    state.letter_index = back + 1;

    // اذا الاحرف صفر ونحن اكثر من الكلمة الاولى والكلمة السابقة غير صحيحى = رجوع
    if(state.letter_index == 0 && state.word_index > 0 && !word_states[state.word_index-1].isCorrect) {
        state.word_index--;
        ws = word_states[state.word_index];
        state.letter_index = ws.word_length;
        return;
    }

    // اذا الحرف الحالي ليس فارغ = احذفه مباشرة
    if(ws.typed[state.letter_index] != null) {
        ws.states[state.letter_index] = 'pending';
        ws.typed[state.letter_index] = null;

        // قطع لكي لا ننزل للشرط الاخر
        return;
    }

    //اذا الحرف الحالي فارغ وليس في اول حرف = انزل للمؤشر السابق
    if(state.letter_index > 0) {
        state.letter_index--;

        ws.states[state.letter_index] = 'pending';
        ws.typed[state.letter_index] = null;
    };
};

function checkIsCorrect() {
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
};

function renderExtraLetters(key) {
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
    summary.currrent_timer = timer.default;
};


function renderWords(key, event) {
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
    const container = dom_items.text_container;

    // موقع الحرف بالنسبة للحاوية + مقدار التمرير الحالي
    const wordPosition = word.offsetTop - container.scrollTop;

    const containerMiddle = container.clientHeight / 2;

    // لو الحرف أعلى أو أسفل منتصف الحاوية
    if(wordPosition > containerMiddle) {
        removeFirstRow();
        fillScreenWords();
    };
};

let language_select = document.querySelector('.language_select')
let overlay_languages = document.querySelector('.overlay_languages')

function show_languages() {  
    state.isInGame = false;
    language_select.style.display = 'block';
    overlay_languages.style.display = 'block';
};

function hide_languages() {
    state.isInGame = true;
    language_select.style.display = 'none';
    overlay_languages.style.display = 'none';
};

let informations = document.querySelectorAll('.information');
let three_points_svg = document.querySelector('.three_points_svg');
let hide_informations = true;

function hideInformations() { 

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



let special_color = getComputedStyle(document.documentElement).getPropertyValue('--special-color').trim();
let type_incorrect_color = getComputedStyle(document.documentElement).getPropertyValue('--type-incorrect').trim();

const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');


function clearCanvas() {
  // مسح فعلي كامل مهما كان في scale أو transform
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}


const data = {
    labels: [],
    datasets: [
        {
            label: "wpm",
            data: [],

            borderColor: special_color,
            backgroundColor: special_color+'1',
            borderWidth: 3,
            tension: 0.2,
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
            borderColor: '#fffa',
            backgroundColor: '#fff4',
            borderWidth: 2,
            tension: 0.2,
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
            borderColor: '#047',
            backgroundColor: '#0474',
            borderWidth: 2,
            tension: 0.2,
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
            borderColor: type_incorrect_color+'a',
            backgroundColor: type_incorrect_color,
            borderWidth: 2,
            tension: 0.2,
            showLine: true,
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
                return v > 0 ? 6 : 0;
            },

            pointHoverRadius: (ctx) => {
                const v = ctx?.parsed?.y;
                return v > 0 ? 7 : 0;
            },

            legend: {
                pointStyle: 'square',
                pointRadius: 14
            }
        },
    ],
};

function createLegendCross(size = 16, color = '#fff', lineWidth = 2) {
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
}



let body = document.querySelector('body')
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
                        return chart.data.datasets.map((dataset, i) => {
                            let pointStyle = 'square';
                            let radius = 8;

                            // تخصيص لكل dataset حسب اسمه
                            if (dataset.label === 'Mistakes') {
                                pointStyle = createLegendCross(12, type_incorrect_color);
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
                        color: '#fff2',
                        lineWidth: 1,
                        drawBorder: false,
                        drawTicks: false
                    },
                    ticks: {
                        color: '#fff4',
                        maxTicksLimit: 11,
                    },
                },

                y: {
                    grid: {
                        type: 'linear',
                        position: 'left',
                        display: true,
                        color: '#fff2', // أوضح شوي من X
                        lineWidth: 1,
                        drawBorder: false,
                        drawTicks: false
                    },
                    ticks: {
                        color: '#fff4',
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
                        color: '#fff4',
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
    // أضف الوقت إلى الـ labels
    myChart.data.labels.push(+time.toFixed(0));

    // أضف القيمة الجديدة
    myChart.data.datasets[0].data.push(wpm);
    myChart.data.datasets[1].data.push(acc);
    myChart.data.datasets[2].data.push(raw);
    myChart.data.datasets[3].data.push(mistakes)


    const maxPoints = 6000;
    if (myChart.data.labels.length > maxPoints) {
        myChart.data.labels.shift();  // إزالة أول عنصر
        for(let i = 0; i < myChart.data.datasets.length; i++) {
            myChart.data.datasets[i].data.shift()
        }
    }

    // تحديث الشارت
    myChart.update();
};

function resetChart() {
    // مسح كل الـ labels
    myChart.data.labels = [];


    // مسح كل البيانات لكل dataset
    myChart.data.datasets.forEach(dataset => {
        dataset.data = [];
    });

    // تحديث الشارت
    myChart.update();
};


let typing_state = document.querySelectorAll('.typing-state');
let resualt_state = document.querySelectorAll('.resualt-state');

function showChart() {
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

    let restart_state = document.querySelector('.restart_container .typing-state')
    restart_state.style.display = ''

    scroll({
        top: 0,
        behavior: 'smooth', 

    })

    resizeChartHeader();
    resizeTextContainer();
};
let type = document.querySelector('.type');

function hideChart() {
    state.page = 'home';
    state.isInGame = true;

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

    scroll({
        top: 0,
    });

    resizeContainerToWords()
};

let canRunTransitionAnimation = true
async function transmissionAnimation(action) {
    if(!canRunTransitionAnimation) return;

    let fade = document.querySelectorAll('.fade');

    // 1️⃣ إظهار الـ fade
    for (let i = 0; i < fade.length; i++) {
        fade[i].style.display = 'block';
    }

    // 2️⃣ ضمان تشغيل الانتقال
    requestAnimationFrame(() => {
        for (let i = 0; i < fade.length; i++) {
            fade[i].style.opacity = '1';
        }
    });

    // 3️⃣ بعد انتهاء fade-in
    setTimeout(() => {

        // تنفيذ الدالة
        if (action === 'restartGame') restartGame();
        else if (action === 'showChart') showChart();
        else if (action === 'hideChart') hideChart();
        
        resizeChartHeader()
        resizeTextContainer()

        // showChart()

        // 4️⃣ fade-out (هون كان الخطأ)
        for (let i = 0; i < fade.length; i++) {
            fade[i].style.opacity = '0';
        }

        // 5️⃣ إخفاء نهائي
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

window.addEventListener('resize', function() {
    resizeChartHeader()
    resizeTextContainer()
    updateTooltipPosition()

    config.options.devicePixelRatio = window.devicePixelRatio + 0.5;
    myChart.update()
});


function resizeChartHeader() {
    if(state.page == 'chart') {
        if(window.innerWidth >= 768) {
            document.documentElement.style.setProperty('--header-height', '200px');
        }
        else {
            document.documentElement.style.setProperty('--header-height', '300px');
        };
    };
};


function resizeTextContainer() {
    if(state.page == 'chart') {
        if(window.innerWidth >= 1150) {
            document.documentElement.style.setProperty('--text_container_height', '130px');
            document.documentElement.style.setProperty('--text_container-margin', '20px 12% 0px 4%');
        }
        else if(window.innerWidth < 1150 && window.innerWidth >= 768) {
            document.documentElement.style.setProperty('--text_container_height', '190px');
            document.documentElement.style.setProperty('--text_container-margin', '20px 12% 0px 4%');

        }
        else {
            document.documentElement.style.setProperty('--text_container_height', '300px');
            document.documentElement.style.setProperty('--text_container-margin', '20px 8%');

        }
    };
};

function updateMoreStats() {
    
    let game_type_bottom = document.querySelector('.resualt-state .morestats .game-type .bottom');

    let characters_bottom = document.querySelector('.resualt-state .morestats .characters .bottom');
    let raw_bottom = document.querySelector('.resualt-state .morestats .raw .bottom');
    let wpm_bottom = document.querySelector('.resualt-state .morestats .wpm .bottom');
    let consistency_bottom = document.querySelector('.resualt-state .morestats .consistency .bottom');
    let personal_best_bottom = document.querySelector('.resualt-state .morestats .personal-best .bottom');


    let correctLetters = summary.correctLetters + summary.lastWS.incorrectLetters;
    let incorrectLetters = summary.incorrectLetters + summary.lastWS.incorrectLetters;
    let extra = summary.extra + summary.lastWS.extra;
    let missed = summary.missed;
    let mistakes = summary.mistakes

    let language_type = language_info.element_name.split(' ')[0];
   
     game_type_bottom.innerHTML = `
        <p class="round_time">time ${formatTime(summary.currrent_timer)}</p>
        <p class="round_language">${language_type}</p>
    `; game_type_bottom.setAttribute('data-tooltip', `time ${timer.default}<br>${language_type}`);
    
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

    let best_wpm = wpm_history.length ? Math.round(Math.max(...wpm_history)) : Math.round(+summary.wpm);
    personal_best_bottom.innerHTML = `
      ${best_wpm}
    `;personal_best_bottom.setAttribute('data-tooltip', `${Math.max(...wpm_history)} best wpm`)
}

let activeTarget = null;

const tooltip = document.querySelector('.tooltip');
let tooltip_content = document.querySelector('.tooltip .content');
function updateTooltipPosition() {

  if (!activeTarget) return;


  const rect = activeTarget.getBoundingClientRect();

  // نضع الـ tooltip أفقياً في منتصف العنصر
  tooltip.style.left = `${rect.left + rect.width / 2}px`;

  // نضع الـ tooltip عموديًا عند رأس العنصر
  tooltip.style.top  = `${rect.top}px`;
  tooltip.style.transform = 'translate(-50%, -100%)';

}


// نطبّق الأحداث على كل عنصر عنده class = stat
document.querySelectorAll('.stat').forEach(el => {

  // عندما يدخل الماوس على العنصر
  el.addEventListener('mouseenter', () => {

    // نخزّن هذا العنصر كعنصر نشط
    activeTarget = el;

    // نُظهر الـ tooltip
    tooltip.classList.add('show');
    
    // tooltip_content.innerHTML = 
    let current_content = el.getAttribute('data-tooltip')
    tooltip_content.innerHTML = current_content

    // نحدّث مكانه فورًا
    updateTooltipPosition();
  });

  // عندما يخرج الماوس من العنصر
  el.addEventListener('mouseleave', () => {

    // نلغي العنصر النشط
    activeTarget = null;

    // نخفي الـ tooltip
    tooltip.classList.remove('show');
  });

});


// عند السكرول نعيد حساب المكان
// لأن العنصر يتحرك بالنسبة للشاشة
window.addEventListener('scroll', updateTooltipPosition);

// عند تغيير حجم الشاشة نعيد الحساب أيضًا
window.addEventListener('resize', updateTooltipPosition);
