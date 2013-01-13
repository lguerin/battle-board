var Team = require('../models/schema').Team,
	Division = require('../models/schema').Division,
	Player = require('../models/schema').Player,
	async = require('async'),
	_ = require('underscore');

exports.playersByDivision = function(req, res, next) {
	var divisionId = req.params.divisionId;
	Player.getPlayersByDivisionId(divisionId, function(err, players) {
		if (err) return next(err);
		res.json({players:players});
	});
};