/// <reference path="jquery-1.11.2.min.js" />
var App = window.App || {};

(function(){
	var PAGE_FADE_OUT = 500;
	var PAGE_FADE_IN = 1000;
	
	App.Config = {
		
	};
	
	App.socket = null;
	
	App.TopPage = {
		element: "#topPage",
		show: function(){
			var self = this;
			var page = $(this.element);
			var btnOpen = page.find(".button-open");
			btnOpen.on('click', function(e){
				if (e) e.preventDefault();
				console.log("主催する!");
				self.hide();
				App.GameNamePage.show();
			});
			
			var btnPlay = page.find(".button-play");
			btnPlay.on('click', function(e){
				if (e) e.preventDefault();
				console.log("参加する!");
				self.hide();
			});
			
			var btnWatch = page.find(".button-watch");
			btnWatch.on('click', function(e){
				if (e) e.preventDefault();
				console.log("観戦する!");
				self.hide();
			});
			
			page.fadeIn(PAGE_FADE_IN);
		},
		hide: function(){
			var page = $(this.element);
			page.fadeOut(PAGE_FADE_OUT);
		}	
	};
		
	App.GameNamePage = {
		element: "#gameNamePage",
		show: function(){
			var self = this;
			var page = $(this.element);
			var btnNext = page.find(".button-next");
			btnNext.on('click', function(e){
				if (e) e.preventDefault();
				var gameName = $("#txtGameName").val();
				App.socket.emit('open_game', { gamename: gameName });
				console.log('Sent message "open_game".', gameName);
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
		
	App.QuizSetPage = {
		element: "#quizSetPage",
		show: function(){
			var self = this;
			var page = $(this.element);
			var btnNext = page.find(".button-next");
			btnNext.on('click', function(e){
				if (e) e.preventDefault();
				var quizSet = $("#drpQuizSet").val();
				App.socket.emit('select_quizset', { quizset: quizSet });
				console.log('Sent message "select_quizset".', quizSet);
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
		
})();

	
$(function(){
	console.log("動いています!", new Date());
	
	App.socket = io();
	console.log("connected", new Date);
	
	App.socket.on('message', function(data){
	    console.log(data.message);
	});	
	
//	App.socket.on('clock', function(data){
//        $('#clock').text(data.date);
//    });
	
// 	$('#text').keypress(function(e){
//      App.socket.emit('client_data', {'letter': String.fromCharCode(e.charCode)});
//    });

	App.socket.on('open_game_ok', function(data){
		console.log('Received "open_game_ok".', data);
		App.GameNamePage.hide();
		App.QuizSetPage.show();
	});

	App.TopPage.show();

});

