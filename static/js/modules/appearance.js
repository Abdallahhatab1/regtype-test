


// === onclick for buttons ===
function onclickAppearanceButtons(element, key, name, value, className) {
    const elements = element.parentNode.querySelectorAll('*');
    const k = settings_state.appearance[key];

    elements.forEach(e => {
        e.classList.remove('isActive');
    });  element.classList.add('isActive');


    // if we are in buttons
    if(k.type.includes('buttons')) {
        settings_state.appearance[key].value = value;
        settings_state.appearance[key].className = className;
            console.log(k)
    };


    localStorage.setItem('settings_state', JSON.stringify(settings_state))
};
// ===

// === oninput and onchange for sliders ===
function oninputAppearanceSlider(element, key, type) {
    const range_number = element.parentNode.querySelector('.range_number');
    const range_slider = element.parentNode.querySelector('.range_slider');

    const k = type.includes('special') && type.includes('glow-sliders') 
    ? settings_state.appearance.appearanceGlowSliders.sliders[key]
    : settings_state.appearance[key] ;

    const value = range_slider.value;
    const unit = k.unit;

    range_number.innerHTML = `${value}${unit}`
};

function onchangeAppearanceSlider(element, key, type) {
    const range_number = element.parentNode.querySelector('.range_number');
    const range_slider = element.parentNode.querySelector('.range_slider');

    // check if k to special or normal
    const k = type.includes('special') && type.includes('glow-sliders') 
        ? settings_state.appearance.appearanceGlowSliders.sliders[key]
        : settings_state.appearance[key] ;


    const value = range_slider.value;
    const propertyUnit = k.unit == 'x' ? '' : k.unit ;
    
    const valWithUnit = `${value}${propertyUnit}`;
    document.documentElement.style.setProperty(k.cssVar, valWithUnit);

    console.log(k.cssVar)

    // check if it's special or normal
    if(type.includes('special') && type.includes('glow-sliders')) {
        settings_state.appearance.appearanceGlowSliders.sliders[key].value = value;
    } else {
        settings_state.appearance[key].value = value;
    };

    localStorage.setItem('settings_state', JSON.stringify(settings_state));
};


// === all applies functions ===

// it void from global.js (LOCAL VOID "only settings.js")
// let glowSliders = document.getElementById('#glowSliders')
// let glowLetterElements = {

// };

function applyAppearanceButtons() {
    let appearanceSection = document.querySelector('.settings_container .content_container .content .option #appearance');

    // slider key names need to be same slider key names in (settings_states.caret > sliders)
    let domElements = {
        appearanceLiveStats: appearanceSection.querySelector('#appearanceLiveStats'),
        appearanceGameLeft: appearanceSection.querySelector('#appearanceGameLeft'),
    };

    for(const key in settings_state.appearance) {
        const k = settings_state.appearance[key];
        
        if(k.type.includes('buttons')) {
            let appearanceButtons = domElements[key].querySelectorAll('.global_settings_button > *');
            let appearanceCurrentButton;


            appearanceButtons.forEach(e => {
                e.classList.remove('isActive');
                
                if(e.classList.contains(k.className)) {
                   appearanceCurrentButton = e;
                };
            });
            appearanceCurrentButton.classList.add('isActive');

        };
    };
};

