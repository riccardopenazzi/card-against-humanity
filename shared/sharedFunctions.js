function isCardSpecial(card) {
    return Object.values(CardVariants).includes(card);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = { isCardSpecial };
} else {
	window.isCardSpecial = isCardSpecial;
}