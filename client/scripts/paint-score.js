export function paintScore() {
	const appDiv = document.getElementById('app');
	appDiv.innerHTML = '';
	const scoreContent = `
		<div class="container">
            <div class="row text-center" id="score-row">
                <h1 class="new-amsterdam-regular mb-3">Classifica</h1>
                <div class="col-2"></div>
                <div class="col-8">
                    <p id="player-counter"></p>
                </div>
                <div class="col-2 mb-5"></div>
                <div class="col-6 mt-4"><strong>Giocatore</strong></div>
                <div class="col-6 mt-4"><strong>Punteggio</strong></div>
            </div>
        </div>
        <div id="disconnection-popup" class="popup hidden">
            <div class="popup-content">
                <span id="popup-title">Sembra ci siano problemi di connessione con un giocatore</span>
                <img src="https://media.giphy.com/media/OiC5BKaPVLl60/giphy.gif?cid=ecf05e47avto77shpr5vhk8ateikqaguawydman3r2hz8gt0&ep=v1_gifs_search&rid=giphy.gif&ct=g" alt="Loading..." style="max-width: 100%; height: auto;">
                <span id="popup-paragraph">Ciò è dovuto al fatto che stiamo utilizzando un server gratis, non è colpa tua e nemmeno dello sviluppatore, tocca adattarsi purtroppo</span>
            </div>
        </div>
        <div id="single-disconnection-popup" class="popup hidden">
            <div class="popup-content">
                <span id="popup-title">Sembra tu abbia problemi di connessione</span>
                <img src="https://media.giphy.com/media/H7wajFPnZGdRWaQeu0/giphy.gif?cid=790b7611oaqn9tr6bho1x95ydl3rqee2vvynfiy66g2jd0nr&ep=v1_gifs_search&rid=giphy.gif&ct=g" alt="Loading..." style="max-width: 100%; height: auto;">
                <span id="popup-paragraph">Ciò è dovuto al fatto che stiamo utilizzando un server gratis, tranquill* se tutto si risolve tornerai in partita</span>
            </div>
        </div>
	`;
	appDiv.innerHTML = scoreContent;
}