Template.tournaments_config.helpers({
	teams: function () {
		return Teams.find({
            name: {
                $in: getActiveTournamentTeams()
            }
        });
	}
});

Template.tournaments_config.events({
	'click .delete-button': function () {
        var activeTournament = Tournaments.findOne({ name: Session.get('activeTournament') }),
            teamNameToDelete = this.name;

        Tournaments.update(activeTournament._id, {
            $pull: { teams: teamNameToDelete }
        });
    }
});