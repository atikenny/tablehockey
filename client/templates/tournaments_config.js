Template.tournaments_config.helpers({
	teams: function () {
		return Teams.find({
            name: {
                $in: getActiveTournamentTeams()
            }
        });
	}
});