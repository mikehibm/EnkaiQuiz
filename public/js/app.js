/// <reference path="jquery-1.11.2.min.js" />
	
$(function(){
	if (console) console.log("動いています!", new Date());
	
	var socket = io();
	if (console) console.log("connected", new Date);
	
	socket.on('message', function(data){
	    console.log(data.message);
	});	
	
//	socket.on('clock', function(data){
//        $('#clock').text(data.date);
//    });
	
// 	$('#text').keypress(function(e){
//      socket.emit('client_data', {'letter': String.fromCharCode(e.charCode)});
//    });	
});

