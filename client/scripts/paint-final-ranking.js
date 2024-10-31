export function paintFinalRanking() {
    return new Promise((resolve, reject) => {
		const appDiv = document.getElementById('app');
		if (!appDiv) {
            reject('app not found');
            return;
        }

        appDiv.innerHTML = '';
        const finalRankingContent = `
            <div class="container-fluid">
                <div class="row text-center">
                    <h1 class="new-amsterdam-regular mt-3">Classifica finale</h1>
                </div>
                <div id="ranking-container" class="container"></div>
                <div class="col-12 flex-column d-flex align-items-center" id="btn-exit-container">
                    
                </div>
            </div>
        `;
        appDiv.innerHTML = finalRankingContent;

		resolve();
	});
}