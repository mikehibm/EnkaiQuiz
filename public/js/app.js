/// <reference path="jquery-1.11.2.min.js" />
var App = window.App || {};

(function(){
	var PAGE_FADE_OUT = 500;
	var PAGE_FADE_IN = 1000;
	
	App.Config = {
		sound: true,
		bgm: false
	};
	
	App.data = {
		gameName: "",
		nickname: "",
		passCode: "",
		mode: "",				//'play', 'watch', or 'master'
		players: [],			//Playerの一覧 (watch, masterは含まない)
		quizSetIndex: null
	};
	
	App.socket = null;
	
	//*************************************************
	//* タイトル画面
	//*************************************************
	App.TopPage = {
		element: "#topPage",
		show: function(){
			var self = this;
			var page = $(this.element);
			var btnOpen = page.find(".button-open");
			var btnPlay = page.find(".button-play");
			var btnWatch = page.find(".button-watch");
			
			btnOpen.off();
			btnOpen.on('click', function(e){
				if (e) e.preventDefault();
				console.log("主催する!");
				self.hide();
				App.GameNamePage.show();
			});
			
			btnPlay.off();
			btnPlay.on('click', function(e){
				if (e) e.preventDefault();
				console.log("参加する!");
				self.hide();
				App.PassCodePage.show({mode: "play"});
			});
			
			btnWatch.off();
			btnWatch.on('click', function(e){
				if (e) e.preventDefault();
				console.log("観戦する!");
				self.hide();
				App.PassCodePage.show({mode: "watch"});
			});
			
			page.fadeIn(PAGE_FADE_IN);
		},
		hide: function(){
			var page = $(this.element);
			page.fadeOut(PAGE_FADE_OUT);
		}	
	};
		
	//*************************************************
	//* 大会名称入力画面
	//**************************************************
	App.GameNamePage = {
		element: "#gameNamePage",
		show: function(){
			var self = this;
			var page = $(this.element);
			var btnNext = page.find(".button-next");
			var txt = $("#txtGameName");
			
			txt.removeAttr("readonly");
			btnNext.removeAttr("disabled");

			btnNext.off();
			btnNext.on('click', function(e){
				if (e) e.preventDefault();
				App.data.gameName = txt.val();
				if (!App.data.gameName){
					alert("名称を入力して下さい。");
					txt.focus();
					return;
				}
				
				App.socket.emit('open_game', { gameName: App.data.gameName });
				console.log('Sent message "open_game".', App.data.gameName);
				txt.attr("readonly", "readonly");
				btnNext.attr("disabled", "disabled");
				//self.hide();
			});
			
			page.fadeIn(PAGE_FADE_IN);
		},	
		hide: function(){
			var page = $(this.element);
			page.fadeOut(PAGE_FADE_OUT);
		}	
	};
		
	//*************************************************
	//* 問題セット選択画面
	//**************************************************
	App.QuizSetPage = {
		element: "#quizSetPage",
		show: function(){
			var self = this;
			var page = $(this.element);
			
			var drp = $("#drpQuizSet");
			var btnNext = page.find(".button-next");
			
			drp.empty();
			var len = App.data.quizSet.length, quiz;
			for (var i=0; i<len; i++){
				quiz = App.data.quizSet[i];
				drp.append("<option value='" + i + "'>" + quiz.name + "</option>");
			}
			
			drp.removeAttr("readonly");
			btnNext.removeAttr("disabled");

			btnNext.off();
			btnNext.on('click', function(e){
				if (e) e.preventDefault();
				App.data.quizSetIndex = drp.val() -0;	//「-0」で数値化。
				self.hide();
				App.GameStartPage.show();
			});
			
			page.fadeIn(PAGE_FADE_IN);
		},	
		hide: function(){
			var page = $(this.element);
			page.fadeOut(PAGE_FADE_OUT);
		}	
	};


	//*************************************************
	//* 参加者パスコード入力画面
	//**************************************************
	App.PassCodePage = {
		element: "#passCodePage",
		show: function(options){
			var self = this;
			var page = $(this.element);
			var btnNext = page.find(".button-next");
			var txtNickname = $("#txtNickname");
			var txtPass = $("#txtPass");
			
			txtNickname.removeAttr("readonly");
			txtPass.removeAttr("readonly");
			btnNext.removeAttr("disabled");

			btnNext.off();
			btnNext.on('click', function(e){
				if (e) e.preventDefault();
				
				var nickname = txtNickname.val();
				if (!nickname){
					alert("ニックネームを入力して下さい。");
					txtNickname.focus();
					return;
				}
				App.data.nickname = nickname;

				var passCode = txtPass.val();
				if (!passCode || passCode.length != 6){
					alert("6桁のパスコードを入力して下さい。");
					txtPass.focus();
					return;
				}
				App.data.passCode = passCode;
				
				App.socket.emit('send_pass', { nickname: nickname, passCode: passCode, mode: options.mode });
				console.log('Sent message "send_pass".', nickname, passCode, options.mode);
				
				txtNickname.attr("readonly", "readonly");
				txtPass.attr("readonly", "readonly");
				btnNext.attr("disabled", "disabled");
				//self.hide();
			});
			
			page.fadeIn(PAGE_FADE_IN);
		},	
		
		hide: function(){
			var page = $(this.element);
			page.fadeOut(PAGE_FADE_OUT);
		},
		
		showError: function(data){
			alert(data.error);
			
			var page = $(this.element);
			var txtNickname = page.find("#txtNickname");
			var txtPass = page.find("#txtPass");
			var btnNext = page.find(".button-next");
			
			txtNickname.removeAttr("readonly");
			txtPass.removeAttr("readonly");
			btnNext.removeAttr("disabled");

			if (data.field === 'passCode'){
				txtPass.focus();
			} else {
				txtNickname.focus();
			}
		}	
	};


	//*************************************************
	//* 大会オープニング画面
	//**************************************************
	App.GameStartPage = {
		element: "#gameStartPage",
		show: function(){
			var self = this;
			var page = $(this.element);
			var btnStart = page.find(".button-start");
			var lblGameName = page.find("#lblGameName");
			var lblPasscode = page.find("#lblPasscode");
			var lblCount = page.find("#lblCount");
			var divPlayers = page.find(".div-players");
			var lblWait = page.find(".label-wait");
			
			lblGameName.text(App.data.gameName);
			lblPasscode.text(App.data.passCode);
			
			if (App.data.mode === 'master'){
				btnStart.show();
			} else {
				btnStart.hide();
			}
			self.lblWaitLoop = setInterval(function(){
				lblWait.fadeOut(300, function(){
					lblWait.fadeIn(800);
				});
			}, 2000);
			
			btnStart.off();
			btnStart.on('click', function(e){
				if (e) e.preventDefault();
				console.log("クイズ大会開始!");
				self.hide();
				App.QuizPage.show();
			});
			
			page.fadeIn(PAGE_FADE_IN);
			self.update();
		},
		
		hide: function(){
			if (self.lblWaitLoop){
				clearInterval(self.lblWaitLoop);
			}
			var page = $(this.element);
			page.fadeOut(PAGE_FADE_OUT);
		},
		
		update: function(){
			var self = this;
			var page = $(this.element);
			
			var lblCount = page.find("#lblCount");
			lblCount.text(App.data.players.length + "人");
			
			var divPlayers = page.find(".div-players");
			divPlayers.empty();
			
			var player, len = App.data.players.length;
			for (var i = 0; i < len; i++){
				player = App.data.players[i];
				divPlayers.append("<span class='player'>" + player.nickname + "(" + player.point + ")" + "</span>");
			}
		}
	};
		

	//*************************************************
	//* クイズ画面
	//**************************************************
	App.QuizPage = {
		element: "#quizPage",
		show: function(){
			var self = this;
			var page = $(this.element);
			var btnNext = page.find(".button-next");
			
			console.log("QuizPage.show: ", App.data);
			
			var quiz = App.data.quizSet[App.data.quizSetIndex];
			console.log("Quiz = ", quiz);
			
			btnNext.off();
			btnNext.on('click', function(e){
				if (e) e.preventDefault();
				console.log("Next");
			});
			
			page.fadeIn(PAGE_FADE_IN);
		},
		hide: function(){
			var page = $(this.element);
			page.fadeOut(PAGE_FADE_OUT);
		}	
	};

	//*************************************************
	//* 順位表画面
	//**************************************************
	App.RankingPage = {
		element: "#rankingPage",
		show: function(returnToPage){
			var self = this;
			var page = $(this.element);
			var btnBack = page.find(".button-back");
			
			btnBack.off();
			btnBack.on('click', function(e){
				if (e) e.preventDefault();
				console.log("Back");
				
				self.hide();
				if (returnToPage){
					returnToPage.show();
				} else {
					App.QuizPage.show();
				}
			});
			
			page.fadeIn(PAGE_FADE_IN);
		},
		hide: function(){
			var page = $(this.element);
			page.fadeOut(PAGE_FADE_OUT);
		}	
	};
		
})();

	
$(function(){
	console.log("動いています!", new Date());
	
	App.socket = io();
	console.log("connected", new Date);
	
	App.socket.on('message', function(data){
	    console.log(data.message);
	});	
	
	//「主催する」の結果を受信
	App.socket.on('open_game_ok', function(data){
		console.log('Received "open_game_ok".', data);
		
		App.data.gameName = data.gameName;
		App.data.passCode = data.passCode;
		App.data.nickname = data.nickname;
		App.data.mode = data.mode;
		
		App.GameNamePage.hide();
		App.QuizSetPage.show();
	});

	//参加・観戦する場合の「パスコード入力」の結果を受信
	App.socket.on('send_pass_result', function(data){
		console.log('Received "send_pass_result".', data);
		if (data.error){
			App.PassCodePage.showError(data);
			return;
		}
		
		App.data.gameName = data.gameName;
		App.data.passCode = data.passCode;
		App.data.nickname = data.nickname;
		App.data.mode = data.mode;
		App.data.players = data.players;		//参加者名の配列
		
		App.PassCodePage.hide();
		App.GameStartPage.show();
	});
	
	//参加者が追加された時
	App.socket.on('new_player', function(data){
		App.data.players = data.players;
		App.GameStartPage.update();
	});

	//最初の画面を表示。
	App.TopPage.show();
});

