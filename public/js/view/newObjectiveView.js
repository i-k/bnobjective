define(['./../js/settings.js',
        'lib/handlebars', 
        'lib/backbone',
        'lib/jquery',
        'lib/text!../../template/newObjectiveTemplate.hbs',
        'lib/jquery.fixheadertable'],
       function (Settings, Handlebars, Backbone, $, ItemTemplateSource) {

  var newObjectiveView = Backbone.View.extend({
    el: $('#items'),

    sessionModel: null,

    initialize: function(options){
      // this.setElement('#items'); // TODO: update to use this!
      _.bindAll(this, 'render')
      this.sessionModel = options.sessionModel
    },

    close: function(){
      $('#main *').off("click.common")
    },

    itemTemplate: Handlebars.compile(ItemTemplateSource),

    render: function(event){
      var self = this
      console.log('Rendering...' + event)
      var $el = this.$el

      $el.html(this.itemTemplate({}))

      $('#save').on('click.common', function(){
         console.log('Saving... ' + Settings.bnobjective.addObjective)
         
         var name = $('#name').val()
           , description = $('#description').val()
           , expirationDate = $('#expirationDate').val()
           , recordIntervalMonths = $('#recordIntervalMonths').val()
           , recordIntervalWeeks = $('#recordIntervalWeeks').val()
           , recordIntervalDays = $('#recordIntervalDays').val()
           , recordIntervalHours = $('#recordIntervalHours').val()
           , recordWindowMonths = $('#recordWindowMonths').val()
           , recordWindowWeeks = $('#recordWindowWeeks').val()
           , recordWindowDays = $('#recordWindowDays').val()
           , recordWindowHours = $('#recordWindowHours').val()
           , entryTitleText = $('#entryTitleText').val()
           , entryUnitOfMeasure = $('#entryUnitOfMeasure').val()
           , entryMinAmount = $('#entryMinAmount').val()
           , entryMaxAmount = $('#entryMaxAmount').val()
           , entrySuccessMinAmount = $('#entrySuccessMinAmount').val()
           , entrySuccessMaxAmount = $('#entrySuccessMaxAmount').val()
           , tags = $('#tags').val()
           , isPublic = $('#isPublic').val()
         
         $.ajax({
          type: "POST",
          url: Settings.bnobjective.addObjective,
          data: {
            uid: self.sessionModel.get('user'),
            app: Settings.bnauth.appName,
            sid: self.sessionModel.get('auth_token'),
            name: name,
            description: description,
            expirationDate: expirationDate,
            recordInterval: {years: 0,
                             months: recordIntervalMonths,
                             weeks: recordIntervalWeeks,
                             days: recordIntervalDays,
                             hours: recordIntervalHours,
                             minutes: 0
                            },
            recordWindow: {years: 0,
                           months: recordWindowMonths,
                           weeks: recordWindowWeeks,
                           days: recordWindowDays,
                           hours: recordWindowHours,
                           minutes: 0
                          },
            entryTitleText: entryTitleText,
            entryUnitOfMeasure: entryUnitOfMeasure,
            entryMinAmount: entryMinAmount,
            entryMaxAmount: entryMaxAmount,
            entrySuccessMinAmount: entrySuccessMinAmount,
            entrySuccessMaxAmount: entrySuccessMaxAmount,
            tags: tags,
            isPublic: isPublic
          },
          success: function(result){
            console.log(result)
            if(result.result.status == 200){
              console.log(result)
            } else {
              console.log("Couldn't save! " + result)
            }
          },
          dataType: 'json'
        })
        
      })

      return this
    }

  })
  
  return newObjectiveView

})