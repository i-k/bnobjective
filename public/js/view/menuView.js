define(['./../js/settings.js',
        'lib/handlebars', 
        'lib/backbone',
        'lib/jquery',
        'lib/text!../../template/menuTemplate.hbs',
        'lib/sha256'
       ],
       function (Settings, Handlebars, Backbone, $, ItemTemplateSource) {

  var menuView = Backbone.View.extend({
    el: $('#menu'),

    initialize: function(){
      // this.setElement('#items'); // TODO: update to use this!
      _.bindAll(this, 'render')
      this.model.on('all', this.render)
    },

    // This view is not closed like others.
    close: function(){},

    itemTemplate: Handlebars.compile(ItemTemplateSource),

    render: function(event){
      var self = this
      // Take care that no listener is bound twice:
      $('#main *').off("click.common")
      
      console.log('Rendering...' + event)
      var $el = this.$el
      console.log('model: %o' , this.model.toJSON())
      var sessionItem = this.model.toJSON()
      console.log(items)
      $el.html(this.itemTemplate(sessionItem))
      
      // bind listeners:
      self.bindLogin(this.model)
      self.bindLogout(this.model)

      return this
    },
    
    bindLogin: function(model){
      $('#login').on('click.common', function(){

        var password = $('#password').val()
          , username = $('#username').val()

         $.ajax({
          type: "POST",
          url: Settings.bnauth.loginTokenUrl,
          data: {
            username: username,
            appName: Settings.bnauth.appName
          },
          success: function(result){
            console.log(result)
            if(result.result.status == 200){

              var hashedPassword = sha256_digest( sha256_digest(password) + result.result.data.salt )

              $.ajax({
                type: "POST",
                url: Settings.bnauth.loginUrl,
                data: {
                  username: username,
                  appName: Settings.bnauth.appName,
                  password: hashedPassword
                },
                success: function(result){
                  console.log(result);
                  password = "";
                  hashedPassword = "";
                  model.set({user: username, auth_token: result.result.data.access_token})
                },
                dataType: 'json'
              })

            } else {
              console.log("Couldn't retrieve login token! " + result.result.status)
            }
          },
          dataType: 'json'
        })

      })

    }, // end bindLogin

    bindLogout: function(model){
      $('#logout').on('click.common', function(){

        var username = model.get('user')
          , sessionId = model.get('auth_token')

         $.ajax({
          type: "POST",
          url: Settings.bnauth.logoutUrl,
          data: {
            username: username,
            application: Settings.bnauth.appName, // TODO: check from bnauth the inconsistency between naming: appName and application !
            session_id: sessionId
            
          },
          success: function(result){
            console.log(result)
            if(result.result.status == 200){
              model.set({user: null, auth_token: null})
              Backbone.history.navigate('/') // go to frontpage after logging out!
            } else {
              console.log("Couldn't logout! " + result.result.status)
            }
          },
          dataType: 'json'
        })

      })

    } // end bindLogout


  }) // end menuView
  
  return menuView

})