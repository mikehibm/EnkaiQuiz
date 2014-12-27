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
		quizSetIndex: null
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
		show: function(){
			var self = this;
			var page = $(this.element);
			var btnOpen = page.find(".button-open");
			var btnPlay = page.find(".button-play");
			var btnWatch = page.find(".button-watch");
			
			App.setTitle();

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
		},
		
		update: function(data){
			var self = this;
			var page = $(this.element);
			var lblPID = page.find("#lblPID");
			var lblConCount = page.find("#lblConCount");
			var lblGameCount = page.find("#lblGameCount");
			
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
		show: function(){
			var self = this;
			var page = $(this.element);
			var btnNext = page.find(".button-next");
			var txt = $("#txtGameName");
			
			App.setTitle();

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
			
			App.setTitle();

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
			
			App.setTitle();
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
				
				var data = { 
					nickname: nickname, 
					passCode: passCode, 
					mode: options.mode 
				};
				App.socket.emit('send_pass', data);
				console.log('Sent "send_pass": ', data);
				
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
			var lblPasscode = page.find("#lblPasscode");
			var lblCount = page.find("#lblCount");
			var divPlayers = page.find(".div-players");
			var lblWait = page.find(".label-wait");
			
			App.setTitle(App.data.gameName);
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
			App.setTitle(App.data.gameName);
			
			var quiz = App.data.quiz;
			console.log("App.data.quiz = ", quiz);
			
			page.off();
			btnNext.hide();
			btnNext.off();
			if (App.data.mode === 'master'){
				btnNext.show();
				btnNext.on('click', self.next);
			} else {
				page.on('click', ".button-answer", self.onClick);
			}
				
			self.update();
			page.fadeIn(PAGE_FADE_IN);
		},
		
		hide: function(){
			var page = $(this.element);
			page.fadeOut(PAGE_FADE_OUT);
		},
		
		next: function(e){
			if (e) e.preventDefault();
			var self = App.QuizPage;
			var page = $(this.element);
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
			
			//self.update();			
		},
		
		finish: function(){
			var self = this;
			var page = $(this.element);
			var stage = App.data.quizSet[App.data.quizSetIndex];
			
			var data = { 
				gameName: App.data.gameName,
				passCode: App.data.passCode,
				stageName: stage.name,
				current: App.data.current,
				total: stage.quizes.length
			};
			App.socket.emit('quiz_finish', data);
			
//			self.hide();
//			App.RankingPage.show(App.TopPage);
		},
		
		update: function(){
			var self = this;
			var page = $(this.element);
			var lblPosition = page.find("#lblPosition");
			var lblQuestion = page.find("#lblQuestion");
			var divAnswers = page.find(".div-answers");
			var divPlayers = page.find(".div-players");
			
			//Show question
			lblPosition.text((App.data.current+1) + " / " + App.data.total);
			lblQuestion.text(App.data.quiz.question);

			//Show answers			
			divAnswers.empty();
			var answers = App.data.quiz.answers;
			var len = answers.length;
			for (var i = 0; i < len; i++){
				var html = "<div class='button-answer' data-index='" + i + "'>" + answers[i] + "</div>";
				divAnswers.append(html);
			}
			
			//Show ranking
			divPlayers.empty();
			var player, len = Math.min(App.data.players.length, App.Config.ShowPlayersTop);
			for (var i = 0; i < len; i++){
				player = App.data.players[i];
				divPlayers.append("<span class='player'>" + player.nickname + "(" + player.point + ")" + "</span>");
			}
			var rest = App.data.players.length - len;
			if (rest > 0){
				divPlayers.append("<span class='player-rest'>他 " + rest + "人" + "</span>");
			}
		}, 
		
		onClick: function(e){
			var data = { 
				nickname: App.data.nickname,
				passCode: App.data.passCode,
				correct: false 
			};
			var div = $(".div-answers");
			var btn = $(e.target);
			var index = btn.data("index") -0;
			div.empty();
			if (App.data.quiz.correct == index){
				div.append("<div class='msg-correct'>正解！！</div>");
				App.QuizPage.enableButtons(false);
				data.correct = true;
			} else {
				div.append("<div class='msg-ng'>NG...(-1点)</div>");
				setTimeout(function(){
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
		show: function(returnToPage){
			var self = this;
			var page = $(this.element);
			var btnBack = page.find(".button-back");
			
			App.setTitle(App.data.gameName);

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

		if (data.players){
			App.data.players = data.players;
			App.QuizPage.update();
		}		
	});
	
	App.socket.on('exit', function(data){
		console.log("Received 'exit': ", data);
		App.data.players = data.players;
		App.GameStartPage.update();
		App.QuizPage.update();
	});
	
	//最初の画面を表示。
	App.TopPage.show();
});

