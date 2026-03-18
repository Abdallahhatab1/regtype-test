
// theme.js

let themes_container = document.querySelector(".themes_container .allThemes .themes_content");
const themeNodeMap = new WeakMap();


async function getThemes() {
    let response = await fetch('/data/json/themes.json');
    let data = await response.json();
    settings_state.theme.normalThemes = {
        ...data, // البيانات المضافة
    };

    localStorage.setItem('settings_state', JSON.stringify(settings_state))
};

function createTheme(type, themeData) {
    const theme = document.createElement('div');
    theme.className = 'theme';

    themeNodeMap.set(theme, themeData);

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = themeData.name;

    const colors = document.createElement('div');
    colors.className = 'colors';
    for(let i = 0; i < themeData.colors.length; i++) {
        let colorDiv = document.createElement('div');  
        colorDiv.style.background = themeData.colors[i];
        colorDiv.classList.add('color_circle');

        colors.appendChild(colorDiv);
    };
    
    const favIconDiv = document.createElement('div')
    favIconDiv.classList.add('favThemeIcon');
    favIconDiv.insertAdjacentHTML("afterbegin", `
            <svg width="40px" height="40px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24">
                <path d="M22,10.1c0.1-0.5-0.3-1.1-0.8-1.1l-5.7-0.8L12.9,3c-0.1-0.2-0.2-0.3-0.4-0.4C12,2.3,11.4,2.5,11.1,3L8.6,8.2L2.9,9C2.6,9,2.4,9.1,2.3,9.3c-0.4,0.4-0.4,1,0,1.4l4.1,4l-1,5.7c0,0.2,0,0.4,0.1,0.6c0.3,0.5,0.9,0.7,1.4,0.4l5.1-2.7l5.1,2.7c0.1,0.1,0.3,0.1,0.5,0.1l0,0c0.1,0,0.1,0,0.2,0c0.5-0.1,0.9-0.6,0.8-1.2l-1-5.7l4.1-4C21.9,10.5,22,10.3,22,10.1z"/>
            </svg>
        `
    );

    const favIconSvg = favIconDiv.querySelector('svg');
    favIconSvg.classList.add('stat');    
    
    const favIconPath = favIconDiv.querySelector('svg path');
    favIconPath.setAttribute('stroke', themeData.data.accent_primary);
    if(settings_state.theme.favThemes.includes(themeData.name)) {
        favIconPath.setAttribute('fill', themeData.data.accent_primary);
    };

    theme.style.background = themeData.data.core_bg;
    theme.style.color = themeData.data.accent_primary;
    theme.style.boxShadow =  `inset 0px 0px 1px 2px ${themeData.data.accent_primary}`;


    const colorsAndFavIcon = document.createElement('div');
    colorsAndFavIcon.classList.add('colorsAndFavIcon');
    colorsAndFavIcon.append(colors, favIconDiv)

    theme.append(name, colorsAndFavIcon);

    return theme;
};

function createSection(type, themes) {
    const section = document.createElement('div');
    section.className = type;

    themes.forEach(theme => {
        section.appendChild(createTheme(type, theme));
    });

    return section;
};

function addThemesToDom(themesObj) {
    themes_container.innerHTML = '';    
    themes_container.append(
        createSection('dark', themesObj.dark),
        createSection('light', themesObj.light)
    );

    let allThemes = themes_container.querySelectorAll('.theme .name');

    let themeIsAvailable = false;
    for(let i = 0; i < allThemes.length; i++) {
        if(allThemes[i].innerHTML == settings_state.theme.currentTheme.name) {
            if(!allThemes[i].isFav) {
                themeIsAvailable = true;
            };
        };
    };

    if(!themeIsAvailable) {
        settings_state.theme.currentTheme = settings_state.theme.defaultTheme;
        applyTheme();
    };


    for(let i = 0; i < allThemes.length; i++) {
        if(allThemes[i].innerHTML == settings_state.theme.currentTheme.name) {
            allThemes[i].parentNode.classList.add("shadow");
        };
    };
    
    bindThemeClicks()
};

