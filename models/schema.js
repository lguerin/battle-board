var crypto = require('crypto'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId,
	config = require('config'),
	_ = require('underscore'),
	BattleUtils = require('../lib/battleutils').BattleUtils;

/**
* Division Model
*/
var DivisionSchema = new Schema({
	'key': {type: String, index: {unique: true}},
	'label': {type: String, required: true}
});

DivisionSchema.statics.findByKey = function(key, fn) {
	this.findOne({ key: key }, function(err, division) {
        if (err) return fn(err);
        if (!division) {
            return fn(null, null, "Division inconnue");
        }
        return fn(null, division);
	});
};

DivisionSchema.statics.findById = function(id, fn) {
	this.findOne({_id: id}, function(err, division) {
        if (err) return fn(err);
        return fn(null, division);
	});
};

DivisionSchema.statics.listAll = function(fn) {
	this.find({}, function(err, divisions) {
		if (err) return fn(err);
		return fn(null, divisions);
	});	
};

DivisionSchema.statics.createDivision = function(key, label, fn) {
	this.create({
		key: key,
		label: label
	}, function(err, division){
		return fn(err, division);
	});	
};

/**
* User Model
*/

var UserSchema = new Schema({
	'login': {type: String, index: {unique: true}},
	'password': String
});

var FAILURE_TYPE = UserSchema.statics.failedAuth = {
    NOT_FOUND: "Utilisateur inconnu.",
    PASSWORD_INCORRECT: "Le mot de passe est incorrect."
};

UserSchema.method('encryptPassword', function(plainText) {
	return crypto.createHmac('sha1', config.auth.salt).update(plainText).digest('hex');
});

UserSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) return next();
    var hash = this.encryptPassword(this.password);
    // override cleartext password with the hashed one
    user.password = hash;
    next();
});

UserSchema.statics.findByLogin = function(login, fn) {
	this.findOne({ login: login }, function(err, user) {
        if (err) return fn(err);

        // make sure the user exists
        if (!user) {
            return fn(null, null, FAILURE_TYPE.NOT_FOUND);
        }
        return fn(null, user);
	});
};

UserSchema.statics.authenticate = function(login, password, fn) {
	
	this.findByLogin(login, function(err, user) {
		if (err) return fn(err);

        // make sure the user exists
        if (!user) {
            return fn(null, null, FAILURE_TYPE.NOT_FOUND);
        }

        var isMatch = (user.encryptPassword(password) === user.password);
        if (!isMatch) {
        	return fn(null, null, FAILURE_TYPE.PASSWORD_INCORRECT);
        }
        
        // Auth ok !
        return fn(null, user);
	});
};

/**
* Team Model
*/

var TeamSchema = new Schema({
	'name': {type: String, index: {unique: true}},
	'division': {type: ObjectId, ref: 'Division'}, 
	'logo': String,
	'members': [{type: ObjectId, ref: 'Player'}],
	'score': {type: Number, default: 0}
});

TeamSchema.statics.findByName = function(name, fn) {
	this.findOne({name: name}, function(err, team) {
        if (err) return fn(err);
        return fn(null, team);
	});
};

TeamSchema.statics.findById = function(id, fn) {
	this.findOne({_id: id}, function(err, team) {
        if (err) return fn(err);
        return fn(null, team);
	}).populate('members');
};

TeamSchema.statics.getTeamsByDivisionId = function(id, fn) {
	this.find({division: id}, function(err, teams) {
		if (err) return fn(err);
    	var items = {};
    	_.each(teams, function(team) {
    		items[team._id] = team;
		});
		return fn(null, items);
	}).populate('members');	
};

TeamSchema.methods.update = function(name, divisionId, img, players, fn) {
	this.name = name;
	this.division = divisionId;
	this.members = players;
	var self = this;
	if (img.name) {
		var logo = BattleUtils.slug(img.name) || 'default.png';
		this.logo = logo;
		BattleUtils.copyImage(img, function(err) {
			if (err) return next(err);
			self.save(function (err, self) {
				return fn(err, self);
			});
		});
	}	
	else {
		this.save(function (err, self) {
			return fn(err, self);
		});
	}
};

TeamSchema.statics.createTeam = function(name, divisionId, img, players, fn) {
	var logo = BattleUtils.slug(img.name) || 'default.png';
	var self = this;
	BattleUtils.copyImage(img, function(err) {
		if (err) return next(err);
		self.create({
			name: name,
			division: divisionId,
			logo: logo,
			members: players
		}, function(err){
			return fn(err);
		});	
	});	
};

/**
* Player Model
*/

