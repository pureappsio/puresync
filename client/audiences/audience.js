Template.audience.helpers({

    integration: function() {
        return Integrations.findOne(this.integrationId).url;
    }

});

Template.audience.events({

    'click .delete': function() {
        Meteor.call('deleteAudience', this._id);
    }

});
