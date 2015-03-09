defaultContent = 'results';

Session.setDefault('shownContent', defaultContent);
Session.setDefault('undoResults', []);

getActiveTournamentTeams = function () {
    var tournaments = Tournaments.findOne({
        name: Session.get('activeTournament')
    });

    return tournaments && tournaments.teams || [];
};

addToResultsUndo = function (actionType, resultObject) {
    var undoResults = Session.get('undoResults');

    undoResults.push({
        actionType: actionType,
        resultObject: resultObject
    });

    Session.set('undoResults', undoResults);
};