function updateCustomThemesData() {
    let themes = settings_state.theme.themes;
    let custom = settings_state.theme.custom;

    for(const key in themes) {
        for(let i = 0; i < themes[key].length; i++) {
            if(themes[key][i].isCustom) themes[key].splice(i, 1)
        }
    }

};

function buildThemesForRender() {
    const result = { dark: [], light: [] };


    // 1️⃣ أضف أولًا المفضلة (من كل الثيمات)
    settings_state.theme.favThemes.forEach(themeName => {
        // تحقق أولًا إذا الثيم موجود بأي قائمة
        let theme = settings_state.theme.customThemes[themeName] || settings_state.theme.normalThemes[themeName];
        if(theme) {
            result[theme.type].push(theme);
        }
    });

    // 2️⃣ أضف ثيمات مخصصة غير مفضلة
    for(const key in settings_state.theme.customThemes) {
        const theme = settings_state.theme.customThemes[key];
        if(!settings_state.theme.favThemes.includes(theme.name)) {
            result[theme.type].push(theme);
        }
    }

    // 3️⃣ أضف الثيمات العادية غير مفضلة
    for(const key in settings_state.theme.normalThemes) {
        const theme = settings_state.theme.normalThemes[key];
        if(!settings_state.theme.favThemes.includes(theme.name)) {
            result[theme.type].push(theme);
        }
    }
    return result;
};



function clearThemeShadows() {
    settings_state.theme.lightThemes.forEach(t => t.classList.remove('shadow'));
    settings_state.theme.darkThemes.forEach(t => t.classList.remove('shadow'));
};

let isInStartChoiceTheme = false;
function bindThemeClicks() {

    // dark  
    settings_state.theme.darkThemes = themes_container.querySelectorAll('.dark .theme');
    settings_state.theme.darkThemes.forEach(theme => {
        theme.addEventListener('click', (event) => {
            const colorsAndFavIcon = theme.querySelector('.colorsAndFavIcon');
            const favSvg = colorsAndFavIcon.querySelector('.favThemeIcon svg');
            if(favSvg.contains(event.target)) {
                const favClickedTheme = themeNodeMap.get(theme);
                const themeName = favClickedTheme.name;
                const themeIndex = settings_state.theme.favThemes.indexOf(themeName);

                if(themeIndex < 0) {
                    settings_state.theme.favThemes.unshift(themeName);
                } else {
                    settings_state.theme.favThemes.splice(themeIndex, 1);   
                }

                localStorage.setItem('settings_state', JSON.stringify(settings_state));
                addThemesToDom(buildThemesForRender());
            } else {
                settings_state.theme.currentTheme = themeNodeMap.get(theme);
                let minLoaderLine = 30
                let maxLoaderLine = 60            
                let randomBetweenLoader = Math.floor(Math.random() * (maxLoaderLine - minLoaderLine + 1)) + minLoaderLine;
                showLoaderLine(randomBetweenLoader);
                isInStartChoiceTheme = true;
                
                // code between loader line
                clearThemeShadows();                

                theme.classList.add('shadow');
                localStorage.setItem('settings_state', JSON.stringify(settings_state));
                applyTheme();

                // end code between loader line
                requestAnimationFrame(() => {
                    showLoaderLine(100);
                    setTimeout(() => isInStartChoiceTheme = false, 600)
                });
            };
        });
    });

    // light
    settings_state.theme.lightThemes = themes_container.querySelectorAll('.light .theme');
    settings_state.theme.lightThemes.forEach(theme => {
        theme.addEventListener('click', () => {
            const colorsAndFavIcon = theme.querySelector('.colorsAndFavIcon');
            const favSvg = colorsAndFavIcon.querySelector('.favThemeIcon svg');
            if(favSvg.contains(event.target)) {
                const favClickedTheme = themeNodeMap.get(theme);
                const themeName = favClickedTheme.name;
                const themeIndex = settings_state.theme.favThemes.indexOf(themeName);

                if(themeIndex < 0) {
                    settings_state.theme.favThemes.unshift(themeName);
                } else {
                    settings_state.theme.favThemes.splice(themeIndex, 1);   
                }

                localStorage.setItem('settings_state', JSON.stringify(settings_state));
                addThemesToDom(buildThemesForRender());
            } else {
                let minLoaderLine = 30;
                let maxLoaderLine = 60;
                
                let randomBetweenLoader = Math.floor(Math.random() * (maxLoaderLine - minLoaderLine + 1)) + minLoaderLine;
                showLoaderLine(randomBetweenLoader);
                isInStartChoiceTheme = true;


                // code between loader line
                clearThemeShadows();

                settings_state.theme.currentTheme = themeNodeMap.get(theme);

                theme.classList.add('shadow');
                localStorage.setItem('settings_state', JSON.stringify(settings_state));
                applyTheme();
                // code between loader line

                requestAnimationFrame(() => {
                    showLoaderLine(100);
                    setTimeout(() => isInStartChoiceTheme = false, 600)
                });        
            };
        });
    });
};

