// عناصر sidebar الأساسية
let sidebarButtons = document.querySelectorAll('.sidebar_container .sidebar .sidebar_buttons * > ul li');
let openSidebarButton = document.querySelector('.sidebar_container .buttons_part1 .openSidebarButton');
let closeSidebarButton = document.querySelector('.sidebar_container .buttons_part1 .closeSidebarButton');

let canTransformItems = document.querySelectorAll('.canTransform');
let canScrollWidthItems;



sidebarElement = document.querySelector('.sidebar_container .sidebar');
sidebarFades = document.querySelectorAll('.sidebar-fades');
mainContent = document.querySelector('#main_content');

sidebar_content = document.querySelector('.sidebar_container .sidebar .sidebar_content');
sidebarScrollbar =  document.querySelector('.sidebar_container .sidebar .sidebar_scrollbar');

// القيم من CSS
const root = document.documentElement;
let sidebar_close_width = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-close-width').trim();
let sidebar_open_width = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-open-width').trim();
let sidebar_items_width = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-items-width').trim();

let sidebarOs;
let OsScrollElement;
let OsScrollMainElement;

document.addEventListener('DOMContentLoaded', () => {
    const { OverlayScrollbars } = window.OverlayScrollbarsGlobal;

    sidebarOs = OverlayScrollbars(sidebarElement, {
        overflow: { x: 'hidden', y: 'scroll' },
        scrollbars: {
            autoHide: 'leave',
            autoHideDelay: 1100,
            clickScroll: true,
            dragScroll: true
        },            
    });
    OsScrollElement = document.querySelector('.sidebar_container .sidebar .os-scrollbar-vertical');
    OsScrollElement.classList.add('canScrollWidth');

    canScrollWidthItems = document.querySelectorAll('.canScrollWidth');
});


let searchControl = document.querySelector('.searchControl');

function openSidebar() {
    // mainContent.style.margin = '0 0 0 calc(var(--sidebar-open-width) - var(--sidebar-close-width))';
    // root.style.setProperty('--sidebar-translate', '240px');    
    
    canTransformItems.forEach(cti => {
        if(cti.classList.contains('sidebar')) {
            cti.style.transform = 'translateX(calc(-100% + var(--sidebar-close-width) + var(--sidebar-translate) + 240px))';
        } else {
            cti.style.transform = 'translateX(240px)';
        }
    })
    canScrollWidthItems.forEach(csw => {
        csw.classList.add('withScrollBarWidth');
    })
    OsScrollElement.style.display = '';

    document.body.style.overflow = 'hidden';


    if(currentPage == 'home') state.isInGame = false;
    searchControl.disabled = false;


    sidebarFades.forEach(f => {
        f.style.opacity = '1';
        f.style.pointerEvents = 'all';
    });
    

    sidebarButtons.forEach(b => b.style.display = 'none');
    closeSidebarButton.style.display = 'block';
    setTimeout(() => {
        sidebarOs.update();
    }, 50);

};

function closeSidebar() {
    // mainContent.style.margin = '0';
    // root.style.setProperty('--sidebar-translate', '0px');   
    
    canTransformItems.forEach(cti => {
        if(cti.classList.contains('sidebar')) {
            cti.style.transform = 'translateX(calc(-100% + var(--sidebar-close-width) + var(--sidebar-translate) + 0px))'
        } else {
            cti.style.transform = 'translateX(0px)';
        };
    });
    canScrollWidthItems.forEach(csw => {
        csw.classList.remove('withScrollBarWidth')
    })
    OsScrollElement.style.display = 'none';


    document.body.style.overflow = '';
    if(currentPage == 'home') state.isInGame = true;
    searchControl.disabled = true;
    

    sidebarFades.forEach(f => {
        f.style.opacity = '0';
        f.style.pointerEvents = 'none';            
    });

    sidebarButtons.forEach(b => b.style.display = 'block');
    closeSidebarButton.style.display = 'none';   

};

// فتح Sidebar
openSidebarButton.addEventListener('click', () => {
    openSidebar()
});

// إغلاق Sidebar
closeSidebarButton.addEventListener('click', () => {
    closeSidebar()
});

sidebarFades.forEach(f => {
    f.addEventListener('click', () => {
        closeSidebar();
    })
});




// ========== START SIDEBAR CONTROL PANEL LOGIC ========== //

let sidebarSectionsName = document.querySelectorAll('.sidebar_content .sidebar-section .arrow_and_name');
sidebarSectionsName.forEach(element => {
    const parent = element.parentNode;
    element.addEventListener('click', () => {
       if(parent.classList.contains('open')) {
            parent.classList.remove('open'); parent.classList.add('close');
       } else if(parent.classList.contains('close')) {
            parent.classList.remove('close'); parent.classList.add('open');
       };
    })
});




function initSidebarSettings() {
    sidebarApplyDisplaySettings();
}; initSidebarSettings()





