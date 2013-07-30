// TODO: somekind of logout/sessionManager -object. Logout and Login -functions should be placed there.
//       If server responds "User is logged out" => then call Session.logout() => this should take the 
//       user back to frontpage.

define(['./../js/settings.js',
        'lib/handlebars', 
        'lib/backbone',
        'lib/jquery',
        'lib/text!../../template/objectivesTemplate.hbs',
        '../js/view/BnView.js',
        'lib/jquery.fixheadertable'],
       function (Settings, Handlebars, Backbone, $, ItemTemplateSource, ExtendBnView) {

  var objectivesView = ExtendBnView({
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
      
      function onSuccess() {
        window.scrollTo(0,0)
        self.collection.fetch()
      }

      rows.forEach(function(row){
      console.log(row.name + ", entries: " + row.entries)
        $('#' + row._id + '-add-entry').on('click.common', function(){
          $('#' + row._id + '-entry-details').toggle()
        })

        $('#' + row._id + '-save-entry').on('click.common', function(){
          var entryAmount = $('#' + row._id + '-entry-uom').val()

          if (parseInt(entryAmount) === 'NaN')
            entryAmount = 0
            
          self.bnPost(
            Settings.bnobjective.addEntryUrl,
            self.sessionModel,
            { 
              objectiveId: row._id,
              amount: entryAmount
            },
            "Kirjaus lisätty",
            onSuccess
          )
        })

        $('#' + row._id + '-delete-objective').on('click.common', function(){
          if (confirm('Haluatko varmasti poistaa tämän tavoitteen?')) {
            self.bnPost(
              Settings.bnobjective.removeObjectiveUrl,
              self.sessionModel,
              { id: row._id, },
              "Tavoite poistettu",
              onSuccess
            )
          }
        })
      })

      return this
    }
    
  })
  
  return objectivesView

})