function initSettingsListeners() {
    // let allThemesTitle = document.querySelector(".themes_container .allThemes .allThemesTitle .title");
    let allThemesTitle = document.querySelector(".themes_container .allThemes .title");
    let allThemesContent = document.querySelector(".themes_container .allThemes .allThemesContent")

    // نفترض انه مفتوح لكي تكون الحركة الاوفل
    let currentAllThemesOpen = false;
    allThemesTitle.addEventListener('click', () => {
        let currentChevron = allThemesTitle.querySelector('.arrow .chevron');
        if(!currentAllThemesOpen) {
            currentChevron.classList.add('open');
            currentChevron.classList.remove('close');

            allThemesContent.style.height = allThemesContent.scrollHeight+'px';
            setTimeout(() => {
                allThemesContent.style.height = 'fit-content';            
            }, 200)



        } else {
            currentChevron.classList.add('close');
            currentChevron.classList.remove('open');

            allThemesContent.style.height = allThemesContent.scrollHeight+'px';       
            setTimeout(() => {
                allThemesContent.style.height = '0px';
            }, 50)

        }
        currentAllThemesOpen = !currentAllThemesOpen;
    });
};

function applyTheme() {
    if(settings_state == null) return;

    let currentTheme = settings_state.theme.currentTheme;
    let data = currentTheme.data;

    const root = document.documentElement;

    for(const key in data) {

        root.style.setProperty(`--${key.replace('_', '-')}`, data[key]);
    };
};

let colorsTransContainer = document.querySelector('.settings_container .option #themes .themes_container .moreContent .global_settings_button_title .correctColorTransContainer .inputes_and_plus .inputes');
let colorsTransInputes;

// correct colors transition;
let correctColorsTransIAP = document.querySelector('.settings_container .option #themes .themes_container .moreContent .global_settings_button_title .correctColorTransContainer .inputes_and_plus');
let allThemesTransButton = document.querySelectorAll('.settings_container .content_container .content .option #themes .moreContent #correctColorTransTitle #correctColorTransButton > *');
let correctColorsSliderContainer = document.querySelector('.settings_container .option #themes .themes_container .moreContent #correctTransDuration');


function CTState(element, name, value) {
    let colors = settings_state.theme.typingCorrectTrans.colors;

    allThemesTransButton.forEach(e => {
        e.classList.remove('isActive');
    }); element.classList.add('isActive');

    if(value) {
        correctColorsTransIAP.style.display = '';
        correctColorsSliderContainer.style.display = '';
    } else {
        correctColorsTransIAP.style.display = 'none';
        correctColorsSliderContainer.style.display = 'none';

        if(colors.length == 0) colors.push('#000000')
        
    };


    settings_state.theme.typingCorrectTrans.name = name;
    settings_state.theme.typingCorrectTrans.value = value;


    localStorage.setItem('settings_state', JSON.stringify(settings_state));

    redrawCorrectTransColor()
};


let currentTransCorrectButton;
allThemesTransButton.forEach(e => {
    if(e.classList.contains(settings_state.theme.typingCorrectTrans.name)) {
        currentTransCorrectButton = e;
    };
});


