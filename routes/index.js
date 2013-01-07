/**
 * GET home page.
 */
exports.index = function(req, res){
	res.render('index', {
			title : 'Battle Board'
		}
	);
};

/**
 * A Route for Creating a 500 Error 
 */
exports.error500 = function(req, res) {
	throw new Error('This is a 500 Error');
};

/**
 * The 404 Route 
 */
exports.error404 = function(req, res) {
	throw new RouteNotFound;
};

/**
 * RouteNotFound util
 */
var RouteNotFound = function(msg){
	this.name = 'NotFound';
	Error.call(this, msg);
	Error.captureStackTrace(this, arguments.callee);
};
exports.notFound = RouteNotFound;

//Setup the errors
exports.error = function(err, req, res, next) {
	if (err instanceof RouteNotFound) {
		res.render('404', {
			locals : {
				title : 'Battle Board - Erreur 404'
			},
			status : 404
		});
	} else {
		console.error(">> Erreur 500: " + err.stack);
		res.render('500', {
			locals : {
				title : 'Battle Board - Erreur Interne',
				error : err.msg
			},
			status : 500
		});
	}
};


