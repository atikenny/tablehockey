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

  function getStats() {
    var stats = {
          teamStats: [],
          playerStats: []
        },
        results = Results.find().fetch();

    function isResultMatchingTeam(resultTeam, stat) {
      return stat.player1 === resultTeam.player1 && stat.player2 === resultTeam.player2 || stat.player1 === resultTeam.player2 && stat.player2 === resultTeam.player1;
    }

    function setTeamStat(stat, thisTeam, opponentTeam) {
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

    function setTeamStats(teamStats, thisTeamResult, opponentTeamResult) {
      var foundTeam = false,
          tempStatTeam = {};

      teamStats.forEach(function (teamStat, index) {
        if (isResultMatchingTeam(thisTeamResult, teamStat)) {
          setTeamStat(teamStat, thisTeamResult, opponentTeamResult);

          foundTeam = true;
        }
      });

      if (!foundTeam) {
        setTeamStat(tempStatTeam, thisTeamResult, opponentTeamResult);
        teamStats.push(tempStatTeam);
      }
    }

    function setPlayerStat(stat, player, thisTeam, opponentTeam) {
      stat.name = stat.name || player;
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

    function setPlayerStats(playerStats, player, thisTeamResult, opponentTeamResult) {
      var foundPlayer = false,
          tempStatPlayer = {};

      playerStats.forEach(function (playerStat, index) {
        if (player === playerStat.name) {
          setPlayerStat(playerStat, player, thisTeamResult, opponentTeamResult);

          foundPlayer = true;
        }
      });

      if (!foundPlayer) {
        setPlayerStat(tempStatPlayer, player, thisTeamResult, opponentTeamResult);
        playerStats.push(tempStatPlayer);
      }
    }

    results.forEach(function (result) {
      setTeamStats(stats.teamStats, result.team1, result.team2);
      setTeamStats(stats.teamStats, result.team2, result.team1);
      setPlayerStats(stats.playerStats, result.team1.player1, result.team1, result.team2);
      setPlayerStats(stats.playerStats, result.team1.player2, result.team1, result.team2);
      setPlayerStats(stats.playerStats, result.team2.player1, result.team2, result.team1);
      setPlayerStats(stats.playerStats, result.team2.player2, result.team2, result.team1);
    });

    return stats;
  }

  Session.setDefault('shownContent', defaultContent);

  Meteor.subscribe('players');
  Meteor.subscribe('results');

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
      if (Session.get('shownContent') === defaultContent) {
        Results.insert(getNewResult());
      }
    }
  });

  Template.stats.helpers({
    teamStats: function () {
      var stats = getStats();

      stats.teamStats.sort(function (a, b) {
        return b.points - a.points;
      });

      return stats.teamStats;
    },
    playerStats: function () {
      var stats = getStats();

      stats.playerStats.sort(function (a, b) {
        return b.points - a.points;
      });

      return stats.playerStats;
    },
    show: function () {
      return Session.get('shownContent') === 'stats';
    }
  });
}

if (Meteor.isServer) {
  function initPlayers() {
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
  }

  Meteor.startup(function () {
    initPlayers();
  });

  Meteor.publish('results', function () {
    return Results.find();
  });

  Meteor.publish('players', function () {
    return Players.find();
  });

  Results.allow({
    insert: function (userId) {
      return !!userId;
    },
    update: function (userId) {
      return !!userId;
    },
    remove: function (userId) {
      return !!userId;
    }
  });
}
