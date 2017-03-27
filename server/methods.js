Meteor.methods({

    getWebsitePages: function(integrationId) {

        // Get integration
        var integration = Integrations.findOne(integrationId);

        // Parameters
        var baseUrl = 'https://' + integration.url + '/api/pages';
        var key = integration.key;

        // Query
        request = baseUrl + '?key=' + key;
        request += '&type=purepages';

        res = HTTP.get(request);
        return res.data.pages;

    },
    getPurePage: function(pageId) {

        // Get integration
        var integration = Integrations.findOne({ type: 'purepages' });

        // Parameters
        var baseUrl = 'https://' + integration.url + '/api/pages/' + pageId;
        var key = integration.key;

        // Query
        request = baseUrl + '?key=' + key;

        res = HTTP.get(request);
        return res.data.page;

    },
    getSubscribers: function(listId, integrationId) {

        // Get integration
        var integration = Integrations.findOne(integrationId);

        // Parameters
        var baseUrl = 'https://' + integration.url + '/api/subscribers';
        var key = integration.key;

        // Query
        request = baseUrl + '?key=' + key;
        request += '&list=' + listId;

        res = HTTP.get(request);
        return res.data.subscribers;

    },
    getListData: function(listId, integrationId) {

        // Get integration
        var integration = Integrations.findOne(integrationId);

        // Parameters
        var baseUrl = 'https://' + integration.url + '/api/lists/' + listId;
        var key = integration.key;

        // Query
        request = baseUrl + '?key=' + key;

        console.log(request);

        res = HTTP.get(request);
        return res.data;

    },
    getBrandName: function(integrationId) {

        // Get integration
        var integration = Integrations.findOne(integrationId);

        // Parameters
        var baseUrl = 'https://' + integration.url + '/api/metas/brandName';
        var key = integration.key;

        // Query
        request = baseUrl + '?key=' + key;

        console.log(request);

        res = HTTP.get(request);
        return res.data.value;

    },
    getLanguage: function(integrationId) {

        // Get integration
        var integration = Integrations.findOne(integrationId);

        // Parameters
        var baseUrl = 'https://' + integration.url + '/api/metas/language';
        var key = integration.key;

        // Query
        request = baseUrl + '?key=' + key;

        console.log(request);

        res = HTTP.get(request);
        return res.data.value;

    },
    getCheckoutPage: function(integrationId) {

        // Get integration
        var integration = Integrations.findOne(integrationId);

        // Parameters
        var baseUrl = 'https://' + integration.url + '/api/metas/homePage';
        var key = integration.key;

        // Query
        request = baseUrl + '?key=' + key;

        res = HTTP.get(request);
        console.log(res);
        if (res.data.value == 'store') {
            return 'checkout';
        } else {
            return 'origin';
        }


    },
    getCustomers: function(integrationId) {

        // Get integration
        var integration = Integrations.findOne(integrationId);

        // Parameters
        var baseUrl = 'https://' + integration.url + '/api/customers';
        var key = integration.key;

        // Query
        request = baseUrl + '?key=' + key;

        res = HTTP.get(request);
        return res.data.customers;

    },

    getLists: function(integrationId) {

        // Get integration
        var integration = Integrations.findOne(integrationId);

        // Parameters
        var baseUrl = 'https://' + integration.url + '/api/lists';
        var key = integration.key;

        // Query
        request = baseUrl + '?key=' + key;

        res = HTTP.get(request);
        return res.data.lists;

    },

    getIntegrations: function() {

        return Integrations.find({}).fetch();

    },
    addIntegration: function(data) {

        // Insert
        Integrations.insert(data);

    },
    removeIntegration: function(data) {

        // Insert
        Integrations.remove(data);

    },

    insertMeta: function(meta) {

        console.log(meta);

        // Check if exist
        if (Metas.findOne({ type: meta.type, userId: meta.userId })) {

            // Update
            console.log('Updating meta');
            Metas.update({ type: meta.type, userId: meta.userId }, { $set: { value: meta.value } });

        } else {

            // Insert
            console.log('Creating new meta');
            Metas.insert(meta);

        }

    },
    createUsers: function() {

        // Create admin user
        var adminUser = {
            email: Meteor.settings.adminUser.email,
            password: Meteor.settings.adminUser.password,
            role: 'admin'
        }
        Meteor.call('createNewUser', adminUser);

    },
    createNewUser: function(data) {

        // Check if exist
        if (Meteor.users.findOne({ "emails.0.address": data.email })) {

            console.log('User already created');
            var userId = Meteor.users.findOne({ "emails.0.address": data.email })._id;

        } else {

            console.log('Creating new user');

            // Create
            var userId = Accounts.createUser(data);

            // Change role
            Meteor.users.update(userId, { $set: { role: data.role } });
            console.log(Meteor.users.findOne(userId));

        }

    }

});
