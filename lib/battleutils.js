var path = require('path'),
	fs = require('fs'),
	util = require('util'),
	join = path.join;

var BattleUtils = {
	slug: function(str) {
		return str
			.replace(/ +/g, '-')
			.replace(/[^a-zA-Z_0-9-\.]/g, '')
			.toLowerCase();
	},
	
	formattedDate: function(dateStr, withTime) {
		var date = new Date(dateStr),
			months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
			day = date.getDate(),
			withTime = withTime || false;
		if (day < 10)
		{
			day = "0" + day;	
		}
		var output = day + " " + months[date.getMonth()] + " " + date.getFullYear();
		if(withTime) {
			output = output + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
		}
		return output;
	},
	
	copyImage: function(img, fn) {
		if (img.name) {
			var source = img.path,
				dir = app.get('photos'),
				logo = BattleUtils.slug(img.name) || 'default.png',
				dest = join(dir, logo);
			if (logo == 'default.png')
				source = dest;
			var	is = fs.createReadStream(source),
				os = fs.createWriteStream(dest);
			util.pump(is, os, function(err) {
				if (err) return next(err);
				fs.unlinkSync(source);
				fn(err);
			});
		}
		else {
			fn(null);
		}
	}
};

module.exports.BattleUtils = BattleUtils;