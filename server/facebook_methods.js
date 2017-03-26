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

        var users = Meteor.users.find({}).fetch();

        for (u in users) {

            // Get all integrations
            var integrations = Integrations.find({ userId: users[u]._id }).fetch();

            console.log(integrations);

            for (i in integrations) {

                console.log('Refreshing audiences for integration: ' + integrations[i].url);
                Meteor.call('updateAudience', integrations[i]._id);

            }

            // Check for lookalike
            Meteor.call('createLookalikeAudiences', users[u]._id);

        }

    },
    updateAudience: function(integrationId) {

        // Integration
        var integration = Integrations.findOne(integrationId);

        // Create/refresh audiences
        if (integration.type == 'purecart') {
            Meteor.call('updateCustomersAudience', integrationId);
            Meteor.call('updateCheckoutAudience', integrationId);
            Meteor.call('updateAbandonAudience', integrationId);
        }

        if (integration.type == 'puremail') {
            Meteor.call('updateEmailAudience', integrationId);
        }

        if (integration.type == 'purepress') {
            Meteor.call('updateWebsiteAudience', integrationId);
        }

    },
    createLookalikeAudiences: function(userId) {

        console.log('Creating lookalike audiences');

        // Get all audiences
        var audiences = Audiences.find({ userId: userId }).fetch();

        for (a in audiences) {

            // Check if it is the right audience
            var type = audiences[a].type;
            if (type == 'visitors' || type == 'subscribers' || type == 'customers') {

                // Get info
                var audienceId = audiences[a].facebookAudienceId;
                var audienceData = Meteor.call('getFacebookAudience', audienceId, userId);

                // If more than 100, create lookalike
                if (audienceData.approximate_count >= 110) {

                    Meteor.call('updateLookalikeAudience', audiences[a]._id);

                }

            }

        }

    },
    updateLookalikeAudience: function(audienceId) {

        // Get audience
        var audience = Audiences.findOne(audienceId);

        // Build type
        var type = audience.type + 'Lookalike';

        if (Audiences.findOne({ type: type, originFacebookAudienceId: audience.facebookAudienceId })) {

            console.log('Lookalike audience exists');

        } else {

            console.log('New lookalike audience for audience: ');
            console.log(audience);

            if (audience.type == 'subscribers') {

                var listData = Meteor.call('getListData', audience.listId, audience.integrationId);

                var brand = listData.brandName;
                if (listData.language) {
                    var language = listData.language;
                } else {
                    var language = 'en';
                }

            } else {

                // Get brand details
                var brand = Meteor.call('getBrandName', audience.integrationId);

                // Get language
                var language = Meteor.call('getLanguage', audience.integrationId);

            }

            parameters = {
                name: brand + ": lookalike for " + audience.type,
                description: "Lookalike audience for " + audience.type + ' of ' + brand,
                referenceAudienceId: audience.facebookAudienceId
            }

            if (language == 'fr') {
                parameters.countries = ['FR', 'BE', 'LU'];
                parameters.country = 'FR';

            } else {
                parameters.countries = ['US', 'CA', 'UK'];
                parameters.country = 'US';

            }

            // Create
            var facebookAudienceId = Meteor.call('createLookalikeAudience', parameters, audience.userId);

            if (facebookAudienceId) {
                
                // Save
                var audience = {
                    name: brand,
                    type: type,
                    facebookAudienceId: facebookAudienceId,
                    originFacebookAudienceId: audience.facebookAudienceId,
                    userId: audience.userId
                }
                console.log(audience);
                Audiences.insert(audience);
            }

        }

    },
    updateEmailAudience: function(integrationId) {

        console.log('Updating email audience');

        // Integration
        var integration = Integrations.findOne(integrationId);

        // Get all lists
        var lists = Meteor.call('getLists', integration._id);

        for (l in lists) {

            // Check if audience exists
            if (Audiences.findOne({ listId: lists[l]._id })) {

                console.log('Updating audience');

                // Get audience
                var audience = Audiences.findOne({ listId: lists[l]._id });
                var facebookAudienceId = audience.facebookAudienceId;

                // Update
                Meteor.call('addSubscribersAudience', facebookAudienceId, integration.userId);


            } else {

                console.log('New list audience');

                // Get brand details
                var brand = lists[l].name;

                parameters = {
                    name: brand + ": subscribers",
                    description: "Audience of all subscribers of " + brand
                }

                // Create
                var facebookAudienceId = Meteor.call('createAudience', parameters, integration.userId);

                // Save
                var audience = {
                    name: brand,
                    type: 'subscribers',
                    facebookAudienceId: facebookAudienceId,
                    userId: integration.userId,
                    integrationId: integration._id,
                    listId: lists[l]._id
                }
                console.log(audience);
                Audiences.insert(audience);

                // Update
                Meteor.call('addSubscribersAudience', facebookAudienceId, integration.userId);

            }

        }

    },
    updateCustomersAudience: function(integrationId) {

        // Integration
        var integration = Integrations.findOne(integrationId);

        // Check if exists
        if (Audiences.findOne({ type: 'customers', integrationId: integrationId })) {

            console.log('Updating audience');

            // Get audience
            var audience = Audiences.findOne({ type: 'customers', integrationId: integrationId });
            var facebookAudienceId = audience.facebookAudienceId;

        } else {

            console.log('New audience');

            // Get brand details
            var brand = Meteor.call('getBrandName', integrationId);

            parameters = {
                name: brand + ": customers",
                description: "Audience of all buyers of " + brand
            }

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
    updateAbandonAudience: function(integrationId) {

        // Integration
        var integration = Integrations.findOne(integrationId);

        // Check if exists
        if (Audiences.findOne({ type: 'abandon', integrationId: integrationId })) {

            console.log('Updating abandon audience');

        } else {

            console.log('New audience');

            // Get brand details
            var brand = Meteor.call('getBrandName', integrationId);

            parameters = {
                name: brand + ": abandoned checkout",
                description: "All people that left checkout without buying on " + brand
            }

            // Create
            var facebookAudienceId = Meteor.call('createAbandonAudience', parameters, integration._id);

            // Save
            var audience = {
                name: brand,
                type: 'abandon',
                facebookAudienceId: facebookAudienceId,
                userId: integration.userId,
                integrationId: integration._id
            }
            console.log(audience);
            Audiences.insert(audience);

        }

    },
    updateCheckoutAudience: function(integrationId) {

        // Integration
        var integration = Integrations.findOne(integrationId);

        // Check if exists
        if (Audiences.findOne({ type: 'checkout', integrationId: integrationId })) {

            console.log('Updating checkout audience');

        } else {

            console.log('New checkout audience');

            // Get brand details
            var brand = Meteor.call('getBrandName', integrationId);

            parameters = {
                name: brand + ": visited checkout",
                description: "All people that visited the checkout page on " + brand
            }

            // Create
            var facebookAudienceId = Meteor.call('createCheckoutAudience', parameters, integration._id);

            // Save
            var audience = {
                name: brand,
                type: 'checkout',
                facebookAudienceId: facebookAudienceId,
                userId: integration.userId,
                integrationId: integration._id
            }
            console.log(audience);
            Audiences.insert(audience);

        }

    },
    updateWebsiteAudience: function(integrationId) {

        // Integration
        var integration = Integrations.findOne(integrationId);

        // Check if exists
        if (Audiences.findOne({ integrationId: integrationId })) {

            console.log('Updating website audience');

        } else {

            console.log('New audience');

            // Get brand details
            var brand = Meteor.call('getBrandName', integrationId);

            parameters = {
                name: brand + ": visitors",
                description: "All visitors of " + brand
            }

            // Create
            var facebookAudienceId = Meteor.call('createWebsiteAudience', parameters, integration._id);

            // Save
            var audience = {
                name: brand,
                type: 'visitors',
                facebookAudienceId: facebookAudienceId,
                userId: integration.userId,
                integrationId: integration._id
            }
            console.log(audience);
            Audiences.insert(audience);

        }

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
        console.log('Customers for ' + integration.url + ': ' + customers.length);

        if (customers.length > 0) {

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

            // Add users
            return Meteor.call('addUsersAudience', parameters, facebookAudienceId, userId);

        } else {
            return {};
        }

    },
    createAbandonAudience: function(parameters, integrationId) {

        // Integration
        var integration = Integrations.findOne(integrationId);

        // Find user
        var user = Meteor.users.findOne(integration.userId);

        // Pixel
        var pixel = Metas.findOne({ type: 'pixel', userId: user._id }).value;

        // Check which page is used for checkout
        var checkoutPage = Meteor.call('getCheckoutPage', integrationId);

        if (checkoutPage == 'checkout') {

            // Rule
            var rule = {
                and: [
                    { url: { i_not_contains: integration.url + '/purchase_confirmation' } },
                    { url: { i_contains: integration.url + '/checkout' } }
                ]
            };

        } else {

            // Rule
            var rule = {
                and: [
                    { url: { i_not_contains: integration.url + '/purchase_confirmation' } },
                    { url: { i_contains: integration.url } }
                ]
            };

        }

        // Parameters
        var parameters = {
            pixel_id: parseInt(pixel),
            name: parameters.name,
            subtype: "WEBSITE",
            description: parameters.description,
            retention_days: 30,
            rule: JSON.stringify(rule),
            prefill: true
        };

        console.log(parameters);

        return Meteor.call('createFacebookAudience', parameters, user._id);

    },
    createCheckoutAudience: function(parameters, integrationId) {

        // Integration
        var integration = Integrations.findOne(integrationId);

        // Find user
        var user = Meteor.users.findOne(integration.userId);

        // Pixel
        var pixel = Metas.findOne({ type: 'pixel', userId: user._id }).value;

        // Check which page is used for checkout
        var checkoutPage = Meteor.call('getCheckoutPage', integrationId);

        if (checkoutPage == 'checkout') {

            // Rule
            var rule = {
                and: [
                    { url: { i_contains: integration.url + '/checkout' } }
                ]
            };

        } else {

            // Rule
            var rule = {
                and: [
                    { url: { i_contains: integration.url } }
                ]
            };

        }

        // Parameters
        var parameters = {
            pixel_id: parseInt(pixel),
            name: parameters.name,
            subtype: "WEBSITE",
            description: parameters.description,
            retention_days: 30,
            rule: JSON.stringify(rule),
            prefill: true
        };

        console.log(parameters);

        return Meteor.call('createFacebookAudience', parameters, user._id);

    },
    createWebsiteAudience: function(parameters, integrationId) {

        // Integration
        var integration = Integrations.findOne(integrationId);

        // Find user
        var user = Meteor.users.findOne(integration.userId);

        // Pixel
        var pixel = Metas.findOne({ type: 'pixel', userId: user._id }).value;

        // Rule
        var rule = {
            url: {
                i_contains: integration.url
            }
        };

        // Parameters
        var parameters = {
            pixel_id: parseInt(pixel),
            name: parameters.name,
            subtype: "WEBSITE",
            description: parameters.description,
            retention_days: 30,
            rule: JSON.stringify(rule),
            prefill: true
        };

        return Meteor.call('createFacebookAudience', parameters, user._id);

    },
    addSubscribersAudience: function(facebookAudienceId, userId) {

        // Find user
        var user = Meteor.users.findOne(userId);

        // Audience
        var audience = Audiences.findOne({ facebookAudienceId: facebookAudienceId });

        // Integration
        var integration = Integrations.findOne(audience.integrationId);

        // Get customers emails
        var subscribers = Meteor.call('getSubscribers', audience.listId, integration._id);
        console.log('Subscribers for ' + integration.url + ': ' + subscribers.length);

        if (subscribers.length > 20) {

            emails = [];
            for (i in subscribers) {

                var hash = sha256.create();
                hash.update(subscribers[i].email);
                emails.push(hash.hex());
            }

            // Parameters
            var parameters = {
                payload: {
                    schema: "EMAIL_SHA256",
                    data: emails
                }
            };

            return Meteor.call('addUsersAudience', parameters, facebookAudienceId, userId);

        } else {
            return {};
        }

    },
    createAudience: function(parameters, userId) {

        // Find user
        var user = Meteor.users.findOne(userId);

        // Parameters
        var parameters = {
            name: parameters.name,
            subtype: "CUSTOM",
            description: parameters.description,
        };

        return Meteor.call('createFacebookAudience', parameters, userId);

    },
    createLookalikeAudience: function(parameters, userId) {

        // Parameters
        var parameters = {
            name: parameters.name,
            subtype: "LOOKALIKE",
            origin_audience_id: parameters.referenceAudienceId,
            lookalike_spec: {
                type: "similarity",
                country: parameters.country
            },
            description: parameters.description
        };

        console.log(parameters);

        return Meteor.call('createFacebookAudience', parameters, userId);

    },
    addUsersAudience: function(parameters, facebookAudienceId, userId) {

        // Find user
        var user = Meteor.users.findOne(userId);

        // Find token
        var token = user.services.facebook.accessToken;

        // Set token
        FacebookAPI.setAccessToken(token);

        // Set version
        FacebookAPI.setVersion("2.8");

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
    createFacebookAudience(parameters, userId) {

        // Find user
        var user = Meteor.users.findOne(userId);

        // Find token
        var token = user.services.facebook.accessToken;

        // Get Facebook Account ID
        var accountId = Metas.findOne({ type: 'adAccountId', userId: userId }).value;

        // Set token
        FacebookAPI.setAccessToken(token);

        // Set version
        FacebookAPI.setVersion("2.8");

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

    },
    getFacebookAudience(audienceId, userId) {

        // Find user
        var user = Meteor.users.findOne(userId);

        // Find token
        var token = user.services.facebook.accessToken;

        // Set token
        FacebookAPI.setAccessToken(token);

        // Set version
        FacebookAPI.setVersion("2.8");

        parameters = {
            fields: 'approximate_count,id'
        }

        // Get insights
        var myFuture = new Future();
        FacebookAPI.get(audienceId, parameters, function(err, res) {

            if (err) {
                console.log(err);
                myFuture.return({});
            } else {
                console.log(res);
                myFuture.return(res);
            }

        });

        return myFuture.wait();

    }

});
