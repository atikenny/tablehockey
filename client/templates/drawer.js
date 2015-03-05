function toggleDrawer() {
    $('#drawer-container').toggleClass('open');
    $('#drawer-modal').toggleClass('show');
}

Template.drawer.events({
    'click #drawer-modal': function () {
        toggleDrawer();
    },
    'click #drawer-list li': function () {
        toggleDrawer();
    },
    'click #tournamentsLink': function () {
        $('#tournaments-container').toggleClass('open');
    }
});