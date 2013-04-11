define(['./../js/settings.js',
        'lib/handlebars', 
        'lib/backbone',
        'lib/jquery',
        'lib/text!../../template/protoTemplate.hbs',
        'lib/jquery.fixheadertable'],
       function (Settings, Handlebars, Backbone, $, ItemTemplateSource) {

  var objectivesView = Backbone.View.extend({
    el: $('#items'),

    initialize: function(){
      // this.setElement('#items'); // TODO: update to use this!
      _.bindAll(this, 'render')
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
      $("#item-table-data > tr:even").addClass("even") // alter row colors
      $("#item-table-data > tr:odd").addClass("odd")

      var rows = this.collection.toJSON()

      /*
      $('#item-table').fixheadertable({
        caption: 'Objectives',
        height: 800,
        minWidth: 1200
      }) */

      return this
    }

  })
  
  return objectivesView

})