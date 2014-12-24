Results = new Mongo.Collection('results');
Players = new Mongo.Collection('players');

if (Meteor.isClient) {
  Template.results.helpers({
    results: function () {
      return Results.find({}, { sort: { date: -1 } });
    }
  });

  Template.result.rendered = function () {
    $('.datetimepicker').datetimepicker({
      pickTime: false
    });
  };

  Template.result.helpers({
    isWinner: function (team, winner) {
      return team === winner ? 'winner' : '';
    }
  });

  Template.result.events({
    "click .delete-button": function () {
      Results.remove(this._id);
    },
    "change .result-container, click .team-container": function (event, template) {
      var score1 = +template.$('[name="score1"]').val(),
        score2 = +template.$('[name="score2"]').val(),
        team1Won = '',
        team2Won = '';

      if (score1 > score2) {
        team1Won = 'winner';
      } else if (score2 > score1) {
        team2Won = 'winner';
      }

      Results.update(this._id, {$set: {
        date: template.$('[name="date"]').val(),
        team1: {
          player1: template.$('.selected[data-name="team[0]player[0]"]').html(),
          player2: template.$('.selected[data-name="team[0]player[1]"]').html(),
          score: score1,
          won: team1Won
        },
        team2: {
          player1: template.$('.selected[data-name="team[1]player[0]"]').html(),
          player2: template.$('.selected[data-name="team[1]player[1]"]').html(),
          score: score2,
          won: team2Won
        }
      }});
    }
  });

  Template.playerButtons.helpers({
    allPlayers: function () {
      return Players.find();
    },
    isSelected: function (currentPlayer, selectedPlayer) {
      return currentPlayer === selectedPlayer ? 'selected' : '';
    }
  });

  Template.playerButtons.events({
    "click .players-container": function (event, template) {
      template.$('.player').removeClass('selected');
      event.target.classList.add('selected');
    }
  });
  
  Template.addButton.events({
    "click #addButton": function () {
      var players = Players.find().fetch(),
        now = new Date();
      
      Results.insert({
        date: now.getFullYear() + '-' + +(now.getMonth() + 1) + '-' + now.getDate(),
        team1: {
          player1: players[0].name,
          player2: players[1].name,
          score: 0,
          won: ''
        },
        team2: {
          player1: players[2].name,
          player2: players[3].name,
          score: 0,
          won: ''
        }
      });
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    var attila = Players.find({ name: 'Attila Bartha' }).fetch(),
        adam = Players.find({ name: 'Igor Mucsicska' }).fetch(),
        igor = Players.find({ name: 'Ádám Gráf' }).fetch(),
        tamas = Players.find({ name: 'Tamás Meleg' }).fetch();
    
    if (_.isEmpty(attila)) {
      Players.insert({
        name: 'Attila Bartha'
      });
    }
    
    if (_.isEmpty(adam)) {
      Players.insert({
        name: 'Igor Mucsicska'
      });
    }
    
    if (_.isEmpty(igor)) {
      Players.insert({
        name: 'Ádám Gráf'
      });
    }
    
    if (_.isEmpty(tamas)) {
      Players.insert({
        name: 'Tamás Meleg'
      });
    }
  });
}
