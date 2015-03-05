Template.result.helpers({
    hasStarted: function() {
        return this.team1.score || this.team2.score;
    },
    isSelected: function(currentTeam, selectedTeam) {
        return currentTeam === selectedTeam ? 'selected' : '';
    },
    teams: function() {
        return Teams.find({
            name: {
                $in: getActiveTournamentTeams()
            }
        });
    },
    player: function(index, players) {
        return players[index];
    }
});

Template.result.rendered = function () {
    $('.date').datepicker({
        format: 'yyyy-mm-dd',
        weekStart: 1,
        todayBtn: 'linked',
        autoclose: true
    });
};

Template.result.events({
    "click .delete-button": function() {
        addToResultsUndo('remove', this);

        Results.remove(this._id);
    },
    "click .players-button": function(event, template) {
        template.$('.teams-container').toggleClass('open');
    },
    "change [name='score1']": function(event) {
        var team1Score = +($(event.currentTarget).val()),
            team1Won = team1Score > this.team2.score,
            team2Won = team1Score < this.team2.score,
            ended = team1Score || this.team2.score;

        addToResultsUndo('update', this);
        Results.update(this._id, {
            $set: {
                "team1.score": team1Score,
                "team1.won": team1Won,
                "team2.won": team2Won,
                ended: !!ended
            }
        });
    },
    "change [name='score2']": function(event) {
        var team2Score = +($(event.currentTarget).val()),
            team1Won = team2Score < this.team1.score,
            team2Won = team2Score > this.team1.score,
            ended = team2Score || this.team1.score;

        addToResultsUndo('update', this);
        Results.update(this._id, {
            $set: {
                "team2.score": team2Score,
                "team1.won": team1Won,
                "team2.won": team2Won,
                ended: !!ended
            }
        });
    },
    "change [name='date']": function(event) {
        var date = $(event.currentTarget).val();

        if (date !== this.date) {
            addToResultsUndo('update', this);
            Results.update(this._id, {$set: {"date": date}});
        }
    },
    "click .team": function(event, template) {
        var teamName = event.target.dataset.teamName,
            teamNumber = event.target.dataset.teamNumber,
            teamObjectSelector = 'team' + teamNumber,
            team = Teams.findOne({ name: teamName }),
            newTeam = {};

        addToResultsUndo('update', template.data);

        newTeam[teamObjectSelector + '.player1'] = team.players[0];
        newTeam[teamObjectSelector + '.player2'] = team.players[1];
        newTeam[teamObjectSelector + '.nationality'] = team.code;

        Results.update(template.data._id, { $set: newTeam });

        //toggle selected class
        template.$('[data-team-number="' + teamNumber + '"]').removeClass('selected');
        event.target.classList.add('selected');
    },
    "click .lock-button": function() {
        Results.update(this._id, {
            $set: {
                locked: !this.locked
            }
        });
    }
});