var socketio = require('socket.io')
var game = require('./game.js')

module.exports.listen = function(app){
    io = socketio.listen(app)

    io.sockets.on('connection', function (socket) {
      console.log("Connection", socket.id)
      io.configure(function () { 
        io.set("transports", ["xhr-polling"]); 
        io.set("polling duration", 10); 
      });

      socket.on('join', function(uuid){
        socket.set('uuid', uuid)
        game.join(uuid, function(err, res){
          if (err) { socket.emit("alert", err) }
          else{ io.sockets.emit("game", res ) }
        })
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

      // Entry
      socket.on('entry', function(entry, cb){
        // add the entry
        socket.get('uuid', function(err, uuid){
          game.addEntry(uuid, entry, function(err, res){
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

      // Vote
      socket.on('vote', function(data){
        socket.get('uuid', function(err, uuid){
          game.setVote(uuid, data, function(err, res){
            if (err) { socket.emit("alert", err) }
            else{ 
              io.sockets.emit("game", res ) 
            }
          })  
        })
      })

      socket.on('email', function(data){
        var winner = game.getWinner
        socket.get('uuid', function(err, uuid){
          var message = "Greetings from Meta4,\n  "
          var player = game.getPlayer(uuid) || {}
          var winner = game.getWinner() || {}
          if(player.id == winner.id)
            message += player.name + " just won a round of Meta4.  To describe '" + winner.bcard + "', " + player.name + " used the card '" + winner.wcard + "'.  "
          message += "Join " + player.name + " at http://meta4.herokuapp.com"
          email.brag(data, player.name, message)
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