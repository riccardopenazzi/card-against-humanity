export function paintSettingsPage() {
    return new Promise((resolve, reject) => {
		const appDiv = document.getElementById('app');
		if (!appDiv) {
            reject('app not found');
            return;
        }

        appDiv.innerHTML = '';
        const settingsPageContent = `
            <div class="row text-center">
            <h1 class="new-amsterdam-regular text-center mt-3 mb-5">Impostazioni partita</h1>
            <div class="col-12">
                <p class="new-amsterdam-regular">Carte per ogni giocatore</p>
                <input type="range" class="form-range px-3" min="4" max="12" id="player-cards-range">
                <span id="player-cards-value"></span>
                <p>Min: 4 | Max: 12</p>
    
                <p class="new-amsterdam-regular">Vittorie necessarie per terminare la partita</p>
                <input type="range" class="form-range px-3" min="3" max="20" id="win-number-range">
                <span id="win-number-value"></span>
                <p>Min: 3 | Max: 20</p>
    
                <input type="checkbox" id="white-card-mode" class="mt-4">
                <label for="white-card-mode">Modalità carta bianca</label>
                <i class="bi bi-question-circle ms-2" data-bs-toggle="tooltip" data-bs-placement="right" title="La modalità carta bianca consente ai giocatori di avere una carta senza testo personalizzabile da utilizzare una sola volta nella partita."></i>
    
                <div class="mt-5">
                    <button id="btn-confirm-settings" class="btn-confirm-settings new-amsterdam-regular">Conferma impostazioni</button>
                </div>
    
            </div>
        </div>
        `;
        appDiv.innerHTML = settingsPageContent;

		resolve();
	});
}