var Player = require('../models/schema').Player,
	Division = require('../models/schema').Division,
	BattleUtils = require('../lib/battleutils').BattleUtils,
	path = require('path'),
	fs = require('fs'),
	join = path.join,
	util = require('util'),
	async = require('async');

exports.list = function(req, res) {
	Player.find({}, function(err, players) {
		if (err) return next(err);
		res.render(
			'admin/player/list', {
				title: "Liste des joueurs",
				players: players
		});
	})
	.populate('division');
};

exports.form = function(req, res) {
	var id = req.params.id;
	
	// List of divisions
	var getDivision = function(callback) {
	    Division.listAll(function(err, items) {		
	    	if (err) return next(err);		
	    	callback(null, items);
	    });		
	};
	
	// Get the player if id param provided
	var getPlayer = function(callback) {
		if (id) {
			Player.findById(id, function(err, player) {		
		    	if (err) return next(err);		
		    	callback(null, player);
		    });		
		}
		else {
			callback(null, null);
		}
	};
	
	// Render the response
	var resultHandler = function(err, result) {
	   	res.render(
			'admin/player/edit', {
				title: "Détail d'un joueur",
				divisions: result[0],
				player: result[1]
    	});
	};
	
	async.parallel([getDivision, getPlayer], resultHandler);
	
};

exports.submit = function(dir) {
	return function(req, res, next) {
		var img = req.files.photo,
			name = req.body.name,
			division = req.body.division, 
			source = img.path,
			photo = BattleUtils.slug(img.name) || 'default.png',
			dest = join(dir, photo);
		
		var is = fs.createReadStream(source);
		var os = fs.createWriteStream(dest);

		util.pump(is, os, function(err) {
			if (err) return next(err);
			fs.unlinkSync(source);
			var player = new Player({
				name: name,
				division: division,
				photo: photo
			});
			player.save(function(err){
				if (err) return next(err);
				res.redirect('admin/player');
			});
		});
	};
};

exports.remove = function(req, res) {
	var id = req.params.id;
	Player.findByIdAndRemove(id, function(err) {
		if (err) return next(err);
		console.log(">> Player %s deleted!", id);
		res.redirect('admin/player');
	});
};