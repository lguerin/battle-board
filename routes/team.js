var Team = require('../models/schema').Team,
	Division = require('../models/schema').Division,
	Player = require('../models/schema').Player,
	Battle = require('../models/schema').Battle,
	async = require('async'),
	_ = require('underscore');

exports.list = function(req, res) {
	Team.find({}, function(err, teams) {
		if (err) return next(err);
		res.render(
			'admin/team/list', {
				title: "Equipes",
				teams: teams
		});
	})
	.populate('division')
	.populate('members');
};

exports.form = function(req, res) {
	var teamId = req.params.id;
	
	// List of divisions
	var getDivision = function(callback) {
	    Division.listAll(function(err, items) {		
	    	if (err) return next(err);		
	    	callback(null, items);
	    });		
	};
	
	// List of team players
	var getPlayers = function(callback) {
		var players = [];
		if (teamId) {
			
			Team.findById(teamId, function(err, team) {
				if (err) return next(err);
				players = team.members;
				callback(null, players);
			});
		}
		else {
			callback(null, players);
		}
	};

	var currentTeam = function(callback) {
		if (teamId) {
			Team.findById(teamId, function(err, team) {
				if (err) return next(err);
				callback(null, team);
			});
		}
		else {
			callback(null, null);
		}
	};
	
	// Render the response
	var resultHandler = function(err, result) {
		var current = result[2];
		var members = [];
		if (current) {
			members = _.pluck(current.members, '_id');
		}
		res.render(
				'admin/team/edit', {
					title: "Profil de l'équipe",
					divisions: result[0],
					currentPlayers: result[1],
					current: current,
					members: members,
					logo: (current && current.logo) || 'default.png'
			});
	};
	
	async.series([getDivision, getPlayers, currentTeam], resultHandler);
};

exports.submit = function() {
	return function(req, res, next) {
		var img = req.files.logo,
			name = req.body.name,
			division = req.body.division, 
			members = req.body.members;
		
		// Validate form
		req.assert('members', "Vous devez sélectionner au moins un joueur.").notNull();
		var errors = req.validationErrors();
		if (errors) {
			res.locals.errors = errors;
			exports.form(req, res);
			return;
		}
		
		var teamId = req.params.id;
		var players = _.union([], members);
		if (teamId) {
			Team.findById(teamId, function(err, team) {
				if (err) return next(err);
				team.update(name, division, img, players, function(err) {
					if (err) return next(err);
					res.redirect('admin/team');
				});
			});
		}
		else {
			Team.createTeam(name, division, img, players, function(err) {
				if (err) return next(err);
				res.redirect('admin/team');
			});
		}
	};
};

exports.remove = function(req, res) {
	var id = req.params.id;

	// TODO : verifier si pas de battle en cours
	
	Team.findById(id, function(err, team) {
		if (err) return next(err);
		team.remove(function (err, team) {
			if(err) return next(err);
			console.log(">> Team %s deleted!", id);
			res.redirect('admin/team');
		});
	});
};