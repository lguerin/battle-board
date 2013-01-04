if(!BattleBoard){
	var BattleBoard = {};
}

BattleBoard.Battle = function() {
	this.id = null; 
	this.socket = null;
};

BattleBoard.Battle.prototype.getNamespace = function() {
	return "/" + this.id;
};

BattleBoard.Battle.prototype._initSocket = function() {
	var namespace = this.getNamespace();
	this.socket = io.connect(namespace);
};

BattleBoard.Battle.prototype.prepareData = function(data) {
	var teams = _.values(data.teams);
	var data = {teams:_.sortBy(teams, 'score').reverse()};
	var tpl = $("#teamTpl").html();
	$('#all').html(_.template(tpl, data));
};

BattleBoard.Battle.prototype.refreshScores = function(data) {
	var teams = _.values(data.teams);
	var data = {teams:_.sortBy(teams, 'score').reverse()};
	var tpl = $("#teamTpl").html();
	$('#new').html(_.template(tpl, data));
	$('.all').quicksand( $('.new li'), {
		duration: 3000,
		easing: 'easeInOutQuad',
		useScaling: true
	});
};

BattleBoard.Battle.prototype._initBattle = function() {
	var self = this;
	if (this.socket) {
		this.socket.on('init_battle', function(data) {
			self.prepareData(data);
		});
		
		$('#sender').bind('click', function() {
			self.socket.emit('message', "hey hey: " + new Date());
		});
	
		this.socket.on('app_message', function(data) {
			$('#receiver').append('<li>' + data + '</li>');
		});
		this.socket.on('refresh_scores', function(data) {
			self.refreshScores(data);			
		});
	}	
};

BattleBoard.Battle.prototype.init = function(id) {
	this.id = id;
	this._initSocket();
	this._initBattle();
};