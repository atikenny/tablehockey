Results = new Mongo.Collection('results');
Players = new Mongo.Collection('players');

if (Meteor.isClient) {
  var defaultContent = 'results';

  function getNewResult() {
    var players = Players.find().fetch(),
        now = new Date();
    
    return {
      date: now.getFullYear() + '-' + +(now.getMonth() + 1) + '-' + now.getDate(),
      team1: {
        player1: players[0].name,
        player2: players[1].name,
        score: 0,
        won: false
      },
      team2: {
        player1: players[2].name,
        player2: players[3].name,
        score: 0,
        won: false
      }
    };
  }

  Session.setDefault('shownContent', defaultContent);

  Template.results.helpers({
    results: function () {
      return Results.find({}, { sort: { date: -1 } });
    },
    show: function () {
      return Session.get('shownContent') === 'results';
    }
  });

  Template.result.rendered = function () {
    $('.datetimepicker').datetimepicker({
      pickTime: false
    });
  };

  Template.result.events({
    "click .delete-button": function () {
      Results.remove(this._id);
    },
    "change .result-container, click .team-container": function (event, template) {
      var score1 = +template.$('[name="score1"]').val(),
        score2 = +template.$('[name="score2"]').val();

      Results.update(this._id, {$set: {
        date: template.$('[name="date"]').val(),
        team1: {
          player1: template.$('.selected[data-name="team[0]player[0]"]').html(),
          player2: template.$('.selected[data-name="team[0]player[1]"]').html(),
          score: score1,
          won: score1 > score2
        },
        team2: {
          player1: template.$('.selected[data-name="team[1]player[0]"]').html(),
          player2: template.$('.selected[data-name="team[1]player[1]"]').html(),
          score: score2,
          won: score1 < score2
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

  Template.navigation.helpers({
    isActive: function (content) {
      return Session.get('shownContent') === content;
    }
  });
  
  Template.navigation.events({
    "click #statsButton": function () {
      if (Session.get('shownContent') === 'stats') {
        Session.set('shownContent', defaultContent);
      } else {
        Session.set('shownContent', 'stats');
      }
    },
    "click #addButton": function () {
      var newResult = getNewResult();
      
      Results.insert(newResult);
    }
  });

  Template.stats.helpers({
    teamStats: function () {
      var teamStats = [],
          results = Results.find().fetch();

      function isResultMatchingTeam(resultTeam, stat) {
        return stat.player1 === resultTeam.player1 && stat.player2 === resultTeam.player2 || stat.player1 === resultTeam.player2 && stat.player2 === resultTeam.player1;
      }

      function setStat(stat, thisTeam, opponentTeam) {
        stat.player1 = stat.player1 || thisTeam.player1;
        stat.player2 = stat.player2 || thisTeam.player2;
        stat.points = stat.points || 0;
        stat.goalsFor = stat.goalsFor || 0;
        stat.goalsAgainst = stat.goalsAgainst || 0;
        stat.winCount = stat.winCount || 0;
        stat.lossCount = stat.lossCount || 0;
        stat.tieCount = stat.tieCount || 0;
        
        stat.goalsFor += thisTeam.score;
        stat.goalsAgainst += opponentTeam.score;

        if (thisTeam.won) {
          stat.points += 3;
          stat.winCount++;
        }

        if (opponentTeam.won) {
          stat.lossCount++;
        }

        if (!thisTeam.won && !opponentTeam.won) {
          stat.points += 1;
          stat.tieCount++;
        }
      }

      results.forEach(function (result) {
        var foundTeam1 = false,
            foundTeam2 = false,
            tempStatTeam1 = {},
            tempStatTeam2 = {};

        teamStats.forEach(function (teamStat, index) {
          if (isResultMatchingTeam(result.team1, teamStat)) {
            setStat(teamStats[index], result.team1, result.team2);

            foundTeam1 = true;
          }

          if (isResultMatchingTeam(result.team2, teamStat)) {
            setStat(teamStats[index], result.team2, result.team1);

            foundTeam2 = true;
          }
        });

        if (!foundTeam1) {
          setStat(tempStatTeam1, result.team1, result.team2);
          teamStats.push(tempStatTeam1);
        }

        if (!foundTeam2) {
          setStat(tempStatTeam2, result.team2, result.team1);
          teamStats.push(tempStatTeam2);
        }
      });

      teamStats.sort(function (a, b) {
        return b.points - a.points;
      });

      return teamStats;
    },
    show: function () {
      return Session.get('shownContent') === 'stats';
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
