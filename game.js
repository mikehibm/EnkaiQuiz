//var exports = module.exports = {};

var config = exports.config = {};
var games = exports.games = [];

var Player = exports.Player = function(nickname){
	this.nickname = nickname;
	this.point = 0;
};

var Game = exports.Game = function(gameName){
	this.gameName = gameName;
	this.passCode = "112233";
	this.players = [];
	
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
	
	this.addPlayer = function(nickname){
		var player = new Player(nickname);
		this.players.push(player);
	};
};

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

