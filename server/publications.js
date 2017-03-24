Meteor.publish("userAudiences", function() {
    return Audiences.find({});
});

Meteor.publish("userIntegrations", function() {
    return Integrations.find({ userId: this.userId });
});

Meteor.publish("userMetas", function() {
    return Metas.find({});
});

Meteor.publish("allUsers", function() {
    return Meteor.users.find({});
});