function updateColorsTransList(haveAction, action) {
    let colors = settings_state.theme.typingCorrectTrans.colors;

    if(haveAction) {
        if(action == 'add') {
            if(colors.length >= 50) return;
            colors.push("#000000")
        } else if(action == 'remove') {
            colors.pop();

            if(colors.length == 0) {
                let element;
                allThemesTransButton.forEach(e => {
                    if(e.classList.contains('off')) {
                        element = e;
                    };
                });
                CTState(element, 'off', false);
            };


        } else if(action == 'reset') {
            colors.splice(0, colors.length);

            let element;
            allThemesTransButton.forEach(e => {
                if(e.classList.contains('off')) {
                    element = e;
                };
            });
            CTState(element, 'off', false);
        };

    };

    redrawCorrectTransColor()
};
function redrawCorrectTransColor() {
    const colors = settings_state.theme.typingCorrectTrans.colors;

    colorsTransContainer.innerHTML = ``;

    for(let i = 0; i < colors.length; i++) {
        let input = document.createElement('input');
        input.classList.add(`colorList${i}`);
        input.setAttribute('type', 'color');
        input.value = colors[i];
        input.setAttribute('onchange', `updateColorTrans(${i})`)
        colorsTransContainer.appendChild(input);
    };

    colorsTransInputes = colorsTransContainer.querySelectorAll('*');

};
function updateColorTrans(index) {
    let colors = settings_state.theme.typingCorrectTrans.colors;
    colors[index] = colorsTransInputes[index].value;

    localStorage.setItem('settings_state', JSON.stringify(settings_state))
};

let correctTransRangeSlider = document.querySelector('.settings_container .option #themes .themes_container .moreContent #correctTransDuration .range_slider');
function sendCorrectTransDurationSliderChange(value, element, matter) {
    let elementInner = element.parentNode.querySelector('.range_number');
    

    settings_state.theme.typingCorrectTrans.duration = +value;


    elementInner.innerHTML = `${value}${matter}`;
    localStorage.setItem(`settings_state`, JSON.stringify(settings_state));
};

function applyCorrectTransDurationLastSliderChange(element, inPx) {
    let rangeNumber = element.parentNode.querySelector('.range_number');

    rangeNumber.innerHTML = inPx? `${settings_state.theme.typingCorrectTrans.duration}px` : `${settings_state.theme.typingCorrectTrans.duration}s`
    element.value = settings_state.theme.typingCorrectTrans.duration;

};


// CHANGE SINGLE OPTION (SLIDER HANDLER)
function bgImageChangeOption(key, value) {
    settings_state.theme.backgroundImage.sliders[key] = value;
    bgImageApplyAll();
};


function bgImageLiveChangeOption(key, element, property, metter) {
    let number = element.parentNode.querySelector('.range_number');
    settings_state.theme.backgroundImage.sliders[key] = element.value;
    number.innerHTML = `${element.value}${metter}`;   

};

// REMOVE BACKGROUND IMAGE
function bgImageRemove() {
    settings_state.theme.backgroundImage.isActive = false;
    bgImageApplyAll();
};


const backgroundImageInput = document.getElementById("backgroundImageInput");
function openBackgroundImage(open) {
    if(open) backgroundImageInput.click();
};

// CUSTOM THEMES

let startAddSvg = document.querySelector('.customThemesContainer .scroll-area .scrollContent .start_add_svg svg');
let addThemeInputes = document.querySelector('.customThemesContainer .scroll-area .scrollContent .addThemeContent');

let isShowAddSvg = false;
let canShowAddTheme = true;


let AddThemeNameInput =  document.querySelector('.customThemesContainer .scroll-area .scrollContent .addThemeContent .name #nameInput');
let AddThemeTypeInput =  document.querySelector('.customThemesContainer .scroll-area .scrollContent .addThemeContent .name #typeInput');
let AddThemeColorInputes =  document.querySelectorAll('.customThemesContainer .scroll-area .scrollContent .addThemeContent .colorInput');

let customThemeSubmitButton = document.querySelector('.customThemesContainer .scroll-area .scrollContent .addThemeContent .submitButton');

let customThemesContainer = document.querySelector('.customThemesContainer');
let customThemesOverlay = document.querySelector('.customThemesOverlay');

