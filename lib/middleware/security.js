exports.authenticated = function(req, res, next) {
	if (req.user) {
		next();
	} else {
		next(new Error('Vous devez être authentifié pour accéder à cette page !'));
	}
};