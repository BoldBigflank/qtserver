var _ = require('underscore')
  , fs = require('fs')
  , levenshtein = require('./levenshtein.js')

var EventEmitter = require('events').EventEmitter;

module.exports = new EventEmitter();

var prepTime = 5 * 1000;
var roundTime = 5 * 1000;

var game = {
    title:null
    , answered:[]
    , state:"prep"
    , players:[]
    , begin:null
    , end:null
    , winner:{}
    , count:null
} // prep, active, ended

var answers = []

var init = function(cb){
    game = {
        title:null
        , answered:[]
        , state:"prep"
        , players:[]
        , begin:null
        , end:null
        , winner:{}
        , count:null
    }

    fs.readFile('categories/pokemon.txt', function(err, data) {
        if(err) throw err;

        var dataArray = data.toString().split("\n");
        title = dataArray[0];
        answers = dataArray.splice(0,1);
        game.count = answers.length

        fs.readFile('names.txt', function(err, data) {
            if(err) throw err;
            names = _.shuffle(data.toString().split("\n"));

            newRound(function(){
                console.log("Game initalized")
            })
        });
    });

}

newRound = function(cb){
    // Remove the current entries from the players
    for(var index in game.players){
        var player = game.players[index]
        player.answers = []
        game.players[index] = player
    }

    // Pick the beginning time
    var now = new Date().getTime(); // Milliseconds
    var begin = now + prepTime;
    game.begin = begin;

    var end = begin + roundTime;
    game.end = end;

    game.answers = []
    game.state = "prep"; // DEBUG: Make prep first in prod
    setTimeout(function(){
        console.log("timer 1 ended")
        setState('active', function(err, res){
            if(!err)
                module.exports.emit('state', res)
        })
    }, prepTime);
    setTimeout(function(){
        console.log("timer 2 ended")
        setState('ended', function(err, res){
            if(!err)
                module.exports.emit('state', res)
        })
    }, prepTime + roundTime);
    cb()
}

// *** TODO: change the state and fire the event when the time is right ***

exports.join = function(uuid, cb){
    if(uuid === undefined) {
        cb("UUID not found")
        return
    }
    var player = _.find(game.players, function(player){ return player.id == uuid })
    if( typeof player === 'undefined'){
        var player = {
            id: uuid
            , name: names.shift() || uuid
            , answers: []
            , score: 0
            , status: 'active'
        }
        game.players.push(player)
    }
    cb(null, {players: game.players})
}

exports.leave = function(id){
    // Remove their player
    var player = _.find(game.players, function(player){ return player.id == id })
    game.players = _.without(game.players, player)

}

exports.getAnswers = function(){ return game.answers }

exports.getGame = function(){ return game }

exports.getScores = function(){
    return _.map(game.players, function(val, key){ return { id:val.id, name:val.name, score:val.answers.length }; })
}

exports.getPlayers = function(){ return game.players }

exports.getPlayer = function(uuid){ return _.find(game.players, function(player){ return player.id == uuid })}

exports.getState = function(){ return game.state }

exports.getTitle = function(){ return game.title }

exports.getWinner = function(){ return game.winner }

exports.getScoreboard = function(){
    return {
        title: game.title
        , scores: _.map(game.players, function(val, key){ return { id:val.id, name:val.name, score:val.answers.length }; })
        , players: game.players.length
        , answered: game.answered.length
        , answers: answers.length
    }

}

exports.setName = function(id, name, cb){
    var p = _.find(game.players, function(player){ return player.id == id })
    if(p) p.name = name
    cb(null, { players: game.players })
}

function setState(state, cb){
    // Only start new rounds when the last is done
    if(game.state != "ended" && state == "prep") return cb("Only start new rounds when the last is done")

    // entry, vote, result
    game.state = state

    if(state=="prep"){ // New round
        game.help = "Be prepared to list answers that fit the following category."
    }
    else if (state == "active")
        game.help = "List items that fit the category."
    else if (state == "ended")
        game.help = "The round has ended.  Click 'New Round' to begin."
    else 
        game.help = "";
    cb(null, game)
}

exports.addAnswer = function(id, guess, cb){
    if(game.state != "active") return cb("Not accepting answers");

    var correctAnswer = _.find(answers, function(answer){
        return levenshtein.distance(guess, answer) < 2;
    })
    // If it's in the answers array and not in the answered array
    if(correctAnswer){
        var correctIndex = _.indexOf(answers, correctAnswer)
        // If it's in the answered array
        if(_.where(game.answered, {index:correctIndex}).length > 0){
            // error 'already found'
            cb("This answer was already found")
            return;
        } else {
            // Add to answered array
            var answerObject = {
                index:correctIndex,
                text:correctAnswer,
                time: new Date().getTime() - game.begin
            }
            game.answered.push(answerObject);

            // Add to player's answers with timestamp
            var player = _.find(game.players, function(p){ return p.uuid ==  id; });
            player.answered.push(correctIndex)
            game.players = _.sort(game.players, function(player){return -1 *  player.answered.length;});
        }

    } else {
        // error 'incorrect answer'
        cb(guess + " is incorrect.")
        return;
    }
    return cb(null, { answers: game.answered, players: game.players, state: game.state })
}

exports.reset = function(cb){
    init()
    cb(null, game)
}

// Not used
exports.endRound = function(id, vote, cb){
    // Set the winner
    var winningPlayer = _.max(game.players, function(player){
        return player.answered.length
    })
    var winner = {
        name: winningPlayer.name
        , title: game.title
        , score: winningPlayer.answered.length
        , id: winningPlayer.id
    }
    game.winner = winner
    // Start new round
    // newRound()
    this.emit(null, {winner:winner})
}

init()