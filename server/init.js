Meteor.startup(function() {

    // Start cron
    SyncedCron.start();

    // Create users if needed
    Meteor.call('createUsers');
    
});
