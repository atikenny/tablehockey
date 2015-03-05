Template.tournament.helpers({
    selected: function() {
        return this.name === Session.get('activeTournament');
    }
});

Template.tournament.events({
    "click .tournament": function(event, template) {
        Session.set('activeTournament', template.data.name);
    }
});