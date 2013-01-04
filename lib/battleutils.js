var BattleUtils = {
	slug: function(str) {
		return str
			.replace(/ +/g, '-')
			.replace(/[^a-zA-Z_0-9-\.]/g, '')
			.toLowerCase();
	}
};

module.exports.BattleUtils = BattleUtils;