function applyAppearanceSliders() {
    let appearanceSection = document.querySelector('.settings_container .content_container .content .option #appearance');

    // slider key names need to be same slider key names in (settings_states.display > sliders)
    let sliderElements = {
        appearanceGlowGlobal: appearanceSection.querySelector('#appearanceGlowGlobal'),
        appearanceTextBoxWidth: appearanceSection.querySelector('#appearanceTextBoxWidth'),
        appearanceLettersTransition: appearanceSection.querySelector('#appearanceLettersTransition'),
    };

    for(const key in settings_state.appearance) {
        
        // if type has (slider) and (var) = apply slider to vars and apply sliders values
        const k = settings_state.appearance[key];

        if(k.type.includes('slider') && k.type.includes('var') && !k.type.includes('special')) {
            
            // set propety to CSS            
            const propertyUnit = k.unit == 'x' ? '' : k.unit ;
            const valWithUnit = `${k.value}${propertyUnit}`;

            document.documentElement.style.setProperty(k.cssVar, valWithUnit);

            // number and slider
            let range_number = sliderElements[key].querySelector('.range_number');
            let range_slider = sliderElements[key].querySelector('.range_slider');

            // apply slider values
            range_number.innerHTML = `${k.value}${k.unit}`;
            range_slider.value = k.value;

        };

        if(k.type.includes('special') && k.type.includes('glow-sliders')) {
            let specialKey = k.sliders;

            let appearanceGlowSliders = document.querySelector('#appearanceGlowSliders')
            let glowSliders = {
                glowInactiveLetter: appearanceGlowSliders.querySelector('#glowInactiveLetter'),
                glowCorrectLetter: appearanceGlowSliders.querySelector('#glowCorrectLetter'),
                glowIncorrectLetter: appearanceGlowSliders.querySelector('#glowIncorrectLetter'),
                glowExtraLetter: appearanceGlowSliders.querySelector('#glowExtraLetter'),
            };

            for(const key in specialKey) {
                const k = settings_state.appearance.appearanceGlowSliders.sliders[key];

                // set propety to CSS            
                const propertyUnit = k.unit == 'x' ? '' : k.unit ;
                const valWithUnit = `${k.value}${propertyUnit}`;

                document.documentElement.style.setProperty(k.cssVar, valWithUnit);

                // number and slider
                let range_number = glowSliders[key].querySelector('.range_number')
                let range_slider = glowSliders[key].querySelector('.range_slider')

                // apply slider values
                range_number.innerHTML = `${k.value}${k.unit}`;
                range_slider.value = k.value;
            };
        };
    };
};


// === special state (glow letters sliders) ===


// only settings
function applyAppearanceSettings() {
    if(currentPage != 'settings') return;
    applyAppearanceButtons();    
    applyAppearanceSliders();
};

// global
function applyAppearanceProperties() {
    for(const key in settings_state.appearance) {
        const k = settings_state.appearance[key];

        if(k.type.includes('special') && k.type.includes('glow-sliders')) {
            for(const key in k.sliders) {
                const specialKey = k.sliders[key];

                const propertyUnit = specialKey.unit == 'x' ? '' : specialKey.unit ;
                const valWithUnit = `${specialKey.value}${propertyUnit}`;
                document.documentElement.style.setProperty(specialKey.cssVar, valWithUnit);
            };
        };
        
        if(k.type.includes('slider') && k.type.includes('var')) {
            const propertyUnit = k.unit == 'x' ? '' : k.unit ;
            const valWithUnit = `${k.value}${propertyUnit}`;
            document.documentElement.style.setProperty(k.cssVar, valWithUnit);
        };
    };
};


// this button has special state because it add class to element in home.html
function applyAppearanceHome() {
    // to appearance class name
    let dom_timer = document.querySelector('.timer_container .timer');
    let dom_bigTimer = document.querySelector('.timer_container .bigTimer');
    let dom_liveStats = document.querySelector('.timer_container .liveStats');
    let dom_bigLiveStats = document.querySelector('.restart_button .bigLiveStats');


    const path = settings_state.appearance;

    // gameLeft
    if(path.appearanceGameLeft.value == 'default') {
        dom_bigTimer.classList.add('hidden');
        dom_timer.classList.remove('hidden');
    } else if(path.appearanceGameLeft.value == 'large') {
        dom_timer.classList.add('hidden');    
        dom_bigTimer.classList.remove('hidden');
    } else {
        dom_timer.classList.add('hidden');    
        dom_bigTimer.classList.add('hidden');        
    };

    // live stats
    if(path.appearanceLiveStats.value == 'default') {
        dom_bigLiveStats.classList.add('hidden');
        dom_liveStats.classList.remove('hidden');
    } else if(path.appearanceLiveStats.value == 'large') {
        dom_liveStats.classList.add('hidden');    
        dom_bigLiveStats.classList.remove('hidden');
    } else {
        dom_liveStats.classList.add('hidden');    
        dom_bigLiveStats.classList.add('hidden');        
    };
};
// ===





