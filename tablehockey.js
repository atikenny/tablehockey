Results = new Mongo.Collection('results');
Players = new Mongo.Collection('players');
Teams = new Mongo.Collection('teams');
Tournaments = new Mongo.Collection('tournaments');

if (Meteor.isClient) {
  var defaultContent = 'results';

  Session.setDefault('shownContent', defaultContent);
  Session.setDefault('activeTournament', 'round two');

  function getNewResult() {
    var teams = Teams.find({ name: {$in: getActiveTournamentTeams()} }).fetch(),
        now = new Date(),
        date;

    date = now.getFullYear() +
      '-' +
      ('0' + +(now.getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + now.getDate()).slice(-2);
    
    return {
      date: date,
      team1: {
        player1: teams[0].players[0],
        player2: teams[0].players[1],
        score: 0,
        won: false,
        nationality: teams[0].code
      },
      team2: {
        player1: teams[1].players[0],
        player2: teams[1].players[1],
        score: 0,
        won: false,
        nationality: teams[1].code
      },
      ended: false,
      tournament: Session.get('activeTournament')
    };
  }

  function getStats() {
    var stats = {};

    function sortByPoints(a, b) {
      var order;

      if (a.points === b.points) {
        order = b.goalsFor - a.goalsFor;
      } else {
        order = b.points - a.points;
      }

      return order;
    }

    function getTeamWinCount(team) {
      return Results.find(
        {
          $and: [
            { ended: true },
            {
              $or: [
                {
                  $and: [
                    { "team1.nationality": team.code },
                    { "team1.won": true }
                  ]
                },
                {
                  $and: [
                    { "team2.nationality": team.code },
                    { "team2.won": true }
                  ]
                }
              ]
            },
            { tournament: Session.get('activeTournament') }
          ]
        }).count();
    }

    function getTeamLossCount(team) {
      return Results.find(
        {
          $and : [
            { ended: true },
            {
              $or: [
                {
                  $and: [
                    { "team1.nationality": team.code },
                    { "team2.won": true }
                  ]
                },
                {
                  $and: [
                    { "team2.nationality": team.code },
                    { "team1.won": true }
                  ]
                }
              ]
            },
            { tournament: Session.get('activeTournament') }
          ]
        }).count();
    }

    function getTeamTieCount(team) {
      return Results.find(
        {
          $and: [
            { ended: true },
            {
              $or: [
                {
                  $and: [
                    { "team1.nationality": team.code },
                    { "team1.won": false },
                    { "team2.won": false }
                  ]
                },
                {
                  $and: [
                    { "team2.nationality": team.code },
                    { "team1.won": false },
                    { "team2.won": false }
                  ]
                }
              ]
            },
            { tournament: Session.get('activeTournament') }
          ]
        }).count();
    }

    function getTeamGoalsAgainst(team) {
      var goalsAgainstTeam1,
          goalsAgainstTeam2;

      goalsAgainstTeam1 = Results
        .find({
          $and : [
            { ended: true },
            { "team1.nationality": team.code },
            { tournament: Session.get('activeTournament') }
          ]
        }).fetch()
        .map(function (result) { 
          return result.team2.score
        })
        .reduce(function (a, b) {
            return a + b;
          }, 0
        );

      goalsAgainstTeam2 = Results
        .find({
          $and : [
            { ended: true },
            { "team2.nationality": team.code },
            { tournament: Session.get('activeTournament') }
          ]
        }).fetch()
        .map(function (result) { 
          return result.team1.score
        })
        .reduce(function (a, b) {
            return a + b;
          }, 0
        );

      return goalsAgainstTeam1 + goalsAgainstTeam2;
    }

    function getTeamGoalsFor(team) {
      var goalsForTeam1,
          goalsForTeam2;

      goalsForTeam1 = Results
        .find({
          $and : [
            { ended: true },
            { "team1.nationality": team.code },
            { tournament: Session.get('activeTournament') }
          ]
        }).fetch()
        .map(function (result) { 
          return result.team1.score
        })
        .reduce(function (a, b) {
            return a + b;
          }, 0
        );

      goalsForTeam2 = Results
        .find({
          $and : [
            { ended: true },
            { "team2.nationality": team.code },
            { tournament: Session.get('activeTournament') }
          ]
        }).fetch()
        .map(function (result) { 
          return result.team2.score
        })
        .reduce(function (a, b) {
            return a + b;
          }, 0
        );

      return goalsForTeam1 + goalsForTeam2;
    }

    function getTeamStats() {
      var teamStats = [],
          teams = Teams.find({ name: {$in: getActiveTournamentTeams()} }).fetch();

      teams.forEach(function (team) {
        var winCount = getTeamWinCount(team),
            lossCount = getTeamLossCount(team),
            tieCount = getTeamTieCount(team);

        teamStats.push({
          player1:        team.players[0],
          player2:        team.players[1],
          team:           team,
          points:         winCount * 3 + tieCount,
          goalsFor:       getTeamGoalsFor(team),
          goalsAgainst:   getTeamGoalsAgainst(team),
          winCount:       winCount,
          lossCount:      lossCount,
          tieCount:       tieCount
        });
      });

      teamStats.sort(sortByPoints);

      return teamStats;
    }

    function getPlayerWinCount(playerName) {
      var teamCodes = getTeamCodesByPlayer(playerName);

      return Results.find(
        {
          $and: [
            { ended: true },
            {
              $or: [
                {
                  $and: [
                    { "team1.nationality": {$in: teamCodes} },
                    { "team1.won": true}
                  ]
                },
                {
                  $and: [
                    { "team2.nationality": {$in: teamCodes} },
                    { "team2.won": true}
                  ]
                }
              ]
            },
            { tournament: Session.get('activeTournament') }
          ]
        }).count();
    }

    function getPlayerLossCount(playerName) {
      var teamCodes = getTeamCodesByPlayer(playerName);

      return Results.find(
        {
          $and: [
            { ended: true },
            {
              $or: [
                {
                  $and: [
                    { "team1.nationality": {$in: teamCodes} },
                    { "team2.won": true}
                  ]
                },
                {
                  $and: [
                    { "team2.nationality": {$in: teamCodes} },
                    { "team1.won": true}
                  ]
                }
              ]
            },
            { tournament: Session.get('activeTournament') }
          ]
        }).count();
    }

    function getPlayerTieCount(playerName) {
      var teamCodes = getTeamCodesByPlayer(playerName);

      return Results.find(
        {
          $and: [
            { ended: true },
            { "team1.won": false},
            { "team2.won": false},
            { tournament: Session.get('activeTournament') },
            {
              $or: [
                { "team1.nationality": {$in: teamCodes} },
                { "team2.nationality": {$in: teamCodes} }
              ]
            }
          ]
        }).count();
    }

    function getPlayerGoalsAgainst(playerName) {
      var teamCodes = getTeamCodesByPlayer(playerName),
          goalsAgainstTeam1,
          goalsAgainstTeam2;

      goalsAgainstTeam1 = Results
        .find({
          $and: [
            { ended: true },
            { "team1.nationality": {$in: teamCodes} },
            { tournament: Session.get('activeTournament') }
          ]
        }).fetch()
        .map(function (result) { 
          return result.team2.score
        })
        .reduce(function (a, b) {
            return a + b;
          }, 0
        );

      goalsAgainstTeam2 = Results
        .find({
          $and: [
            { ended: true },
            { "team2.nationality": {$in: teamCodes} },
            { tournament: Session.get('activeTournament') }
          ]
        }).fetch()
        .map(function (result) { 
          return result.team1.score
        })
        .reduce(function (a, b) {
            return a + b;
          }, 0
        );

      return goalsAgainstTeam1 + goalsAgainstTeam2;
    }

    function getPlayerGoalsFor(playerName) {
      var teamCodes = getTeamCodesByPlayer(playerName),
          goalsForTeam1,
          goalsForTeam2;

      goalsForTeam1 = Results
        .find({
          $and: [
            { ended: true },
            { "team1.nationality": {$in: teamCodes} },
            { tournament: Session.get('activeTournament') }
          ]
        }).fetch()
        .map(function (result) { 
          return result.team1.score
        })
        .reduce(function (a, b) {
            return a + b;
          }, 0
        );

      goalsForTeam2 = Results
        .find({
          $and: [
            { ended: true },
            { "team2.nationality": {$in: teamCodes} },
            { tournament: Session.get('activeTournament') }
          ]
        }).fetch()
        .map(function (result) { 
          return result.team2.score
        })
        .reduce(function (a, b) {
            return a + b;
          }, 0
        );

      return goalsForTeam1 + goalsForTeam2;
    }

    function getPlayerStats() {
      var playerStats = [],
          players = Players.find().fetch();

      players.forEach(function (player) {
        var winCount = getPlayerWinCount(player.name),
            lossCount = getPlayerLossCount(player.name),
            tieCount = getPlayerTieCount(player.name);

        playerStats.push({
          name:           player.name,
          points:         winCount * 3 + tieCount,
          goalsFor:       getPlayerGoalsFor(player.name),
          goalsAgainst:   getPlayerGoalsAgainst(player.name),
          winCount:       winCount,
          lossCount:      lossCount,
          tieCount:       tieCount
        });
      });

      playerStats.sort(sortByPoints);

      return playerStats;
    }

    stats.teamStats = getTeamStats();
    stats.playerStats = getPlayerStats();

    return stats;
  }

  function getTeamsByPlayer(playerName) {
    return Teams.find({
        players: playerName
      }).fetch();
  }

  function getTeamCodesByPlayer(playerName) {
    return getTeamsByPlayer(playerName).map(function (team) {
      return team.code;
    });
  }

  function getActiveTournamentTeams() {
    var tournaments = Tournaments.findOne({ name: Session.get('activeTournament') });

    return tournaments && tournaments.teams || [];
  }

  Meteor.subscribe('players');
  Meteor.subscribe('teams');
  Meteor.subscribe('results');
  Meteor.subscribe('tournaments');

  Template.tournaments.helpers({
    tournaments: function () {
      return Tournaments.find();
    }
  });

  Template.tournament.helpers({
    selected: function () {
      return this.name === Session.get('activeTournament');
    }
  });

  Template.tournament.events({
    "click .tournament": function (event, template) {
      Session.set('activeTournament', template.data.name);
    }
  });

  Template.results.helpers({
    results: function () {
      return Results.find({ tournament: Session.get('activeTournament') }, { sort: { date: -1 } });
    },
    show: function () {
      return Session.get('shownContent') === 'results';
    }
  });

  Template.result.helpers({
    hasStarted: function () {
      return this.team1.score || this.team2.score;
    },
    isSelected: function (currentTeam, selectedTeam) {
      return currentTeam === selectedTeam ? 'selected' : '';
    },
    teams: function () {
      return Teams.find({ name: {$in: getActiveTournamentTeams()} });
    }
  });

  Template.result.rendered = function () {
    $('.date').datepicker({
      format: 'yyyy-mm-dd',
      weekStart: 1,
      todayBtn: 'linked',
      autoclose: true
    });
  };

  Template.result.events({
    "click .delete-button": function () {
      Results.remove(this._id);
    },
    "click .players-button": function (event, template) {
      template.$('.teams-container').toggleClass('open');
    },
    "change .result-container, click .teams-container": function (event, template) {
      var score1 = +template.$('[name="score1"]').val(),
        score2 = +template.$('[name="score2"]').val(),
        team1Name = template.$('.team[data-team-number="1"].selected').data('team-name'),
        team2Name = template.$('.team[data-team-number="2"].selected').data('team-name'),
        team1 = Teams.findOne({ name: team1Name }),
        team2 = Teams.findOne({ name: team2Name }),
        ended = score1 !== 0 || score2 !== 0;

      Results.update(this._id, {$set: {
        date: template.$('[name="date"]').val(),
        team1: {
          player1: team1.player1,
          player2: team1.player2,
          score: score1,
          won: score1 > score2,
          nationality: team1.code
        },
        team2: {
          player1: team2.player1,
          player2: team2.player2,
          score: score2,
          won: score1 < score2,
          nationality: team2.code
        },
        ended: ended
      }});
    },
    "click .team": function (event, template) {
      var teamNumber = event.target.dataset.teamNumber;

      template.$('[data-team-number="' + teamNumber + '"]').removeClass('selected');
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

  function initTeams() {
    var hungary = Teams.find({ name: 'hungary' }).fetch(),
        ukraine = Teams.find({ name: 'ukraine' }).fetch(),
        canada = Teams.find({ name: 'canada' }).fetch(),
        czech = Teams.find({ name: 'czech' }).fetch(),
        djibuty = Teams.find({ name: 'djibuty' }).fetch(),
        greatbritain = Teams.find({ name: 'greatbritain' }).fetch();
    
    if (_.isEmpty(hungary)) {
      Teams.insert({
        name: 'hungary',
        code: 'hu',
        players: ['Tamás Meleg', 'Attila Bartha']
      });
    }
    
    if (_.isEmpty(ukraine)) {
      Teams.insert({
        name: 'ukraine',
        code: 'ua',
        players: ['Tamás Meleg', 'Igor Mucsicska']
      });
    }
    
    if (_.isEmpty(canada)) {
      Teams.insert({
        name: 'canada',
        code: 'ca',
        players: ['Tamás Meleg', 'Ádám Gráf']
      });
    }
    
    if (_.isEmpty(czech)) {
      Teams.insert({
        name: 'czech',
        code: 'cz',
        players: ['Igor Mucsicska', 'Attila Bartha']
      });
    }

    if (_.isEmpty(djibuty)) {
      Teams.insert({
        name: 'djibuty',
        code: 'dj',
        players: ['Ádám Gráf', 'Attila Bartha']
      });
    }

    if (_.isEmpty(greatbritain)) {
      Teams.insert({
        name: 'greatbritain',
        code: 'gb',
        players: ['Ádám Gráf', 'Igor Mucsicska']
      });
    }
  }

  function getInitialTeams() {
    return ['hungary', 'ukraine', 'hungary', 'greatbritain', 'czech', 'djibuty', 'canada'];
  }

  function initTournaments() {
    var tournaments = Tournaments.find().fetch(),
        tournamentsWithoutTeams = Tournaments.find({ teams: undefined }).fetch(),
        resultsWithoutTournament = Results.find({ tournament: undefined }).fetch(),
        initialTeams = getInitialTeams();

    if (_.isEmpty(tournaments)) {
      Tournaments.insert({
        name: 'initial games',
        ended: true,
        teams: initialTeams
      });

      Tournaments.insert({
        name: 'round two',
        ended: false,
        teams: initialTeams
      });
    }

    _.each(tournamentsWithoutTeams, function (element) {
      Tournaments.update(element._id, {$set: {
        teams: initialTeams
      }});
    });

    _.each(resultsWithoutTournament, function (element) {
      Results.update(element._id, {$set: {
        tournament: 'initial games'
      }});
    });
  }

  Accounts.validateLoginAttempt(function (info) {
    var allowedEmails = [
      'atikenny@gmail.com',
      'mucsi96@gmail.com',
      'tamas.meleg@gmail.com',
      'szpadamen@gmail.com'
    ];

    return info.user && info.user.services && allowedEmails.indexOf(info.user.services.google.email) !== -1;
  });

  Meteor.startup(function () {
    initPlayers();
    initTeams();
    initTournaments();
  });

  Meteor.publish('results', function () {
    if (this.userId) {
      return Results.find();
    }
  });

  Meteor.publish('players', function () {
    if (this.userId) {
      return Players.find();
    }
  });

  Meteor.publish('teams', function () {
    if (this.userId) {
      return Teams.find();
    }
  });

  Meteor.publish('tournaments', function () {
    if (this.userId) {
      return Tournaments.find();
    }
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

  Tournaments.allow({
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