let customThemeTypeSelect = document.getElementById('customThemeTypeSelect');
let customThemeNameInput = document.getElementById('customThemeNameInput');

let customThemeTbody = document.querySelector('.customThemesContainer .scroll-area .scrollContent .tableContent table tbody');

let customThemeMode = 'add';
let updateKey;
let customThemeUniqueName;
let isInCustomThemes = false;

let deleteAllCustomThemesButton = document.querySelector('#deleteAllCustomThemes')

function hex3ToHex6(hex) {
    if(hex.length > 4 && hex.split('#').length == 2) return hex;

    if(hex.split('#').length == 3) hex = hex.split('#')[1];

    hex = hex.replace("#", "");
    return "#" + hex.split("").map(c => c + c).join("");
};

function showCustomThemes() {
    isInCustomThemes = true;

    
    customThemesContainer.querySelector('.scroll-area').scroll({
        top: 0,
        behavior: "smooth"
    })

    customThemesContainer.style.visibility = 'visible';
    customThemesOverlay.style.visibility = 'visible';

    customThemesContainer.style.opacity = 1;
    customThemesOverlay.style.opacity = 1;

    for(let i = 0; i < AddThemeColorInputes.length; i++) {
        let colorName = AddThemeColorInputes[i].name;
        let defaultThemeValue = settings_state.theme.currentTheme.data[colorName];

   
        AddThemeColorInputes[i].value = hex3ToHex6(defaultThemeValue);
    };
    showCustomThemesTable()
    checkCustomNameAvailable(customThemeNameInput)
};

function hideCustomThemes() {
    customThemesContainer.style.opacity = 0;
    customThemesOverlay.style.opacity = 0;

    setTimeout(() => {
        customThemesContainer.style.visibility = 'hidden';
        customThemesOverlay.style.visibility = 'hidden';

        customThemesContainer.querySelector('.scroll-area').scroll({
            top: 0,
            behavior: "smooth"
        });
        isInCustomThemes = false
        
        themes_container.innerHTML = ``;
        addThemesToDom(buildThemesForRender());
    }, 200)
};


function showAddThemeInputes() {
    if(!canShowAddTheme) return;


    canShowAddTheme = false;
    isShowAddSvg = !isShowAddSvg;
    let h = addThemeInputes.scrollHeight;

    if(isShowAddSvg) {
        startAddSvg.style.transform = 'rotate(90deg)'; 
        
        addThemeInputes.style.height = h+'px';
        setTimeout(() => {
            addThemeInputes.style.height = 0;
            addThemeInputes.style.boxShadow = 'none'
        }, 200)
        

    } else {
        startAddSvg.style.transform = 'rotate(0deg)'; 

        addThemeInputes.style.height = h+'px';
        addThemeInputes.style.boxShadow = '#0005 0px 0px 10px 5px';
        
        setTimeout(() => {
            addThemeInputes.style.height = 'fit-content';
        }, 200)

        setTimeout(() => {
            customThemesContainer.querySelector('.scroll-area').scroll({top: 0, behavior: "smooth"});
        }, 100)

    };


    setTimeout(() => {
        canShowAddTheme = true;
    }, 200)

    checkCustomNameAvailable(customThemeNameInput)
};

function getColorThemeTarget(name) {
    const target = Array.from(AddThemeColorInputes).find(
        el => el.name === name
    );
    return target
};

