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