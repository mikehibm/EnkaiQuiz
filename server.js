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
        default:
            response.writeHead(404);
            response.write("Not found - 404");
            response.end();
            break;
    }
});

var io = require('socket.io')(server);

io.on('connection', function(socket){
    console.log('a user connected', process);
    
    socket.data = socket.data || {};
    socket.data.startTime = new Date();

    var emitProcStat = function(){
        var procstat = {
            pid: process.pid || 0,
            conCount: socket.client.conn.server.clientsCount,
            gameCount: myapp.games.length,
        };
    
        //socket.emitだと一人だけに送信する。io.emitだと全員に送信する。
        io.emit('procstat', procstat);
    };
    
    emitProcStat();
    
    socket.on('disconnect', function(){
        console.log('user disconnected', socket.data);
        
        if (socket.data.player){
            //player.passCodeから参加しているgameを探す。
            var game = myapp.findGame(socket.data.player.passCode);
            game.removePlayer(socket.data.player);
            
            var data = { 
                player: socket.data.player,
                players: game.players
            };
            io.emit('exit', data);
            
            //参加者が居なくなった終了済みの大会を削除。
            if (game.state === myapp.Game.STATE_FINISHED && game.players.length <= 0){
                myapp.removeGame(game);
                console.log("Game '"+ game.gameName + "' was removed.");
            }
        }
        
        emitProcStat();
    });
    
    socket.on('open_game', function(data){
        console.log("open_game: " + data);
        
        //Gameオブジェクトを生成。
        var game = myapp.createGame(data.gameName);
        
        //主催者だけに返信。
        socket.emit('open_game_ok', { 
           gameName: game.gameName, 
           passCode: game.passCode,
           nickname: '主催者さん', 
           mode: 'master',
           players: game.players 
        }); 

        emitProcStat();
    });
    
    socket.on('send_pass', function(data){
        console.log("send_pass: ", data);
       
        //data.passCodeから参加受付中のgameを探す。
        var game = myapp.findGame(data.passCode);
        
        if (game && game.state !== myapp.Game.STATE_WAITING && data.mode === 'play'){
           socket.emit('send_pass_result', { error: '大会はもう始まっています。', field: 'passCode', mode: data.mode }); 
           return;
        }

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
            var player = game.addPlayer(data.nickname, data.mode, data.passCode);
            //ソケットにPlayerを紐付ける。
            socket.data.player = player;
            
            //参加した人以外の全員に通知。(本来は該当の大会の参加者のみにおくるべき)
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
    
    socket.on('start_game', function(data){
        console.log("start_game: ", data);
        
        //data.passCodeから参加受付中のgameを探す。
        var game = myapp.findGame(data.passCode);
        if (!game){
           socket.emit('start_game_result', { error: '大会の情報が見つかりません。', passCode: data.passCode }); 
           return;
        }
        if (game.state !== myapp.Game.STATE_WAITING){
           socket.emit('start_game_result', { error: '大会は既に始まっているかまたは終了しています。', passCode: data.passCode }); 
           return;
        }
        game.start(data.quiz);

        //接続している全員に通知。(本来は該当の大会の参加者のみにおくるべき)
        io.emit('start_game_result', { 
            gameName: data.gameName, 
            passCode: data.passCode,
            stageName: data.stageName,
            current: data.current,
            total: data.total,
            quiz: data.quiz
        });

        emitProcStat();
    });
    
    socket.on('quiz_next', function(data){
        console.log("quiz_next: ", data);
        var game = myapp.findGame(data.passCode);
        if (!game){
           socket.emit('quiz_next_result', { error: '大会の情報が見つかりません。', passCode: data.passCode }); 
           return;
        }
        
        game.next(data.quiz);

        //接続している全員に通知。(本来は該当の大会の参加者のみにおくるべき)
        io.emit('quiz_next_result', { 
            gameName: data.gameName, 
            passCode: data.passCode,
            stageName: data.stageName,
            current: data.current,
            total: data.total,
            quiz: data.quiz
        });
    });
    
    socket.on('quiz_finish', function(data){
        console.log("quiz_finish: ", data);
        
        //data.passCodeから参加受付中のgameを探す。
        var game = myapp.findGame(data.passCode);
        if (!game){
           socket.emit('quiz_finish_result', { error: '大会の情報が見つかりません。', passCode: data.passCode }); 
           return;
        }
        game.finish();

        //接続している全員に通知。(本来は該当の大会の参加者のみにおくるべき)
        io.emit('quiz_finish_result', { 
            gameName: data.gameName, 
            passCode: data.passCode,
            stageName: data.stageName,
            current: data.current,
            total: data.total
        });

        emitProcStat();
    });
    
    socket.on('answer', function(data){
        console.log("answer: ", data);
        var game = myapp.findGame(data.passCode);
        if (!game){
           socket.emit('answer_result', { error: '大会の情報が見つかりません。' }); 
           return;
        }
        
        var player = game.findNickname(data.nickname);
        if (!player){
           socket.emit('answer_result', { error: '参加者の情報が見つかりません。' }); 
           return;
        }
        
        if (data.correct){
            player.point += game.correct(data.nickname);
        } else {
            player.point += game.ng();
        }
        game.sortPlayers();
       
        //全員に最新の得点を通知。(本来は該当の大会の参加者のみにおくるべき)
        var send_data = {
            passCode: data.passCode,
            players: game.players,
            winners: game.currentQuiz.winners
        };
        io.emit('answer_result', send_data); 
    });
    
});

server.listen(process.env.PORT || 8080);
