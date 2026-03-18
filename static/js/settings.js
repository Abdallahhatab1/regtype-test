
// let options = document.querySelectorAll(".settings_container .option");
// let mainSettingsContainer = document.querySelector('body > .container');


// init function
function initSettingsMainTools() {

    let arrowUpContainer = document.querySelector('.settings_container .arrow_up_container');
    // show loader in page start
    showLoader(1, '0', '0', '50vh - 55px', '50% - 55px', 10, 0);


    // show & hide scroll 
    const showScrollTopAt = 1000;
    const hideScrollTopAt = 900;
    window.addEventListener('scroll', () => {
        if (window.scrollY > showScrollTopAt) {
            arrowUpContainer.classList.add('show');
        } else if (window.scrollY < hideScrollTopAt) {
            arrowUpContainer.classList.remove('show');
        }
    });
    arrowUpContainer.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    // end show & hide scroll 


    // for open and close sections
    let title = document.querySelectorAll('.settings_container .option > .title')
    let contents = document.querySelectorAll('.settings_container .option .content')

    let canTransition = true;
    for(let i = 0; i < title.length; i++) {
        title[i].querySelector('.arrow svg').classList.add('close');
        contents[i].classList.add('close');

        contents[i].style.height = '0px';
    }

    title.forEach((item, i) => {

        item.addEventListener("click", () => {
            if(canTransition == false) return;

            canTransition = false;
            let svg = item.querySelector('.arrow svg');

            if(svg.classList.contains('open')) {
                svg.classList.remove('open');
                svg.classList.add('close');

                contents[i].classList.remove('open');
                contents[i].classList.add('close');

                contents[i].style.height = contents[i].scrollHeight+'px';
                setTimeout(() => {
                    contents[i].style.height = '0px';                 
                }, 50);

                    
            } else {
                svg.classList.remove('close');
                svg.classList.add('open');

                contents[i].classList.remove('close');
                contents[i].classList.add('open');

                contents[i].style.height = contents[i].scrollHeight+'px';
                setTimeout(() => {
                    contents[i].style.height = 'fit-content';                 
                }, 200);

            };

        
            window.addEventListener('transitionend', () => {
                canTransition = true;
            }, {once: true});

        });
    });
    // end for open and close sections

}; initSettingsMainTools();


// after dom loaded
window.addEventListener('DOMContentLoaded', async () => { 
    hideLoader();
});



// function getHourDegree(firstHour, secondHour) {

//     // ex
//     h = '6:00';

//     const minutesInHour = 60;
//     const RoundsInVals = 360 / 4;
//     const DPM = (RoundsInVals / minutesInHour)

//     let f = ((+h.split(':')[0] * 60) + +h.split(':')[1]) / 2;

//     console.log(f)


// }; getHourDegree();









