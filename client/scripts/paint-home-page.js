export function paintHomePage() {
	return new Promise((resolve, reject) => {
		const appDiv = document.getElementById('app');
		if (!appDiv) {
            reject('app not found');
            return;
        }
		
		appDiv.innerHTML = '';
		const homePageContent = `
			<div class="container-fluid mt-2 text-center">
				<div class="row text-center">
					<h1 class="new-amsterdam-regular text-center" id="title">Card against humanity</h1>

					<div class="col-2 col-lg-4"></div>
					<div class="col-8 col-lg-4" style="margin-top: 10vh;">
						<p id="btn-tutorial" class="btn btn-primary">Avvia il tutorial</p>
					</div>
					<div class="col-2 col-lg-4"></div>

					<div class="col-2 col-lg-4"></div>
					<div class="col-8 col-lg-4 mt-5" id="btn-create-container">
						
					</div>
					<div class="col-2 col-lg-4"></div>
		
					<div class="col-2 col-lg-4"></div>
					<div class="col-8 col-lg-4 mt-5 text-center" id="input-game-code-container">
						<div class="label-game-code">Inserisci il codice della stanza</div>
					</div>
					<div class="col-2 col-lg-4"></div>
		
					<div class="col-2 col-lg-4"></div>
					<div class="col-8 col-lg-4 mt-2" id="btn-join-container">

					</div>
					<div class="col-2 col-lg-4"></div>
		
					<div class="col-2 col-lg-4"></div>
					<div class="col-8 col-lg-4 mt-2">
						<p id="show-error"></p>
					</div>
					<div class="col-2 col-lg-4"></div>
				</div>
				<div id="info-popup" class="popup hidden">
					<div class="popup-content">
						<div id="popup-title">!DISCLAIMER!</div>
						<div id="popup-info-paragraph">Il gioco è ancora in beta, potrebbe avere ancora qualche bug, evita di ricaricare la pagina, soprattutto nella waiting-room, e ricorda di non chiudere il browser, altrimenti potresti essere disconnesso</div>
						
					</div>
				</div>
			</div>
		`;
		appDiv.innerHTML = homePageContent;

		resolve();
	});
}