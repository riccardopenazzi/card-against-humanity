export function paintPlayingRoom() {
    return new Promise((resolve, reject) => {
        const appDiv = document.getElementById('app');
        if (!appDiv) {
            reject('app not found');
            return;
        }
        appDiv.innerHTML = '';
        /* I pulsanti per 'prossima carta' e 'vai alla scelta vincitore' sono inseriti da js dopo il div 'single-card-frame' */
        const playingRoomContent = `
            <div class="row text-center">
            <h1 class="new-amsterdam-regular text-center mt-3 mb-3" id="title">Manche </h1>
            <div class="col-12" id="main-frame">
                
                <div class="row">
                    <div class="col-12">
                        <div id="standard-frame">
                            <p class="shadows-into-light-regular">La frase da completare è:</p>
                            <p id="black-card" class="poetsen-one-regular"></p>
                        </div>
                        <div id="frame" class="mt-2"></div>
                        <div id="skip-card-frame">
                            <div class="flex-column d-flex align-items-center" id="internal-skip-card-frame">
    
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12 d-flex flex-column align-items-center">
                <div id="single-card-frame"></div>
                
                <button class="btn-show-choose-winner new-amsterdam-regular mt-2" id="btn-show-choose-winner" style="display: none;">Vai alla scelta vincitore</button>
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
        <div class="modal" tabindex="-1" id="popup-score">
            <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content">
                    <div class="modal-header">
                          <h5 class="modal-title text-dark">Classifica</h5>
                          <button type="button" id="btn-popup-score-close" class="btn-close" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="popup-score-body">
                    </div>
                  </div>
            </div>
        </div>
        `; 
        appDiv.innerHTML = playingRoomContent;
        resolve();
    });
}