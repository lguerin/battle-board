var Team = require('../models/schema').Team,
	Division = require('../models/schema').Division,
	Player = require('../models/schema').Player,
	BattleUtils = require('../lib/battleutils').BattleUtils,
	path = require('path'),
	fs = require('fs'),
	join = path.join,
	util = require('util'),
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
	
	// List of divisions
	var getDivision = function(callback) {
	    Division.listAll(function(err, items) {		
	    	if (err) return next(err);		
	    	callback(null, items);
	    });		
	};
	
	// List of players
	var getPlayers = function(callback) {
		Player.listAll(function(err, players) {
			if (err) return next(err);
			callback(null, players);
		});
	};
	
	// Render the response
	var resultHandler = function(err, result) {
		res.render(
				'admin/team/edit', {
					title: "Ajout d'une équipe",
					divisions: result[0],
					players: result[1],
			});
	};
	
	async.parallel([getDivision, getPlayers], resultHandler);
};

exports.submit = function(dir) {
	var players = [];
	return function(req, res, next) {
		var img = req.files.logo,
			name = req.body.name,
			division = req.body.division, 
			source = img.path,
			logo = BattleUtils.slug(img.name),
			dest = join(dir, logo),
			members = req.body.members;
		
		var is = fs.createReadStream(source);
		var os = fs.createWriteStream(dest);

		
		if (members && !_.isArray(members))
			players.push(members);
		else
			players = members;
		
		util.pump(is, os, function(err) {
			if (err) return next(err);
			fs.unlinkSync(source);
			var team = new Team({
				name: name,
				division: division,
				logo: logo,
				members: players
			});
			team.save(function(err){
				if (err) return next(err);
				res.redirect('admin/team');
			});
		});
	};
};