var _ = require('underscore'),
	async = require('async'),
	config = require('config'),
	Battle = require('../models/schema').Battle;

var battles = [];

var BattleTimeManager = {
	start: function() {
		var getBattlesInProgress = function(callback) {
			Battle.findBattlesInProgress(function(err, list) {
				if (err) return next(err);
				battles = _.union(battles, _.pluck(list, '_id'));
				callback(null, battles);
			});
		};

		var period = 60 * 1000; // 1 minute
		var resultHandler = function(err, result) {		
			setInterval(function() {
				BattleTimeManager.refresh();
			},  period);
		};
		
		async.series([getBattlesInProgress], resultHandler);
	},
	
	refresh: function() {
		if (battles) {			
			_.each(battles, function(battleId) {
				Battle.findById(battleId, function(err, battle) {
					if (battle && battle.countdown > 0) {
						logger.debug("BattleTimeManager: trigger refresh for battle: %s", battle.id);						
						battle.countdown = battle.countdown - 1;
						if (_.contains([20, 40], battle.countdown)) {
							var io = app.get('io');
							io.of('/' + battle.id).emit('alarm');
						}
						battle.save();
					}
					else {
						battles = _.without(battles, battleId);
					}
				});
			});
		}
	},
	
	register: function(battleId) {
		battles.push(battleId);
	},
};

module.exports.BattleTimeManager = BattleTimeManager;