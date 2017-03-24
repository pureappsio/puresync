Router.configure({
    layoutTemplate: 'layout'
});

// Main route
Router.route('/', function() {

    if (!Meteor.userId()) {

        this.render('login');

    } else {

        this.render('audiences');

    }

});

Router.route('/login', {
    name: 'login'
});

Router.route('/signup', {
    name: 'signup'
});

Router.route('/admin', {
    name: 'admin'
});

Router.route('/audiences', {
    name: 'audiences'
});

