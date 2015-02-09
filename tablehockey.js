Results = new Mongo.Collection('results');
Players = new Mongo.Collection('players');
Teams = new Mongo.Collection('teams');

if (Meteor.isClient) {
  var defaultContent = 'results';

  function getNewResult() {
    var players = Players.find().fetch(),
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
        player1: players[0].name,
        player2: players[1].name,
        score: 0,
        won: false,
        nationality: getTeamByPlayers([players[0].name, players[1].name]).code
      },
      team2: {
        player1: players[2].name,
        player2: players[3].name,
        score: 0,
        won: false,
        nationality: getTeamByPlayers([players[2].name, players[3].name]).code
      },
      ended: false
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

    function getTeamWinCount(players) {
      return Results.find(
        {
          $and: [
            { ended: true },
            {
              $or: [
                {
                  $and: [
                    {
                      $or: [
                        {
                          $and: [
                            { "team1.player1": players[0] },
                            { "team1.player2": players[1] }
                          ]
                        },
                        {
                          $and: [
                            { "team1.player1": players[1] },
                            { "team1.player2": players[0] }
                          ]
                        }
                      ]
                    },
                    { "team1.won": true }
                  ]
                },
                {
                  $and: [
                    {
                      $or: [
                        {
                          $and: [
                            { "team2.player1": players[0] },
                            { "team2.player2": players[1] }
                          ]
                        },
                        {
                          $and: [
                            { "team2.player1": players[1] },
                            { "team2.player2": players[0] }
                          ]
                        }
                      ]
                    },
                    { "team2.won": true }
                  ]
                }
              ]
            }
          ]
        }).count();
    }

    function getTeamLossCount(players) {
      return Results.find(
        {
          $and : [
            { ended: true },
            {
              $or: [
                {
                  $and: [
                    {
                      $or: [
                        {
                          $and: [
                            { "team1.player1": players[0] },
                            { "team1.player2": players[1] }
                          ]
                        },
                        {
                          $and: [
                            { "team1.player1": players[1] },
                            { "team1.player2": players[0] }
                          ]
                        }
                      ]
                    },
                    { "team2.won": true }
                  ]
                },
                {
                  $and: [
                    {
                      $or: [
                        {
                          $and: [
                            { "team2.player1": players[0] },
                            { "team2.player2": players[1] }
                          ]
                        },
                        {
                          $and: [
                            { "team2.player1": players[1] },
                            { "team2.player2": players[0] }
                          ]
                        }
                      ]
                    },
                    { "team1.won": true }
                  ]
                }
              ]
            }
          ]
        }).count();
    }

    function getTeamTieCount(players) {
      return Results.find(
        {
          $and: [
            { ended: true },
            {
              $or: [
                {
                  $and: [
                    {
                      $or: [
                        {
                          $and: [
                            { "team1.player1": players[0] },
                            { "team1.player2": players[1] }
                          ]
                        },
                        {
                          $and: [
                            { "team1.player1": players[1] },
                            { "team1.player2": players[0] }
                          ]
                        }
                      ]
                    },
                    { "team1.won": false },
                    { "team2.won": false }
                  ]
                },
                {
                  $and: [
                    {
                      $or: [
                        {
                          $and: [
                            { "team2.player1": players[0] },
                            { "team2.player2": players[1] }
                          ]
                        },
                        {
                          $and: [
                            { "team2.player1": players[1] },
                            { "team2.player2": players[0] }
                          ]
                        }
                      ]
                    },
                    { "team1.won": false },
                    { "team2.won": false }
                  ]
                }
              ]
            }
          ]
        }).count();
    }

    function getTeamGoalsAgainst(players) {
      var goalsAgainstTeam1,
          goalsAgainstTeam2;

      goalsAgainstTeam1 = Results
        .find({
          $and : [
            { ended: true },
            {
              $or: [
                {
                  $and: [
                    { "team1.player1": players[0] },
                    { "team1.player2": players[1] }
                  ]
                },
                {
                  $and: [
                    { "team1.player1": players[1] },
                    { "team1.player2": players[0] }
                  ]
                }
              ]
            }
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
            {
              $or: [
                {
                  $and: [
                    { "team2.player1": players[0] },
                    { "team2.player2": players[1] }
                  ]
                },
                {
                  $and: [
                    { "team2.player1": players[1] },
                    { "team2.player2": players[0] }
                  ]
                }
              ]
            }
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

    function getTeamGoalsFor(players) {
      var goalsForTeam1,
          goalsForTeam2;

      goalsForTeam1 = Results
        .find({
          $and : [
            { ended: true },
            {
              $or: [
                {
                  $and: [
                    { "team1.player1": players[0] },
                    { "team1.player2": players[1] }
                  ]
                },
                {
                  $and: [
                    { "team1.player1": players[1] },
                    { "team1.player2": players[0] }
                  ]
                }
              ]
            }
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
            {
              $or: [
                {
                  $and: [
                    { "team2.player1": players[0] },
                    { "team2.player2": players[1] }
                  ]
                },
                {
                  $and: [
                    { "team2.player1": players[1] },
                    { "team2.player2": players[0] }
                  ]
                }
              ]
            }
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
          teams = Teams.find().fetch();

      teams.forEach(function (team) {
        var winCount = getTeamWinCount(team.players),
            lossCount = getTeamLossCount(team.players),
            tieCount = getTeamTieCount(team.players);

        teamStats.push({
          player1:        team.players[0],
          player2:        team.players[1],
          team:           team,
          points:         winCount * 3 + tieCount,
          goalsFor:       getTeamGoalsFor(team.players),
          goalsAgainst:   getTeamGoalsAgainst(team.players),
          winCount:       winCount,
          lossCount:      lossCount,
          tieCount:       tieCount
        });
      });

      teamStats.sort(sortByPoints);

      return teamStats;
    }

    function getPlayerWinCount(playerName) {
      return Results.find(
        {
          $and: [
            { ended: true },
            {
              $or: [
                {
                  $and: [
                    {
                      $or: [
                        { "team1.player1": playerName },
                        { "team1.player2": playerName }
                      ]
                    },
                    { "team1.won": true}
                  ]
                },
                {
                  $and: [
                    {
                      $or: [
                        { "team2.player1": playerName },
                        { "team2.player2": playerName }
                      ]
                    },
                    { "team2.won": true}
                  ]
                }
              ]
            }
          ]
        }).count();
    }

    function getPlayerLossCount(playerName) {
      return Results.find(
        {
          $and: [
            { ended: true },
            {
              $or: [
                {
                  $and: [
                    {
                      $or: [
                        { "team1.player1": playerName },
                        { "team1.player2": playerName }
                      ]
                    },
                    { "team2.won": true}
                  ]
                },
                {
                  $and: [
                    {
                      $or: [
                        { "team2.player1": playerName },
                        { "team2.player2": playerName }
                      ]
                    },
                    { "team1.won": true}
                  ]
                }
              ]
            }
          ]
        }).count();
    }

    function getPlayerTieCount(playerName) {
      return Results.find(
        {
          $and: [
            { ended: true },
            { "team1.won": false},
            { "team2.won": false},
            {
              $or: [
                { "team1.player1": playerName },
                { "team1.player2": playerName },
                { "team2.player1": playerName },
                { "team2.player2": playerName }
              ]
            }
          ]
        }).count();
    }

    function getPlayerGoalsAgainst(playerName) {
      var goalsAgainstTeam1,
          goalsAgainstTeam2;

      goalsAgainstTeam1 = Results
        .find({
          $and: [
            { ended: true },
            {
              $or: [
                { "team1.player1": playerName },
                { "team1.player2": playerName }
              ]
            }
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
            {
              $or: [
                { "team2.player1": playerName },
                { "team2.player2": playerName }
              ]
            }
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
      var goalsForTeam1,
          goalsForTeam2;

      goalsForTeam1 = Results
        .find({
          $and: [
            { ended: true },
            {
              $or: [
                { "team1.player1": playerName },
                { "team1.player2": playerName }
              ]
            }
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
            {
              $or: [
                { "team2.player1": playerName },
                { "team2.player2": playerName }
              ]
            }
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

  function getTeamByPlayers(players) {
    var team = Teams.findOne({
        players: { $all: players }
      });

    return team;
  }

  Session.setDefault('shownContent', defaultContent);

  Meteor.subscribe('players');
  Meteor.subscribe('teams');
  Meteor.subscribe('results');

  Template.results.helpers({
    results: function () {
      return Results.find({}, { sort: { date: -1 } });
    },
    show: function () {
      return Session.get('shownContent') === 'results';
    }
  });

  Template.result.helpers({
    hasStarted: function () {
      return this.team1.score || this.team2.score;
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
    "change .result-container, click .player-selector-container": function (event, template) {
      var score1 = +template.$('[name="score1"]').val(),
        score2 = +template.$('[name="score2"]').val(),
        team1 = {
          player1: template.$('.selected[data-name="team[0]player[0]"]').html(),
          player2: template.$('.selected[data-name="team[0]player[1]"]').html()
        },
        team2 = {
          player1: template.$('.selected[data-name="team[1]player[0]"]').html(),
          player2: template.$('.selected[data-name="team[1]player[1]"]').html()
        },
        ended = score1 !== 0 || score2 !== 0;

      Results.update(this._id, {$set: {
        date: template.$('[name="date"]').val(),
        team1: {
          player1: team1.player1,
          player2: team1.player2,
          score: score1,
          won: score1 > score2,
          nationality: getTeamByPlayers([team1.player1, team1.player2]).code
        },
        team2: {
          player1: team2.player1,
          player2: team2.player2,
          score: score2,
          won: score1 < score2,
          nationality: getTeamByPlayers([team2.player1, team2.player2]).code
        },
        ended: ended
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
