






function sidebarOninputDisplaySliders(element, key) {
    const range_number = element.parentNode.querySelector('.range_number');
    const range_slider = element.parentNode.querySelector('.range_slider');

    const value = range_slider.value;
    const unit = settings_state.display[key].unit;

    range_number.innerHTML = `${value}${unit}`
};
function sidebarOnchangeDisplaySlider(element, key) {
    const range_number = element.parentNode.querySelector('.range_number');
    const range_slider = element.parentNode.querySelector('.range_slider');

    const k = settings_state.display[key];
    const value = range_slider.value;
    const propertyUnit = k.unit == 'x' ? '' : k.unit ;
    
    const valWithUnit = `${value}${propertyUnit}`;
    document.documentElement.style.setProperty(k.cssVar, valWithUnit);

    settings_state.display[key].value = value;
    localStorage.setItem('settings_state', JSON.stringify(settings_state));

    if(currentPage == 'home') {
        resizeContainerToWords()
    }
};
function sidebarApplyDisplayButtons() {
    let displaySection = document.querySelector('.sidebar_content .options #sidebar-display');

    // slider key names need to be same slider key names in (settings_states.display > sliders)
    let sliderElements = {
        fontSizeGlobal: displaySection.querySelector('#sidebarFontSizeGlobal'),
        fontSizeTyping: displaySection.querySelector('#sidebarFontSizeTyping'),
        letterSpacingTyping: displaySection.querySelector('#sidebarLetterSpacingTyping'),
        wordSpacingTyping: displaySection.querySelector('#sidebarWordSpacingTyping'),
        lineHeightTyping: displaySection.querySelector('#sidebarLineHeightTyping'),
        errorUnderWordHeight: displaySection.querySelector('#sidebarErrorUnderWordHeight'),
    };

    for(const key in settings_state.display) {
        
        // if type has (slider) and (var) = apply slider to vars and apply sliders values
        const k = settings_state.display[key]; 
        if(k.type.includes('slider') && k.type.includes('var')) {
            
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
    };
};

function sidebarApplyDisplaySettings() {
    sidebarApplyDisplayButtons()
}; sidebarApplyDisplaySettings()




