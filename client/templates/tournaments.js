Template.tournaments.helpers({
    tournaments: function() {
        return Tournaments.find();
    },
    show: function () {
    	return Session.get('shownContent', 'tournaments');
    }
});