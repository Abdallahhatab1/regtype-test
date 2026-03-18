

// caretButtons


// === onclick for buttons ===
function sidebarOnclickCaretButtons(element, key, value, className) {
    const elements = element.parentNode.querySelectorAll('*');
    const k = settings_state.caret[key];

    elements.forEach(e => {
        e.classList.remove('isActive');
    });  element.classList.add('isActive');


    // if we are in buttons
    if(k.type.includes('buttons')) {
        settings_state.caret[key].value = value;
        settings_state.caret[key].className = className;
    };


    localStorage.setItem('settings_state', JSON.stringify(settings_state));
    sidebarApplyCaretSettings();
    
};
// ===

// === oninput and onchange for sliders ===
function sidebarOninputCaretSlider(element, key) {
    const range_number = element.parentNode.querySelector('.range_number');
    const range_slider = element.parentNode.querySelector('.range_slider');

    const value = range_slider.value;
    const unit = settings_state.caret[key].unit;

    range_number.innerHTML = `${value}${unit}`
};

function sidebarOnchangeCaretSlider(element, key) {
    const range_number = element.parentNode.querySelector('.range_number');
    const range_slider = element.parentNode.querySelector('.range_slider');

    const k = settings_state.caret[key];

    const value = range_slider.value;
    const propertyUnit = k.unit == 'x' ? '' : k.unit ;
    
    const valWithUnit = `${value}${propertyUnit}`;
    document.documentElement.style.setProperty(k.cssVar, valWithUnit);

    settings_state.caret[key].value = value;
    localStorage.setItem('settings_state', JSON.stringify(settings_state));
    sidebarApplyCaretSettings()
};
// ===


// === all applies functions ===

// it void from global.js (LOCAL VOID "only settings.js")
function sidebarApplyCaretButtons() {
    let caretSection = document.querySelector('#sidebar-caret .content');

    // slider key names need to be same slider key names in (settings_states.caret > sliders)
    let domElements = {
        caretShape: caretSection.querySelector('#caretShape'),
        caretTransition: caretSection.querySelector('#caretTransition'),
        caretBlink: caretSection.querySelector('#caretBlink'),
        caretStrong: caretSection.querySelector('#caretStrong'),
    };

    for(const key in settings_state.caret) {
        const k = settings_state.caret[key];
        
        if(k.type.includes('buttons')) {
            let caretShapeButtons = domElements[key].querySelectorAll('.sidebar-global_settings_button > *');
            let caretShapeCurrentButton;

            caretShapeButtons.forEach(e => {
                e.classList.remove('isActive');

                if(e.classList.contains(k.className)) {
                   caretShapeCurrentButton = e;
                };
            });
            caretShapeCurrentButton.classList.add('isActive');
        };

        if(k.type.includes('slider')) {

            // set propety to CSS            
            const propertyUnit = k.unit == 'x' ? '' : k.unit ;
            const valWithUnit = `${k.value}${propertyUnit}`;

            document.documentElement.style.setProperty(k.cssVar, valWithUnit);

            // number and slider
            let range_number = domElements[key].querySelector('.range_number');
            let range_slider = domElements[key].querySelector('.range_slider');

            // apply slider values
            range_number.innerHTML = `${k.value}${k.unit}`;
            range_slider.value = k.value;
        };
    };
};

// it void from global.js (GLOBAL VOID)
function sidebarApplyCaretProperties() {
    for(const key in settings_state.caret) {
        const k = settings_state.caret[key];
 
        if(k.type.includes('css-var')) {
            const propertyUnit = k.unit == 'x' ? '' : k.unit ;
            const valWithUnit = `${k.value}${propertyUnit}`;
            document.documentElement.style.setProperty(k.cssVar, valWithUnit);
        };
    };
};


// this function to get all applies like "sidebarApplyCaretButtons()" and void from settings.js
function sidebarApplyCaretSettings() {
    sidebarApplyCaretProperties();
    sidebarApplyCaretHome();
    sidebarApplyCaretButtons();
}; sidebarApplyCaretButtons()


// this button has special state because it add class to element in home.html
function sidebarApplyCaretHome() {
    // to caret shape class name
    if(currentPage != 'home') return;

    const caret = document.getElementById('caret');
    const shape = settings_state.caret.caretShape.value;
    caret.classList = 'caretBlink';
    caret.classList.add(shape);
};



// ===