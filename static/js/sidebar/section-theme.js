
// theme.js

let sThemesContents = document.querySelectorAll(".sidebar_content .sidebar-section .content .themesSection > .content");


const sThemeNodeMap = new WeakMap();

async function getSidebarThemes() {
    let response = await fetch('/data/json/themes.json');
    let data = await response.json();
    settings_state.theme.normalThemes = {
        ...data, // البيانات المضافة
    };

    localStorage.setItem('settings_state', JSON.stringify(settings_state));
};

// <div class="theme">
//     <div class="svgAndThemeName">
//         <div class="svg">
//             <svg width="20px" height="20px" viewBox="3 3 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path d="M12.0001 9.32C13.1901 9.32 14.1601 8.35 14.1601 7.16C14.1601 5.97 13.1901 5 12.0001 5C10.8101 5 9.84009 5.97 9.84009 7.16C9.84009 8.35 10.8101 9.32 12.0001 9.32Z" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
//                 <path d="M6.78988 18.9999C7.97988 18.9999 8.94988 18.0299 8.94988 16.8399C8.94988 15.6499 7.97988 14.6799 6.78988 14.6799C5.59988 14.6799 4.62988 15.6499 4.62988 16.8399C4.62988 18.0299 5.58988 18.9999 6.78988 18.9999Z" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
//                 <path d="M17.21 18.9999C18.4 18.9999 19.37 18.0299 19.37 16.8399C19.37 15.6499 18.4 14.6799 17.21 14.6799C16.02 14.6799 15.05 15.6499 15.05 16.8399C15.05 18.0299 16.02 18.9999 17.21 18.9999Z" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
//             </svg>
//         </div>

//         <div class="name">RegType Dark</div>   
        
//         <div class="svg">
            // <svg height="20px" width="20px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve">
            //     <g>
            //         <g>
            //             <path d="M511.177,197.119c-1.975-6.079-7.23-10.51-13.554-11.429l-156.54-22.758L271.059,21.066
            //                 c-2.829-5.731-8.667-9.359-15.059-9.359c-6.391,0-12.23,3.628-15.059,9.359l-70.024,141.866L14.377,185.689
            //                 c-6.324,0.919-11.58,5.35-13.554,11.429c-1.976,6.079-0.328,12.753,4.25,17.214L118.338,324.74L91.619,480.664
            //                 c-1.08,6.3,1.51,12.665,6.681,16.422c5.17,3.756,12.024,4.252,17.683,1.279l140.016-73.593l140.014,73.593
            //                 c5.688,2.99,12.54,2.457,17.683-1.279c5.171-3.756,7.762-10.123,6.681-16.422L393.66,324.741l113.267-110.409
            //                 C511.505,209.87,513.153,203.196,511.177,197.119z M363.897,306.851c-3.958,3.857-5.763,9.414-4.83,14.861l22.463,131.097
            //                 l-117.718-61.875c-4.89-2.572-10.735-2.573-15.625,0l-117.719,61.875l22.463-131.097c0.934-5.446-0.872-11.004-4.83-14.861
            //                 L52.878,214.03l131.607-19.133c5.469-0.795,10.195-4.23,12.643-9.185L256,66.439l58.872,119.274
            //                 c2.447,4.955,7.174,8.39,12.643,9.185l131.607,19.133L363.897,306.851z"/>
            //         </g>
            //     </g>
            // </svg>
//         </div>

//     </div>                                                            
// </div>


function createSidebarTheme(themeData) {
    const theme = document.createElement('div');
    theme.className = 'theme';
    theme.setAttribute('data-search', themeData.name);

    const line = document.createElement('div');
    line.className = 'line';

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = themeData.name;

    const colors = document.createElement('div');
    colors.className = 'colors';

    for(let i = 0; i < 3; i++) {
        let color = document.createElement('div');
        color.className = `color`;
        color.style.background = themeData.colors[i];

        colors.appendChild(color)
    }

    line.style.color = themeData.data.accent_primary;

    colors.style.background = themeData.data.core_bg;
    colors.style.boxShadow =  `inset 0 0 0 2px ${themeData.data.accent_primary}`;


    sThemeNodeMap.set(theme, themeData);


    theme.append(line, name, colors);

    return theme;
};

