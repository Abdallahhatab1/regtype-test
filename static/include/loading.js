

const loading_container = document.querySelector('.loading_container');
let loaderOverlay = document.querySelector('.loaderOverlay')
const squares = document.querySelectorAll('.loading_container .container > *');


const loading_line = document.querySelector('.loadingLineContainer .loadingLine')


function showLoader(scale = 1, x='0', y='0', top='0', left='0', zIndex=10, margin='auto') {
    loading_container.style.visibility = 'visible';

    document.documentElement.style.overflow = 'hidden'

    loading_container.style.transform = `scale(${scale})`;
    loading_container.style.transform = `translate(calc(${x}), calc(${y})`;
    
    loading_container.style.top = `calc(${top})`;
    loading_container.style.left = `calc(${left})`;
    
    loading_container.style.zIndex = zIndex;
    loading_container.style.margin = `auto`;

    for (let i = 0; i < squares.length; i++) {
        let s = squares[i];
        s.classList.remove('animation');
        void s.offsetWidth; // force reflow
        s.classList.add('animation');
    }
}

function hideLoader() {
    loading_container.style.visibility = 'hidden';
    document.documentElement.style.overflow = '';
    loaderOverlay.style.visibility = 'hidden';

    for (let i = 0; i < squares.length; i++) {
            squares[i].classList.remove('animation');
        }
        finished = 0; // إعادة ضبط العداد  

        window.scroll({top: 0}) 
}

// عدد المربعات التي أنهت الانيميشن
let finished = 0;
let rounds = 12;

// إضافة حدث animationend لكل مربع
for (let i = 0; i < squares.length; i++) {
    let s = squares[i];
    s.addEventListener('animationend', () => {
        finished++;
        if (finished == rounds) {
            finished = 0;
            showLoader(); // إعادة تشغيل الدورة
        }
    });
}


function showLoaderLine(width) {
    loading_line.style.visibility = 'visible';
    loading_line.style.transform = `scaleX(${width / 100})`;

    if(width == 100) {
        setTimeout(() => {
            loading_line.style.visibility = 'hidden';
            loading_line.style.transform = `scaleX(${0})`
        }, 600)
    }
}