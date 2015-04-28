Meteor.methods({
    removeTournament: function (id) {
        var tournament = Tournaments.findOne(id),
            tournaments;

        if (tournament) {
            Tournaments.remove(tournament._id);
            Results.remove({ tournament: tournament.name });
        }
    },
    newTournament: function () {
    	var placeholderName = 'new tournament',
    		palceholderTournament = Tournaments.findOne({
    			name: placeholderName
    		}),
            allTeams = Teams.find().fetch().map(function (team) {
                return team.name;
            });

    	if (!palceholderTournament) {
    		Tournaments.insert({
    			name: placeholderName,
                teams: allTeams
    		});
    	}
    }
});