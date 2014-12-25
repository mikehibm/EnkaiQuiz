var http = require('http');
var url = require('url');
var fs = require('fs');
var myapp = require("./game");

var server = http.createServer(function (request, response) {
    var path = url.parse(request.url).pathname;
    console.log("path=" + path, __dirname);

    switch(path){
        case '/':
            fs.readFile(__dirname + '//public//index.html', function(error, data){
                if (error){
                    response.writeHead(404);
                    return response.end("index.html not found - 404");
                }
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end(data, "utf8");
            });

            break;
        case '/hello':
        case '/hello/':
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write("<!DOCTYPE html><html lang='ja'>");
            response.write("  <head><meta charset='UTF-8'></head>");
            response.write("  <body>Hello! <br />こんにちは!</body>");
            response.write("</html>");
            response.end();
            break;
        default:
            response.writeHead(404);
            response.write("Not found - 404");
            response.end();
            break;
    }
});

var io = require('socket.io')(server);

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
    
    //socket.emitだと一人だけに送信する。io.emitだと全員に送信する。
    io.emit('message', {'message': 'ようこそ!  サーバー時刻は ' + new Date() + "です。"});

//    setInterval(function(){
//        socket.emit('clock', {'date': new Date()});
//    }, 1 * 1000);
    
    //recieve client data
    socket.on('client_data', function(data){
        //socket.broadcast.emitを使うと該当socket以外の全員に送信される。
        socket.broadcast.emit('message', {'message': data.letter});
    });
    
    socket.on('open_game', function(data){
        console.log("open_game: " + data);
        
        //Gameオブジェクトを生成。
        var game = myapp.createGame(data.gameName);
        
        socket.emit('open_game_ok', { 
           gameName: game.gameName, 
           passCode: game.passCode,
           nickname: '主催者さん', 
           mode: 'master',
           players: game.players 
        }); 
    });
    
    socket.on('send_pass', function(data){
        console.log("send_pass: ", data);
       
        //data.passCodeから参加受付中のgameを探す。
        var game = myapp.findGame(data.passCode);

        //passCodeが一致するものが見つからなければエラーを返す。
        if (!game){
           socket.emit('send_pass_result', { error: 'パスコードが違います。', field: 'passCode', mode: data.mode }); 
           return;
        }
       
        //data.nicknameが既に同じ大会内で存在していたらエラーを返す。
        if (game.findNickname(data.nickname)){
           socket.emit('send_pass_result', { error: 'ニックネームが既に使われています。', field: 'nickname', mode: data.mode }); 
           return;
        }
       
        if (data.mode == 'play'){
            //参加者リストに追加。
            game.addPlayer(data.nickname);
            
            //参加した人以外の全員に通知。
            socket.broadcast.emit('new_player', { 
               gameName: game.gameName, 
               passCode: game.passCode,
               nickname: data.nickname, 
               mode: data.mode,
               players: game.players
            });
        }

        //参加した人に返信。
        socket.emit('send_pass_result', { 
           gameName: game.gameName, 
           passCode: game.passCode,
           nickname: data.nickname, 
           mode: data.mode,
           players: game.players
        }); 
       
    });
    
});

server.listen(process.env.PORT || 8080);
