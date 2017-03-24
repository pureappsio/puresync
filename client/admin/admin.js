Template.admin.helpers({

    facebookStatus: function() {
        if (Meteor.user().services.facebook) {
            return 'Connected';
        }
    },
    integrations: function() {
        return Integrations.find({});
    }
});

Template.admin.rendered = function() {

}

Template.admin.events({

    'click #add-integration': function() {

        var accountData = {
            type: $('#integration-type :selected').val(),
            key: $('#integration-key').val(),
            url: $('#integration-url').val(),
            userId: Meteor.user()._id
        };
        Meteor.call('addIntegration', accountData);

    },

    'click #set-facebook-ad': function() {

        // Add
        Meteor.call('insertMeta', {
            type: 'adAccountId',
            value: $('#facebook-ad').val(),
            userId: Meteor.user()._id
        });

    },

    'click #set-facebook-pixel': function() {

        // Add
        Meteor.call('insertMeta', {
            type: 'pixel',
            value: $('#facebook-pixel').val(),
            userId: Meteor.user()._id
        });

    },

    'click #facebook-test': function() {

        Meteor.call('updateAudiences');

    },
    'click #facebook-connect': function() {

        Facebook.requestCredential({ requestPermissions: ['ads_management'] }, function(token) {

            var secret = Package.oauth.OAuth._retrieveCredentialSecret(token);

            Meteor.call("userAddFacebookOauthCredentials", token, secret, function(err, response) {
                console.log('Facebook token saved');
            });
        });
    },

});
