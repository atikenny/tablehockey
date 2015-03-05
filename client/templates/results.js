Template.results.helpers({
    results: function() {
        return Results.find({
            tournament: Session.get('activeTournament')
        }, {
            sort: {
                date: -1
            }
        });
    },
    show: function() {
        return Session.get('shownContent') === 'results';
    }
});