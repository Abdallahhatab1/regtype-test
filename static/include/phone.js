
let isPhone = 'ontouchstart' in window || navigator.maxTouchPoints > 0

let textAreaFromPhone = document.querySelector('.text_container .typing-state .text');

let footerKeyboardHints = document.querySelector('footer .hints_container')

// إذا الجهاز غير لمسي: أوقف كل شيء بصمت

// phone code:
if(isPhone) {
    document.addEventListener('domLoaded', () => {
        showMessage("info", `
            This site is optimized for desktop. Mobile support is partial.<br>
            Expect some limitations:<br>
            &bull; Arabic text may be disconnected.<br>
            &bull; Typing responsiveness may drop.<br>
            &bull; Minor glitches possible.<br><br>

            <strong><em>For best results, use a desktop.</em></strong>`, 
        20000, true);
    });
};



function scrollAboveKeyboard(element) {
    if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const rect = element.getBoundingClientRect();

        const offset = rect.top - (viewportHeight / 2);

        window.scrollBy({
            top: offset,
            behavior: "smooth"
        });
    }
};

function closeKeyboard() {
    const trap = document.getElementById("focus-trap");
    trap.focus();
    trap.blur();
};

let phoneInputFromPhone = document.createElement('input');
function runKeyboard() {
    if(!isPhone) return;
    
    const pInput = phoneInputFromPhone;
    // إعدادات أساسية
    pInput.type = 'text';
    pInput.autocapitalize = 'off';
    pInput.autocomplete = 'off';
    pInput.autocorrect = 'off';
    pInput.spellcheck = false;
    
    // ✨ أهم جزء (منع السكرول)
    pInput.style.position = 'fixed';
    pInput.style.top = '0px';
    pInput.style.left = '0px';

    pInput.style.width = '0px';
    pInput.style.height = '0px';

    pInput.style.opacity = '0';
    pInput.style.pointerEvents = 'none';
    pInput.style.border = 'none';
    pInput.style.outline = 'none';

    // مهم جدًا في iOS (يمنع zoom)
    pInput.style.fontSize = '16px';

    document.body.appendChild(pInput);


    document.body.appendChild(pInput);
    pInput.focus();

    setTimeout(() => {
        scrollAboveKeyboard(dom_items.text_container)        
    }, 100)


    const DUMMY = '\u200B'; // zero-width space
    pInput.value = DUMMY;

    pInput.addEventListener('keydown', (e) => {
            pInput.value = DUMMY;
            console.log(pInput.value)
    });

    document.addEventListener('spaceEventToPhone', (e) => {
        pInput.value = ``;
    });
};


function hideMoreData() {
    if(isPhone) {
        footerKeyboardHints.style.display = 'none';
        
    } else {
        footerKeyboardHints.style.display = '';
    }
}; hideMoreData();
