export function paintWaitingRoom() {
    return new Promise((resolve, reject) => {
		const appDiv = document.getElementById('app');
		if (!appDiv) {
            reject('app not found');
            return;
        }

        appDiv.innerHTML = '';
        const waitingRoomContent = `
            <div class="container-fluid mt-2 text-center"></div>
            <div class="row text-center" id="main-row">
                <h1 class="new-amsterdam-regular text-center" id="title">Card against humanity</h1>
                <p id="show-error"></p>
                <p id="player-username"></p>
                <p id="game-stats"></p>
                <div class="col-2 col-lg-4"></div>
                <div class="col-8 col-lg-4 mt-5">
                    <form>
                        <label for="txt-username" class="form-label text-start d-block fst-italic">Username: </label>
                        <input type="text" class="form-control w-100 mx-auto" id="txt-username" placeholder="Es: Peffò">
                        <button class="new-amsterdam-regular btn-confirm-username w-100 mt-2" id="btn-confirm-username" disabled>Conferma</button>
                    </form>
                </div>
                <div class="col-2 col-lg-4"></div>
    
                <div class="col-2 col-lg-4"></div>
                <div class="col-8 col-lg-4 mt-5" id="players-list"></div>
                <div class="col-2 col-lg-4"></div>
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
        appDiv.innerHTML = waitingRoomContent;

		resolve();
	});
}