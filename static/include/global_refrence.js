// first theme
let firstTheme =  { 
    name: "RegLink Dark",
        colors: [
            "#bb0088",
            "#ffffff",
            "#b00000"
        ],
        data: {
        core_bg: "#02022a",
        core_panel: "#111a33",
        core_text: "#cccccc",
        core_text_hover: "#555555",
        core_muted: "#53576a",
        core_muted_hover: "#75798c",
        core_border: "#2d3753",
        core_scroll_color: "#738db5",
        typing_correct: "#dddddd",
        typing_incorrect: "#b00000",
        typing_extra: "#700000",
        typing_inactive: "#53576a",
        accent_primary: "#bb0088"
    }
};

// all settings
let settings_state = {
    theme: {
        mes: null,
        allDomThemes: [],

        currentTheme: firstTheme,
        defaultTheme: firstTheme,
        
        normalThemes: {},
        customThemes: {},
        favThemes: [],        
  

        typingCorrectTrans: {
            name: 'off',
            value: false,
            duration: 1,
            colors: ["#ff0000", "#00ff00", "#0000ff"],
        },

        backgroundImage: {
            isActive: false,
            base64: null,
            fileName: 'open file',
            size: 'cover',
            sideAndNav: 'off',

            sliders: {
                blur: 0,                
                opacity: 1,
                brightness: 1,
                contrast: 1,
                grayscale: 1,
                invert: 0,
            },
        },
    },

    display: {
        fontSizeGlobal: {
            type: "css-var-slider",
            cssVar: '--font-size-global',            
            unit: 'x',
            value: 1,
        },
        fontSizeTyping: {
            type: "css-var-slider",
            cssVar: "--font-size-typing",
            unit: 'x',
            value: 1,
        },
        letterSpacingTyping: {
            type: "css-var-slider",
            cssVar: '--letter-spacing-typing',
            unit: 'px',
            value: 3.5,
        },
        wordSpacingTyping: {
            type: "css-var-slider",
            cssVar: '--word-spacing-typing',
            unit: 'px',
            value: 7,
        },
        lineHeightTyping: {
            type: "css-var-slider",
            cssVar: "--line-height-typing",
            unit: 'px',
            value: 25,
        },
        errorUnderWordHeight: {
            type: "css-var-slider",
            cssVar: "--error-under-word-height",
            unit: 'px',
            value: 2,
        },
        fontFamilyGlobal: {
            type: "special-state-font-family",
            cssVar: "--font-family-global",
            fontGroups: [],
            fontActive: {mainGroup: 2, group: 0, index: 0, name: 'monospace'}
        },
       
    },

    caret: {
        caretShape: {
            type: 'special-caret-shape-buttons',
            value: 'line',
            unit: null,
            className: 'line',
        },
        caretTransition: {
            type: 'css-var-buttons',
            cssVar: '--caret-transition',
            value: 120,
            unit: 'ms',
            className: 'medium',
        },
        caretBlink: {
            type: 'css-var-buttons',
            cssVar: '--caret-blink',
            value: 666,
            unit: 'ms',
            className: 'blinkNormal',           
        },
        caretStrong: {
            type: 'css-var-slider',
            cssVar: '--caret-strong',            
            unit: 'x',
            value: 1.5,
        },

    },

    sound: {
        soundCorrectLetter: {
            type: 'settings-global-buttons-sound-volume-preview-and-slider',
            value: 'default',
            unit: null,
            className: 'default',
            volume: 0.5,
        },
        soundIncorrectLetter: {
            type: 'settings-global-buttons-sound-volume-preview-and-slider',
            value: 'default',
            unit: null,
            className: 'default',
            volume: 0.5,
        },
        soundExtraLetter: {
            type: 'settings-global-buttons-sound-volume-preview-and-slider',
            value: 'default',
            unit: null,
            className: 'default',
            volume: 0.5,
        },
        soundCorrectWord: {
            type: 'settings-global-buttons-sound-volume-preview-and-slider',
            value: 'success-ping',
            unit: null,
            className: 'success-ping',
            volume: 0.5,
        },
        soundIncorrectWord: {
            type: 'settings-global-buttons-sound-volume-preview-and-slider',
            value: 'oops-sound',
            unit: null,
            className: 'oops-sound',
            volume: 0.5,
        },
        soundBackspace: {
            type: 'settings-global-buttons-sound-volume-preview-and-slider',
            value: 'gear-tap',
            unit: null,
            className: 'gear-tap',
            volume: 0.5,
        },

    },

    appearance: {
        appearanceGameLeft: {
            type: 'class-name-global-buttons',
            value: 'default',
            unit: null,
            className: 'default',
        },
        appearanceLiveStats: {
            type: 'class-name-global-buttons',
            value: 'hidden',
            unit: null,
            className: 'hidden',
        },
        appearanceGlowSliders: {
            type: 'special-css-var-glow-sliders',
            sliders: {
                glowInactiveLetter: {
                    value: 0,
                    cssVar: '--glow-inactiveLetter',
                    unit: 'px',
                },
                glowCorrectLetter: {
                    value: 0,
                    cssVar: '--glow-correctLetter',
                    unit: 'px',
                },
                glowIncorrectLetter: {
                    value: 0,
                    cssVar: '--glow-incorrectLetter',

                    unit: 'px',
                },
                glowExtraLetter: {
                    value: 0,
                    cssVar: '--glow-extraLetter',
                    unit: 'px',
                },

            },
        },
        appearanceGlowGlobal: {
            type: "css-var-slider",
            cssVar: '--glow-global',            
            unit: 'px',
            value: 0,
        },
        appearanceTextBoxWidth: {
            type: "css-var-slider",
            cssVar: '--text-box-width',            
            unit: '%',
            value: 90,
        },
        appearanceLettersTransition: {
            type: "css-var-slider",
            cssVar: '--letters-transition-typing',            
            unit: 'ms',
            value: 0,
        },
    }
};

// default settings state
localStorage.setItem('settings_state_default', JSON.stringify(settings_state));


function initGlobalSettingsState() {

    // set settings state from local storage    
    if(JSON.parse(localStorage.getItem('settings_state')) == null) {
        localStorage.setItem('settings_state', JSON.stringify(settings_state));
    } else {
        settings_state = JSON.parse(localStorage.getItem('settings_state'));
    };


    // set current theme to first theme if current theme is null
    if(settings_state.theme.currentTheme == null) {
        localStorage.setItem('settings_state', JSON.stringify(settings_state));
        settings_state.theme.currentTheme = firstTheme;
    };
};initGlobalSettingsState();
