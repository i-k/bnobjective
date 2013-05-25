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

      Handlebars.registerHelper('proto', function() {
        if(typeof this != 'undefined'){
          return this.test_field + 1
        }
      })
    },

    close: function(){
      this.collection.off('all', this.render)
      $('#main *').off("click.common")
    },

    itemTemplate: Handlebars.compile(ItemTemplateSource),

    test: function(event){
      console.log(event)
    },

    render: function(event){
      var self = this
      console.log('Rendering...' + event)
      var $el = this.$el
      console.log('collection: %o' , this.collection.toJSON())
      var items = { "item": this.collection.toJSON() }
      console.log(items)
      $el.html(this.itemTemplate(items))

      var rows = this.collection.toJSON()

      console.log('ROWS')
      console.log(rows)

      rows.forEach(function(row){
        $('#' + row._id + '-delete-objective').on('click.common', function(){
          if (confirm('Haluatko varmisti poistaa tämän tavoitteen?')) {
          $.ajax({
            type: "POST",
            url: Settings.bnobjective.removeObjectiveUrl,
            data: {
              id: row._id,
              uid: self.sessionModel.get('user'),
              app: Settings.bnauth.appName,
              sid: self.sessionModel.get('auth_token')
            },
            success: function(result){
              console.log(result);
              if(result.result.status < 300){
                $('#messages').html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">x</button><p>Tavoite poistettu</p></div>')
                window.scrollTo(0,0)
                self.collection.fetch()
              } else {
                $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">x</button><p>' + result.result.message + '</p></div>')
              }
            },
            error: function(jqXHR, textStatus, errorThrown){
              if (jqXHR.responseText === '')
                $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">x</button><p>Could not connect to service-backend!</p></div>')
              else {
                try {
                  var respObj = JSON.parse(jqXHR.responseText)
                  $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">x</button><p>' + respObj.result.message + '</p></div>')
                } catch (err){
                  $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">x</button><p>' + err + '</p></div>')
                }
              }
            },
            dataType: 'json'
          })
          }
        })  
      })

      return this
    }

  })
  
  return objectivesView

})