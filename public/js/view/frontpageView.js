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
    },

    close: function(){
      $('#main *').off("click.common")
    },

    itemTemplate: Handlebars.compile(ItemTemplateSource),

    render: function(event){
      this.$el.html(this.itemTemplate())

      $('#register').on('click.common', function(){
        Backbone.history.navigate('#/register')
      })

      return this
    }

  })
  
  return frontpageView

})