function submitCustomTheme() {
    if(!customThemeUniqueName) return;

    let custom = settings_state.theme.customThemes;
    if(customThemeMode == 'add') {
        const name = customThemeNameInput.value;
        if(name == '') return;
        const type = customThemeTypeSelect.value;

        let obj = {
            name: name,
            colors: [getColorThemeTarget('accent_primary').value, getColorThemeTarget('typing_correct').value, getColorThemeTarget('typing_incorrect').value],
            type: type,
            isCustom: true,
            data: {
                core_bg: getColorThemeTarget('core_bg').value,
                core_panel: getColorThemeTarget('core_panel').value,
                core_text: getColorThemeTarget('core_text').value,
                core_text_hover: getColorThemeTarget('core_text_hover').value,
                core_muted: getColorThemeTarget('core_muted').value,
                core_muted_hover: getColorThemeTarget('core_muted_hover').value,
                core_border: getColorThemeTarget('core_border').value,
                core_scroll_color: getColorThemeTarget('core_scroll_color').value,
                typing_correct: getColorThemeTarget('typing_correct').value,
                typing_incorrect: getColorThemeTarget('typing_incorrect').value,
                typing_extra: getColorThemeTarget('typing_extra').value,
                typing_inactive: getColorThemeTarget('typing_inactive').value,
                accent_primary: getColorThemeTarget('accent_primary').value,
            }
        };
        
        // settings_state.theme.customThemes[name] = obj;
        settings_state.theme.customThemes = {
            [name]: obj, 
            ...settings_state.theme.customThemes
        }
        updateCustomThemesData()

        customThemeNameInput.value = '';
        customThemeTypeSelect.value = 'dark';

        
    } else if(customThemeMode == 'update') {
        let data = custom[updateKey].data;
        
        for (const key in data) {
            const input = getColorThemeTarget(key);
            data[key] = input.value;
        };
        custom[updateKey].name = customThemeNameInput.value;
        custom[updateKey].type = customThemeTypeSelect.value;

        let customTheme = settings_state.theme.currentTheme;

        for (const key in customTheme.data) {
            const input = getColorThemeTarget(key);
            if(input) input.value = hex3ToHex6(customTheme.data[key]);
        };
        customThemeNameInput.value = '';
        customThemeTypeSelect.value = 'dark';
        customThemeSubmitButton.innerHTML = 'Add';
        customThemeMode = 'add';

    };

    // update live dom
    addThemesToDom(buildThemesForRender());
    showCustomThemesTable();

    checkCustomNameAvailable(customThemeNameInput)

    localStorage.setItem('settings_state', JSON.stringify(settings_state));
    settings_state = JSON.parse(localStorage.getItem('settings_state'));
};

let iconDiv = document.createElement('div');
iconDiv.classList.add('icon2');

let customThemeInputWrapper = document.querySelector(".customThemesContainer .scroll-area .scrollContent .addThemeContent .name .input-wrapper")
let customThemeNameIcon = document.querySelector('.customThemesContainer .scroll-area .scrollContent .addThemeContent .name .icon');


function checkCustomNameAvailable(element) {
    customThemeNameIcon.style.visibility = 'visible';
    if(customThemeInputWrapper.contains(iconDiv)) customThemeInputWrapper.removeChild(iconDiv);

    if(element.value == '') {
        customThemeNameIcon.style.visibility = 'hidden';
        if(customThemeInputWrapper.contains(iconDiv)) customThemeInputWrapper.removeChild(iconDiv);
        customThemeUniqueName = false;
        customThemeSubmitButton.classList.add('disabled')
        return;
    }



    let custom = settings_state.theme.customThemes;
    let normal = settings_state.theme.normalThemes;
    let themes = settings_state.theme.themes;
    let specialSvg;
    
    let unique = true;
    if(normal[element.value] || custom[element.value]) {
        unique = false;
    };

    for(const key in themes) {
        for(let i = 0; i < themes[key].length; i++) {
            if(themes[key][i].name == element.value) {
                unique = false;
                break;
            };
        };
    };

    if(customThemeMode == 'update') {
        if(custom[updateKey].name == element.value) unique = true;
    }

    customThemeUniqueName = unique;

    if(unique) {
        specialSvg = '<svg id="correct"  width="30px" height="30px" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><title/><g><path d="M58.3945,32.1563,42.9961,50.625l-5.3906-6.4629a5.995,5.995,0,1,0-9.211,7.6758l9.9961,12a5.9914,5.9914,0,0,0,9.211.0059l20.0039-24a5.9988,5.9988,0,1,0-9.211-7.6875Z"/><path d="M48,0A48,48,0,1,0,96,48,48.0512,48.0512,0,0,0,48,0Zm0,84A36,36,0,1,1,84,48,36.0393,36.0393,0,0,1,48,84Z"/></g></svg>'
        customThemeSubmitButton.classList.remove('disabled')
    } else {
        specialSvg = '<svg id="incorrect"  height="30px" width="30px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 512 512" xml:space="preserve"><g><g><g><path d="M437.016,74.984c-99.979-99.979-262.075-99.979-362.033,0.002c-99.978,99.978-99.978,262.073,0.004,362.031 c99.954,99.978,262.05,99.978,362.029-0.002C536.995,337.059,536.995,174.964,437.016,74.984z M406.848,406.844 c-83.318,83.318-218.396,83.318-301.691,0.004c-83.318-83.299-83.318-218.377-0.002-301.693 c83.297-83.317,218.375-83.317,301.691,0S490.162,323.549,406.848,406.844z"/> <path d="M361.592,150.408c-8.331-8.331-21.839-8.331-30.17,0l-75.425,75.425l-75.425-75.425c-8.331-8.331-21.839-8.331-30.17,0 s-8.331,21.839,0,30.17l75.425,75.425L150.43,331.4c-8.331,8.331-8.331,21.839,0,30.17c8.331,8.331,21.839,8.331,30.17,0 l75.397-75.397l75.419,75.419c8.331,8.331,21.839,8.331,30.17,0c8.331-8.331,8.331-21.839,0-30.17l-75.419-75.419l75.425-75.425 C369.923,172.247,369.923,158.74,361.592,150.408z"/></g></g></g></svg>'
        customThemeSubmitButton.classList.add('disabled')
    }
    
    iconDiv.innerHTML = specialSvg;

    setTimeout(() => {
        if(element.value == '') return;
        customThemeNameIcon.style.visibility = 'hidden';
        customThemeInputWrapper.appendChild(iconDiv);
        
    }, 600);
};


