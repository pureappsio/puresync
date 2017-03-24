import FacebookAPI from 'fbgraph';
Future = Npm.require('fibers/future');
import sha256 from 'js-sha256';

Meteor.methods({

    deleteAudience: function(audienceId) {

        Audiences.remove(audienceId)

    },
    userAddFacebookOauthCredentials: function(token, secret) {

        var data = Facebook.retrieveCredential(token, secret).serviceData;
        console.log(data);

        Meteor.users.update({ _id: Meteor.user()._id }, { $set: { "services.facebook": data } }, function(error) {
            if (error) { console.log(error); }
        });
    },

    updateAudiences: function() {

        // Get all integrations
        var integrations = Integrations.find({}).fetch();

        console.log(integrations);

        for (i in integrations) {

            console.log('Refreshing audiences for integration: ' + integrations[i].url);
            Meteor.call('updateAudience', integrations[i]._id);

        }

    },
    updateAudience: function(integrationId) {

        // Integration
        var integration = Integrations.findOne(integrationId);

        // Check if exists
        if (Audiences.findOne({ integrationId: integrationId })) {

            console.log('Updating audience');

            // Get audience
            var audience = Audiences.findOne({ integrationId: integrationId });
            var facebookAudienceId = audience.facebookAudienceId;

        } else {

            console.log('New audience');

            // Get brand details
            var brand = Meteor.call('getBrandName', integrationId);

            parameters = {
                name: "Customers for " + brand,
                description: "Audience of all buyers of " + brand
            }

            console.log(parameters);

            // Create
            var facebookAudienceId = Meteor.call('createAudience', parameters, integration.userId);

            // Save
            var audience = {
                name: brand,
                type: 'customers',
                facebookAudienceId: facebookAudienceId,
                userId: integration.userId,
                integrationId: integration._id
            }
            console.log(audience);
            Audiences.insert(audience);

        }

        // Update
        var answer = Meteor.call('addCustomersAudience', facebookAudienceId, integration.userId);

    },
    addCustomersAudience: function(facebookAudienceId, userId) {

        // Find user
        var user = Meteor.users.findOne(userId);

        // Audience
        var audience = Audiences.findOne({ facebookAudienceId: facebookAudienceId });

        // Integration
        var integration = Integrations.findOne(audience.integrationId);

        // Get customers emails
        var customers = Meteor.call('getCustomers', integration._id);
        console.log(customers);

        emails = [];
        for (i in customers) {

            var hash = sha256.create();
            hash.update(customers[i].email);
            emails.push(hash.hex());
        }

        // Find token
        var token = user.services.facebook.accessToken;

        // Set token
        FacebookAPI.setAccessToken(token);

        // Set version
        FacebookAPI.setVersion("2.8");

        // Parameters
        var parameters = {
            payload: {
                schema: "EMAIL_SHA256",
                data: emails
            }
        };

        // Get insights
        var myFuture = new Future();
        FacebookAPI.post(facebookAudienceId + "/users", parameters, function(err, res) {

            if (err) {
                console.log(err);
                myFuture.return({});
            } else {
                console.log(res);
                myFuture.return(res);
            }

        });

        return myFuture.wait();

    },
    createAudience: function(parameters, userId) {

        // Find user
        var user = Meteor.users.findOne(userId);

        // Find token
        var token = user.services.facebook.accessToken;

        // Set token
        FacebookAPI.setAccessToken(token);

        // Set version
        FacebookAPI.setVersion("2.8");

        // Parameters
        var parameters = {
            name: parameters.name,
            subtype: "CUSTOM",
            description: parameters.description,
        };

        // Get Facebook Pixel ID
        var accountId = Metas.findOne({ type: 'adAccountId', userId: userId }).value;

        // Get insights
        var myFuture = new Future();
        FacebookAPI.post('act_' + accountId + "/customaudiences", parameters, function(err, res) {

            if (err) {
                console.log(err);
                myFuture.return({});
            } else {
                console.log(res);
                myFuture.return(res);
            }

        });

        return (myFuture.wait()).id;

    }

});