function createSidebarSection(themes, type) {
    // let sidebarDarkThemes = document.getElementById('sidebar-darkThemes');
    // let sidebarLightThemes = document.getElementById('sidebar-lightThemes');

    let content = document.createElement('themesContent');
    content.className = 'themesContent';

    themes.forEach(theme => {
        content.appendChild(createSidebarTheme(theme))

    });

    return content;
};

function addSidebarThemesToDom(themesObj) {
    sThemesContents.forEach(e => e.innerHTML = '');

    sThemesContents[0].appendChild(createSidebarSection(themesObj.dark, 'dark'),);
    sThemesContents[1].appendChild(createSidebarSection(themesObj.light, 'light'));
    

    // let allThemes = sThemesContents.querySelectorAll('.theme .name');

    // let themeIsAvailable = false;
    // for(let i = 0; i < allThemes.length; i++) {
    //     if(allThemes[i].innerHTML == settings_state.theme.currentTheme.name) {
    //         if(!allThemes[i].isFav) {
    //             themeIsAvailable = true;
    //         };
    //     };
    // };

    // if(!themeIsAvailable) {
    //     settings_state.theme.currentTheme = settings_state.theme.defaultTheme;
    //     applySidebarTheme();
    // };


    // for(let i = 0; i < allThemes.length; i++) {
    //     if(allThemes[i].innerHTML == settings_state.theme.currentTheme.name) {
    //         allThemes[i].parentNode.classList.add("shadow");
    //     };
    // };
    
    bindThemeSidebarClicks()
};

function updateCustomSidebarThemesData() {
    let themes = settings_state.theme.themes;
    let custom = settings_state.theme.custom;

    for(const key in themes) {
        for(let i = 0; i < themes[key].length; i++) {
            if(themes[key][i].isCustom) themes[key].splice(i, 1)
        }
    }
};