var PlayerSchema = new Schema({
	'name': {type: String, index: {unique: true}},
	'division': {type: ObjectId, ref: 'Division'},
	'photo': String
});

PlayerSchema.statics.findByName = function(name, fn) {
	this.findOne({name: name}, function(err, player) {
        if (err) return fn(err);
        return fn(null, player);
	});
};

PlayerSchema.statics.findById = function(id, fn) {
	this.findOne({_id: id}, function(err, player) {
        if (err) return fn(err);
        return fn(null, player);
	});
};

PlayerSchema.statics.createPlayer = function(name, divisionId, img, fn) {
	var self = this;
	var photo = BattleUtils.slug(img.name) || 'default.png';
	BattleUtils.copyImage(img, function(err) {
		if (err) return next(err);
		self.create({
			name: name,
			division: divisionId,
			photo: photo
		}, function(err){
			return fn(err);
		});	
	});
};


PlayerSchema.methods.update = function(name, divisionId, img, fn) {
	this.name = name;
	this.division = divisionId;
	var self = this;
	if (img.name) {
		var photo = BattleUtils.slug(img.name) || 'default.png';
		this.photo = photo;
		BattleUtils.copyImage(img, function(err) {
			if (err) return next(err);
			self.save(function (err, self) {
				return fn(err, self);
			});
		});
	}
	else {
		this.save(function (err, self) {
			return fn(err, self);
		});
	}
};

PlayerSchema.statics.getPlayersByDivisionId = function(divisionId, fn) {
	this.find({division: divisionId}, function(err, players) {
        if (err) return fn(err);
        return fn(null, players);
	});
};

PlayerSchema.statics.listAll = function(fn) {
	this.find({}, function(err, players) {
		if (err) return fn(err);
		return fn(null, players);
	});	
};

/**
* Battle Model
*/

var BattleSchema = new Schema({
	'key': String,
	'created': { type: Date, default: Date.now},
	'label': String,
	'duree': {type: Number, min: 0, max: 120}, 
	'countdown': Number, 
	'teams': Schema.Types.Mixed,
	'divisions': Schema.Types.Mixed,
	'started': {type: Boolean, default: false}
});

BattleSchema.methods.updateScore = function(teamId, points, fn) {
	var teams = {};
	_.extend(teams, this.teams)
	teams[teamId].score = parseInt(teams[teamId].score) + parseInt(points);
	this.teams = teams;
	this.markModified('teams');
	var self = this;
	this.save(function (err, self) {
		return fn(err, self);
	});
};

BattleSchema.statics.findById = function(id, fn) {
	this.findOne({_id: id}, function(err, battle) {
        if (err) return fn(err);
        return fn(null, battle);
	});
};

BattleSchema.statics.isValid = function(division1, division2, fn) {
	var battleKey = division1.key + "" + division2.key;
	this.findOne({key: battleKey, countdown: {$gt: 0}}, function(err, battle) {
        if (err) return fn(err);
        if (battle) {
        	return fn(null, battle, "Cette battle est déjà en cours !");
        }
        return fn(null, null, null);
	});
};

BattleSchema.statics.createBattle = function(division1, division2, duree, teams, fn) {
	var battleKey = division1.key + "" + division2.key;
	var battleLabel = division1.label + " VS " + division2.label;
	var divisions = {};
	divisions[division1._id] = division1;
	divisions[division2._id] = division2;

	this.create({
		key: battleKey,
		label: battleLabel,
		duree: duree,
		countdown: duree,
		teams: teams,
		divisions: divisions,
		started: true
	}, function(err, battle){
		return fn(err, battle);
	});	
};

BattleSchema.statics.findBattlesInProgress = function(fn) {
	this.find({started: true, countdown: {$gt: 0}}, function(err, battles) {
		if (err) return fn(err);
		return fn(null, battles);
	});	
};

/**
* HistoItem Model
*/

var HistoScoreSchema = new Schema({
	'battleId': {type: ObjectId, ref: 'Battle'},
	'login': String,
	'teamName': String,
	'points': Number,
	'created': { type: Date, default: Date.now}
});

HistoScoreSchema.statics.findByBattleId = function(battleId, fn) {
	this.find({battleId: battleId}, function(err, scores) {
        if (err) return fn(err);
        return fn(null, scores);
	});
}

// Export models
module.exports.Division = mongoose.model('Division', DivisionSchema);
module.exports.User = mongoose.model('User', UserSchema);
module.exports.Team = mongoose.model('Team', TeamSchema);
module.exports.Player = mongoose.model('Player', PlayerSchema);
module.exports.Battle = mongoose.model('Battle', BattleSchema);
module.exports.HistoScore = mongoose.model('HistoScore', HistoScoreSchema);