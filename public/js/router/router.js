define([
  'lib/jquery',
  'lib/underscore',
  'lib/backbone',
  'view/objectivesView',
  'view/objectiveDetailsView',
  'view/menuView',
  'view/frontpageView',
  'view/registerView',
  'model/item',
  'collection/itemCollection',
],

  function($, _, Backbone, ObjectivesView, ObjectiveDetailsView, MenuView,
           FrontpageView, RegisterView,
           Item, ItemCollection){

  var AppRouter = Backbone.Router.extend({

    routes: {
      '': 'render',
      'objectives/:identifier': 'renderObjectiveByIdentifier',
      'objectives': 'render',
      'register': 'renderRegister',
      '*actions': 'render' // Default
    },

    itemCollection: new ItemCollection(),

    session: null,

    initialize: function(){
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

      session = new Item()
      session.set({user: null, auth_token: null})
      var menuView = new MenuView({model: session})
      menuView.render()
      window.views.push(menuView)
    },

    // if user is logged in, render list of objectives,
    // otherwise render frontpage.
    render: function(actions){
      this.closeViews()
      console.log('(Default) Route:', actions)
      $('#page-description').html('Kimppatsemppari')
      if (session !== null){
        if (session.get('user') !== null){
          // TODO: fetch objectives for collection
          console.log('USER INFO:')
          console.log(session.get('user'))
          var objectivesView = new ObjectivesView({collection: this.itemCollection})
          objectivesView.render()
          window.views.push(objectivesView)
          $('#page-description').html('Tavoitteet')
        } else {
          var frontpageView = new FrontpageView()
          frontpageView.render()
          window.views.push(frontpageView) 
        }
      }
    },

    renderObjectiveByIdentifier: function(identifier){
      this.closeViews()
      console.log('Route: objective by identifier: ', identifier)
      $('#page-description').html('Tavoite: ' + identifier)
      this.itemCollection.setIdentifier(identifier)
      this.itemCollection.fetch()
      var objectiveDetailsView = new ObjectiveDetailsView({collection: this.itemCollection, identifier: identifier})
      objectiveDetailsView.render()
      window.views.push(objectiveDetailsView)
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
