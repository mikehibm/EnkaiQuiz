/// <reference path="jquery-1.11.2.min.js" />
var App = window.App || {};

(function(){
	var PAGE_FADE_OUT = 500;
	var PAGE_FADE_IN = 1000;
	
	App.Config = {
		AppName: 'Enkai Quiz',
		Sound: true,
		Bgm: false,
		ShowPlayersTop: 5
	};
	
	App.data = {
		gameName: "",
		nickname: "",
		passCode: "",
		mode: "",				//'play', 'watch', or 'master'
		players: [],			//Playerの一覧 (watch, masterは含まない)
		quizSetIndex: null,
		quiz: null				//現在表示中のクイズ。  {question: "", answers: [], correct: 0, winners: [{nickname:"", point:0}] }
	};
	
	App.socket = null;
	
	App.setTitle = function(s){
		s = s || App.Config.AppName;
		$("#lblTitle").text(s);
	};
	
	//*************************************************
	//* タイトル画面
	//*************************************************
	App.TopPage = {
		element: "#topPage",
		init: function(){
			var self = this;
			var el = this.el = $(this.element);
			var btnOpen = this.btnOpen = el.find(".button-open");
			var btnPlay  = this.btnPlay = el.find(".button-play");
			var btnWatch = this.btnWatch = el.find(".button-watch");
			
			btnOpen.off();
			btnOpen.on('click', function(e){
				if (e) e.preventDefault();
				self.hide();
				App.GameNamePage.show();
			});
			
			btnPlay.off();
			btnPlay.on('click', function(e){
				if (e) e.preventDefault();
				self.hide();
				App.PassCodePage.show({mode: "play"});
			});
			
			btnWatch.off();
			btnWatch.on('click', function(e){
				if (e) e.preventDefault();
				self.hide();
				App.PassCodePage.show({mode: "watch"});
			});
		},

		show: function(){
			App.setTitle();
			this.el.fadeIn(PAGE_FADE_IN);
		},
		
		hide: function(){
			this.el.fadeOut(PAGE_FADE_OUT);
		},
		
		update: function(data){
			var lblPID = this.el.find("#lblPID");
			var lblConCount = this.el.find("#lblConCount");
			var lblGameCount = this.el.find("#lblGameCount");
			
			lblPID.text("PID: " + data.pid);
			lblConCount.text("Connections: " + data.conCount);
			lblGameCount.text("Games: " + data.gameCount);
		}	
	};
		
	//*************************************************
	//* 大会名称入力画面
	//**************************************************
	App.GameNamePage = {
		element: "#gameNamePage",
		init: function(){
			var el = this.el = $(this.element);
			var btnBack = this.btnBack = el.find(".button-back");
			var btnNext = this.btnNext = el.find(".button-next");
			var txt = this.txt = el.find("#txtGameName");
			
			btnBack.off();
			btnBack.on('click', this.onBack);

			btnNext.off();
			btnNext.on('click', this.onNext);
		},

		show: function(){
			App.setTitle();
			
			this.txt.removeAttr("readonly");
			this.btnNext.removeAttr("disabled");
			
			this.el.fadeIn(PAGE_FADE_IN);
		},
			
		hide: function(){
			this.el.fadeOut(PAGE_FADE_OUT);
		},
		
		onBack: function(e){
			if (e) e.preventDefault();
			App.GameNamePage.hide();
			App.TopPage.show();
		},
		
		onNext: function(e){
			var self = App.GameNamePage;
			if (e) e.preventDefault();
			App.data.gameName = self.txt.val();
			if (!App.data.gameName){
				alert("名称を入力して下さい。");
				self.txt.focus();
				return;
			}
			
			App.socket.emit('open_game', { gameName: App.data.gameName });
			console.log('Sent message "open_game".', App.data.gameName);
			
			self.txt.attr("readonly", "readonly");
			self.btnNext.attr("disabled", "disabled");
		}
	};
		
	//*************************************************
	//* 問題セット選択画面
	//**************************************************
	App.QuizSetPage = {
		element: "#quizSetPage",
		init: function(){
			var self = this;
			var el = this.el = $(this.element);
			var btnBack = this.btnBack = el.find(".button-back");
			var btnNext =this.btnNext = el.find(".button-next");
			var drp = this.drp = this.el.find("#drpQuizSet");
			
			btnBack.off();
			btnBack.on('click', this.onBack);

			btnNext.off();
			btnNext.on('click', this.onNext);
		},

		show: function(){
			var self = this;
			App.setTitle();

			this.drp.empty();
			var len = App.data.quizSet.length, stage;
			for (var i=0; i<len; i++){
				stage = App.data.quizSet[i];
				this.drp.append("<option value='" + i + "'>" + stage.name + " (" + stage.quizes.length + "問)</option>");
			}
			
			this.drp.removeAttr("readonly");
			this.btnNext.removeAttr("disabled");
			
			this.el.fadeIn(PAGE_FADE_IN);
		},
			
		hide: function(){
			this.el.fadeOut(PAGE_FADE_OUT);
		},

		onBack: function(e){
			if (e) e.preventDefault();
			App.QuizSetPage.hide();
			App.GameNamePage.show();
		},
		
		onNext: function(e){
			var self = App.QuizSetPage;
			if (e) e.preventDefault();
			App.data.quizSetIndex = self.drp.val() -0;	//「-0」で数値化。
			self.hide();
			App.GameStartPage.show();
		}
	};


	//*************************************************
	//* 参加者パスコード入力画面
	//**************************************************
	App.PassCodePage = {
		element: "#passCodePage",
		init: function(){
			var self = this;
			var el = this.el = $(this.element);
			var btnBack = this.btnBack = el.find(".button-back");
			var btnNext =this.btnNext = el.find(".button-next");
			var txtNickname = this.txtNickname = el.find("#txtNickname");
			var txtPass = this.txtPass = el.find("#txtPass");
			
			btnBack.off();
			btnBack.on('click', this.onBack);

			btnNext.off();
			btnNext.on('click', this.onNext);
		},

		show: function(options){
			App.setTitle();
			this.options = options;
			
			this.txtNickname.removeAttr("readonly");
			this.txtPass.removeAttr("readonly");
			this.btnNext.removeAttr("disabled");

			this.el.fadeIn(PAGE_FADE_IN);
		},	
		
		hide: function(){
			this.el.fadeOut(PAGE_FADE_OUT);
		},

		onBack: function(e){
			if (e) e.preventDefault();
			App.PassCodePage.hide();
			App.TopPage.show();
		},
		
		onNext: function(e){
			var self = App.GameNamePage;
			if (e) e.preventDefault();
			
			var nickname = self.txtNickname.val();
			if (!nickname){
				alert("ニックネームを入力して下さい。");
				self.txtNickname.focus();
				return;
			}
			App.data.nickname = nickname;

			var passCode = self.txtPass.val();
			if (!passCode || passCode.length != 6){
				alert("6桁のパスコードを入力して下さい。");
				self.txtPass.focus();
				return;
			}
			App.data.passCode = passCode;
			
			var data = { 
				nickname: nickname, 
				passCode: passCode, 
				mode: self.options.mode 
			};
			App.socket.emit('send_pass', data);
			console.log('Sent "send_pass": ', data);
			
			self.txtNickname.attr("readonly", "readonly");
			self.txtPass.attr("readonly", "readonly");
			self.btnNext.attr("disabled", "disabled");
		},
		
		showError: function(data){
			alert(data.error);
			
			this.txtNickname.removeAttr("readonly");
			this.txtPass.removeAttr("readonly");
			this.btnNext.removeAttr("disabled");

			if (data.field === 'passCode'){
				this.txtPass.focus();
			} else {
				this.txtNickname.focus();
			}
		}	
	};


	//*************************************************
	//* 大会オープニング画面
	//**************************************************
	App.GameStartPage = {
		element: "#gameStartPage",
		init: function(){
			var el = this.el = $(this.element);
			var btnStart = this.btnStart = el.find(".button-start");
			var lblPasscode = this.lblPasscode = el.find("#lblPasscode");
			var lblCount = this.lblCount = el.find("#lblCount");
			var divPlayers = this.divPlayers = el.find(".div-players");
			var lblWait = this.lblWait = el.find(".label-wait");
			//var btnBack = this.btnBack = el.find(".button-back");
			
			//btnBack.off();
			//btnBack.on('click', this.onBack);

			btnStart.off();
			btnStart.on('click', this.onStart);
		},

		show: function(){
			App.setTitle(App.data.gameName);
			this.lblPasscode.text(App.data.passCode);
			
			if (App.data.mode === 'master'){
				this.btnStart.show();
			} else {
				this.btnStart.hide();
			}
			this.lblWaitLoop = setInterval(function(){
				this.lblWait.fadeOut(300, function(){
					this.lblWait.fadeIn(800);
				});
			}, 2000);
			
			this.el.fadeIn(PAGE_FADE_IN);
			this.update();
		},
		
		hide: function(){
			if (this.lblWaitLoop){
				clearInterval(this.lblWaitLoop);
			}
			this.el.fadeOut(PAGE_FADE_OUT);
		},
		
		onStart: function(e){
			if (e) e.preventDefault();

			var stage = App.data.quizSet[App.data.quizSetIndex];
			App.data.current = 0;
			var data = { 
				gameName: App.data.gameName,
				passCode: App.data.passCode,
				stageName: stage.name,
				current: App.data.current,
				total: stage.quizes.length,
				quiz: stage.quizes[App.data.current] 
			};
			App.socket.emit('start_game', data);
			console.log("'start_game' sent: ", data);
		},
		
		update: function(){
			var self = this;
			self.lblCount.text(App.data.players.length + "人");
			
			self.divPlayers.empty();
			var player, len = App.data.players.length;
			for (var i = 0; i < len; i++){
				player = App.data.players[i];
				self.divPlayers.append("<span class='player'>" + player.nickname + "(" + player.point + ")" + "</span>");
			}
		}
	};
		

	//*************************************************
	//* クイズ画面
	//**************************************************
	App.QuizPage = {
		element: "#quizPage",
		init: function(){
			var self = this;
			var el = this.el = $(this.element);
			var lblPosition = this.lblPosition = el.find("#lblPosition");
			var lblQuestion = this.lblQuestion = el.find("#lblQuestion");
			var divAnswers = this.divAnswers = el.find(".div-answers");
			var divPlayers = this.divPlayers = el.find(".div-players");
			var divWinners = this.divWinners = el.find(".div-winners");
			var btnNext = this.btnNext = el.find(".button-start");
//			var btnBack = this.btnBack = el.find(".button-back");
			
//			btnBack.off();
//			btnBack.on('click', this.onBack);

			btnNext.off();
			btnNext.on('click', this.onNext);
		},

		show: function(){
			App.setTitle(App.data.gameName);
			var quiz = App.data.quiz;
			console.log("App.data.quiz = ", quiz);
			
			this.el.off();
			this.btnNext.hide();
			this.btnNext.off();
			if (App.data.mode === 'master'){
				this.btnNext.show();
				this.btnNext.on('click', this.onNext);
			} else {
				this.el.on('click', ".button-answer", this.onClick);
			}
				
			this.update();
			this.el.fadeIn(PAGE_FADE_IN);
		},
		
		hide: function(){
			this.el.fadeOut(PAGE_FADE_OUT);
		},
		
		onNext: function(e){
			if (e) e.preventDefault();
			var self = App.QuizPage;
			var stage = App.data.quizSet[App.data.quizSetIndex];
			App.data.current++;
			if (App.data.current >= stage.quizes.length){
				self.finish();
				return;
			}
			
			var data = { 
				gameName: App.data.gameName,
				passCode: App.data.passCode,
				stageName: stage.name,
				current: App.data.current,
				total: stage.quizes.length,
				quiz: stage.quizes[App.data.current] 
			};
			App.socket.emit('quiz_next', data);
			console.log("'quiz_next' sent: ", data);
		},
		
		finish: function(){
			var stage = App.data.quizSet[App.data.quizSetIndex];
			
			var data = { 
				gameName: App.data.gameName,
				passCode: App.data.passCode,
				stageName: stage.name,
				current: App.data.current,
				total: stage.quizes.length
			};
			App.socket.emit('quiz_finish', data);
		},
		
		update: function(){
			if (App.data.quiz.ng) return;
			
			if (!App.data.quiz.done) {
				//Show question
				this.lblPosition.text(App.data.total + "問中 " + (App.data.current+1) + "問目");
				this.lblQuestion.text(App.data.quiz.question);
	
				//Show answers			
				this.divAnswers.empty();
				var answers = App.data.quiz.answers;
				var len = answers.length;
				for (var i = 0; i < len; i++){
					var html = "<div class='button-answer' data-index='" + i + "'>" + answers[i] + "</div>";
					this.divAnswers.append(html);
				}
			}
			
			//Show ranking
			this.divPlayers.empty();
			var player, len = Math.min(App.data.players.length, App.Config.ShowPlayersTop);
			for (var i = 0; i < len; i++){
				player = App.data.players[i];
				this.divPlayers.append("<span class='player'>" + player.nickname + "(" + player.point + ")" + "</span>");
			}
			var rest = App.data.players.length - len;
			if (rest > 0){
				this.divPlayers.append("<span class='player-rest'>他 " + rest + "人" + "</span>");
			}
			
			//Show winners
			this.divWinners.empty();
			if (!App.data.quiz.winners) App.data.quiz.winners = [];
			var winner, len = App.data.quiz.winners.length, pointStr;
			for (var i = 0; i < len; i++){
				winner = App.data.quiz.winners[i];
				pointStr = winner.point > 0 ? "+" + winner.point : "" + winner.point;
				this.divWinners.append("<span class='winner'>" + winner.nickname + "(" + pointStr + ")" + "</span>");
			}
		}, 
		
		onClick: function(e){
			var self = App.QuizPage;
			if (App.data.quiz.done) return;
			
			var data = { 
				nickname: App.data.nickname,
				passCode: App.data.passCode,
				correct: false 
			};
			var div = self.divAnswers;
			var btn = $(e.target);
			var index = btn.data("index") -0;
			div.empty();
			if (App.data.quiz.correct == index){
				App.data.quiz.done = true;
				div.append("<div class='msg-correct'>正解！！</div>");
				data.correct = true;
			} else {
				App.data.quiz.ng = true;
				div.append("<div class='msg-ng'>NG...(-1点)</div>");
				setTimeout(function(){
					App.data.quiz.ng = false;
					App.QuizPage.update();
				}, 2000);
			}
			
			//サーバーに正解・不正解を送信。
			App.socket.emit('answer', data);
		}
		
	};

	//*************************************************
	//* 順位表画面
	//**************************************************
	App.RankingPage = {
		element: "#rankingPage",
		init: function(){
			var el = this.el = $(this.element);
			var btnBack = this.btnBack = el.find(".button-back");
			btnBack.on('click', this.onBack);
		},

		show: function(returnToPage){
			App.setTitle(App.data.gameName);
			this.returnToPage = returnToPage;
			this.update();
			this.el.fadeIn(PAGE_FADE_IN);
		},
		
		hide: function(){
			this.el.fadeOut(PAGE_FADE_OUT);
		},
		
		onBack: function(e){
			if (e) e.preventDefault();
			
			self.hide();
			if (this.returnToPage){
				this.returnToPage.show();
			} else {
				App.QuizPage.show();
			}
		},
		
		update: function(){
			var divRanking = this.el.find(".ranking");
			divRanking.empty();
			var player, len = App.data.players.length;
			for (var i = 0; i < len; i++){
				player = App.data.players[i];
				divRanking.append("<div class='player'>" + (i+1) + ". " + player.nickname + " ... " + player.point + "点" + "</div>");
			}
		}	
	};
		
})();

	
$(function(){
	App.socket = io();
	
	App.socket.on('procstat', function(data){
		console.log("Received 'procstat':", data);
		App.TopPage.update(data);
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
		if (App.data.passCode !== data.passCode){
			//自分が参加しているゲームと違う場合は無視。
			return;
		}
		App.data.players = data.players;
		App.GameStartPage.update();
	});

	//「始める！」の結果を受信
	App.socket.on('start_game_result', function(data){
		console.log('Received "start_game_result".', data);
		
		if (App.data.passCode !== data.passCode){
			//自分が参加しているゲームと違う場合は無視。
			return;
		}
		if (data.error){
			alert(data.error);
			return;
		}
		
		App.data.stageName = data.stageName;
		App.data.current = data.current;
		App.data.total = data.total;
		App.data.quiz = data.quiz;
		
		App.GameStartPage.hide();
		App.QuizPage.show();
	});
	
	//クイズ画面の「次へ」の結果を受信
	App.socket.on('quiz_next_ok', function(data){
		console.log('Received "quiz_next_ok".', data);
		
		if (App.data.passCode !== data.passCode){
			//自分が参加しているゲームと違う場合は無視。
			return;
		}
		
		App.data.stageName = data.stageName;
		App.data.current = data.current;
		App.data.total = data.total;
		App.data.quiz = data.quiz;
		
		App.QuizPage.update();
	});
	
	//クイズが全問終了した時
	App.socket.on('quiz_finish_result', function(data){
		console.log('Received "quiz_finish_result".', data);
		
		if (App.data.passCode !== data.passCode){
			//自分が参加しているゲームと違う場合は無視。
			return;
		}
		if (data.error){
			alert(data.error);
			return;
		}
		
		App.data.stageName = data.stageName;
		App.data.current = data.current;
		App.data.total = data.total;
		
		App.QuizPage.hide();
		App.RankingPage.show(App.TopPage);
	});
	
	//正解・不正解時の結果を受信  (全参加者の得点を受け取って表示を更新)
	App.socket.on('answer_result', function(data){
		console.log("Received 'answer_result'.", data);
		if (App.data.passCode !== data.passCode){
			//自分が参加しているゲームと違う場合は無視。
			return;
		}
		if (data.error){
			alert(data.error);
			return;
		}

		App.data.players = data.players;
		App.data.quiz.winners = data.winners;
		App.QuizPage.update();
	});
	
	App.socket.on('exit', function(data){
		console.log("Received 'exit': ", data);
		App.data.players = data.players;
		App.GameStartPage.update();
		App.QuizPage.update();
	});
	
	
	//全画面を初期化。
	[
		App.TopPage,
		App.GameNamePage,
		App.QuizSetPage,
		App.PassCodePage,
		App.GameStartPage,
		App.QuizPage,
		App.RankingPage
	].forEach(function(page, index, arr){
		if (page.init) page.init();
	});
	
	//最初の画面を表示。
	App.TopPage.show();
});

