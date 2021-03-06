if(!BattleBoard){
	var BattleBoard = {};
}

BattleBoard.Util = {};

BattleBoard.Util.loadSelectPlayers = function(selectId, tplId, targetId, selected) {
	var divisionId = $('#' + selectId).val();	
	var selected = (selected && selected.split(',')) || [];
	$.ajax({
		url : '/api/players/' + divisionId,
		type : 'POST',
		success : function(data) {
			var tpl = $('#' + tplId).html();
			_.each(data.players, function(player) {
				if (_.indexOf(selected, player._id) != -1)
					player.checked = true;
			});
			$('#' + targetId).html(_.template(tpl, data));
		},
		error : function(jqXHR, textStatus, err) {
			alert('text status ' + textStatus + ', err ' + err);
		}
	});
};

BattleBoard.Util.confirmModalBox = function(id, linkId) {
	var target = $('#' + linkId).data('url');
	// Dismiss the dialog
	$("#" + id).modal('hide');
	// Redirect
	window.location = target;
};

BattleBoard.Battle = function() {
	this.id = null; 
	this.socket = null;
	this.sounds = {
			'up': '../sound/up',
			'down': '../sound/down',
			'alarm': '../sound/alarm',
	};
};

BattleBoard.Battle.prototype.getBattleNamespace = function() {
	return "/" + this.id;
};

BattleBoard.Battle.prototype._initSocket = function() {
	var namespace = this.getBattleNamespace();
	this.socket = io.connect(namespace);
};

BattleBoard.Battle.prototype.sortByScoreDesc = function(list, division1) {
	var teams = _.values(list);	
	teams = _.sortBy(teams, 'score').reverse();
	_.each(teams, function(team){
		if (team.division == division1) {
			team.visitor = 0;
		}
		else {
			team.visitor = 1;
		}
	});
	teams[0].rank = 'first';
	teams[1].rank = 'second';
	if (teams.length > 2) {
		teams[2].rank = 'third';
	}
	return teams;
};

BattleBoard.Battle.prototype.prepareData = function(data) {
	var division1 = _.keys(data.divisions)[0];
	var teams = this.sortByScoreDesc(data.teams, division1);
	var data = {teams:teams};
	var tpl = $("#teamTpl").html();
	$('#all').html(_.template(tpl, data));
};

BattleBoard.Battle.prototype.refreshScores = function(data, id, score) {
	var division1 = _.keys(data.divisions)[0];	
	var teams = this.sortByScoreDesc(data.teams, division1);
	var data = {teams:teams};
	var tpl = $("#teamTpl").html();
	var self = this;
	$('#new').html(_.template(tpl, data));
	$('.all').quicksand($('.new li'), {
		duration: 800,
		adjustHeight: false,
		retainExisting: false,
		easing: 'easeInOutQuad',
		useScaling: true
	}, function() {
		self.playScoreSound(score);		
		self.highlightTeam(id);
	});
};

BattleBoard.Battle.prototype.highlightTeam = function(teamId) {
	$('#' + teamId).effect("pulsate", {times: 4}, 4000);
};

BattleBoard.Battle.prototype.playScoreSound = function(score) {
	var sound = score > 0 ? 'up' : 'down';
	var gameSound = new buzz.sound(this.sounds[sound]);
	gameSound.play();
};

BattleBoard.Battle.prototype.playAlarm = function() {
	var gameSound = new buzz.sound(this.sounds['alarm']);
	gameSound.play();
};

BattleBoard.Battle.prototype.alarmBoard = function() {
	$('#board').addClass('alarm-board');
	$('#board').effect("pulsate", {times: 5}, 5000, function() {
		$('#board').removeClass('alarm-board');	
	});
};

BattleBoard.Battle.prototype._initBattle = function() {
	var self = this;
	buzz.defaults.formats = [ 'ogg', 'mp3' ];
	buzz.defaults.preload = 'metadata';
	
	if (this.socket) {
		this.socket.on('init_battle', function(data) {
			self.prepareData(data);
		});
		
		this.socket.on('refresh_scores', function(data, id, score) {
			self.refreshScores(data, id, score);			
		});
		
		this.socket.on('alarm', function() {
			self.alarmBoard();
			self.playAlarm();			
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