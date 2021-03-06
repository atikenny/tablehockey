function setActiveTournamentToLast() {
    var tournaments = Tournaments.find().fetch(),
        lastTournament = tournaments && tournaments.pop();

    if (lastTournament && lastTournament.name !== Session.get('activeTournament')) {
        Session.set('activeTournament', lastTournament.name);
    }
}

Meteor.subscribe('tournaments', null, setActiveTournamentToLast);

Template.tournaments.helpers({
    tournaments: function() {
        return Tournaments.find();
    },
    show: function () {
        return Session.get('shownContent') === 'tournaments';
    }
});

Template.tournaments.events({
    'click #addTournamentButton': function () {
        Meteor.call('newTournament', setActiveTournamentToLast);
    }
});