var defaultContent = 'results';

Session.setDefault('shownContent', defaultContent);
Session.setDefault('activeTournament', 'round two');
Session.setDefault('undoResults', []);

function getNewResult() {
    var teams = Teams.find({
            name: {
                $in: getActiveTournamentTeams()
            }
        }).fetch(),
        now = new Date(),
        year = now.getFullYear(),
        month = ('0' + parseInt(now.getMonth() + 1)).slice(-2),
        day = ('0' + now.getDate()).slice(-2),
        date;

    date = year + '-' + month + '-' + day;

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

function sortByPointsAndGoals(a, b) {
    var order;

    if (a.points === b.points) {
        order = b.goalsFor - a.goalsFor;
    } else {
        order = b.points - a.points;
    }

    return order;
}

function getPlayerWinCount(playerName) {
    var teamCodes = getTeamCodesByPlayer(playerName);

    return Results.find({
        $and: [
            {
                ended: true
            },
            {
                $or: [
                    {
                        $and: [
                            {
                                "team1.nationality": {
                                    $in: teamCodes
                                }
                            },
                            {
                                "team1.won": true
                            }
                        ]
                    },
                    {
                        $and: [
                            {
                                "team2.nationality": {
                                    $in: teamCodes
                                }
                            },
                            {
                                "team2.won": true
                            }
                        ]
                    }
                ]
            },
            {
                tournament: Session.get('activeTournament')
            }
        ]
    }).count();
}

function getPlayerLossCount(playerName) {
    var teamCodes = getTeamCodesByPlayer(playerName);

    return Results.find({
        $and: [
            {
                ended: true
            },
            {
                $or: [
                    {
                        $and: [
                            {
                                "team1.nationality": {
                                    $in: teamCodes
                                }
                            },
                            {
                                "team2.won": true
                            }
                        ]
                    },
                    {
                        $and: [
                            {
                                "team2.nationality": {
                                    $in: teamCodes
                                }
                            },
                            {
                                "team1.won": true
                            }
                        ]
                    }
                ]
            },
            {
                tournament: Session.get('activeTournament')
            }
        ]
    }).count();
}

function getPlayerTieCount(playerName) {
    var teamCodes = getTeamCodesByPlayer(playerName);

    return Results.find({
        $and: [
            {
                ended: true
            },
            {
                "team1.won": false
            },
            {
                "team2.won": false
            },
            {
                tournament: Session.get('activeTournament')
            },
            {
                $or: [
                    {
                        "team1.nationality": {
                            $in: teamCodes
                        }
                    },
                    {
                        "team2.nationality": {
                            $in: teamCodes
                        }
                    }
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
                {
                    ended: true
                },
                {
                    "team1.nationality": {
                        $in: teamCodes
                    }
                },
                {
                    tournament: Session.get('activeTournament')
                }
            ]
        }).fetch()
        .map(function(result) {
            return result.team2.score;
        })
        .reduce(function(a, b) {
            return a + b;
        }, 0);

    goalsAgainstTeam2 = Results
        .find({
            $and: [
                {
                    ended: true
                },
                {
                    "team2.nationality": {
                        $in: teamCodes
                    }
                },
                {
                    tournament: Session.get('activeTournament')
                }
            ]
        }).fetch()
        .map(function(result) {
            return result.team1.score;
        })
        .reduce(function(a, b) {
            return a + b;
        }, 0);

    return goalsAgainstTeam1 + goalsAgainstTeam2;
}

function getPlayerGoalsFor(playerName) {
    var teamCodes = getTeamCodesByPlayer(playerName),
        goalsForTeam1,
        goalsForTeam2;

    goalsForTeam1 = Results
        .find({
            $and: [
                {
                    ended: true
                },
                {
                    "team1.nationality": {
                        $in: teamCodes
                    }
                },
                {
                    tournament: Session.get('activeTournament')
                }
            ]
        }).fetch()
        .map(function(result) {
            return result.team1.score;
        })
        .reduce(function(a, b) {
            return a + b;
        }, 0);

    goalsForTeam2 = Results
        .find({
            $and: [
                {
                    ended: true
                },
                {
                    "team2.nationality": {
                        $in: teamCodes
                    }
                },
                {
                    tournament: Session.get('activeTournament')
                }
            ]
        }).fetch()
        .map(function(result) {
            return result.team2.score;
        })
        .reduce(function(a, b) {
            return a + b;
        }, 0);

    return goalsForTeam1 + goalsForTeam2;
}

function getPlayerGoalsScored(playerName) {
    return Results
        .find({
            $and: [
                {
                    ended: true
                },
                {
                    tournament: Session.get('activeTournament')
                },
                {
                    $or: [
                        {
                            "team1.player2": playerName
                        },
                        {
                            "team2.player2": playerName
                        }
                    ]
                }
            ]
        }).fetch()
        .map(function(result) {
            return result.team1.player2 === playerName ? result.team1.score : result.team2.score;
        })
        .reduce(function(a, b) {
            return a + b;
        }, 0);
}

function getPlayerGoalsTaken(playerName) {
    return Results
        .find({
            $and: [
                {
                    ended: true
                },
                {
                    tournament: Session.get('activeTournament')
                },
                {
                    $or: [
                        {
                            "team1.player1": playerName
                        },
                        {
                            "team2.player1": playerName
                        }
                    ]
                }
            ]
        }).fetch()
        .map(function(result) {
            return result.team1.player1 === playerName ? result.team2.score : result.team1.score;
        })
        .reduce(function(a, b) {
            return a + b;
        }, 0);
}

function getPlayerStats() {
    var playerStats = [],
        players = Players.find().fetch();

    players.forEach(function(player) {
        var winCount = getPlayerWinCount(player.name),
            lossCount = getPlayerLossCount(player.name),
            tieCount = getPlayerTieCount(player.name);

        playerStats.push({
            name: player.name,
            points: winCount * 3 + tieCount,
            goalsFor: getPlayerGoalsFor(player.name),
            goalsAgainst: getPlayerGoalsAgainst(player.name),
            goalsScored: getPlayerGoalsScored(player.name),
            goalsTaken: getPlayerGoalsTaken(player.name),
            winCount: winCount,
            lossCount: lossCount,
            tieCount: tieCount,
            gamesCount: winCount + lossCount + tieCount
        });
    });

    playerStats.sort(sortByPointsAndGoals);

    return playerStats;
}

function getTeamWinCount(team) {
    return Results.find({
        $and: [
            {
                ended: true
            },
            {
                $or: [
                    {
                        $and: [
                            {
                                "team1.nationality": team.code
                            },
                            {
                                "team1.won": true
                            }
                        ]
                    },
                    {
                        $and: [
                            {
                                "team2.nationality": team.code
                            },
                            {
                                "team2.won": true
                            }
                        ]
                    }
                ]
            },
            {
                tournament: Session.get('activeTournament')
            }
        ]
    }).count();
}

function getTeamLossCount(team) {
    return Results.find({
        $and: [
            {
                ended: true
            },
            {
                $or: [
                    {
                        $and: [
                            {
                                "team1.nationality": team.code
                            },
                            {
                                "team2.won": true
                            }
                        ]
                    },
                    {
                        $and: [
                            {
                                "team2.nationality": team.code
                            },
                            {
                                "team1.won": true
                            }
                        ]
                    }
                ]
            },
            {
                tournament: Session.get('activeTournament')
            }
        ]
    }).count();
}

function getTeamTieCount(team) {
    return Results.find({
        $and: [
            {
                ended: true
            },
            {
                $or: [
                    {
                        $and: [
                            {
                                "team1.nationality": team.code
                            },
                            {
                                "team1.won": false
                            },
                            {
                                "team2.won": false
                            }
                        ]
                    },
                    {
                        $and: [
                            {
                                "team2.nationality": team.code
                            },
                            {
                                "team1.won": false
                            },
                            {
                                "team2.won": false
                            }
                        ]
                    }
                ]
            },
            {
                tournament: Session.get('activeTournament')
            }
        ]
    }).count();
}

function getTeamGoalsAgainst(team) {
    var goalsAgainstTeam1,
        goalsAgainstTeam2;

    goalsAgainstTeam1 = Results
        .find({
            $and: [
                {
                    ended: true
                },
                {
                    "team1.nationality": team.code
                },
                {
                    tournament: Session.get('activeTournament')
                }
            ]
        }).fetch()
        .map(function(result) {
            return result.team2.score;
        })
        .reduce(function(a, b) {
            return a + b;
        }, 0);

    goalsAgainstTeam2 = Results
        .find({
            $and: [
                {
                    ended: true
                },
                {
                    "team2.nationality": team.code
                },
                {
                    tournament: Session.get('activeTournament')
                }
            ]
        }).fetch()
        .map(function(result) {
            return result.team1.score;
        })
        .reduce(function(a, b) {
            return a + b;
        }, 0);

    return goalsAgainstTeam1 + goalsAgainstTeam2;
}

function getTeamGoalsFor(team) {
    var goalsForTeam1,
        goalsForTeam2;

    goalsForTeam1 = Results
        .find({
            $and: [
                {
                    ended: true
                },
                {
                    "team1.nationality": team.code
                },
                {
                    tournament: Session.get('activeTournament')
                }
            ]
        }).fetch()
        .map(function(result) {
            return result.team1.score;
        })
        .reduce(function(a, b) {
            return a + b;
        }, 0);

    goalsForTeam2 = Results
        .find({
            $and: [
                {
                    ended: true
                },
                {
                    "team2.nationality": team.code
                },
                {
                    tournament: Session.get('activeTournament')
                }
            ]
        }).fetch()
        .map(function(result) {
            return result.team2.score;
        })
        .reduce(function(a, b) {
            return a + b;
        }, 0);

    return goalsForTeam1 + goalsForTeam2;
}

function getTeamStats() {
    var teamStats = [],
        teams = Teams.find({
            name: {
                $in: getActiveTournamentTeams()
            }
        }).fetch();

    teams.forEach(function(team) {
        var winCount = getTeamWinCount(team),
            lossCount = getTeamLossCount(team),
            tieCount = getTeamTieCount(team);

        teamStats.push({
            player1: team.players[0],
            player2: team.players[1],
            team: team,
            points: winCount * 3 + tieCount,
            goalsFor: getTeamGoalsFor(team),
            goalsAgainst: getTeamGoalsAgainst(team),
            winCount: winCount,
            lossCount: lossCount,
            tieCount: tieCount,
            gamesCount: winCount + lossCount + tieCount
        });
    });

    teamStats.sort(sortByPointsAndGoals);

    return teamStats;
}

function getTeamsByPlayer(playerName) {
    return Teams.find({
        players: playerName
    }).fetch();
}

function getTeamCodesByPlayer(playerName) {
    return getTeamsByPlayer(playerName).map(function(team) {
        return team.code;
    });
}

function addToResultsUndo(actionType, resultObject) {
    var undoResults = Session.get('undoResults');

    undoResults.push({
        actionType: actionType,
        resultObject: resultObject
    });

    Session.set('undoResults', undoResults);
}

function undoPreviousResultsActionBatch(actionCount) {
    while (actionCount--) {
        undoPreviousResultsAction();
    }
}

function undoPreviousResultsAction() {
    var undoResults = Session.get('undoResults'),
        previousResultsAction = undoResults[(undoResults.length - 1)];

    switch (previousResultsAction.actionType) {
        case 'remove':
            undoResultsDelete(previousResultsAction.resultObject);

            break;
        case 'update':
            undoResultsUpdate(previousResultsAction.resultObject);

            break;
        case 'insert':
            undoResultsInsert(previousResultsAction.resultObject);

            break;
    }

    // undo results may change
    // so we should get it again
    undoResults = Session.get('undoResults');
    undoResults.pop();
    Session.set('undoResults', undoResults);
}

function getUndoResultsFromInsert(resultsID) {
    var undoResults = Session.get('undoResults'),
        foundUndoResultIndex = false;

    undoResults.some(function(element, index) {
        if (element.actionType === 'insert' && element.resultObject._id === resultsID) {
            foundUndoResultIndex = index;
        }

        return foundUndoResultIndex;
    });

    return foundUndoResultIndex;
}

function undoResultsDelete(resultObject) {
    var newID,
        undoResults = Session.get('undoResults'),
        undoResultFromInsertIndex = getUndoResultsFromInsert(resultObject._id);

    delete resultObject._id;

    newID = Results.insert(resultObject);

    // if the result came from an insert
    // we need to update the id to the new one
    if (undoResultFromInsertIndex !== false) {
        undoResults[undoResultFromInsertIndex].resultObject._id = newID;
        Session.set('undoResults', undoResults);
    }
}

function undoResultsUpdate(resultObject) {
    var id = resultObject._id;

    delete resultObject._id;

    Results.update(id, {
        $set: resultObject
    });
}

function undoResultsInsert(resultObject) {
    Results.remove(resultObject._id);
}

Meteor.subscribe('userData');
Meteor.subscribe('players');
Meteor.subscribe('teams');
Meteor.subscribe('results');
Meteor.subscribe('tournaments');

Template.tournament.helpers({
    selected: function() {
        return this.name === Session.get('activeTournament');
    }
});

Template.tournament.events({
    "click .tournament": function(event, template) {
        Session.set('activeTournament', template.data.name);
    }
});

Template.results.helpers({
    results: function() {
        return Results.find({
            tournament: Session.get('activeTournament')
        }, {
            sort: {
                date: -1
            }
        });
    },
    show: function() {
        return Session.get('shownContent') === 'results';
    }
});

Template.result.helpers({
    hasStarted: function() {
        return this.team1.score || this.team2.score;
    },
    isSelected: function(currentTeam, selectedTeam) {
        return currentTeam === selectedTeam ? 'selected' : '';
    },
    teams: function() {
        return Teams.find({
            name: {
                $in: getActiveTournamentTeams()
            }
        });
    },
    player: function(index, players) {
        return players[index];
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
    "click .delete-button": function() {
        addToResultsUndo('remove', this);

        Results.remove(this._id);
    },
    "click .players-button": function(event, template) {
        template.$('.teams-container').toggleClass('open');
    },
    "change [name='score1']": function(event) {
        var team1Score = +($(event.currentTarget).val()),
            team1Won = team1Score > this.team2.score,
            team2Won = team1Score < this.team2.score,
            ended = team1Score || this.team2.score;

        addToResultsUndo('update', this);
        Results.update(this._id, {
            $set: {
                "team1.score": team1Score,
                "team1.won": team1Won,
                "team2.won": team2Won,
                ended: !!ended
            }
        });
    },
    "change [name='score2']": function(event) {
        var team2Score = +($(event.currentTarget).val()),
            team1Won = team2Score < this.team1.score,
            team2Won = team2Score > this.team1.score,
            ended = team2Score || this.team1.score;

        addToResultsUndo('update', this);
        Results.update(this._id, {
            $set: {
                "team2.score": team2Score,
                "team1.won": team1Won,
                "team2.won": team2Won,
                ended: !!ended
            }
        });
    },
    "change [name='date']": function(event) {
        var date = $(event.currentTarget).val();

        if (date !== this.date) {
            addToResultsUndo('update', this);
            Results.update(this._id, {$set: {"date": date}});
        }
    },
    "click .team": function(event, template) {
        var teamName = event.target.dataset.teamName,
            teamNumber = event.target.dataset.teamNumber,
            teamObjectSelector = 'team' + teamNumber,
            team = Teams.findOne({ name: teamName }),
            newTeam = {};

        addToResultsUndo('update', template.data);

        newTeam[teamObjectSelector + '.player1'] = team.players[0];
        newTeam[teamObjectSelector + '.player2'] = team.players[1];
        newTeam[teamObjectSelector + '.nationality'] = team.code;

        Results.update(template.data._id, { $set: newTeam });

        //toggle selected class
        template.$('[data-team-number="' + teamNumber + '"]').removeClass('selected');
        event.target.classList.add('selected');
    },
    "click .lock-button": function() {
        Results.update(this._id, {
            $set: {
                locked: !this.locked
            }
        });
    }
});

Template.navigation.helpers({
    isActive: function (content) {
        return Session.get('shownContent') === content;
    },
    noUndo: function () {
        return Session.get('undoResults').length === 0;
    },
    noNew: function () {
        return Session.get('shownContent') != 'results';
    },
    undoResults: function () {
        return Session.get('undoResults').slice(-10).reverse();
    },
    profilePicturePath: function () {
        var userData = Meteor.user(),
            googleData = userData && userData.services && userData.services.google,
            profilePicturePath = googleData && googleData.picture;
        
        return profilePicturePath;
    }
});

Template.navigation.events({
    "click #statsButton": function() {
        if (Session.get('shownContent') === 'stats') {
            Session.set('shownContent', defaultContent);
        } else {
            Session.set('shownContent', 'stats');
        }
    },
    "click #addButton": function() {
        if (Session.get('shownContent') === defaultContent) {
            var newID = Results.insert(getNewResult()),
                newResult = Results.findOne(newID);

            addToResultsUndo('insert', newResult);
        }
    },
    "click #undoButton": function() {
        undoPreviousResultsAction();
    },
    "click #undo-actions-list li": function(event) {
        undoPreviousResultsActionBatch(($(event.currentTarget).index() + 1));
    }
});

Template.stats.helpers({
    teamStats: function() {
        return getTeamStats();
    },
    playerStats: function() {
        return getPlayerStats();
    },
    show: function() {
        return Session.get('shownContent') === 'stats';
    }
});