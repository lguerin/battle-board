var Division = require('../models/schema').Division,
	Team = require('../models/schema').Team,
	Battle = require('../models/schema').Battle,
	async = require('async'),
	_ = require('underscore');

exports.view = function(req, res) {
	var id = req.params.id;
	
	// Get the current battle
	var getBattle = function(callback) {
	    Battle.findById(id, function(err, battle) {		
	    	if (err) return next(err);		
	    	callback(null, battle);
	    });		
	};
	
	// Render the response
	var resultHandler = function(err, result) {		
		var battle = result[0];
		// TODO : creer un SocketUtils
		var io = app.get('io');
		io.of('/' + battle.id).on('connection', function(socket) {
			socket.emit('init_battle', battle);
			
			socket.on('disconnect', function() {
				console.log('Client Disconnected.');
			});
		});
		
		var divisions = _.values(battle.divisions).reverse();
		
	   	res.render(
			'battle/view', {
				title: battle.label,
				battle: battle,
				user: req.user,
				division1: divisions[0],
				division2: divisions[1]
    	});
	   	
	};
	
	async.parallel([getBattle], resultHandler);
};

exports.list = function(req, res) {
	Battle.find({}, function(err, battles) {
		if (err) return next(err);
		res.render(
			'admin/battle/list', {
				title: "Liste des Battles",
				battles: battles
		});
	});
};

exports.form = function(req, res) {
	
	// List of divisions
	var getDivisions = function(callback) {
	    Division.listAll(function(err, items) {		
	    	if (err) return next(err);		
	    	callback(null, items);
	    });		
	};
	
	// Render the response
	var resultHandler = function(err, result) {
	   	res.render(
			'admin/battle/add', {
				title: "Créer une Battle",
				divisions: result[0],
				divisions2: _.clone(result[0]).reverse()
    	});
	};
	
	async.parallel([getDivisions], resultHandler);
	
};

exports.submit = function(req, res, next) {
		var getDivision1 = function(callback) {
		    Division.findById(req.body.division1, function(err, division) {	
		    	if (err) return next(err);
		    	callback(null, division);
		    });		
		};
		
		var getDivision2 = function(callback) {
		    Division.findById(req.body.division2, function(err, division) {	
		    	if (err) return next(err);
		    	callback(null, division);
		    });		
		};		
		
		var getTeamsDivision1 = function(callback) {
			Team.getTeamsByDivisionId(req.body.division1, function(err, teams) {	
		    	if (err) return next(err);
		    	callback(null, teams);
		    });		
		};
		
		var getTeamsDivision2 = function(callback) {
			Team.getTeamsByDivisionId(req.body.division2, function(err, teams) {	
		    	if (err) return next(err);
		    	callback(null, teams);
		    });		
		};		
		
		// Render the response
		var resultHandler = function(err, result) {
			// TODO : BatteBuilder
			Battle.createBattle(result[0], result[1], req.body.duree, _.extend(result[2], result[3]), function() {
				if (err) return next(err);
				res.redirect('admin/battle');
			});
		};
		
		async.parallel([getDivision1, getDivision2, getTeamsDivision1, getTeamsDivision2], 
				resultHandler);
};

exports.remove = function(req, res) {
	var id = req.params.id;
	Battle.findById(id, function(err, battle) {
		if (err) return next(err);
		 battle.remove(function (err, battle) {
			 if(err) return next(err);
			 console.log(">> Battle %s deleted!", id);
			 res.redirect('admin/battle');
		});
	});
};

exports.score = function(req, res) {
	var id = req.params.id;
	Battle.findById(id, function(err, battle) {
		if (err) return next(err);
		
		var teams = _.values(battle.teams);
		teams = _.sortBy(teams, "name");
		
		res.render(
			'admin/battle/score', {
				title: "Scores de la Battle",
				battle: battle,
				teams: teams
    	});
	});
};

exports.updateBattle = function(req, res, next) {
	var id = req.params.id;
	var teamId = req.body.team;
	var points = req.body.score;
	
	Battle.findById(id, function(err, battle) {
		if (err) return next(err);
		if (battle) {
			battle.updateScore(teamId, points, function(err, battle) {
				if(err) return next(err);
				console.log(">> Battle %s updated!", id);
				// TODO : creer un SocketUtils
				var io = app.get('io');
				io.of('/' + battle.id).emit('refresh_scores', battle);
				var list = _.sortBy(battle.teams, 'name');
				res.render(
						'admin/battle/score', {
							title: "Scores de la Battle",
							battle: battle,
							teams: list
			    });
			});
		}
	});
};