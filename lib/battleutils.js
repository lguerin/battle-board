var BattleUtils = {
	slug: function(str) {
		return str
			.replace(/ +/g, '-')
			.replace(/[^a-zA-Z_0-9-\.]/g, '')
			.toLowerCase();
	},
	
	formattedDate: function(dateStr) {
		var date = new Date(dateStr);
		var months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
		var day = date.getDate();
		if (day < 10)
		{
			day = "0" + day;	
		}
		var output = day + " " + months[date.getMonth()] + " " + date.getFullYear();
		return output;
	}
};

module.exports.BattleUtils = BattleUtils;