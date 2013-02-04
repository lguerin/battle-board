var mongoose = require('mongoose'),
	should = require('should');	

//Models to test
var Division = require('../models/schema').Division;

// Connect to test DB
var url = 'mongodb://localhost/battle_test';
mongoose.connect(url);

var DataLoader = require('../lib/dataloader').DataLoader;


describe('#Division', function() {
	
	beforeEach(function(done) {
		DataLoader.populateDivisions(function(err, result) {
			done();
		});
	});

});