function buildSidebarThemesForRender() {
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



// function clearThemeShadows() {
//     settings_state.theme.lightThemes.forEach(t => t.classList.remove('shadow'));
//     settings_state.theme.darkThemes.forEach(t => t.classList.remove('shadow'));
// };


// let isInStartChoiceTheme = false;
function bindThemeSidebarClicks() {

    // dark  
    settings_state.theme.darkThemes = sThemesContents[0].querySelectorAll('.theme');
    settings_state.theme.darkThemes.forEach(theme => {
        theme.addEventListener('click', (event) => {

            settings_state.theme.currentTheme = sThemeNodeMap.get(theme);
            let minLoaderLine = 30
            let maxLoaderLine = 60            
            let randomBetweenLoader = Math.floor(Math.random() * (maxLoaderLine - minLoaderLine + 1)) + minLoaderLine;
            showLoaderLine(randomBetweenLoader);
            isInStartChoiceTheme = true;
            
            // code between loader line
            theme.classList.add('shadow');
            localStorage.setItem('settings_state', JSON.stringify(settings_state));
            applyTheme();

            const themeChangedEvent = new CustomEvent("themeChanged", { detail: { message: "themeChanged" } });
            document.dispatchEvent(themeChangedEvent);

            // end code between loader line
            requestAnimationFrame(() => {
                showLoaderLine(100);
                setTimeout(() => isInStartChoiceTheme = false, 600)
            });

        });
    });

    // light
    settings_state.theme.lightThemes = sThemesContents[1].querySelectorAll('.theme')
    settings_state.theme.lightThemes.forEach(theme => {
        theme.addEventListener('click', () => {

            let minLoaderLine = 30;
            let maxLoaderLine = 60;
            
            let randomBetweenLoader = Math.floor(Math.random() * (maxLoaderLine - minLoaderLine + 1)) + minLoaderLine;
            showLoaderLine(randomBetweenLoader);
            isInStartChoiceTheme = true;


            // code between loader line
            // clearThemeShadows();

            settings_state.theme.currentTheme = sThemeNodeMap.get(theme);

            theme.classList.add('shadow');
            localStorage.setItem('settings_state', JSON.stringify(settings_state));
            applyTheme();

            const themeChangedEvent = new CustomEvent("themeChanged", { detail: { message: "themeChanged" } });
            document.dispatchEvent(themeChangedEvent);

            // code between loader line

            requestAnimationFrame(() => {
                showLoaderLine(100);
                setTimeout(() => isInStartChoiceTheme = false, 600)
            });
        });
    });
};

// function initSettingsListeners() {
//     let allThemesTitle = document.querySelector(".themes_container .allThemes .allThemesTitle .title");
//     let allThemesContent = document.querySelector(".themes_container .allThemes .allThemesContent")

//     // نفترض انه مفتوح لكي تكون الحركة الاوفل
//     let currentAllThemesOpen = false;
//     allThemesTitle.addEventListener('click', () => {
//         let currentChevron = allThemesTitle.querySelector('.arrow .chevron');
//         if(!currentAllThemesOpen) {
//             currentChevron.classList.add('open');
//             currentChevron.classList.remove('close');

//             allThemesContent.style.height = allThemesContent.scrollHeight+'px';
//             setTimeout(() => {
//                 allThemesContent.style.height = 'fit-content';            
//             }, 200)



//         } else {
//             currentChevron.classList.add('close');
//             currentChevron.classList.remove('open');

//             allThemesContent.style.height = allThemesContent.scrollHeight+'px';       
//             setTimeout(() => {
//                 allThemesContent.style.height = '0px';
//             }, 50)

//         }
//         currentAllThemesOpen = !currentAllThemesOpen;
//     });
// };


// function applyTheme() {
//     if(settings_state == null) return;

//     let currentTheme = settings_state.theme.currentTheme;
//     let data = currentTheme.data;

//     const root = document.documentElement;

//     for(const key in data) {

//         root.style.setProperty(`--${key.replace('_', '-')}`, data[key]);
//     };
// };



let CTContainer = document.querySelector('#sidebar-CT .content .sidebar-CTContainer .sidebar-inputes_and_plus .inputes');
// CTInputes;

// correct colors transition;

// IAP = (inputes and plus)
let CT_inputes_and_plus = document.querySelector('#sidebar-CT .content .sidebar-CTContainer .sidebar-inputes_and_plus');



let allCTButtons = document.querySelectorAll('#sidebar-CT .content #sidebar-CTButton > *');
let CTSliderContainer = document.querySelector('#sidebar-CT .content #sidebar-CTDRange');

function SidebarCTState(element, name, value) {
    let colors = settings_state.theme.typingCorrectTrans.colors;

    allCTButtons.forEach(e => {
        e.classList.remove('isActive');
    }); element.classList.add('isActive');

    if(value) {
        CT_inputes_and_plus.style.display = '';
        CTSliderContainer.style.display = '';
    } else {
        CT_inputes_and_plus.style.display = 'none';

        CTSliderContainer.style.display = 'none';

        if(colors.length == 0) colors.push('#000000')
        
    };

    settings_state.theme.typingCorrectTrans.name = name;
    settings_state.theme.typingCorrectTrans.value = value;

    localStorage.setItem('settings_state', JSON.stringify(settings_state));
    redrawCT();
    applyCT();
};


let currentSidebarCTButton;
allCTButtons.forEach(e => {
    if(e.classList.contains(settings_state.theme.typingCorrectTrans.name)) {
        currentSidebarCTButton = e;
    };
});

function updateSidebarCTList(haveAction, action) {
    let colors = settings_state.theme.typingCorrectTrans.colors;

    if(haveAction) {
        if(action == 'add') {
            if(colors.length >= 50) return;
            colors.push("#000000")
        } else if(action == 'remove') {
            colors.pop();

            if(colors.length == 0) {
                let element;
                allCTButtons.forEach(e => {
                    if(e.classList.contains('off')) {
                        element = e;
                    };
                });
                SidebarCTState(element, 'off', false);
            };
        } else if(action == 'reset') {
            colors.splice(0, colors.length);

            let element;
            allCTButtons.forEach(e => {
                if(e.classList.contains('off')) {
                    element = e;
                };
            });
            SidebarCTState(element, 'off', false);
        };

    };
 
    redrawCT();
    applyCT();
};
function redrawCT() {
    const colors = settings_state.theme.typingCorrectTrans.colors;

    CTContainer.innerHTML = ``;

    for(let i = 0; i < colors.length; i++) {
        let input = document.createElement('input');
        input.classList.add(`colorList${i}`);
        input.setAttribute('type', 'color');
        input.value = colors[i];
        input.setAttribute('onchange', `updateCT(${i})`)
        CTContainer.appendChild(input);
    };

    CTInputes = CTContainer.querySelectorAll('*');

}; redrawCT()
function updateCT(index) {
    let colors = settings_state.theme.typingCorrectTrans.colors;
    colors[index] = CTInputes[index].value;

    localStorage.setItem('settings_state', JSON.stringify(settings_state));
    applyCT();
};

// CTD = colors trans duration
let sidebarCTDRangeSlider = document.querySelector('#sidebar-CT .content #sidebar-CTDRange .range_slider');

function sendSidebarCTDSliderChange(value, element, matter) {
    let elementInner = element.parentNode.querySelector('.range_number');
    settings_state.theme.typingCorrectTrans.duration = +value;
    elementInner.innerHTML = `${value}${matter}`;
    localStorage.setItem(`settings_state`, JSON.stringify(settings_state));  
};

function applySidebarCTDSliderChange(element, unit) {
    let rangeNumber = element.parentNode.querySelector('.range_number');

    rangeNumber.innerHTML =  `${settings_state.theme.typingCorrectTrans.duration}${unit}`
    element.value = settings_state.theme.typingCorrectTrans.duration;

    applyCT()
};



function applySidebarCTSettings() {
    const name = settings_state.theme.typingCorrectTrans.name
    const value = settings_state.theme.typingCorrectTrans.value

    SidebarCTState(currentSidebarCTButton, name, value)    
    applySidebarCTDSliderChange(sidebarCTDRangeSlider, 's');    
}; applySidebarCTSettings()




// CHANGE SINGLE OPTION (SLIDER HANDLER)


function sidebarBgChangeOption(key, value) {
    settings_state.theme.backgroundImage.sliders[key] = value;
    bgImageApplyAll();
};


function sidebarBgLiveChangeOption(key, element, property, metter) {
    let number = element.parentNode.querySelector('.range_number');
    settings_state.theme.backgroundImage.sliders[key] = element.value;
    number.innerHTML = `${element.value}${metter}`;   

};

// REMOVE BACKGROUND IMAGE
function sidebarBgRemove() {
    settings_state.theme.backgroundImage.isActive = false;
    bgImageApplyAll();
};


const sidebarBgImageInput = document.getElementById("backgroundImageInput");
function openBackgroundImage(open) {
    if(open) sidebarBgImageInput.click();
};











// CUSTOM THEMES

// let startAddSvg = document.querySelector('.customThemesContainer .scroll-area .scrollContent .start_add_svg svg');
// let addThemeInputes = document.querySelector('.customThemesContainer .scroll-area .scrollContent .addThemeContent');

// let isShowAddSvg = false;
// let canShowAddTheme = true;


// let AddThemeNameInput =  document.querySelector('.customThemesContainer .scroll-area .scrollContent .addThemeContent .name #nameInput');
// let AddThemeTypeInput =  document.querySelector('.customThemesContainer .scroll-area .scrollContent .addThemeContent .name #typeInput');
// let AddThemeColorInputes =  document.querySelectorAll('.customThemesContainer .scroll-area .scrollContent .addThemeContent .colorInput');

// let customThemeSubmitButton = document.querySelector('.customThemesContainer .scroll-area .scrollContent .addThemeContent .submitButton');

// let customThemesContainer = document.querySelector('.customThemesContainer');
// let customThemesOverlay = document.querySelector('.customThemesOverlay');

// let customThemeTypeSelect = document.getElementById('customThemeTypeSelect');
// let customThemeNameInput = document.getElementById('customThemeNameInput');

// let customThemeTbody = document.querySelector('.customThemesContainer .scroll-area .scrollContent .tableContent table tbody');

// let customThemeMode = 'add';
// let updateKey;
// let customThemeUniqueName;
// let isInCustomThemes = false;

// let deleteAllCustomThemesButton = document.querySelector('#deleteAllCustomThemes')

// function hex3ToHex6(hex) {
//     if(hex.length > 4 && hex.split('#').length == 2) return hex;

//     if(hex.split('#').length == 3) hex = hex.split('#')[1];

//     hex = hex.replace("#", "");
//     return "#" + hex.split("").map(c => c + c).join("");
// };

// function showCustomThemes() {
//     isInCustomThemes = true;

    
//     customThemesContainer.querySelector('.scroll-area').scroll({
//         top: 0,
//         behavior: "smooth"
//     })

//     customThemesContainer.style.visibility = 'visible';
//     customThemesOverlay.style.visibility = 'visible';

//     customThemesContainer.style.opacity = 1;
//     customThemesOverlay.style.opacity = 1;

//     for(let i = 0; i < AddThemeColorInputes.length; i++) {
//         let colorName = AddThemeColorInputes[i].name;
//         let defaultThemeValue = settings_state.theme.currentTheme.data[colorName];

   
//         AddThemeColorInputes[i].value = hex3ToHex6(defaultThemeValue);
//     };
//     showCustomThemesTable()
//     checkCustomNameAvailable(customThemeNameInput)
// };

// function hideCustomThemes() {
//     customThemesContainer.style.opacity = 0;
//     customThemesOverlay.style.opacity = 0;

//     setTimeout(() => {
//         customThemesContainer.style.visibility = 'hidden';
//         customThemesOverlay.style.visibility = 'hidden';

//         customThemesContainer.querySelector('.scroll-area').scroll({
//             top: 0,
//             behavior: "smooth"
//         });
//         isInCustomThemes = false
        
//         themes_container.innerHTML = ``;
//         addThemesToDom(buildThemesForRender());
//     }, 200)
// };


// function showAddThemeInputes() {
//     if(!canShowAddTheme) return;


//     canShowAddTheme = false;
//     isShowAddSvg = !isShowAddSvg;
//     let h = addThemeInputes.scrollHeight;

//     if(isShowAddSvg) {
//         startAddSvg.style.transform = 'rotate(90deg)'; 
        
//         addThemeInputes.style.height = h+'px';
//         setTimeout(() => {
//             addThemeInputes.style.height = 0;
//             addThemeInputes.style.boxShadow = 'none'
//         }, 200)
        

//     } else {
//         startAddSvg.style.transform = 'rotate(0deg)'; 

//         addThemeInputes.style.height = h+'px';
//         addThemeInputes.style.boxShadow = '#0005 0px 0px 10px 5px';
        
//         setTimeout(() => {
//             addThemeInputes.style.height = 'fit-content';
//         }, 200)

//         setTimeout(() => {
//             customThemesContainer.querySelector('.scroll-area').scroll({top: 0, behavior: "smooth"});
//         }, 100)

//     };


//     setTimeout(() => {
//         canShowAddTheme = true;
//     }, 200)

//     checkCustomNameAvailable(customThemeNameInput)
// };

// function getColorThemeTarget(name) {
//     const target = Array.from(AddThemeColorInputes).find(
//         el => el.name === name
//     );
//     return target
// };

// function submitCustomTheme() {
//     if(!customThemeUniqueName) return;

//     let custom = settings_state.theme.customThemes;
//     if(customThemeMode == 'add') {
//         const name = customThemeNameInput.value;
//         if(name == '') return;
//         const type = customThemeTypeSelect.value;

//         let obj = {
//             name: name,
//             colors: [getColorThemeTarget('accent_primary').value, getColorThemeTarget('typing_correct').value, getColorThemeTarget('typing_incorrect').value],
//             type: type,
//             isCustom: true,
//             data: {
//                 core_bg: getColorThemeTarget('core_bg').value,
//                 core_panel: getColorThemeTarget('core_panel').value,
//                 core_text: getColorThemeTarget('core_text').value,
//                 core_text_hover: getColorThemeTarget('core_text_hover').value,
//                 core_muted: getColorThemeTarget('core_muted').value,
//                 core_muted_hover: getColorThemeTarget('core_muted_hover').value,
//                 core_border: getColorThemeTarget('core_border').value,
//                 core_scroll_color: getColorThemeTarget('core_scroll_color').value,
//                 typing_correct: getColorThemeTarget('typing_correct').value,
//                 typing_incorrect: getColorThemeTarget('typing_incorrect').value,
//                 typing_extra: getColorThemeTarget('typing_extra').value,
//                 typing_inactive: getColorThemeTarget('typing_inactive').value,
//                 accent_primary: getColorThemeTarget('accent_primary').value,
//             }
//         };
        
//         // settings_state.theme.customThemes[name] = obj;
//         settings_state.theme.customThemes = {
//             [name]: obj, 
//             ...settings_state.theme.customThemes
//         }
//         updateCustomThemesData()

//         customThemeNameInput.value = '';
//         customThemeTypeSelect.value = 'dark';

        
//     } else if(customThemeMode == 'update') {
//         let data = custom[updateKey].data;
        
//         for (const key in data) {
//             const input = getColorThemeTarget(key);
//             data[key] = input.value;
//         };
//         custom[updateKey].name = customThemeNameInput.value;
//         custom[updateKey].type = customThemeTypeSelect.value;

//         let customTheme = settings_state.theme.currentTheme;

//         for (const key in customTheme.data) {
//             const input = getColorThemeTarget(key);
//             if(input) input.value = hex3ToHex6(customTheme.data[key]);
//         };
//         customThemeNameInput.value = '';
//         customThemeTypeSelect.value = 'dark';
//         customThemeSubmitButton.innerHTML = 'Add';
//         customThemeMode = 'add';

//     };

//     // update live dom
//     addThemesToDom(buildThemesForRender());
//     showCustomThemesTable();

//     checkCustomNameAvailable(customThemeNameInput)

//     localStorage.setItem('settings_state', JSON.stringify(settings_state));
//     settings_state = JSON.parse(localStorage.getItem('settings_state'));
// };

// let iconDiv = document.createElement('div');
// iconDiv.classList.add('icon2');

// let customThemeInputWrapper = document.querySelector(".customThemesContainer .scroll-area .scrollContent .addThemeContent .name .input-wrapper")
// let customThemeNameIcon = document.querySelector('.customThemesContainer .scroll-area .scrollContent .addThemeContent .name .icon');


// function checkCustomNameAvailable(element) {
//     customThemeNameIcon.style.visibility = 'visible';
//     if(customThemeInputWrapper.contains(iconDiv)) customThemeInputWrapper.removeChild(iconDiv);

//     if(element.value == '') {
//         customThemeNameIcon.style.visibility = 'hidden';
//         if(customThemeInputWrapper.contains(iconDiv)) customThemeInputWrapper.removeChild(iconDiv);
//         customThemeUniqueName = false;
//         customThemeSubmitButton.classList.add('disabled')
//         return;
//     }



//     let custom = settings_state.theme.customThemes;
//     let normal = settings_state.theme.normalThemes;
//     let themes = settings_state.theme.themes;
//     let specialSvg;
    
//     let unique = true;
//     if(normal[element.value] || custom[element.value]) {
//         unique = false;
//     };

//     for(const key in themes) {
//         for(let i = 0; i < themes[key].length; i++) {
//             if(themes[key][i].name == element.value) {
//                 unique = false;
//                 break;
//             };
//         };
//     };

//     if(customThemeMode == 'update') {
//         if(custom[updateKey].name == element.value) unique = true;
//     }

//     customThemeUniqueName = unique;

//     if(unique) {
//         specialSvg = '<svg id="correct"  width="30px" height="30px" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><title/><g><path d="M58.3945,32.1563,42.9961,50.625l-5.3906-6.4629a5.995,5.995,0,1,0-9.211,7.6758l9.9961,12a5.9914,5.9914,0,0,0,9.211.0059l20.0039-24a5.9988,5.9988,0,1,0-9.211-7.6875Z"/><path d="M48,0A48,48,0,1,0,96,48,48.0512,48.0512,0,0,0,48,0Zm0,84A36,36,0,1,1,84,48,36.0393,36.0393,0,0,1,48,84Z"/></g></svg>'
//         customThemeSubmitButton.classList.remove('disabled')
//     } else {
//         specialSvg = '<svg id="incorrect"  height="30px" width="30px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 512 512" xml:space="preserve"><g><g><g><path d="M437.016,74.984c-99.979-99.979-262.075-99.979-362.033,0.002c-99.978,99.978-99.978,262.073,0.004,362.031 c99.954,99.978,262.05,99.978,362.029-0.002C536.995,337.059,536.995,174.964,437.016,74.984z M406.848,406.844 c-83.318,83.318-218.396,83.318-301.691,0.004c-83.318-83.299-83.318-218.377-0.002-301.693 c83.297-83.317,218.375-83.317,301.691,0S490.162,323.549,406.848,406.844z"/> <path d="M361.592,150.408c-8.331-8.331-21.839-8.331-30.17,0l-75.425,75.425l-75.425-75.425c-8.331-8.331-21.839-8.331-30.17,0 s-8.331,21.839,0,30.17l75.425,75.425L150.43,331.4c-8.331,8.331-8.331,21.839,0,30.17c8.331,8.331,21.839,8.331,30.17,0 l75.397-75.397l75.419,75.419c8.331,8.331,21.839,8.331,30.17,0c8.331-8.331,8.331-21.839,0-30.17l-75.419-75.419l75.425-75.425 C369.923,172.247,369.923,158.74,361.592,150.408z"/></g></g></g></svg>'
//         customThemeSubmitButton.classList.add('disabled')
//     }
    
//     iconDiv.innerHTML = specialSvg;

//     setTimeout(() => {
//         if(element.value == '') return;
//         customThemeNameIcon.style.visibility = 'hidden';
//         customThemeInputWrapper.appendChild(iconDiv);
        
//     }, 600);
// };


// function showCustomThemesTable() {
//     let custom = settings_state.theme.customThemes;

//     customThemeTbody.innerHTML = ``;
//     let currentIndex = 0;
//     for(const key in custom) {
//         const k = custom[key]
        
//         customThemeTbody.innerHTML += `
//             <tr>
//                 <td>${currentIndex+1}</td>
//                 <td class="stat" style="font-size: calc(14px * var(--font-size-global)); color: ${k.data['accent_primary']}">${k.name}</td>
//                 <td>${k.type}</td>
//                 <td onclick="updateCustomTheme('${key}', this)" class="update"><div class="update">update</div></td>
//                 <td onclick="deleteCustomTheme('${key}', this)" class="delete"><div class="delete">delete</div></td>
//             </tr>
//         `;
//         currentIndex ++;
//     };   
//     checkCustomThemesTableLength()

// };


// function updateCustomTheme(key, element) {
//     updateKey = key;
//     customThemeMode = 'update';
//     customThemeSubmitButton.innerHTML = 'Update'

//     let custom = settings_state.theme.customThemes
//     let data = custom[key].data;

//     for (const key in data) {
//         const input = getColorThemeTarget(key);
//         if(input) input.value = data[key];
//     };
//     customThemeNameInput.value = custom[key].name;
//     customThemeTypeSelect.vaue = custom[key].type;

//     customThemesContainer.querySelector('.scroll-area').scroll({top: 0, behavior: "smooth"});
//     if(isShowAddSvg) showAddThemeInputes();
//     checkCustomNameAvailable(customThemeNameInput);
//     showCustomThemesTable()

//     localStorage.setItem('settings_state', JSON.stringify(settings_state))
// };



// function checkCustomThemesTableLength() {
//     if(Object.entries(settings_state.theme.customThemes).length > 0) {
//         deleteAllCustomThemesButton.classList.remove('disable');
//         deleteAllCustomThemesButton.disabled = false;
        
//     } else {
//         deleteAllCustomThemesButton.classList.add('disable');
//         deleteAllCustomThemesButton.disabled = true;
//     }

//     deleteAllCustomThemesButton.value = `delete all (${Object.entries(settings_state.theme.customThemes).length})`
// };

// function deleteCustomTheme(key, element) {
//     if(customThemeMode == 'update') return;


//     const elementInFavIndex = settings_state.theme.favThemes.indexOf(key);
//     if(elementInFavIndex >= 0) {
//         settings_state.theme.favThemes.splice(elementInFavIndex, 1)
//     };


//     const { [key]: _, ...newObj } = settings_state.theme.customThemes;
//     settings_state.theme.customThemes = newObj;

    
//     addThemesToDom(buildThemesForRender());
//     showCustomThemesTable();
//     checkCustomNameAvailable(customThemeNameInput);

//     localStorage.setItem('settings_state', JSON.stringify(settings_state))
// }


// let sureDeleteAllCustomThemes = document.querySelector('.sureDeleteAllCustomThemes');
// let sureDeleteAllCustomThemesOverlay = document.querySelector('.sureDeleteAllCustomThemesOverlay');


// function showSureDeleteAllCustomThemes() {
//     sureDeleteAllCustomThemes.style.visibility = 'visible';
//     sureDeleteAllCustomThemesOverlay.style.visibility = 'visible';    
    
//     sureDeleteAllCustomThemes.style.opacity = 1;
//     sureDeleteAllCustomThemesOverlay.style.opacity = 1;
// };

// function hideSureDeleteAllCustomThemes() {  
//     sureDeleteAllCustomThemes.style.opacity = 0;
//     sureDeleteAllCustomThemesOverlay.style.opacity = 0;
    
//     setTimeout(() => {
//         sureDeleteAllCustomThemes.style.visibility = 'hidden';
//         sureDeleteAllCustomThemesOverlay.style.visibility = 'hidden';
//     }, 300)
// };


// function deleteAllCustomThemes() {

//     for(const key in settings_state.theme.customThemes) {
//         const elementInFavIndex = settings_state.theme.favThemes.indexOf(key);
//             if(elementInFavIndex >= 0) {
//             settings_state.theme.favThemes.splice(elementInFavIndex, 1)
//         };
//     };

//     settings_state.theme.customThemes = {};

//     addThemesToDom(buildThemesForRender());
//     showCustomThemesTable();
//     checkCustomNameAvailable(customThemeNameInput);
//     hideSureDeleteAllCustomThemes(); 

//     localStorage.setItem('settings_state', JSON.stringify(settings_state))

// };


// function searchCustomThemeTable(element) {
//     let svg = element.parentNode.querySelector('.icon svg');
//     if(element.value == '') {svg.style.display = ''}
//     else {svg.style.display = 'none'};

//     let val = element.value;
//     let custom = settings_state.theme.customThemes;

//     customThemeTbody.innerHTML = ``;
//     let currentIndex = 0;
//     for(const key in custom) {
//         const k = custom[key]

//         if(k.name.toLowerCase().includes(val.toLowerCase()) || k.type.toLowerCase().includes(val.toLowerCase())) {
//             customThemeTbody.innerHTML += `
//                 <tr>
//                     <td>${currentIndex+1}</td>
//                     <td class="stat" style="font-size: calc(14px * var(--font-size-global)); color: ${k.data['accent_primary']}">${k.name}</td>
//                     <td>${k.type}</td>
//                     <td onclick="updateCustomTheme('${key}', this)" class="update"><div class="update">update</div></td>
//                     <td onclick="deleteCustomTheme('${key}', this)" class="delete"><div class="delete">delete</div></td>
//                 </tr>
//             `;
//             currentIndex ++;
//         };
//     };  
// };


async function applySidebarThemeSettings() {
    // get from json database
    await getSidebarThemes();
    // await getFontFamilyGroups();

    // rebuild themes
    addSidebarThemesToDom(buildSidebarThemesForRender());
    
   
    // initSettingsListeners();

    SidebarCTState(currentSidebarCTButton, settings_state.theme.typingCorrectTrans.name, settings_state.theme.typingCorrectTrans.value)
    updateSidebarCTList(false);
    applySidebarCTDSliderChange(sidebarCTDRangeSlider, 's')


    sidebarBgImageInput.addEventListener("change", () => {
        const file = sidebarBgImageInput.files[0];

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

}; applySidebarThemeSettings()


// // async function applyThemeProperties() {
// //     applyTheme();
// // };

