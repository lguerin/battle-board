var User = require('../../models/schema').User;

module.exports = function(req, res, next) {
	var uid = req.session.uid;
	if (!uid)
		return next();
	
	User.findOne({ _id: uid }, function(err, user) {
		if (err)
			return next(err);
		req.user = res.locals.user = user;
		next();
	});
};