Template.navigation.events({
    'click #drawerButton': function () {
        $('#drawer-container').toggleClass('open');
        $('#drawer-modal').toggleClass('show');
    }
});