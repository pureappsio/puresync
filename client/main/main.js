// Tracker
Tracker.autorun(function() {
  
    Meteor.subscribe('userAudiences');
    Meteor.subscribe('userMetas');
    Meteor.subscribe('allUsers');
    Meteor.subscribe('userIntegrations');
});

// Imports
import 'bootstrap';
import '/node_modules/bootstrap/dist/css/bootstrap.min.css';
