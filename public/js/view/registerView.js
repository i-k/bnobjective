define(['./../js/settings.js',
        'lib/handlebars', 
        'lib/backbone',
        'lib/jquery',
        'lib/text!../../template/registerTemplate.hbs'],
       function (Settings, Handlebars, Backbone, $, ItemTemplateSource) {

  var registerView = Backbone.View.extend({
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
      console.log('Rendering...' + event)
      var $el = this.$el
      $el.html(this.itemTemplate())

      $('#register').on('click.common', function(){

        var username = $('#username').val()
          , email = $('#email').val()
          , password = $('#password').val()
          , hashedPassword = sha256_digest(password)

        $.ajax({
          type: "POST",
          url: Settings.bnauth.registerUrl,
          data: {
            username: username,
            appName: Settings.bnauth.appName,
            email: email,
            password: hashedPassword
          },
          success: function(result){
            console.log(result);
            // TODO: log user in?
            password = "";
            hashedPassword = "";
            // model.set({user: username, auth_token: result.result.data.access_token})
          },
          dataType: 'json'
        })
      })

      return this
    }

  })
  
  return registerView

})