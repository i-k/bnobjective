define(['../js/settings.js',
        'lib/handlebars', 
        'lib/backbone',
        'lib/jquery',
        'lib/text!../../template/newObjectiveTemplate.hbs',
        '../js/view/BnView.js',
        'lib/jquery.fixheadertable'],
       function (Settings, Handlebars, Backbone, $, ItemTemplateSource, ExtendBnView) {

//TODO: this.collection returns / contains all of the Objectives, so this view always thinks its editing an old Objective
//      so create own views for editing and creating, that extend a common super-view

  var newObjectiveView = ExtendBnView({
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
      console.log('Rendering...' + event)
      var self = this
        , $el = this.$el
        , items = this.collection.toJSON()
        , item;

    
      if (items.length > 0) {
        item = items[0]
        $el.html(this.itemTemplate(item))
      } else 
        $el.html(this.itemTemplate({}))

      // Enable tooltips:
      $("[rel='tooltip']").tooltip()

      $('#toggleRecordWindowExtra').on('click.common', function(){
        $('#recordWindowExtra').toggle()
      })

      $('#toggleUomExtra').on('click.common', function(){
        $('#uomExtra').toggle()
      })

      $('#save').on('click.common', function(){
         console.log('Saving... ' + Settings.bnobjective.addObjective)
         
         var name = $('#name').val()
           , description = $('#description').val()
           , expirationDate = $('#expirationDate').val()
           , entryTitleText = $('#entryTitleText').val()
           , entryUnitOfMeasure = $('#entryUnitOfMeasure').val()
           , entryMinAmount = $('#entryMinAmount').val()
           , entryMaxAmount = $('#entryMaxAmount').val()
           , entrySuccessMinAmount = $('#entrySuccessMinAmount').val()
           , entrySuccessMaxAmount = $('#entrySuccessMaxAmount').val()
           , tags = $("#tags").val().split(",").map(function(e) { return e.trim(); })
           , isPublic = $('#isPublic').val()
           , id = null

         // if updating existing objective, get the id (else send null, which creates a new objective):
        if (item)
          id = item._id
         
        self.bnPost(
           Settings.bnobjective.addOrUpdateObjective,
           self.sessionModel,
           {
            id: id, // if id exists (is not null), then we do update, otherwise create a new objective
            name: name,
            description: description,
            expirationDate: expirationDate,
            entryTitleText: entryTitleText,
            entryUnitOfMeasure: entryUnitOfMeasure,
            entryMinAmount: entryMinAmount,
            entryMaxAmount: entryMaxAmount,
            entrySuccessMinAmount: entrySuccessMinAmount,
            entrySuccessMaxAmount: entrySuccessMaxAmount,
            tags: tags,
            isPublic: isPublic
          },
          "Tavoite tallennettu",
          function() {
            window.scrollTo(0,0)
            Backbone.history.navigate('#/objectives', {trigger: true})
          }
        )
        
      })

      return this
    }

  })
  
  return newObjectiveView

})