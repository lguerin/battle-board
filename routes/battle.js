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
		
		// TODO : refactor
		var getTeamsDivision1 = function(callback) {
			Team.getTeamsByDivisionId(req.body.division1, function(err, teams) {	
		    	if (err) return next(err);
		    	var items = {};
		    	_.each(teams, function(team) {
		    		items[team._id] = team;
				});
		    	callback(null, items);
		    });		
		};
		
		// TODO : refactor
		var getTeamsDivision2 = function(callback) {
			Team.getTeamsByDivisionId(req.body.division2, function(err, teams) {	
		    	if (err) return next(err);
		    	var items = {};
		    	_.each(teams, function(team) {
		    		items[team._id] = team;
				});
		    	callback(null, items);
		    });		
		};		
		
		// Render the response
		var resultHandler = function(err, result) {
			// TODO : BatteBuilder
			var division1 = result[0];
			var division2 = result[1];
			var battleKey = division1.key + "" + division2.key;
			var battleLabel = division1.label + " VS " + division2.label;
			var teams1 = result[2];
			var teams2 = result[3];
			
			var teams = _.extend(teams1, teams2);
			var divisions = {};
			divisions[division1._id] = division1;
			divisions[division2._id] = division2;
			// teams[division1._id] = teams1;
			// teams[division2._id] = teams2;
			
			console.log(JSON.stringify(teams, null, 2));
			
			var battle = new Battle({
				key: battleKey,
				label: battleLabel,
				duree: req.body.duree,
				teams: teams,
				divisions: divisions
			});
			battle.save(function(err){
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
	var scoreOffset = req.body.score;
	
	Battle.findById(id, function(err, battle) {
		if (err) return next(err);
		if (battle) {
			// TODO : methode updateScore dans schema
			var teams = {};
			_.extend(teams, battle.teams)
			teams[teamId].score = parseInt(teams[teamId].score) + parseInt(scoreOffset);
			
			battle.teams = teams;
			battle.markModified('teams');
			var list = _.sortBy(teams, 'name');

			battle.save(function (err, battle) {
				if(err) return next(err);
				console.log(">> Battle %s updated!", id);
				
				// TODO : creer un SocketUtils
				var io = app.get('io');
				io.of('/' + battle.id).emit('refresh_scores', battle);
				
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