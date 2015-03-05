function undoPreviousResultsActionBatch(actionCount) {
    while (actionCount--) {
        undoPreviousResultsAction();
    }
}

function undoPreviousResultsAction() {
    var undoResults = Session.get('undoResults'),
        previousResultsAction = undoResults[(undoResults.length - 1)];

    switch (previousResultsAction.actionType) {
        case 'remove':
            undoResultsDelete(previousResultsAction.resultObject);

            break;
        case 'update':
            undoResultsUpdate(previousResultsAction.resultObject);

            break;
        case 'insert':
            undoResultsInsert(previousResultsAction.resultObject);

            break;
    }

    // undo results may change
    // so we should get it again
    undoResults = Session.get('undoResults');
    undoResults.pop();
    Session.set('undoResults', undoResults);
}

function getUndoResultsFromInsert(resultsID) {
    var undoResults = Session.get('undoResults'),
        foundUndoResultIndex = false;

    undoResults.some(function(element, index) {
        if (element.actionType === 'insert' && element.resultObject._id === resultsID) {
            foundUndoResultIndex = index;
        }

        return foundUndoResultIndex;
    });

    return foundUndoResultIndex;
}

function undoResultsDelete(resultObject) {
    var newID,
        undoResults = Session.get('undoResults'),
        undoResultFromInsertIndex = getUndoResultsFromInsert(resultObject._id);

    delete resultObject._id;

    newID = Results.insert(resultObject);

    // if the result came from an insert
    // we need to update the id to the new one
    if (undoResultFromInsertIndex !== false) {
        undoResults[undoResultFromInsertIndex].resultObject._id = newID;
        Session.set('undoResults', undoResults);
    }
}

function undoResultsUpdate(resultObject) {
    var id = resultObject._id;

    delete resultObject._id;

    Results.update(id, {
        $set: resultObject
    });
}

function undoResultsInsert(resultObject) {
    Results.remove(resultObject._id);
}

function getNewResult() {
    var teams = Teams.find({
            name: {
                $in: getActiveTournamentTeams()
            }
        }).fetch(),
        now = new Date(),
        year = now.getFullYear(),
        month = ('0' + parseInt(now.getMonth() + 1)).slice(-2),
        day = ('0' + now.getDate()).slice(-2),
        date;

    date = year + '-' + month + '-' + day;

    return {
        date: date,
        team1: {
            player1: teams[0].players[0],
            player2: teams[0].players[1],
            score: 0,
            won: false,
            nationality: teams[0].code
        },
        team2: {
            player1: teams[1].players[0],
            player2: teams[1].players[1],
            score: 0,
            won: false,
            nationality: teams[1].code
        },
        ended: false,
        tournament: Session.get('activeTournament')
    };
}

Template.navigation.helpers({
    isActive: function (content) {
        return Session.get('shownContent') === content;
    },
    noUndo: function () {
        return Session.get('undoResults').length === 0;
    },
    noNew: function () {
        return Session.get('shownContent') != 'results';
    },
    undoResults: function () {
        return Session.get('undoResults').slice(-10).reverse();
    },
    profilePicturePath: function () {
        var userData = Meteor.user(),
            googleData = userData && userData.services && userData.services.google,
            profilePicturePath = googleData && googleData.picture;
        
        return profilePicturePath;
    }
});

Template.navigation.events({
    'click #statsButton': function() {
        if (Session.get('shownContent') === 'stats') {
            Session.set('shownContent', defaultContent);
        } else {
            Session.set('shownContent', 'stats');
        }
    },
    'click #addButton': function() {
        if (Session.get('shownContent') === defaultContent) {
            var newID = Results.insert(getNewResult()),
                newResult = Results.findOne(newID);

            addToResultsUndo('insert', newResult);
        }
    },
    'click #undoButton': function() {
        undoPreviousResultsAction();
    },
    'click #undo-actions-list li': function(event) {
        undoPreviousResultsActionBatch(($(event.currentTarget).index() + 1));
    },
    'click #drawerButton': function () {
        $('#drawer-container').toggleClass('open');
        $('#drawer-modal').toggleClass('show');
    }
});