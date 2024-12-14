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
                <h1 class="new-amsterdam-regular text-center mt-3 mb-5" id="title">Impostazioni partita</h1>
                <div class="col-12">
                    <p class="new-amsterdam-regular" id="p-cards-number">Carte per ogni giocatore</p>
                    
                    <span id="player-cards-value"></span>
                    <p id="cards-explanation">Min: 4 | Max: 12</p>
        
                    <p class="new-amsterdam-regular" id="p-win-number">Vittorie necessarie per terminare la partita</p>
                    
                    <span id="win-number-value"></span>
                    <p id="wins-explanation">Min: 2 | Max: 20</p>
        
                    <input type="checkbox" id="white-card-mode" class="mt-4">
                    <label for="white-card-mode">Modalità carta bianca</label>
                    <i class="bi bi-question-circle ms-2" data-bs-toggle="tooltip" data-bs-placement="right" title="La modalità carta bianca consente ai giocatori di avere una carta senza testo personalizzabile da utilizzare una sola volta nella partita."></i>
        
                    <div class="mt-5" id="btn-confirm-settings-container">
                        
                    </div>
        
                </div>
                <div id="info-popup" class="popup hidden">
                    <div class="popup-content">
                        <div id="popup-title">!DISCLAIMER!</div>
                        <div id="popup-info-paragraph">Il gioco è ancora in beta, potrebbe avere ancora qualche bug, evita di ricaricare la pagina, soprattutto nella waiting-room, e ricorda di non chiudere il browser, altrimenti potresti essere disconnesso</div>
                        
                    </div>
                </div>
            </div>
        `;
        appDiv.innerHTML = settingsPageContent;

        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltipTriggerEl) => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });

		resolve();
	});
}