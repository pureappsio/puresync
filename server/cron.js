SyncedCron.add({
  name: 'Refresh Facebook audiences',
  schedule: function(parser) {
    // parser is a later.parse object
    return parser.text('every 1 day');
  },
  job: function() {
    Meteor.call('updateAudiences');
  }
});

SyncedCron.config({
  log: true
});
