// Setup Modules
var express = require('express'), 
	http = require('http'),
	io = require('socket.io'), 
	hbs = require('express-hbs'), 
	routes = require('./routes'),
	team = require('./routes/team'),
	player = require('./routes/player'),
	login = require('./routes/login'),
	battle = require('./routes/battle'),
	api = require('./routes/api'),
	config = require('config'),
	mongoose = require('mongoose'),
	schema = require('./models/schema'),
	User = schema.User,
	DataLoader = require('./lib/dataloader').DataLoader,
	session = require('./lib/middleware/session'),
	security = require('./lib/middleware/security'),
	expressValidator = require('express-validator'),
	hbsBattleHelper = require('./lib/hbs/helpers');

// Setup local variables
var port = (process.env.PORT || config.app.port);

// Setup MongoDB connection
var db = mongoose.connect(config.db.url);
mongoose.connection.on("open", function(){
	  console.log("Connection opened to mongodb at %s", config.db.url);
});

// Populate Database
DataLoader.populateDB();

// Setup Express
var env = process.env.NODE_ENV || 'development';
app = express();
app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'html');
    app.engine('html', hbs.express3({
    	partialsDir: __dirname + '/views/partials',
    	defaultLayout: __dirname + '/views/layout.html'
    }));
	app.set('photos', __dirname + '/public/photos');
	app.set('db', mongoose.connection.db);
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(expressValidator);
	app.use(express.cookieParser(config.app.cookie_secret));
	app.use(express.cookieSession());
	app.use(session);
	app.use(express.methodOverride());
	app.use(require('less-middleware')({ src: __dirname + '/public' }));
	app.use(express.static(__dirname + '/public'));
	app.use(app.router);
	app.use(routes.notFound);
	app.use(routes.error);	
	if ('development' == env) {
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
		// DataLoader.populateDevBase();
	}
	if ('production' == env) {
		app.use(express.errorHandler());
	}
});

var server = http.createServer(app);

// Setup Socket.IO
var io = io.listen(server);
app.set('io', io);

// Start application
server.listen(port, function () {
	console.log('Battle Board started - Listening on port: ' + port);
});

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/**
 * Pages publiques
 */
app.get('/', routes.index);
app.get('/login', login.form);
app.post('/login', login.submit);
app.get('/logout', login.logout);
app.get('/battle/:id', battle.view);

/**
 * Admin
 */
app.get('/admin/*', security.authenticated);

app.get('/admin/team', team.list);
app.get('/admin/team/add', team.form);
app.get('/admin/team/edit/:id', team.form);
app.post('/admin/team/edit/:id', team.submit(app.get('photos')));
app.post('/admin/team/add', team.submit(app.get('photos')));

app.get('/admin/player', player.list);
app.get('/admin/player/edit', player.form);
app.get('/admin/player/edit/:id', player.form);
app.post('/admin/player/edit', player.submit(app.get('photos')));

app.get('/admin/battle/add', battle.form);
app.post('/admin/battle/add', battle.submit);
app.get('/admin/battle', battle.list);
app.get('/admin/battle/delete/:id', battle.remove);
app.get('/admin/battle/score/:id', battle.score);
app.put('/admin/battle/score/:id', battle.updateBattle);

/**
 * API
 */
app.post('/api/players/:divisionId', api.playersByDivision);

// ALWAYS keep those as last routes
app.get('/500', routes.error500);
app.get('/*', routes.error404);
