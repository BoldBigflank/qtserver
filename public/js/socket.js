/** @jsx React.DOM */
var socket = io.connect();
console.log("socket is defined");
var game = {};

var GameComponent = React.createClass({
	getInitialState: function(){
		return {
	        title:null
	        , round:0
	        , correctAnswer:null
	        , answers:[]
	        , now:0
	        , state:"ended"
	        , players:[]
	        , begin:0
	        , end:1
	        , winner:{}
	        , count:null
    	}
	},
	componentDidMount: function(){
		var self = this
		socket.on("game", function(data){
			console.log("game", data);
			self.setState(data);
		})
	},
	render: function(){
		// var items = this.state.answers.map(function(answer) {
		// 	return <Answer answer={answer}/>
		// })
		// return <span class="round">{this.state.round}</span>;
		var next = (this.state.state == 'ended') ? <button id="begin-btn" class="btn btn-large btn-primary">Next</button> : <div class="div-info alert alert-info">This question is worth {percent*10} points.</div>;
		var answer = (this.state.state == 'ended') ? <div class="div-info alert alert-info"> {this.state.correctAnswer}</div> : "";
		var timestamp = new Date().getTime();
		var timestamp_diff = timestamp - this.state.now;
		if(timestamp < this.state.end){
			percent = parseInt((this.state.end - timestamp) / (this.state.end-this.state.begin) * 100);
			if(percent > 100) percent = 100;
		} else {
			percent = 0;
		}
		var barStyle = {width:percent + "%"};
		return (
			<div>
				<div class="progress progress-striped" id="timer">
				  	<div class="progress-bar progress-bar-info" style={barStyle}></div>
				</div>
				<div class="timebar bar" >
				    	<i class="glyphicon-time glyphicon-white"></i>{percent*10}
				  	</div>
				
				<div class="jumbotron">
					<h1>
						Question {this.state.round}
					</h1>
					<p class="title">
						{this.state.title}
					</p>
					{answer}
				</div>
				{next}
				
				<div class="answers">
					<a class="btn btn-block btn-large btn-primary answer-btn">{this.state.answers[0]}</a>
					<a class="btn btn-block btn-large btn-danger answer-btn">{this.state.answers[1]}</a>
					<a class="btn btn-block btn-large btn-warning answer-btn">{this.state.answers[2]}</a>
					<a class="btn btn-block btn-large btn-success answer-btn">{this.state.answers[3]}</a>
				</div>
			</div>
        );
	}
});

// var Answer = React.createClass({
// 	onClick: function(e){
// 		e.stopPropagation();
// 		socket.emit('answer', guess, function(message){
// 			// update a helper div with this information

// 		})
// 	},
// 	render: function(){
// 		return <a onClick={this.onClick} class="btn btn-block btn-large btn-primary answer">{this.props.answer}</a>
// 	}
// });
setInterval(function() {
        React.renderComponent(
          GameComponent({timestamp: new Date().getTime()}),
          document.getElementById('question-panel')
        );
      }, 50);

(function($, undefined){
  $(document).ready(function(){
  	React.renderComponent(<GameComponent />, $("#question-panel")[0]);
  	console.log("preparing for sockets");
    // var users = new Users();
    // var leaderboard = new Leaderboard();
    // var answers = new Answers();
    // var user_info = new UserInfo();
    // var countdown = new Countdown();
    // var notify = new Notify();

    socket.on('answers', function (data) {
      //console.log('answers array', data);
      var tiles = $('.tiles .tile');
      for(var i = 0; i < data.length; i++){
        if(typeof tiles.eq(i).data('flipped') == 'undefined'){
          tiles.eq(i).html('<span class="answer_grey">' + data[i] + '</span>');
        }
      }
    });

    // socket.on('game', function (data) {

    // 	console.log("socket game", game)
    // 	game = data
    	
    // 	// Round number
    // 	$(".round").text(game.round)

    // 	// The timer will go to (end-now)/(begin-end)
    // 	var percent = (game.end - game.now) / (game.begin-game.end) * 100;
    // 	$(".timebar").attr("style", "width: " + percent + "%");
    // 	// TODO: Animate this

    // 	if(game.state == "ended") $("#begin-btn").show()
    // 	else $("#begin-btn").hide()

    // 	$(".title").text(game.title)

    // 	$($(".answer")[0]).text(game.answers[0]).attr("answer", game.answers[0])
    // 	$($(".answer")[1]).text(game.answers[1]).attr("answer", game.answers[1])
    // 	$($(".answer")[2]).text(game.answers[2]).attr("answer", game.answers[2])
    // 	$($(".answer")[3]).text(game.answers[3]).attr("answer", game.answers[3])

    // });

    socket.emit('join', function(playerObj){
    	console.log("emitted join", playerObj)
    	$(".username").text(playerObj.name)
    });

    socket.on('alert', function (data) {
    	console.log("socket alert", data)
    });

    //Begin game
    $(document).on('click', '#begin-btn', function(){
      socket.emit('state', 'prep', function(err, res){
        // console.log('sent answer');
        // console.log(res);
        // console.log(err);
      });
    });

    $('#info_bar .username').click(function(){
      $('#username_modal').modal();
    });
    //Answer submit
    // $('#answer-input').keypress(function(e){
    //   if(e.which === 13){
    //     console.log('return');
    //   }
    // });
    $('.answer-btn').click(function(){
		var val = $(this).text();
		console.log("answering", val)
		if(val !== ''){
			// console.log('test');
			socket.emit('answer', val);
		}
    });

    //Username update
    $('.update-name').click(function(){
    	// var val = $('#username-input').val();
    	var val = prompt("What is your name?")
		if(!val) return;
    	$('.username').text(val)
    	if(val !== ''){
        	socket.emit('name', val, function(err, res){

        	// console.log(res);
        	});
      	}
    });

    $("#begin-btn").click(function(){
    	console.log("click")
    	socket.emit("state", "prep", function(err, res){

    	})
    	return false;
    });

  });

})(jQuery);