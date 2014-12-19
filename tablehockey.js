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
    allPlayers: function () {
      return Players.find();
    },
    isChecked: function (currentPlayer, selectedPlayer) {
      return currentPlayer === selectedPlayer;
    }
  });
  
  Template.result.events({
    "click .delete-button": function () {
      Results.remove(this._id);
    },
    "change .result-container": function (event, template) {
      Results.update(this._id, {$set: {
        date: template.$('[name="date"]').val(),
        team1: {
          player1: template.$('[name="team[0]player[0]"]:checked').val(),
          player2: template.$('[name="team[0]player[1]"]:checked').val(),
          score: template.$('[name="score1"]').val()
        },
        team2: {
          player1: template.$('[name="team[1]player[0]"]:checked').val(),
          player2: template.$('[name="team[1]player[1]"]:checked').val(),
          score: template.$('[name="score2"]').val()
        }
      }});
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
          score: 0
        },
        team2: {
          player1: players[2].name,
          player2: players[3].name,
          score: 0
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