function showCustomThemesTable() {
    let custom = settings_state.theme.customThemes;

    customThemeTbody.innerHTML = ``;
    let currentIndex = 0;
    for(const key in custom) {
        const k = custom[key]
        
        customThemeTbody.innerHTML += `
            <tr>
                <td>${currentIndex+1}</td>
                <td class="stat" style="font-size: calc(14px * var(--font-size-global)); color: ${k.data['accent_primary']}">${k.name}</td>
                <td>${k.type}</td>
                <td onclick="updateCustomTheme('${key}', this)" class="update"><div class="update">update</div></td>
                <td onclick="deleteCustomTheme('${key}', this)" class="delete"><div class="delete">delete</div></td>
            </tr>
        `;
        currentIndex ++;
    };   
    checkCustomThemesTableLength()

};


function updateCustomTheme(key, element) {
    updateKey = key;
    customThemeMode = 'update';
    customThemeSubmitButton.innerHTML = 'Update'

    let custom = settings_state.theme.customThemes
    let data = custom[key].data;

    for (const key in data) {
        const input = getColorThemeTarget(key);
        if(input) input.value = data[key];
    };
    customThemeNameInput.value = custom[key].name;
    customThemeTypeSelect.vaue = custom[key].type;

    customThemesContainer.querySelector('.scroll-area').scroll({top: 0, behavior: "smooth"});
    if(isShowAddSvg) showAddThemeInputes();
    checkCustomNameAvailable(customThemeNameInput);
    showCustomThemesTable()

    localStorage.setItem('settings_state', JSON.stringify(settings_state))
};



function checkCustomThemesTableLength() {
    if(Object.entries(settings_state.theme.customThemes).length > 0) {
        deleteAllCustomThemesButton.classList.remove('disable');
        deleteAllCustomThemesButton.disabled = false;
        
    } else {
        deleteAllCustomThemesButton.classList.add('disable');
        deleteAllCustomThemesButton.disabled = true;
    }

    deleteAllCustomThemesButton.value = `delete all (${Object.entries(settings_state.theme.customThemes).length})`
};

