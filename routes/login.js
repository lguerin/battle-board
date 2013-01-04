var User = require('../models/schema').User;

exports.form = function(req, res) {
	res.render('login', {
		title : 'Connexion'
	});
};

exports.submit = function(req, res, next) {
	var data = req.body.user;
	User.authenticate(data.login, data.password, function(err, user, reason) {
		if (err)
			return next(err);
	    // login was successful if we have a user
	    if (user) {
	        // handle login success
			req.session.uid = user.id;
			res.redirect('/');
	    }
	    else {
	    	console.log("ici: " + reason);
			res.locals.error = reason;
			exports.form(req, res);
	    }
	});
};

exports.logout = function(req, res) {
	req.session = null;
	res.locals.disconnect = true;
	res.redirect('/');
};