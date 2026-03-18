
// ============================ START font family (special state) ============================
let fontFamilyButton = document.querySelector(".settings_container #display .display_container .global_one_button_title .global_one_button");

let fontsContent = document.querySelector('.fontsContent');
let isInFontsBoard = false;

// font block, title and page num
let fontsBlock = document.querySelector('.fontsBoardContainer .scroll-area .scrollContent .fontsBlock');
let fontsTitle = document.querySelector('.fontsBoardContainer .title_and_pageNum .fonts_title');
let fontsPageNum = document.querySelector('.fontsBoardContainer .title_and_pageNum .fonts_page_num');

// arrows
let fontsArrowLeft = document.querySelector('.fontsBoardContainer .leftArrow');
let fontsArrowRight = document.querySelector('.fontsBoardContainer .rightArrow');

// current page font part to main and second page
let mainCurrentFontsPart = 0;
let currentFontsPart = 0;

// get fonts from database
let groupNames = ['arabic', 'latin', 'monospace'];
async function getFontFamilyGroups() {
    let response = await fetch(`/data/json/fonts.json`);
    let data = await response.json();
    
    let size = 10;

    settings_state.display.fontFamilyGlobal.fontGroups = [];


    for(let i = 0; i < groupNames.length; i++) {
        let currentGroup = [];
        let currentList = data[groupNames[i]];
        for(let a = 0; a < currentList.length; a += size) {
            let group = currentList.slice(a, a+size);
            currentGroup.push(group);
        };
        settings_state.display.fontFamilyGlobal.fontGroups.push(currentGroup);
    };

    localStorage.setItem('settings_state', JSON.stringify(settings_state))
};


let fontFamilyContainer = document.querySelector('.fontFamilyContainer');
let fontFamilyOverlay = document.querySelector('.font_family_overlay');
function fontFamilyShowSections() {
    fontFamilyContainer.classList.remove('hidden');
    fontFamilyOverlay.classList.remove('hidden');
};
function fontFamilyHideSections() {
    fontFamilyContainer.classList.add('hidden');
    fontFamilyOverlay.classList.add('hidden');
};


// overlay for loading UI
let fontsDisableOverlay = document.querySelector('.fontsBoardContainer .fontsDisableOverlay');
function fontFamilyAddNewFonts(groupIndex, part) {
    fontsBlock.innerHTML = ``;

    let currentGroup = settings_state.display.fontFamilyGlobal.fontGroups[part][groupIndex];
    let groupPartLength = settings_state.display.fontFamilyGlobal.fontGroups[part].length;
    fontsPageNum.innerHTML = `${currentFontsPart+1}<span>/</span>${groupPartLength}`


    fontsDisableOverlay.style.display = '';
    for(let i = 0; i < currentGroup.length; i++) {
        let fontDiv = document.createElement('div');
        fontDiv.classList.add('font');

        let fontP = document.createElement('p');
        fontP.style.fontFamily = currentGroup[i];

        fontP.innerHTML = currentGroup[i];

        fontDiv.appendChild(fontP);
        fontDiv.setAttribute('data-fontName', currentGroup[i])

        if(settings_state.display.fontFamilyGlobal.fontActive.mainGroup == part &&
            settings_state.display.fontFamilyGlobal.fontActive.group == groupIndex &&
            settings_state.display.fontFamilyGlobal.fontActive.index == i
        ) {
            fontDiv.classList.add('isActive');
        } else {
            fontDiv.addEventListener('click', () => {

                let minLoaderLine = 30;
                let maxLoaderLine = 60;


                let randomBetweenLoader = Math.floor(Math.random() * (maxLoaderLine - minLoaderLine + 1)) + minLoaderLine;
                showLoaderLine(randomBetweenLoader);
                isInStartChoiceTheme = true;


                // content between loading line
                setNewFontFamily(currentGroup[i], groupIndex, i);


                requestAnimationFrame(() => {
                    showLoaderLine(100);
                    setTimeout(() => isInStartChoiceTheme = false, 600)
                }); 

            });
        };

        fontsBlock.appendChild(fontDiv);
    };

    document.fonts.ready.then(() => {
        fontsDisableOverlay.style.display = 'none';
    });
};


let fontsBoardContainer = document.querySelector('.fontsBoardContainer');
let fonts_board_overlay = document.querySelector('.fonts_board_overlay');
function fontFamilyShowBoard(fontsName, part) {
    fontsBoardContainer.classList.remove('hidden');
    fonts_board_overlay.classList.remove('hidden');

    
    // show from fonts name and part
    fontsTitle.innerHTML = `${fontsName} section`;
    mainCurrentFontsPart = part;


    // reset
    fontsArrowRight.style.display = '';
    fontsArrowLeft.style.display = '';
    currentFontsPart = 0;    

    // get length
    let pagesLength = settings_state.display.fontFamilyGlobal.fontGroups.length;
    
    // check arrows and add fonts to page
    fontFamilyCheckArrows(pagesLength, currentFontsPart)
    fontFamilyAddNewFonts(currentFontsPart, mainCurrentFontsPart);
};
function fontFamilyHideBoard() {
    fontsBoardContainer.classList.add('hidden');
    fonts_board_overlay.classList.add('hidden');
};

