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
				<h1 class="new-amsterdam-regular text-center">Card against humanity</h1>
				<div class="col-2 col-lg-4"></div>
				<div class="col-8 col-lg-4" style="margin-top: 20vh;">
					<button id="btn-create-game" class="btn-create-game w-100 new-amsterdam-regular">Crea una stanza</button>
				</div>
				<div class="col-2 col-lg-4"></div>
	
				<div class="col-2 col-lg-4"></div>
				<div class="col-8 col-lg-4 mt-5 text-center">
					<input type="text" class="form-control w-100 mx-auto mt-2" placeholder="Codice stanza" id="txt-game-code">
				</div>
				<div class="col-2 col-lg-4"></div>
	
				<div class="col-2 col-lg-4"></div>
				<div class="col-8 col-lg-4 mt-2">
					<button id="btn-join-game" class="btn-join-game w-100 new-amsterdam-regular" disabled>Entra in una stanza</button>
				</div>
				<div class="col-2 col-lg-4"></div>
	
				<div class="col-2 col-lg-4"></div>
				<div class="col-8 col-lg-4 mt-2">
					<p id="show-error"></p>
				</div>
				<div class="col-2 col-lg-4"></div>
			</div>
		</div>
		`;
		appDiv.innerHTML = homePageContent;

		resolve();
	});
}