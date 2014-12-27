//var exports = module.exports = {};

var config = exports.config = {
	passCodeLength: 6,
	passCodeChars: "0123456789",		//"abcdefghjkmnpqrstuwxyz3456789"
	pointWinners: 3						//正解時に得点を得る人の数(例：3なら最初の3人がそれぞれ+3,+2,+1点)
};
var games = exports.games = [];

var Player = exports.Player = function(nickname, mode){
	this.nickname = nickname;
	this.point = 0;
	this.mode = mode;
	this.passCode = "";			//参加している大会のパスコード。
};

function randomInt(min, max){
	return min + Math.floor( Math.random() * (max - min + 1) );
}

function generatePassCode(){
	var chars = config.passCodeChars, n, c, str = "";
	
	for (var i = 0; i < config.passCodeLength; i++){
		n = randomInt(0, chars.length-1);
		c = chars[n];
		str += c;
	}
	
	//パスコードの重複をチェック。
	var exists = games.some(function(value, ix){
		return value.passCode == str;
	});
	if (exists){
		console.log("passCode is duplicated.", str);
		//重複している場合は再生成。
		str = this.generatePassCode();
	}
	return str;
}

var Game = exports.Game = function(gameName){
	this.gameName = gameName;
	this.passCode = generatePassCode();
	this.players = [];
	this.state = "waiting";		//waiting/playing/finished
	this.currentQuiz = null;
	
	this.findNickname = function(nickname){
		var len = this.players.length, player;
		for (var i = 0; i < len; i++){
			player = this.players[i];
			if (player.nickname === nickname){
				return player;
			}
		}
		return null;
	};
	
	this.addPlayer = function(nickname, mode, passCode){
		var player = new Player(nickname, mode);
		player.passCode = passCode;
		this.players.push(player);
		return player;
	};
	
	this.removePlayer = function(player){
		this.players.some(function(v, i){
		    if (v == player) this.players.splice(i,1);    
		});	
	};
	
	this.start = function(){
		this.state = "playing";
	};
	
	this.finish = function(){
		this.state = "finished";
	};
	
	this.next = function(quiz){
		this.currentQuiz = quiz;
		this.currentQuiz.winners = [];
	};
	
	this.correct = function(nickname){
		if (!this.currentQuiz) return 0;
		
		this.currentQuiz.winners.push(nickname);
		var point = Math.max(config.pointWinners + 1 - this.currentQuiz.winners.length, 0);
		return point;
	};
	
	this.ng = function(){
		return -1;
	}
};
Game.STATE_WAITING = "waiting";
Game.STATE_PLAYING = "playing";
Game.STATE_FINISHED = "finished";

exports.createGame = function(gameName){
	var game = new Game(gameName);
	games.push(game);
	return game;
};

exports.findGame = function(passCode){
	var len = games.length, game;
	for (var i = 0; i < len; i++){
		game = games[i];
		if (game.passCode === passCode){
			return game;
		}
	}
	return null;
};

exports.removeGame = function(game){
	games.some(function(v, i){
		if (v == game) games.splice(i,1);    
	});	
};