function setNewFontFamily(fontName, group, index) {
    settings_state.display.fontFamilyGlobal.fontActive.mainGroup = mainCurrentFontsPart;
    settings_state.display.fontFamilyGlobal.fontActive.group = group;
    settings_state.display.fontFamilyGlobal.fontActive.index = index;
    settings_state.display.fontFamilyGlobal.fontActive.name = fontName;

    
    localStorage.setItem('settings_state', JSON.stringify(settings_state));
    document.documentElement.style.setProperty('--font-family-global', fontName);


    fontFamilyAddNewFonts(currentFontsPart, mainCurrentFontsPart);
};


function fontFamilyCheckArrows(pagesLength, currentPage) {
    
    if(currentPage > 0) {
        fontsArrowLeft.style.display = '';
    } else {
        fontsArrowLeft.style.display = 'none'
    };

    if(currentPage < pagesLength-1) {
        fontsArrowRight.style.display = '';       
    } else {
        fontsArrowRight.style.display = 'none';
    };
};


function fontFamilyRightPage() {
    currentFontsPart ++;

    let currentGroups = settings_state.display.fontFamilyGlobal.fontGroups[mainCurrentFontsPart].length;
    fontFamilyCheckArrows(currentGroups, currentFontsPart);
    fontFamilyAddNewFonts(currentFontsPart, mainCurrentFontsPart)
};
function fontFamilyLeftPage() {
    currentFontsPart --;

    let currentGroups = settings_state.display.fontFamilyGlobal.fontGroups[mainCurrentFontsPart].length;
    fontFamilyCheckArrows(currentGroups, currentFontsPart);
    fontFamilyAddNewFonts(currentFontsPart, mainCurrentFontsPart);
};


// apply property
function fontFamilyApply() {
    if(settings_state == null) return;

    let fontName = settings_state.display.fontFamilyGlobal.fontActive.name;
    fontFamilyButton.innerHTML = fontName;

    document.documentElement.style.setProperty('--font-family-global', fontName);
};
// end apply property


// ============================ END font family (special state) ============================



// ============================ start apply sliders (slider state) ============================



typing_font_size_slider = document.querySelector(".settings_container .option #display #typing_font_size_slider");
function oninputDisplaySlider(element, key) {
    const range_number = element.parentNode.querySelector('.range_number');
    const range_slider = element.parentNode.querySelector('.range_slider');

    const value = range_slider.value;
    const unit = settings_state.display[key].unit;

    range_number.innerHTML = `${value}${unit}`
};

function onchangeDisplaySlider(element, key) {
    const range_number = element.parentNode.querySelector('.range_number');
    const range_slider = element.parentNode.querySelector('.range_slider');

    const k = settings_state.display[key];
    const value = range_slider.value;
    const propertyUnit = k.unit == 'x' ? '' : k.unit ;
    
    const valWithUnit = `${value}${propertyUnit}`;
    document.documentElement.style.setProperty(k.cssVar, valWithUnit);

    settings_state.display[key].value = value;
    localStorage.setItem('settings_state', JSON.stringify(settings_state));
};


function applyDisplaySliders() {
    let displaySection = document.querySelector('.settings_container .content_container .content .option #display');

    // slider key names need to be same slider key names in (settings_states.display > sliders)
    let sliderElements = {
        fontSizeGlobal: displaySection.querySelector('#fontSizeGlobal'),
        fontSizeTyping: displaySection.querySelector('#fontSizeTyping'),
        letterSpacingTyping: displaySection.querySelector('#letterSpacingTyping'),
        wordSpacingTyping: displaySection.querySelector('#wordSpacingTyping'),
        lineHeightTyping: displaySection.querySelector('#lineHeightTyping'),
        errorUnderWordHeight: displaySection.querySelector('#errorUnderWordHeight'),
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


function applyDisplayProperties() {
    for(const key in settings_state.display) {
        const k = settings_state.display[key];
        if(k.type.includes('special') && k.type.includes('family')) {
            document.documentElement.style.setProperty(k.cssVar, k.fontActive.name);
        };
        
        if(k.type.includes('slider') && k.type.includes('var')) {
            const propertyUnit = k.unit == 'x' ? '' : k.unit ;
            const valWithUnit = `${k.value}${propertyUnit}`;
            document.documentElement.style.setProperty(k.cssVar, valWithUnit);
        };
    };
};
// ============================ start apply sliders (slider state) ============================



// notice: this function is applied in "global.js"
function applyDisplaySettings() {
    fontFamilyApply();
    applyDisplaySliders();
    applyThemeProperties();
};







