getActiveTournamentTeams = function () {
    var tournaments = Tournaments.findOne({
        name: Session.get('activeTournament')
    });

    return tournaments && tournaments.teams || [];
};