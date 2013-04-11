define([
  'lib/jquery',
  'lib/underscore',
  'lib/backbone',
  'view/objectivesView',
  'view/objectiveDetailsView',
  'model/item',
  'collection/itemCollection',
],

  function($, _, Backbone, ObjectivesView, ObjectiveDetailsView,
           Item, ItemCollection){

  var AppRouter = Backbone.Router.extend({

    routes: {
      '': 'renderObjective',
      'objectives/:identifier': 'renderObjectiveByIdentifier',
      'objectives/': 'render',
      '*actions': 'render' // Default
    },

    itemCollection: new ItemCollection(),

    initialize: function(){
      $.support.cors = true
      $.ajaxSetup({cache: false}) // For Internet Explorer. If this is not set, all Ajax-requests hit the cache.

      // show the '#loading' element when ajaxStart, and hide it when ajaxComplete
      $("#loading").on('ajaxStart', function(){
        $(this).show()
      }).on('ajaxComplete', function(){
        $(this).hide()
      })

      // TODO: can we rather use: dpt.views instead of global variable?
      window.views = [] // to manage views and prevent them from turning into zombies.
    },

    render: function(actions){
      this.closeViews()
      console.log('(Default) Route:', actions)
      $('#page-description').html('Objectives')
      this.itemCollection.fetch()
      var objectivesView = new ObjectivesView({collection: this.itemCollection})
      objectivesView.render()
      window.views.push(objectivesView)
    },

    renderObjectiveByIdentifier: function(identifier){
      this.closeViews()
      console.log('Route: objective by identifier: ', identifier)
      $('#page-description').html('Objective: ' + identifier)
      this.itemCollection.setIdentifier(identifier)
      this.itemCollection.fetch()
      var objectiveDetailsView = new ObjectiveDetailsView({collection: this.itemCollection, identifier: identifier})
      objectiveDetailsView.render()
      window.views.push(objectiveDetailsView)
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