function deleteCustomTheme(key, element) {
    if(customThemeMode == 'update') return;


    const elementInFavIndex = settings_state.theme.favThemes.indexOf(key);
    if(elementInFavIndex >= 0) {
        settings_state.theme.favThemes.splice(elementInFavIndex, 1)
    };


    const { [key]: _, ...newObj } = settings_state.theme.customThemes;
    settings_state.theme.customThemes = newObj;

    
    addThemesToDom(buildThemesForRender());
    showCustomThemesTable();
    checkCustomNameAvailable(customThemeNameInput);

    localStorage.setItem('settings_state', JSON.stringify(settings_state))
}


let sureDeleteAllCustomThemes = document.querySelector('.sureDeleteAllCustomThemes');
let sureDeleteAllCustomThemesOverlay = document.querySelector('.sureDeleteAllCustomThemesOverlay');


function showSureDeleteAllCustomThemes() {
    sureDeleteAllCustomThemes.style.visibility = 'visible';
    sureDeleteAllCustomThemesOverlay.style.visibility = 'visible';    
    
    sureDeleteAllCustomThemes.style.opacity = 1;
    sureDeleteAllCustomThemesOverlay.style.opacity = 1;
};

function hideSureDeleteAllCustomThemes() {  
    sureDeleteAllCustomThemes.style.opacity = 0;
    sureDeleteAllCustomThemesOverlay.style.opacity = 0;
    
    setTimeout(() => {
        sureDeleteAllCustomThemes.style.visibility = 'hidden';
        sureDeleteAllCustomThemesOverlay.style.visibility = 'hidden';
    }, 300)
};


function deleteAllCustomThemes() {

    for(const key in settings_state.theme.customThemes) {
        const elementInFavIndex = settings_state.theme.favThemes.indexOf(key);
            if(elementInFavIndex >= 0) {
            settings_state.theme.favThemes.splice(elementInFavIndex, 1)
        };
    };

    settings_state.theme.customThemes = {};

    addThemesToDom(buildThemesForRender());
    showCustomThemesTable();
    checkCustomNameAvailable(customThemeNameInput);
    hideSureDeleteAllCustomThemes(); 

    localStorage.setItem('settings_state', JSON.stringify(settings_state))

};


function searchCustomThemeTable(element) {
    let svg = element.parentNode.querySelector('.icon svg');
    if(element.value == '') {svg.style.display = ''}
    else {svg.style.display = 'none'};

    let val = element.value;
    let custom = settings_state.theme.customThemes;

    customThemeTbody.innerHTML = ``;
    let currentIndex = 0;
    for(const key in custom) {
        const k = custom[key]

        if(k.name.toLowerCase().includes(val.toLowerCase()) || k.type.toLowerCase().includes(val.toLowerCase())) {
            customThemeTbody.innerHTML += `
                <tr>
                    <td>${currentIndex+1}</td>
                    <td class="stat" style="font-size: calc(14px * var(--font-size-global)); color: ${k.data['accent_primary']}">${k.name}</td>
                    <td>${k.type}</td>
                    <td onclick="updateCustomTheme('${key}', this)" class="update"><div class="update">update</div></td>
                    <td onclick="deleteCustomTheme('${key}', this)" class="delete"><div class="delete">delete</div></td>
                </tr>
            `;
            currentIndex ++;
        };
    };  
};


async function applyThemeSettings() {
    // get from json database
    await getThemes();
    await getFontFamilyGroups();

    // rebuild themes
    addThemesToDom(buildThemesForRender());
    
   
    initSettingsListeners();

    CTState(currentTransCorrectButton, settings_state.theme.typingCorrectTrans.name, settings_state.theme.typingCorrectTrans.value)
    updateColorsTransList(false);
    applyCorrectTransDurationLastSliderChange(correctTransRangeSlider, false)


    backgroundImageInput.addEventListener("change", () => {
    const file = backgroundImageInput.files[0];

    if (!file) {
        settings_state.theme.backgroundImage.isActive = false;
        applyBackgroundImage();
        return;
    }

    settings_state.theme.backgroundImage.isActive = true;

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64Image = e.target.result;

        const bg = settings_state.theme.backgroundImage;
        bg.fileName = file.name;
        bg.base64 = base64Image;

        bgImageApplyAll()
    };

    reader.readAsDataURL(file);
});

};


async function applyThemeProperties() {
    applyTheme();
};

