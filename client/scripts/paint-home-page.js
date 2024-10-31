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
				<div class="col-8 col-lg-4" style="margin-top: 20vh;" id="btn-create-container">
					
				</div>
				<div class="col-2 col-lg-4"></div>
	
				<div class="col-2 col-lg-4"></div>
				<div class="col-8 col-lg-4 mt-5 text-center" id="input-game-code-container">
				
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
		</div>
		`;
		appDiv.innerHTML = homePageContent;

		resolve();
	});
}