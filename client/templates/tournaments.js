Template.tournaments.helpers({
    tournaments: function() {
        return Tournaments.find();
    },
    show: function () {
        return Session.get('shownContent') === 'tournaments';
    }
});

Template.tournaments.events({
    'click .delete-button': function () {
        var activeTournament = Tournaments.findOne({ name: Session.get('activeTournament') }),
            teamNameToDelete = this.name;

        Tournaments.update(activeTournament._id, {
            $pull: { teams: teamNameToDelete }
        });
    }
});