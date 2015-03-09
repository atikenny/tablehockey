function setActiveTournamentToInserted() {
    var tournaments = Tournaments.find().fetch(),
        lastTournament = tournaments && tournaments.pop();

    if (lastTournament.name !== Session.get('activeTournament')) {
        Session.set('activeTournament', lastTournament.name);
    }
}

Template.tournaments.helpers({
    tournaments: function() {
        return Tournaments.find();
    },
    show: function () {
        return Session.get('shownContent') === 'tournaments';
    }
});

Template.tournaments.rendered = function () {
    var tournaments = Tournaments.find().fetch(),
        firstTournament = tournaments && tournaments[0];

    if (!Session.get('activeTournament') && firstTournament) {
        Session.set('activeTournament', firstTournament.name);
    }
};

Template.tournaments.events({
    'click #addTournamentButton': function () {
        Meteor.call('newTournament', setActiveTournamentToInserted);
    }
});