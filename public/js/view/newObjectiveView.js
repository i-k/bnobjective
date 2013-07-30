define(['../js/settings.js',
        'lib/handlebars', 
        'lib/backbone',
        'lib/jquery',
        'lib/text!../../template/newObjectiveTemplate.hbs',
        '../js/view/BnView.js',
        'lib/jquery.fixheadertable'],
        function (Settings, Handlebars, Backbone, $, ItemTemplateSource, ExtendBnView) {
          
  var newObjectiveView = ExtendBnView({
    el: $('#items'),

    sessionModel: null,

    initialize: function(options){
      _.bindAll(this, 'render')
      this.sessionModel = options.sessionModel
    },

    close: function(){
      $('#main *').off("click.common")
    },

    itemTemplate: Handlebars.compile(ItemTemplateSource),
    
    renderNewOrEdit: function(extraDataForPost) {
      var self = this;
      $("[rel='tooltip']").tooltip()

      $('#toggleRecordWindowExtra').on('click.common', function(){
        $('#recordWindowExtra').toggle()
      })

      $('#toggleUomExtra').on('click.common', function(){
        $('#uomExtra').toggle()
      })

      $('#save').on('click.common', function(){
         
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
         
          self.bnPost(
            Settings.bnobjective.addOrUpdateObjective,
            self.sessionModel,
            $.extend(
              extraDataForPost || {},
              {
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
              }
            ),
            "Tavoite tallennettu",
            function() {
              window.scrollTo(0,0)
              Backbone.history.navigate('#/objectives', {trigger: true})
            }
          )
      })
    },

    renderEdit: function(item) {
      var $el = this.$el
      $el.html(this.itemTemplate(item))
      this.renderNewOrEdit({ id: item.id })
      return this
    },
    
    render: function() {
      var $el = this.$el;
      $el.html(this.itemTemplate({}))
      this.renderNewOrEdit()
      return this
    },
    
    renderNotFound: function() {
      this.msg("Tavoitetta ei löytynyt");
    }

  })
  
  return newObjectiveView

})