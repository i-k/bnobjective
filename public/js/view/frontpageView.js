define(['./../js/settings.js',
        'lib/handlebars', 
        'lib/backbone',
        'lib/jquery',
        'lib/text!../../template/frontpageTemplate.hbs'],
       function (Settings, Handlebars, Backbone, $, ItemTemplateSource) {

  var frontpageView = Backbone.View.extend({
    el: $('#items'),

    initialize: function(){
      _.bindAll(this, 'render')
      $('#loading').hide()
      Handlebars.registerHelper('proto', function() {
        if(typeof this != 'undefined'){
          return this.test_field + 1
        }
      })
    },

    close: function(){
      $('#main *').off("click.common")
    },

    itemTemplate: Handlebars.compile(ItemTemplateSource),

    test: function(event){
      console.log(event)
    },

    render: function(event){
      var self = this
      console.log('Rendering frontpage...' + event)
      var $el = this.$el
      $el.html(this.itemTemplate())

      $('#register').on('click.common', function(){
        Backbone.history.navigate('#/register')
      })

      return this
    }

  })
  
  return frontpageView

})