function showLoadingMask() {
    document.getElementById('loading-mask').classList.remove('hidden');
}

function hideLoadingMask() {
    document.getElementById('loading-mask').classList.add('hidden');
}

function isLoadingMaskVisible() {
    return !document.getElementById('loading-mask').classList.contains('hidden');
}

export { showLoadingMask, hideLoadingMask, isLoadingMaskVisible };