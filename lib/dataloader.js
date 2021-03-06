var mongoose = require('mongoose'),
	config = require('config'),
	_ = require('underscore'),
	async = require('async');

var User = require('../models/schema').User;
var Division = require('../models/schema').Division;
var Player = require('../models/schema').Player;

var DataLoader = {
	
	populateDivisions: function(callback) {
		var divisions = [];
		divisions.push({key: 'SECTEUR_PUBLIC', label: 'Secteur Public'});
		divisions.push({key: 'INDUSTRIE_SERVICE', label: 'Industrie & Services'});
		mongoose.connection.collection('divisions').insert(divisions, {safe:true}, function(err, result) {
			console.log("Dataloader: default divisions loaded");
	        return callback(err, result);
	    });
	},
	
	populateAdminUser: function() {
		User.findByLogin('admin', function(err, user) {
			if (err) {
				throw new Error("Unable to populate Database");
			}

			// Create admin user
	        if (!user) {
	        	console.log("Dataloader: load default admin user");
	        	var admin = new User({
	        		login: 'admin',
	        		password: config.auth.default_admin_pass
	        	});
	        	admin.save(function(err) {
					if (err) throw err;
					console.log('admin user loaded.');
				});
	        }
		});		
	},
	
	populatePlayers: function() {
		var nbPlayers = 75;
		
		// List of divisions
		var getDivisions = function(callback) {
		    Division.listAll(function(err, items) {		
		    	if (err) return next(err);		
		    	callback(null, items);
		    });		
		};
		
		var players = [];
		var createPlayers = function(divisions, callback) {
			for (var i = 0; i < nbPlayers; i++) {
				var division = (i % 2 == 0 ? divisions[0] : divisions[1]);
				var player = {
					name: 'player' + i,
					photo: 'default.png',
					division: division._id
				};
				players.push(player);
			}
			
			app.get('db').collection('players', function(err, collection) {
		        collection.insert(players, {safe:true}, function(err, result) {
		        	callback(null, divisions, players);
		        });
		    });
			
		};
		
		// Render the response
		var resultHandler = function(err, result) {
			console.log("Database DEV loader done!");
		};
		
		async.waterfall([getDivisions, createPlayers], resultHandler);
	},
	
	populateDB: function() {
		var self = this;
		var env = process.env.NODE_ENV || 'development';
		this.populateAdminUser();
		this.populateDivisions(function(err) {
			if ('development' == env) {
				self.populatePlayers();
			}
		});
	}
};


module.exports.DataLoader = DataLoader;