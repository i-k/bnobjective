// TODO: somekind of logout/sessionManager -object. Logout and Login -functions should be placed there.
//       If server responds "User is logged out" => then call Session.logout() => this should take the 
//       user back to frontpage.

define(['./../js/settings.js',
        'lib/handlebars', 
        'lib/backbone',
        'lib/jquery',
        'lib/text!../../template/objectivesTemplate.hbs',
        'lib/jquery.fixheadertable'],
       function (Settings, Handlebars, Backbone, $, ItemTemplateSource) {

  var objectivesView = Backbone.View.extend({
    el: $('#items'),

    sessionModel: null,

    initialize: function(options){
      // this.setElement('#items'); // TODO: update to use this!
      _.bindAll(this, 'render')
      this.sessionModel = options.sessionModel
      this.collection.on('all', this.render)
    },

    close: function(){
      this.collection.off('all', this.render)
      $('#main *').off("click.common")
    },

    itemTemplate: Handlebars.compile(ItemTemplateSource),

    render: function(event){
      var self = this,
          $el = this.$el
          rows = this.collection.toJSON(),
          items = { "item": rows };
      $el.html(this.itemTemplate(items))

      console.log('render objectivesView')
      console.log(rows)

      rows.forEach(function(row){

        $('#' + row._id + '-add-entry').on('click.common', function(){
          $('#' + row._id + '-entry-details').toggle()
        })

        $('#' + row._id + '-save-entry').on('click.common', function(){
          var entryAmount = $('#' + row._id + '-entry-uom').val()

          if (parseInt(entryAmount) === 'NaN')
            entryAmount = 0
            
          bnPost(
            Settings.bnobjective.addEntryUrl,
            self.sessionModel,
            { 
              objectiveId: row._id,
              amount: entryAmount
            },
            "Kirjaus lisätty",
            self.collection
          )
        })

        $('#' + row._id + '-delete-objective').on('click.common', function(){
          if (confirm('Haluatko varmasti poistaa tämän tavoitteen?')) {
            bnPost(
              Settings.bnobjective.removeObjectiveUrl,
              self.sessionModel,
              { id: row._id, },
              "Tavoite poistettu",
              self.collection
            )
          }
        })
      })

      return this
    }
    
  })
  //TODO: create a new Backbone-view with these added and extend it in the views 
  function bnPost(url, sessionModel, data, succMsg, collection) { return $.ajax({
    type: "POST",
    url: url,
    data: $.extend({
      uid: sessionModel.get('user'),
      app: Settings.bnauth.appName,
      sid: sessionModel.get('auth_token')
    }, data),
    success: createSuccessHandler(succMsg, collection),
    error: errorHandler,
    dataType: 'json'
  }); }
  
  function createSuccessHandler(succMsg, collection) {
    return function(result) {
      if(result.result.status < 300) {
        successMsg(succMsg)
        window.scrollTo(0,0)
        collection.fetch()
      } else 
        errorMsg(result.result.message)
    }
  }
  
  function errorHandler(jqXHR, textStatus, errorThrown) {
    if (jqXHR.responseText === '')
      errorMsg("Could not connect to service-backend!")
    else {
      try {
        var respObj = JSON.parse(jqXHR.responseText)
        errorMsg(respObj.result.message)
      } catch (err) {
        errorMsg(err)
      }
    }
  }
  
  function msg(message, messageDivClass) {
    $('#messages').html('<div class="alert alert-' + messageDivClass + '"><button type="button" class="close" data-dismiss="alert">x</button><p>' + message + '</p></div>');
  }
  
  function errorMsg(message) { msg(message, "error"); }
  function successMsg(message) { msg(message, "success"); }
  
  return objectivesView

})