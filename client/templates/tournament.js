function setActiveTournamentAfterDelete(deletedTournament) {
    var tournaments = Tournaments.find().fetch(),
        lastTournament = tournaments && tournaments.pop();

    if (Session.get('activeTournament') === deletedTournament.name) {
        Session.set('activeTournament', lastTournament.name);
    }
}

Template.tournament.helpers({
    selected: function() {
        return this.name === Session.get('activeTournament');
    }
});

Template.tournament.events({
    'click .tournament': function(event, template) {
        Session.set('activeTournament', template.data.name);
    },
    'click .tournament .delete-button': function (event) {
        if (confirm('Are you sure you want to delete this tournament and all its results?')) {
            Meteor.call('removeTournament', this._id, setActiveTournamentAfterDelete.bind(null, this));
        }

        event.stopPropagation();
    },
    'blur .tournament-name': function (event) {
        var oldName = this.name,
            newName = $(event.target).html();

        if (oldName !== newName) {
            Tournaments.update(this._id, {
                $set: {
                    name: newName
                }
            });
            Session.set('activeTournament', newName);
        }
    }
});