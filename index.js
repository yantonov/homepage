function switchLang() {
    let element = document.getElementsByClassName('lang')[0];
    window.location.href = element.href;
}

function initPage() {
    window.addEventListener("keydown", (event) => {
        if (window.location.href.includes("debug")) {
            console.log(event.key);
        }
        if (event.ctrlKey && (event.key == 'ArrowRight' || event.key == 'ArrowLeft')) {
            switchLang();
        }
    });
}

initPage();
