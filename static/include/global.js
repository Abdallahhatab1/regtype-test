
const keysPressed = new Set();
const fileName = window.location.pathname.split("/").pop() || "index.html";

settings_state = JSON.parse(localStorage.getItem('settings_state'));


isPhone = 'ontouchstart' in window || navigator.maxTouchPoints > 0


let currentPage = location.pathname
    .split('/')
    .pop()
    .replace('.html', '')
    .trim();

// tooltip
let activeTarget = null;
const tooltip = document.querySelector('.tooltip');
let tooltip_content = document.querySelector('.tooltip .content');
function updateTooltipPosition() {
    if (!activeTarget || isPhone) return;

    //console.log('llfe: updateTooltipPosition()');

    const rect = activeTarget.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const offsetY = 5;


    // نضع الـ tooltip أفقياً في منتصف العنصر
    tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;

    // نضع الـ tooltip عموديًا عند رأس العنصر
    tooltip.style.top  = `${rect.top - (tooltipRect.height) - offsetY}px`;
};

// نطبّق الأحداث على كل عنصر عنده class = stat
document.querySelectorAll('.stat').forEach(el => {
    if(isPhone) return;

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


document.addEventListener('keydown', (e) => {
    keysPressed.add(e.code);

    // restart game
    if(
        (   
            (keysPressed.has('AltLeft') || keysPressed.has('AltRight')) &&
            keysPressed.has('KeyR'))
    ) {
        if(currentPage != 'home') return;

        state.hasShortcut = true        
        transmissionAnimation('hideChart');
    }

    // end game
    else if(
        (keysPressed.has('AltLeft') || keysPressed.has('AltRight')) &&
        keysPressed.has('KeyN')
    ) {
        if(state.isInGame) {
            if(currentPage != 'home') return;

            endGame();
        }
    }

    // open settings
    else if(
        (keysPressed.has('AltLeft') || keysPressed.has('AltRight')) &&
        keysPressed.has('KeyS')
    ) {
        if(currentPage == 'settings') return;
        window.location.href = 'settings.html';
    }

    // home
    else if(
        (keysPressed.has('AltLeft') || keysPressed.has('AltRight')) &&
        keysPressed.has('KeyH')
    ) {
        if(currentPage == 'home') return;
        window.location.href = 'home.html';
    };

    setTimeout(() => {
        if(currentPage != 'home') return;
        state.hasShortcut = false;
    }, 100);

});

document.addEventListener('keyup', (event) => {
    keysPressed.delete(event.code);
});



document.addEventListener('DOMContentLoaded', () => {
    const themeChangedEvent = new CustomEvent("domLoaded", { detail: { message: "dom loaded successfully!" } });
    document.dispatchEvent(themeChangedEvent);
});




let backgroundImageCross = document.querySelector('.global_one_button_title #openBgAndCross svg')
let openBgButton = document.getElementById('open_bg_image_button');
let bgOptionSliders = document.querySelector('.settings_container .option #themes .themes_container .moreContent .bg_image_and_option_sliders .sliders_and_hint .bg_option_sliders')
let bgSizeBTNsTitle = document.getElementById('bgImageSizeButtonsTitle');
let bgImageSideNavButtonsTitle = document.getElementById('bgImageSideNavButtonsTitle');

// sidebar
// BT = buttons title
let sidebarBgImageCross = document.querySelector('.sidebar-global_one_button_title #sidebar-openBgAndCross svg')
let sidebarOpenBgButton = document.getElementById('sidebar-open_bg_image_button');
let sidebarBgOptionSliders = document.querySelector('.sidebar-bgAndOptionSliders .sliders_and_hint .bg_option_sliders')
let sidebarBgImageSizeBT = document.getElementById('sidebar-bgSizeBTNsTitle');
let sidebarBgImageSideNavBT = document.getElementById('sidebar-bgSideNavBTNsTitle');




/* =====================================================
   BG IMAGE CONTROLS (CACHE DOM ELEMENTS ONCE)
===================================================== */

const bgImageUI = {
    blur: bgImageGetControl('bgImageBlur'),
    brightness: bgImageGetControl('bgImageBrightness'),
    contrast: bgImageGetControl('bgImageContrast'),
    grayscale: bgImageGetControl('bgImageGrayscale'),
    invert: bgImageGetControl('bgImageInvert'),
    opacity: bgImageGetControl('bgImageOpacity'),
};

/* Get slider + number element from one wrapper */
function bgImageGetControl(id) {

    //console.log('llfe: bgImageGetControl()');

    if(currentPage != 'settings') return null;    
    const el = document.getElementById(id);

    return {
        slider: el.querySelector('.range_slider'),
        number: el.querySelector('.range_number')
    };
}

/* BG IMAGE DEFAULT VALUES */
const bgImageDefaults = {
    blur: 0,
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    invert: 0,
    opacity: 1,
};

/* APPLY CSS VARIABLES (ONLY CSS LOGIC) */
function bgImageApplyCSS(sliders) {

    //console.log('llfe: bgImageApplyCSS()');

    const root = document.documentElement.style;

    root.setProperty("--bg-blur", `${sliders.blur}px`);
    root.setProperty("--bg-brightness", `${sliders.brightness}%`);
    root.setProperty("--bg-contrast", `${sliders.contrast}%`);
    root.setProperty("--bg-grayscale", `${sliders.grayscale}%`);
    root.setProperty("--bg-invert", `${sliders.invert}%`);
    root.setProperty("--bg-opacity", sliders.opacity);
}

// SYNC SLIDERS + NUMBERS WITH STATE
function bgImageSyncUI(sliders) {
    //console.log('llfe: bgImageSyncUI()');

    for (const key in sliders) {
        const ui = bgImageUI[key];
        if (!ui) continue;

        ui.slider.value = sliders[key];
        ui.number.textContent = bgImageFormatValue(key, sliders[key]);
    }
}

/* Format values for UI */
function bgImageFormatValue(key, value) {
    //console.log('llfe: bgImageFormatValue()');

    if (key === 'blur') return `${value}px`;
    if (key === 'opacity') return value;
    return `${value}%`;
}


// SIDE AND NAV BUTTONS 
let bgSideNavBTNs = document.querySelector('#bgImageSideAndNavButtons');
let sidebarBgSideNavBTNs = document.querySelector('#sidebar-bgSideAndNavBTNs');



let currentBgImageSideAndNav;
// bgSideNavBTNs.forEach(e => {
//     if(e.classList.contains(settings_state.theme.backgroundImage.sideAndNav)) {
//         currentBgImageSideAndNav = e;
//     };
// });

// MAIN APPLY FUNCTION (CONTROLLER)
function bgImageApplyAll() {
    //console.log('llfe: bgImageApplyAll()');

    const bg = settings_state.theme.backgroundImage;


    let sidenavOffButton = document.querySelector('#bgImageSideAndNavButtons .off');

    // 1️⃣ الصورة موجودة ومفعلة
    if (bg.isActive && bg.base64) {
        document.documentElement.style.setProperty('--background-image-url', `url(${bg.base64})`);
    } else {
        // الصورة غير مفعلة → اعادة defaults
        document.documentElement.style.setProperty('--background-image-url', 'none');

        Object.assign(bg.sliders, bgImageDefaults);

        // حدث CSS Variables مباشرة
        bgImageApplyCSS(bg.sliders);
    }

    // 2️⃣ تحديث UI فقط لو نحن في صفحة settings
    if (currentPage == 'settings') {
        if (bg.isActive && bg.base64) {
            openBgButton.textContent = bg.fileName;
            backgroundImageCross.style.display = '';
            bgOptionSliders.style.display = '';
            bgSizeBTNsTitle.style.display = '';
            bgImageSideNavButtonsTitle.style.display = '';

        } else {
            openBgButton.textContent = 'open file';
            backgroundImageCross.style.display = 'none';
            bgOptionSliders.style.display = 'none';
            bgSizeBTNsTitle.style.display = 'none';
            bgImageSideNavButtonsTitle.style.display = 'none';


            applyBgImageSideNav('off');
        }

        bgImageSyncUI(bg.sliders);
    }

    if(bg.isActive && bg.base64) {
         // for sidebar
            sidebarOpenBgButton.textContent = bg.fileName;
            sidebarBgImageCross.style.display = '';
            sidebarBgOptionSliders.style.display = '';
            sidebarBgImageSizeBT.style.display = '';
            sidebarBgImageSideNavBT.style.display = '';
    } else {
        // for sidebar 
        sidebarOpenBgButton.textContent = 'open file';
        sidebarBgImageCross.style.display = 'none';
        sidebarBgOptionSliders.style.display = 'none';
        sidebarBgImageSizeBT.style.display = 'none';
        sidebarBgImageSideNavBT.style.display = 'none';
    }



    // 3️⃣ حدث CSS Variables حتى لو خارج settings
    bgImageApplyCSS(bg.sliders);

    localStorage.setItem('settings_state', JSON.stringify(settings_state));
}


// INITIAL APPLY ON PAGE LOAD
bgImageApplyAll();


let bgSizeBTNs = document.querySelector('#bgImageSizeButtons');
let sidebarBgSizeBTNs = document.querySelector('#sidebar-bgSizeBTNs');

function applyBgImageSize(name) {
    //console.log('llfe: applyBgImageSize()');

    const sidebarCover = sidebarBgSizeBTNs.querySelector('.cover');
    const sidebarContain = sidebarBgSizeBTNs.querySelector('.contain');
    const sidebarAuto = sidebarBgSizeBTNs.querySelector('.auto');

    let buttonsState = {
        'cover': [sidebarCover],
        'contain': [sidebarContain],
        'auto': [sidebarAuto],
    }

    if(bgSizeBTNs) {
        const settingsCover = bgSizeBTNs.querySelector('.cover'); buttonsState.cover.push(settingsCover);
        const settingsContain = bgSizeBTNs.querySelector('.contain'); buttonsState.contain.push(settingsContain);
        const settingsAuto = bgSizeBTNs.querySelector('.auto'); buttonsState.auto.push(settingsAuto);
    };

    for(const k in buttonsState) {
        buttonsState[k].forEach(e => {
            e.classList.remove('isActive')
        });
    } ;

    buttonsState[name].forEach(e => {
        e.classList.add('isActive')
    });


    settings_state.theme.backgroundImage.size = name;
    document.documentElement.style.setProperty('--background-size', name);

    localStorage.setItem('settings_state', JSON.stringify(settings_state))

};
applyBgImageSize(settings_state.theme.backgroundImage.size);




function applyBgImageSideNav(name) {
    //console.log('llfe: applyBgImageSideNav()');

    const sidebarOn = sidebarBgSideNavBTNs.querySelector('.choice.on');
    const sidebarOff = sidebarBgSideNavBTNs.querySelector('.choice.off');

    let buttonsState = {
        'on': [sidebarOn],
        'off': [sidebarOff]
    }

    if(bgSideNavBTNs) {
        const settingsOn = bgSideNavBTNs.querySelector('.on');
        const settingsOff = bgSideNavBTNs.querySelector('.off');
        buttonsState.on.push(settingsOn); buttonsState.off.push(settingsOff)
    };

    for(const k in buttonsState) {
        buttonsState[k].forEach(e => {
            e.classList.remove('isActive')
        });
    } ;

    buttonsState[name].forEach(e => {
        e.classList.add('isActive')
    });
        
    settings_state.theme.backgroundImage.sideAndNav = name;

    requestAnimationFrame(() => {
        if(name == 'on') {
        document.documentElement.style.setProperty('--sidenav-image', `none`);
        } else {
        document.documentElement.style.setProperty('--sidenav-image', `var(--core-bg)`);
        }        
    });


    localStorage.setItem('settings_state', JSON.stringify(settings_state));
};
applyBgImageSideNav(settings_state.theme.backgroundImage.sideAndNav);



document.documentElement.style.setProperty('--screenHeight', `${screen.availHeight}px`)

let navbar_svgs = document.querySelectorAll(".navbar_container .navbar .buttons_container svg")
for(let i = 0; i < navbar_svgs.length; i++) {
    navbar_svgs[i].classList.remove('active')
};

if(currentPage == 'home') {
    navbar_svgs[0].classList.add('active');
} else if(currentPage == 'settings') {
    navbar_svgs[1].classList.add('active')
};


// CT = (colors transition)
function applyCT() {
    if(currentPage != 'home') return;

    //console.log('llfe: applyCT()');

    // مصفوفة الألوان (طولها غير معروف)
    const colors = settings_state.theme.typingCorrectTrans.colors;
    const time = settings_state.theme.typingCorrectTrans.duration;

    // حساب النسب المئوية تلقائيًا
    const n = colors.length;
    const keyframeStrings = colors.map((color, i) => {
        const percent = (i / (n - 1)) * 100;
        return `${percent}% { color: ${color}; }`;
    });

    // دمجها في نص keyframes
    const keyframesText = `
        @keyframes transCorrectColor {
            ${keyframeStrings.join("\n")}
        }
    `;

    const CTAnimationStyle = document.querySelector('.CTAnimationClass')

    let CTName = settings_state.theme.typingCorrectTrans.name;
    if(CTName == 'on') {
        CTAnimationStyle.textContent = keyframesText;
        CTAnimationStyle.textContent += `.text_container .text {
            animation: transCorrectColor ${time}s linear 0s infinite alternate;
        }`;        
    } else {
        CTAnimationStyle.textContent = '';
    };


}; applyCT()



// function applyCaretTransition() {
//     if(currentPage != 'home') return;
//     document.documentElement.style.setProperty('--caret-transition', `${settings_state.caret.caretTransition.speedMs}ms`);
// };  applyCaretTransition();

// function applyCaretBlink() {
//     if(currentPage != 'home') return;
//     document.documentElement.style.setProperty('--caret-blink', `${settings_state.caret.caretBlink.speedMs}ms`);
// };  applyCaretBlink();





language_button = document.querySelector('.language_button');
restart_button = document.querySelector('.restart_button');
sidebar_container = document.querySelector('.sidebar_container');

sidebarButton = document.querySelector('.sidebar_container .buttons_part1 .openCloseButton')
sidebarElement = document.querySelector('.sidebar_container .sidebar')
sidebarFades = document.querySelectorAll('.sidebar-fades')

sidebar_buttons = document.querySelector('.sidebar_buttons');
test_settings = document.querySelector('header .test_settings')
footer_container = document.querySelector('footer .footer_container');

function setAllViewPort() {
    //console.log('llfe: setAllViewPort)');

    const root = document.documentElement;

    let sidebar_width = getComputedStyle(root).getPropertyValue('--sidebar-width').trim();
    let sidebar_close_width = getComputedStyle(root).getPropertyValue('--sidebar-close-width').trim();
    let sidebar_open_width = getComputedStyle(root).getPropertyValue('--sidebar-open-width').trim();
  
    // for sidebar
    if(window.innerWidth >= 540) {
        if(sidebar_width == '0px') {
            root.style.setProperty('--sidebar-width', sidebar_close_width);
            sidebar_container.style.display = '';
            sidebar_container.style.pointerEvents = '';


        }
    } else {
        root.style.setProperty('--sidebar-width', '0px');
        sidebarFades.forEach(f => {
            f.style.opacity = '0';
            f.style.pointerEvents = 'none';            
        });
        sidebar_container.style.display = 'none';
        sidebar_container.style.pointerEvents = 'none';

    }



    if(window.innerWidth > 1150) {
    }
    if(window.innerWidth < 1150 && window.innerWidth >= 850) {
    }
    if(window.innerWidth < 850 && window.innerWidth >= 725) {
    }
    if(window.innerWidth < 725 && window.innerWidth >= 540) {
    }
    if(window.innerWidth < 540 && window.innerWidth >= 425) {
    }
    if(window.innerWidth < 425 && window.innerWidth >= 0) {
    };

}; setAllViewPort()

window.addEventListener('resize', () => {
    setAllViewPort()
});


// local => only settings.html
function applySettings() {
    if(currentPage != 'settings') return;

    //console.log('llfe: applySettings()');

    applyDisplaySettings();
    applyThemeSettings();
    applyCaretSettings();
    applyVolumeSettings()
    applyAppearanceSettings()
}; applySettings();


// local => only home.html
function applyOnlyHomeSettings() {
    if(currentPage != 'home') return;

    //console.log('llfe: applyOnlyHomeSettings()');

    applyCaretHome();
    applyAppearanceHome()

}; applyOnlyHomeSettings()


// global => Home & settings etc..
function applyGlobalSettings() {
    //console.log('llfe: applyGlobalSettings()');

    applyDisplayProperties();
    applyThemeProperties();
    applyCaretProperties();
    applyAppearanceProperties()    
}; applyGlobalSettings();


function applyDisplayLive() {
    //console.log('llfe: applyDisplayLive()');
    sidebarApplyDisplaySettings();
};
function applyVolumeLive() {
    //console.log('llfe: applyVolumeLive()');

    sidebarApplyVolumeSettings();
    applyVolumeSettings();
};
function applyAppearanceLive() {
    //console.log('llfe: applyAppearanceLive()');  
    sidebarApplyAppearanceSettings();
    applyAppearanceSettings();
};



function createMessage(type, content, duration, pressToClose) {
    //console.log('llfe: createMessage()');

    let messagesSvgs = {
        error: `
            <svg width="800px" height="800px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.6 1c1.6.1 3.1.9 4.2 2 1.3 1.4 2 3.1 2 5.1 0 1.6-.6 3.1-1.6 4.4-1 1.2-2.4 2.1-4 2.4-1.6.3-3.2.1-4.6-.7-1.4-.8-2.5-2-3.1-3.5C.9 9.2.8 7.5 1.3 6c.5-1.6 1.4-2.9 2.8-3.8C5.4 1.3 7 .9 8.6 1zm.5 12.9c1.3-.3 2.5-1 3.4-2.1.8-1.1 1.3-2.4 1.2-3.8 0-1.6-.6-3.2-1.7-4.3-1-1-2.2-1.6-3.6-1.7-1.3-.1-2.7.2-3.8 1-1.1.8-1.9 1.9-2.3 3.3-.4 1.3-.4 2.7.2 4 .6 1.3 1.5 2.3 2.7 3 1.2.7 2.6.9 3.9.6zM7.9 7.5L10.3 5l.7.7-2.4 2.5 2.4 2.5-.7.7-2.4-2.5-2.4 2.5-.7-.7 2.4-2.5-2.4-2.5.7-.7 2.4 2.5z"/>
            </svg>
        `,

        success:  `
            <svg fill="#000000" width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M12,2 C17.5228475,2 22,6.4771525 22,12 C22,17.5228475 17.5228475,22 12,22 C6.4771525,22 2,17.5228475 2,12 C2,6.4771525 6.4771525,2 12,2 Z M12,4 C7.581722,4 4,7.581722 4,12 C4,16.418278 7.581722,20 12,20 C16.418278,20 20,16.418278 20,12 C20,7.581722 16.418278,4 12,4 Z M15.2928932,8.29289322 L10,13.5857864 L8.70710678,12.2928932 C8.31658249,11.9023689 7.68341751,11.9023689 7.29289322,12.2928932 C6.90236893,12.6834175 6.90236893,13.3165825 7.29289322,13.7071068 L9.29289322,15.7071068 C9.68341751,16.0976311 10.3165825,16.0976311 10.7071068,15.7071068 L16.7071068,9.70710678 C17.0976311,9.31658249 17.0976311,8.68341751 16.7071068,8.29289322 C16.3165825,7.90236893 15.6834175,7.90236893 15.2928932,8.29289322 Z"/>
            </svg>
        `,

        info: `
            <svg width="800px" height="800px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
                <path fill="#000000" fill-rule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm8-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.01 8a1 1 0 102 0V9a1 1 0 10-2 0v5z"/>
            </svg>
        `,
    }

    let msgBlock = document.createElement('div');
    msgBlock.classList.add('msgBlock', type);

    // svg close cross
    let closeSvg = document.createElement('div');
    closeSvg.classList.add('closeSvg');
    closeSvg.insertAdjacentHTML(
        "beforeend", 
        `<svg
            viewBox="0 -0.5 25 25" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <path d="M6.96967 16.4697C6.67678 16.7626 6.67678 17.2374 6.96967 17.5303C7.26256 17.8232 7.73744 17.8232 8.03033 17.5303L6.96967 16.4697ZM13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697L13.0303 12.5303ZM11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303L11.9697 11.4697ZM18.0303 7.53033C18.3232 7.23744 18.3232 6.76256 18.0303 6.46967C17.7374 6.17678 17.2626 6.17678 16.9697 6.46967L18.0303 7.53033ZM13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303L13.0303 11.4697ZM16.9697 17.5303C17.2626 17.8232 17.7374 17.8232 18.0303 17.5303C18.3232 17.2374 18.3232 16.7626 18.0303 16.4697L16.9697 17.5303ZM11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697L11.9697 12.5303ZM8.03033 6.46967C7.73744 6.17678 7.26256 6.17678 6.96967 6.46967C6.67678 6.76256 6.67678 7.23744 6.96967 7.53033L8.03033 6.46967ZM8.03033 17.5303L13.0303 12.5303L11.9697 11.4697L6.96967 16.4697L8.03033 17.5303ZM13.0303 12.5303L18.0303 7.53033L16.9697 6.46967L11.9697 11.4697L13.0303 12.5303ZM11.9697 12.5303L16.9697 17.5303L18.0303 16.4697L13.0303 11.4697L11.9697 12.5303ZM13.0303 11.4697L8.03033 6.46967L6.96967 7.53033L11.9697 12.5303L13.0303 11.4697Z" fill="#000000"/>
        </svg>`,
    );

    closeSvg.addEventListener('click', () => {
        hideMessage(msgBlock, true);
    })


    // title and svg
    let messageTitle = document.createElement('div');
    messageTitle.classList.add('messageTitle', type);
    messageTitle.innerHTML = content;


    let msgSvgAndTitle = document.createElement('div');
    msgSvgAndTitle.classList.add('msgSvgAndTitle');


    let msgSvg = document.createElement('div');
    msgSvg.classList.add('msgSvg', type);
    msgSvg.insertAdjacentHTML("beforeend", messagesSvgs[type]);

    
    let msgTitle = document.createElement('div');
    msgTitle.classList.add('msgTitle');
    msgTitle.innerHTML = type;

    msgSvgAndTitle.append(msgSvg, msgTitle);
    msgBlock.append(closeSvg, msgSvgAndTitle, messageTitle);

    if(pressToClose) {
        msgBlock.addEventListener('click', (e) => {
            if(closeSvg.contains(e.target)) return;
            hideMessage(msgBlock, false);
        });        
    };

    return msgBlock
};


function showMessage(type, content, duration, pressToClose) {
    //console.log('llfe: showMessage()');

    let messagesContainer = document.querySelector('.messagesContainer');

    let msgBlock = createMessage(type, content, duration, pressToClose);
    messagesContainer.prepend(msgBlock);

    let timeout = setTimeout(() => {
        hideMessage(msgBlock, false, timeout);
    }, duration);
};

function hideMessage(block, force, timeout) {
    //console.log('llfe: hideMessage()');
    let messagesContainer = document.querySelector('.messagesContainer');

    if(force) {
        clearTimeout(timeout);
        messagesContainer.removeChild(block);
    } else {
        if(!block) return;
        clearTimeout(timeout)
        block.classList.add('goBack');
        setTimeout(() => {
              try {
                messagesContainer.removeChild(block);                
            }catch(error) {
                return error;
            };
        }, 700);
    };
};



