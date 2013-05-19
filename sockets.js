var socketio = require('socket.io')
var game = require('./game.js')
var availableUUID = 1;

module.exports.listen = function(app){
    io = socketio.listen(app)

    io.configure(function () { 
      io.set("transports", ["xhr-polling"]); 
      io.set("polling duration", 10); 
    });

    io.sockets.on('connection', function (socket) {
      socket.on('join', function(cb){

        //Turn off persistence
        uuid = availableUUID++;

        socket.set('uuid', uuid)
        game.join(uuid, function(err, res){
          if (err) { socket.emit("alert", err) }
          else{ 
              socket.emit('game', game.getGame() )
              io.sockets.emit("game", res ) 
          }
        })
        cb(uuid)
      })

      // User leaves
      socket.on('disconnect', function(){
        // Don't destroy data when people leave.  Besides, it is buggy
        // socket.get('uuid', function(err, uuid){
        //   if(typeof uuid !== 'undefined' ) game.leave(uuid)
        // })
        // io.sockets.emit("game", { czar:game.getCzar(), players: game.getPlayers() } )
        console.log("Disconnect: ", socket.id)
      })
      
      socket.on('name', function(data){
        socket.get('uuid', function(err, uuid){
          game.setName(uuid, data, function(err, res){
            if (err) { socket.emit("alert", err) }
            else{ io.sockets.emit("game", res ) }
          })
          
        })
      })

      // Answer
      socket.on('answer', function(answer, cb){
        // add the entry
        socket.get('uuid', function(err, uuid){
          game.addAnswer(uuid, answer, function(err, res){
            if (err) { socket.emit("alert", err) }
            else{ io.sockets.emit("game", res ) }
          })  
        })
        
      })

      // State
      socket.on('state', function(data){
        // add the entry
        socket.get('uuid', function(err, uuid){
          game.setState(uuid, data, function(err, res){
            if (err) { socket.emit("alert", err) }
            else{ io.sockets.emit("game", res ) }
          })  
        })
      })

      socket.on('reset', function(data){
        game.reset(function(err, res){
          if (err) { socket.emit("alert", err) }
          else{ 
            io.sockets.emit("game", res ) 
          }
        })
      })
    });

    return io
}