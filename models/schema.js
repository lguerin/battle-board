var crypto = require('crypto'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId,
	config = require('config');

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

TeamSchema.statics.getTeamsByDivisionId = function(id, fn) {
	this.find({division: id}, function(err, teams) {
		if (err) return fn(err);
		return fn(null, teams);
	}).populate('members');	
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
	'teams': Schema.Types.Mixed,
	'divisions': Schema.Types.Mixed,
	'done': {type: Boolean, default: false},
	'started': {type: Boolean, default: false}
});

BattleSchema.statics.findById = function(id, fn) {
	this.findOne({_id: id}, function(err, battle) {
        if (err) return fn(err);
        return fn(null, battle);
	});
};

// Export models
module.exports.Division = mongoose.model('Division', DivisionSchema);
module.exports.User = mongoose.model('User', UserSchema);
module.exports.Team = mongoose.model('Team', TeamSchema);
module.exports.Player = mongoose.model('Player', PlayerSchema);
module.exports.Battle = mongoose.model('Battle', BattleSchema);