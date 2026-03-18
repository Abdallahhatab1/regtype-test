

audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// === onclick for buttons ===
async function onclickVolumeButtons(element, key, section, value, className) {
    const elements = element.parentNode.querySelectorAll('*');
    const k = settings_state.sound[key];

    elements.forEach(e => {
        e.classList.remove('isActive');
    });  element.classList.add('isActive');


    // if we are in buttons
    if(k.type.includes('buttons')) {
        settings_state.sound[key].value = value;
        settings_state.sound[key].className = className;


        if(k.type.includes('sound') && k.type.includes('preview')) {
            if(value != 'off') {
                // get audio
                const res = await fetch(`/data/audio/${section}/${value}.wav`);
                const arrayBuffer = await res.arrayBuffer();
                const audioName = await audioCtx.decodeAudioData(arrayBuffer);

                // play audio
                const source = audioCtx.createBufferSource();
                source.buffer = audioName;
                const gainNode = audioCtx.createGain();
                gainNode.gain.value = settings_state.sound[key].volume;
                source.connect(gainNode).connect(audioCtx.destination);
                source.start(0);
            }
        };
    };

    localStorage.setItem('settings_state', JSON.stringify(settings_state));
    applyVolumeLive();
};
// ===



// === oninput and onchange for sliders ===
function oninputVolumeSlider(element, key, type='default') {
    const range_number = element.parentNode.querySelector('.range_number');
    const range_slider = element.parentNode.querySelector('.range_slider');

    const value = range_slider.value;
    const unit = settings_state.sound[key].unit;
    
    if(type == 'default') {
        range_number.innerHTML = `${value}${unit}`;

    }
    
    if(type == 'volumeLevel') {
        range_number.innerHTML = `${Math.round(value * 100)}%`;

        const volumeSvgs = element.parentNode.parentNode.querySelectorAll('.title_and_svg svg');

        volumeSvgs.forEach(v => {
            v.style.display = 'none';
        });

        if(value == 0){
            volumeSvgs[0].style.display = '';
        } else if(value > 0 && value < 0.6){
            volumeSvgs[1].style.display = '';
        } else if(value >= 0.6){
            volumeSvgs[2].style.display = '';
        }

    };
};

function onchangeVolumeSlider(element, key) {
    const range_number = element.parentNode.querySelector('.range_number');
    const range_slider = element.parentNode.querySelector('.range_slider');

    const k = settings_state.sound[key];
    const value = range_slider.value;

    if(k.type.includes('css-var')) {
        const propertyUnit = k.unit == 'x' ? '' : k.unit ;
        const valWithUnit = `${value}${propertyUnit}`;
        document.documentElement.style.setProperty(k.cssVar, valWithUnit); 
        settings_state.sound[key].value = value;
    } else if(k.type.includes('volume')) {
        settings_state.sound[key].volume = value;
    };

    localStorage.setItem('settings_state', JSON.stringify(settings_state));
    applyVolumeLive();
};
// ===


// === all applies functions ===

// it void from global.js (LOCAL VOID "only settings.js")
function applyVolumeButtons() {
    let soundSection = document.querySelector('.settings_container .content_container .content .option #sound');

    // slider key names need to be same slider key names in (settings_states.caret > sliders)
    let domElements = {
        soundCorrectLetter: soundSection.querySelector('#soundCorrectLetter'),
        soundIncorrectLetter: soundSection.querySelector('#soundIncorrectLetter'),
        soundExtraLetter: soundSection.querySelector('#soundExtraLetter'),
        soundCorrectWord: soundSection.querySelector('#soundCorrectWord'),
        soundIncorrectWord: soundSection.querySelector('#soundIncorrectWord'),
        soundBackspace: soundSection.querySelector('#soundBackspace'),
    };

    for(const key in settings_state.sound) {
        const k = settings_state.sound[key];
        
        if(k.type.includes('buttons')) {
            let soundButtons = domElements[key].querySelectorAll('.global_settings_button > *');
            let soundCurrentButton;

            soundButtons.forEach(e => {
                e.classList.remove('isActive');
                if(e.classList.contains(k.className)) {
                   soundCurrentButton = e;
                };
            });

            soundCurrentButton.classList.add('isActive');

        };

        if(k.type.includes('volume-preview-and-slider')) {

            // set propety to CSS            
            const propertyUnit = k.unit == 'x' ? '' : k.unit ;
            const valWithUnit = `${k.value}${propertyUnit}`;

            document.documentElement.style.setProperty(k.cssVar, valWithUnit);

            // number and slider
            let range_number = domElements[key].parentNode.querySelector('.slider_container .range_container .range_number');
            let range_slider = domElements[key].parentNode.querySelector('.slider_container .range_container .range_slider');

            // apply slider values
            range_number.innerHTML = `${Math.round(k.volume * 100)}%`;
            range_slider.value = k.volume;


            
            const volumeSvgs = range_slider.parentNode.parentNode.querySelectorAll('.title_and_svg svg');

            volumeSvgs.forEach(v => {
                v.style.display = 'none';
            });

            if(k.volume == 0){
                volumeSvgs[0].style.display = '';
            } else if(k.volume > 0 && k.volume < 0.6){
                volumeSvgs[1].style.display = '';
            } else if(k.volume >= 0.6){
                volumeSvgs[2].style.display = '';
            }
        };
    };
};



// it void from global.js (GLOBAL VOID)
function applyVolumeProperties() {

};


// this function to get all applies like "applyCaretButtons()" and void from settings.js
function applyVolumeSettings() {
    if(currentPage != 'settings') return;
    applyVolumeButtons();
};



// this button has special state because it add class to element in home.html
function applyVolumeHome() {
    // to caret shape class name
    // const caret = document.getElementById('caret');
    // const shape = settings_state.caret.caretShape.value;
    // caret.classList = 'caretBlink';
    // caret.classList.add(shape);
};
// ===





