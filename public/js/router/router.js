define([
  './../js/settings.js',
  'lib/jquery',
  'lib/underscore',
  'lib/backbone',
  'view/objectivesView',
  'view/objectiveDetailsView',
  'view/newObjectiveView',
  'view/menuView',
  'view/frontpageView',
  'view/registerView',
  'model/item',
  'collection/itemCollection',
  'lib/jquery.cookie'
],

  function(Settings, $, _, Backbone, ObjectivesView, ObjectiveDetailsView, NewObjectiveView,
           MenuView, FrontpageView, RegisterView, Item, ItemCollection){

  var AppRouter = Backbone.Router.extend({

    routes: {
      '': 'render',
      'objectives/:identifier': 'renderObjectiveByIdentifier',
      'objectives': 'render',
      'new-objective': 'renderNewObjective',
      'update-objective/:id': 'renderNewObjective',
      'register': 'renderRegister',
      '*actions': 'render' // Default
    },

    itemCollection: new ItemCollection(),

    session: new Item(),

    initialize: function(){
      var self = this
      $.support.cors = true
      $.ajaxSetup({cache: false}) // For Internet Explorer. If this is not set, all Ajax-requests hit the cache.

      // show the '#loading' element when ajaxStart, and hide it when ajaxComplete
      $("#loading").on('ajaxStart', function(){
        $(this).show()
      }).on('ajaxComplete', function(){
        $(this).hide()
      })

      // TODO: can we rather use: app.views instead of global variable?
      window.views = [] // to manage views and prevent them from turning into zombies.

      var cookieSession = $.cookie(Settings.bnauth.appName + '.session')
        , cookieSessionObj = {}

       try {
         if (cookieSession && cookieSession.length > 0)
           cookieSessionObj = JSON.parse(cookieSession)
       } catch(err){
         console.log('Error parsing the cookieSession into Json-object')
       }

      if (typeof cookieSessionObj.access_token === 'undefined')
        self.session.set({user: null,
                          auth_token: null,
                          user_roles: null})
      else
        self.session.set({user: cookieSessionObj.username,
                          auth_token: cookieSessionObj.access_token,
                          user_roles: cookieSessionObj.user_roles})

      console.log('Session: %o', self.session)

      var menuView = new MenuView({model: self.session})
      console.log('Rendering menu...')
      menuView.render()
      window.views.push(menuView)
    },

    // if user is logged in, render list of objectives,
    // otherwise render frontpage.
    render: function(actions){
      var self = this
      this.closeViews() // closes other views but menu
      console.log('(Default) Route:', actions)
      $('#page-description').html('Kimppatsemppari')
      if (self.session.get('user') !== null) {
        // TODO: fetch objectives for collection
        console.log('USER INFO:')
        console.log(self.session.get('user'))
        this.itemCollection.setCredentials(self.session.get('user'), Settings.bnauth.appName, self.session.get('auth_token'))
        this.itemCollection.setSearchUserId(self.session.get('user'))
        this.itemCollection.fetch()
        var objectivesView = new ObjectivesView({collection: this.itemCollection, sessionModel: this.session})
        objectivesView.render()
        window.views.push(objectivesView)
        $('#page-description').html('Tavoitteet')
      } else {
        console.log('Rendering frontpage:')
        var frontpageView = new FrontpageView()
        frontpageView.render()
        window.views.push(frontpageView) 
      }
    },

    renderObjectiveById: function(id){
      this.closeViews()
      console.log('Route: objective by identifier: ', id)
      $('#page-description').html('Tavoite: ' + id)
      this.itemCollection.setCredentials(this.session.get('user'), Settings.bnauth.appName, this.session.get('auth_token'))
      this.itemCollection.setId(id)
      this.itemCollection.setSearchUserId(session.get('user'))
      this.itemCollection.fetch()
      var objectiveDetailsView = new ObjectiveDetailsView({collection: this.itemCollection})
      objectiveDetailsView.render()
      window.views.push(objectiveDetailsView)
    },

    // new or update
    renderNewObjective: function(id){
      this.closeViews()
      console.log('Route: new-objective. Id: ' + id)
      $('#page-description').html('Uusi tavoite')

      if (typeof id !== 'undefined' && id !== null) {
        this.itemCollection.setCredentials(this.session.get('user'), Settings.bnauth.appName, this.session.get('auth_token'))
        this.itemCollection.setId(id)
        this.itemCollection.setSearchUserId(this.session.get('user'))
        this.itemCollection.fetch()
        $('#page-description').html('Muokkaa tavoitetta')
      } else {
        this.itemCollection.setCredentials(this.session.get('user'), Settings.bnauth.appName, this.session.get('auth_token'))
        this.itemCollection.setId(id)
        this.itemCollection.setSearchUserId(this.session.get('user'))
        this.itemCollection.fetch()
      }
      console.log('RENDER:')
      console.log(this.itemCollection)
      var newObjectiveView = new NewObjectiveView({collection: this.itemCollection, sessionModel: this.session})
      newObjectiveView.render()
      window.views.push(newObjectiveView)
    },

    renderRegister: function(){
      this.closeViews()
      console.log('Route: register')
      $('#page-description').html('Liity jäseneksi')
      var registerView = new RegisterView()
      registerView.render()
      window.views.push(registerView)
    },

    // view must implement the close()-method which unbinds it from any subscribed events
    closeViews: function(){
      _.each(window.views, function(view){
        if(typeof view.close != 'undefined'){
          console.log('Closing view:')
          console.log(view)
          view.close()
        }
      })
      window.views = []
    }
  })

  var initialize = function(){
    var app_router = new AppRouter
    $(document).ready(function(){
      Backbone.history.start()
    })
  }

  return {
    initialize: initialize
  }

})
