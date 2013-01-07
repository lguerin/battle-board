if(!BattleBoard){
	var BattleBoard = {};
}

BattleBoard.Battle = function() {
	this.id = null; 
	this.socket = null;
};

BattleBoard.Battle.prototype.getBattleNamespace = function() {
	return "/" + this.id;
};

BattleBoard.Battle.prototype._initSocket = function() {
	var namespace = this.getBattleNamespace();
	this.socket = io.connect(namespace);
};

BattleBoard.Battle.prototype.sortByScoreDesc = function(list) {
	var teams = _.values(list);
	teams = _.sortBy(teams, 'score').reverse();
	teams[0].rank = 'first';
	teams[1].rank = 'second';
	teams[2].rank = 'third';
	return teams;
};

BattleBoard.Battle.prototype.prepareData = function(data) {
	var teams = this.sortByScoreDesc(data.teams);
	var data = {teams:teams};
	var tpl = $("#teamTpl").html();
	$('#all').html(_.template(tpl, data));
};

BattleBoard.Battle.prototype.refreshScores = function(data) {
	var teams = this.sortByScoreDesc(data.teams);
	var data = {teams:teams};
	var tpl = $("#teamTpl").html();
	$('#new').html(_.template(tpl, data));
	$('.all').quicksand($('.new li'), {
		duration: 800,
		adjustHeight: false,
		retainExisting: false,
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