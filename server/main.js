function initPlayers() {
    var attila = Players.find({
            name: 'Attila Bartha'
        }).fetch(),
        adam = Players.find({
            name: 'Igor Mucsicska'
        }).fetch(),
        igor = Players.find({
            name: 'Ádám Gráf'
        }).fetch(),
        tamas = Players.find({
            name: 'Tamás Meleg'
        }).fetch();

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
    var hungary = Teams.find({
            name: 'hungary'
        }).fetch(),
        ukraine = Teams.find({
            name: 'ukraine'
        }).fetch(),
        canada = Teams.find({
            name: 'canada'
        }).fetch(),
        czech = Teams.find({
            name: 'czech'
        }).fetch(),
        djibuty = Teams.find({
            name: 'djibuty'
        }).fetch(),
        greatbritain = Teams.find({
            name: 'greatbritain'
        }).fetch();

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
        tournamentsWithoutTeams = Tournaments.find({
            teams: undefined
        }).fetch(),
        resultsWithoutTournament = Results.find({
            tournament: undefined
        }).fetch(),
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

    _.each(tournamentsWithoutTeams, function(element) {
        Tournaments.update(element._id, {
            $set: {
                teams: initialTeams
            }
        });
    });

    _.each(resultsWithoutTournament, function(element) {
        Results.update(element._id, {
            $set: {
                tournament: 'initial games'
            }
        });
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

Meteor.publish('userData', function () {
    if (this.userId) {
        return Meteor.users.find({_id: this.userId});
    }
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
    insert: function(userId) {
        return !!userId;
    },
    update: function(userId) {
        return !!userId;
    },
    remove: function(userId) {
        return !!userId;
    }
});

Tournaments.allow({
    insert: function(userId) {
        return !!userId;
    },
    update: function(userId) {
        return !!userId;
    },
    remove: function(userId) {
        return !!userId;
    }
});

Teams.allow({
    insert: function(userId) {
        return !!userId;
    },
    update: function(userId) {
        return !!userId;
    },
    remove: function(userId) {
        return !!userId;
    }
});