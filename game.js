var _ = require('underscore')
  , fs = require('fs')
  , levenshtein = require('./levenshtein.js');

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
        // Shuffle
        newRound()
    });

    fs.readFile('names.txt', function(err, data) {
        if(err) throw err;
        names = _.shuffle(data.toString().split("\n"));
        // Shuffle
        newRound()
    });
}

newRound = function(callback){
    // Remove the current entries from the players
    for(var index in game.players){
        var player = game.players[index]
        player.answers = []
        game.players[index] = player
    }

    // Pick the beginning time
    var now = new Date().getTime(); // Milliseconds
    var begin = now + 30000;
    game.begin = begin;

    var end = begin + 60000;
    game.end = end;

    game.answers = []
    game.state = "active"; // DEBUG: Make prep first in prod
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

exports.setState = function(id, state, cb){
    // Only start new rounds when the last is done
    if(game.state != "ended" && state == "prep") return cb("Only start new rounds when the last is done")

    // Only end the entry round when there are entries
    if(game.state == "active" && state == "ended" && game.entries.length === 0) return cb("Must have at least one entry")

    // entry, vote, result
    game.state = state

    if(state=="prep"){ // New round
        // Set the state
        game.state = "prep"
        game.answered = []
        game.help = "Be prepared to list answers that fit the following category."
    }
    else if (state == "active")
        game.help = "List items that fit the category."
    else if (state == "ended")
        game.help = "The round has ended.  Click 'New Round' to begin."
    else
        game.help = "";
    return cb(null, { state: game.state })
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
        // TODO UPDATE
        if(_.contains(game.answered, correctIndex)){
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
    newRound()
    cb(null, game)
}

init()