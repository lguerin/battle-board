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

/**
 * Countdown 
 * @returns {BattleBoard.Countdown}
 */
BattleBoard.Countdown = function() {
	this.countdownMinutes = null;
	this.total = null;
	this.timer = null;
	this.finishTime = null;
};

BattleBoard.Countdown.prototype.calculateFinishTime = function(minutes) {
	var seconds = minutes * 60;
	this.finishTime =  new Date().getTime() + (seconds * 1000);
};

BattleBoard.Countdown.prototype.setTimer = function() {
	var self = this;
	this.timer = setInterval(function() {
		self.stop();
	}, 1000);
};

BattleBoard.Countdown.prototype.init = function(minutes, total) {
	this.countdownMinutes = minutes;
	this.total = total;
	this.calculateFinishTime(this.countdownMinutes);
	this.setTimer();
};

BattleBoard.Countdown.prototype.stop = function() {	
	var seconds = (this.finishTime - (new Date().getTime())) / 1000;
	var timerSeconds = this.countdownMinutes * 60;
	if (seconds <= 0) {
		clearInterval(this.timer);
		this.refreshCountdown(0, 0);
		// TODO : handler pour fin de Battle
		alert('Fin de la partie !');
	}
	else {
		var countdown = (seconds / timerSeconds) * this.countdownMinutes;
		this.refreshCountdown(countdown, this.total);
	}
};

BattleBoard.Countdown.prototype.refreshCountdown = function(countdown, total) {
	var half = Math.round(total / 2);
	var data = {countdown: countdown, half: half};
	var tpl = $("#timerTpl").html();
	$('div.timer').html(_.template(tpl, data));
	var deg = 360 / this.total * countdown;
	$('#slice .pie').css({
		'-moz-transform': 'rotate(' + deg + 'deg)',
		'-webkit-transform': 'rotate(' + deg + 'deg)',
		'-o-transform': 'rotate(' + deg + 'deg)',
		'transform': 'rotate(' + deg + 'deg)'
	});
	$('.countdown').html(Math.round(countdown + 0.5));
};