define(['./../js/settings.js',
        'lib/handlebars', 
        'lib/backbone',
        'lib/jquery',
        'lib/text!../../template/newObjectiveTemplate.hbs',
        'lib/jquery.fixheadertable'],
       function (Settings, Handlebars, Backbone, $, ItemTemplateSource) {

//TODO: this.collection returns / contains all of the Objectives, so this view always thinks its editing a view
//      so create own views for editing and creating, that extend a common super-view

  var newObjectiveView = Backbone.View.extend({
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

      if (item) {
        // Set value for recordInterval and recordWindow, if given:
        $('#recordIntervalMonths option[value="' + item.recordInterval.months +'"]').prop("selected", true)
        $('#recordIntervalWeeks option[value="' + item.recordInterval.weeks +'"]').prop("selected", true)
        $('#recordIntervalDays option[value="' + item.recordInterval.days +'"]').prop("selected", true)
        $('#recordIntervalHours option[value="' + item.recordInterval.hours +'"]').prop("selected", true)
        $('#recordWindowMonths option[value="' + item.recordWindow.months +'"]').prop("selected", true)
        $('#recordWindowWeeks option[value="' + item.recordWindow.weeks +'"]').prop("selected", true)
        $('#recordWindowDays option[value="' + item.recordWindow.days +'"]').prop("selected", true)
        $('#recordWindowHours option[value="' + item.recordWindow.hours +'"]').prop("selected", true)
      }

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
           , id = null

         // if updating existing objective, get the id (else send null, which creates a new objective):
         if (item)
           id = item._id
         
         $.ajax({
          type: "POST",
          url: Settings.bnobjective.addOrUpdateObjective,
          data: {
            id: id, // if id exists (is not null), then we do update, otherwise create a new objective
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
            if(result.result.status >= 200 && result.result.status < 300){
              console.log(result)
              $('#messages').html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button>Tavoite tallennettu</div>')
              window.scrollTo(0,0)
              Backbone.history.navigate('#/objectives', {trigger: true})
            } else if(result.result.status >= 300 && result.result.status < 500){
              console.log("Couldn't save! " + result)
              $('#messages').html('<div class="alert"><button type="button" class="close" data-dismiss="alert">&times;</button> Tallennus epäonnistui! ' + result.result.message + '</div>')
              window.scrollTo(0,0)
            } else {
              $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button> Tallennus epäonnistui! ' + result.result.message + '</div>')
              window.scrollTo(0,0)
            }
          },
          error: function(xhr){
            var jsonResp = JSON.parse(xhr.responseText)
            if (xhr.status >= 300 && xhr.status < 500) {
              if (jsonResp.result.message === 'user not logged in') {
                $('#messages').html('<div class="alert"><button type="button" class="close" data-dismiss="alert">&times;</button> <h4 class="alert-heading">Tallennus epäonnistui!</h4>Et ole kirjautunut sisään</div>')
                window.scrollTo(0,0)
              } else {
                $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button><h4>Tallennus epäonnistui!</h4>' + jsonResp.result.message + '</div>')
                window.scrollTo(0,0)
              }
            } else {
              $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button><h4>Tallennus epäonnistui!</h4>' + jsonResp.result.message + '</div>')
              window.scrollTo(0,0)
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