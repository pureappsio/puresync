Meteor.methods({

    getBrandName: function(integrationId) {

        // Get integration
        var integration = Integrations.findOne(integrationId);

        // Parameters
        var baseUrl = 'https://' + integration.url + '/api/metas/brandName';
        var key = integration.key;

        // Query
        request = baseUrl + '?key=' + key;

        res = HTTP.get(request);
        return res.data.value;

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