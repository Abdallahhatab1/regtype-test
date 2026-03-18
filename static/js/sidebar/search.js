
let dataSearchElements = document.querySelectorAll('[data-search]');
let searchRusultBlock = document.querySelector('.sidebar_content .searchResultBlock');
let searchSidebarContent = document.querySelector('.sidebar_container .sidebar');
let sidebarScrollViewPort;

document.addEventListener('DOMContentLoaded', () => {
    const { OverlayScrollbars } = window.OverlayScrollbarsGlobal;
    sidebarOs = OverlayScrollbars(searchSidebarContent, {
        overflow: { x: 'hidden', y: 'scroll' }
    });
    sidebarScrollViewPort = sidebarOs.elements().viewport;
})


function openAllParentByClass(el, className) {
    const parents = [];
    let current = el;

    let index = 0;

        while (index < 20) {
            if(current == null) break;
            if(current.classList.contains(className)) {
                parents.push(current);
            };
            current = current.parentElement;
            index ++;
        };

        return parents;
};


let canShowSearchResult = true;
function showSearchResults() {
    if(!canShowSearchResult) return;
    searchRusultBlock.classList.remove('close');    
    searchRusultBlock.classList.add('open');
};
function hideSearchResults() {
    searchRusultBlock.classList.remove('open');
    searchRusultBlock.classList.add('close');
};

let tempSearchObj = [];
let searchResultLocation = 0;
let searchControlSvg = document.querySelector('.sidebar_content .search .search-svg svg');
let searchResultNumbers = document.querySelector('.sidebar_content .searchResult .resultNumbers');
let searchResultArrows = document.querySelector('.sidebar_content .searchResult .resultArrows');


function sidebarOninputSearch(element) {
    if (!sidebarScrollViewPort) return;
    if(!canShowSearchResult) {
        element.value = "";
        return;
    };
    
    tempSearchObj = [];  

    if(element.value == "") {
        searchControlSvg.style.visibility = 'visible';
        hideSearchResults();

        canShowSearchResult = false;
        window.setTimeout(() => {
            updateSearchResults();
            renderSearchResultsUi();
            
            canShowSearchResult = true;
        }, 300);

        dataSearchElements.forEach(dse => {
            dse.classList.remove('mark');
        });

        sidebarScrollViewPort.scrollTop = 0;


        return;
    };

    searchControlSvg.style.visibility = 'hidden';
    showSearchResults()
  
    dataSearchElements = document.querySelectorAll('[data-search]');
    dataSearchElements.forEach(se => {
        dataName = se.getAttribute('data-search');
        if(dataName.toLowerCase().includes(element.value.toLowerCase())) {
            const tempObj = {
                'name': se.getAttribute('data-search'),
                'element': se,
                'openWay': openAllParentByClass(se, 'sidebar-section')
            };

            tempSearchObj.push(tempObj);
        };
    });

    updateSearchResults();
    renderSearchResultsUi();
};


function updateSearchResults() {
    // تصفير
    searchResultLocation = tempSearchObj.length ? 1 : 0;
    getItemSearchResult(searchResultLocation);
};

function renderSearchResultsUi() {
    // numbers
    let resultIndex = searchResultNumbers.querySelector('.wrapping .number1');
    let ofMark = searchResultNumbers.querySelector('.wrapping .ofMark');
    let resultLength = searchResultNumbers.querySelector('.wrapping .number2');

    // search name
    let domSearchName = searchResultNumbers.querySelector('.searchName');

    resultIndex.innerHTML = searchResultLocation;
    resultLength.innerHTML = tempSearchObj.length;

    // arrows
    let upSvg = searchResultArrows.querySelector('.upSvg');
    let downSvg = searchResultArrows.querySelector('.downSvg');

    upSvg.classList.remove('disabled');
    downSvg.classList.remove('disabled');
    if(searchResultLocation <= 1) {
        upSvg.classList.add('disabled');
    };
    if(searchResultLocation >= tempSearchObj.length) {
        downSvg.classList.add('disabled');
    };

    if(searchResultLocation == 0) {
        domSearchName.innerHTML = 'no result';
        domSearchName.classList.add('noResult')
    } else {
        domSearchName.innerHTML = tempSearchObj[searchResultLocation - 1].name;
        domSearchName.classList.remove('noResult')
    }


}; renderSearchResultsUi();

function goSearchNextOrBack(action) {
    if(action == 'up') {
        if(searchResultLocation > 1) {
            searchResultLocation --;
            getItemSearchResult(searchResultLocation);
        };
    } else if(action == 'down') {
        if(searchResultLocation < tempSearchObj.length) {
            searchResultLocation ++;
            getItemSearchResult(searchResultLocation);
        };
    };
    renderSearchResultsUi();

};


function getItemSearchResult(index) {
    if (!sidebarScrollViewPort) return;

    let location = searchResultLocation;

    dataSearchElements.forEach(dse => {
        dse.classList.remove('mark');
    });
    if(location == 0) return;

    let searchIndex = location - 1;
    
    let name = tempSearchObj[searchIndex].name;
    let element = tempSearchObj[searchIndex].element;
    let openWay = tempSearchObj[searchIndex].openWay;

    openWay.forEach(oe => {
        oe.classList.remove('close');
        oe.classList.add('open');
    });

    const viewportRect = sidebarScrollViewPort.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    let sidebarHeight = sidebarScrollViewPort.clientHeight;
    let sidebarOffset = sidebarHeight / 3;

    const offset = elementRect.top - viewportRect.top;

    sidebarScrollViewPort.scrollTop += offset - sidebarOffset;


    element.classList.add('mark');

};







