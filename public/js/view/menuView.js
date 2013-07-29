define(['./../js/settings.js',
        'lib/handlebars', 
        'lib/backbone',
        'lib/jquery',
        'lib/text!../../template/menuTemplate.hbs',
        '../js/view/BnView.js',
        'lib/sha256',
        'lib/jquery.cookie'
       ],
       function (Settings, Handlebars, Backbone, $, ItemTemplateSource, ExtendBnView) {

  var menuView = ExtendBnView({
    el: $('#menu'),

    initialize: function(){
      // this.setElement('#items'); // TODO: update to use this!
      _.bindAll(this, 'render')
      this.model.on('all', this.render)
      
      Handlebars.registerHelper('hasUserRole', function(context, block) {
        console.log('CHECKING FOR ROLE: ' + context)
        if (typeof this != 'undefined'){
          var userRoles = null
          if (self.model)
            userRoles = self.model.get('user_roles')

          if (userRoles && $.isArray(userRoles)){
            if (userRoles.indexOf(context) > -1){
              return block.fn(this)
            } else {
              return block.inverse(this)
            }
          } else {
            return block.inverse(this)
          }
        } else
          return block.inverse(this)
      })

    },

    // This view is not closed like others.
    close: function(){},

    itemTemplate: Handlebars.compile(ItemTemplateSource),

    render: function(event){
      // Take care that no listener is bound twice:
      $('#main *').off("click.menu")

      console.log('model: %o' , this.model.toJSON())
      var sessionItem = this.model.toJSON()
      this.$el.html(this.itemTemplate(sessionItem))
      
      // bind listeners:
      this.bindLogin(this.model)
      this.bindLogout(this.model)

      return this
    },
    
    bindLogin: function(model){
      var self = this
      $('#login-menu').on('click.menu', function(){

        var password = $('#password-menu').val()
          , username = $('#username-menu').val()

         $.ajax({
          type: "POST",
          url: Settings.bnauth.loginTokenUrl,
          data: {
            username: username,
            appName: Settings.bnauth.appName
          },
          success: function(result){
            console.log(result)
            if(result.result.status < 300){

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
                  if(result.result.status < 300){
                    password = "";
                    hashedPassword = "";
                    model.set({user: username, auth_token: result.result.data.access_token, user_roles: result.result.data.user_roles})
                    // Cookie is set so when the user comes back or refreshes the page (F5) the session is retrieved from the cookie.
                    $.cookie.json = true // see: https://github.com/carhartl/jquery-cookie
                    var bnSessionObj = {access_token: result.result.data.access_token,
                                        username: username,
                                        user_roles: result.result.data.user_roles}
                    $.cookie(Settings.bnauth.appName + '.session', bnSessionObj, { expires: 7 })
                    Backbone.history.navigate('#/objectives', {trigger: true})
                  } else {
                    self.errorMsg(result.result.message)
                  }
                },
                error: self.errorHandler,
                dataType: 'json'
              })

            } else {
              console.log("Couldn't retrieve login token! " + result.result.status)
              self.errorMsg(result.result.message)
            }
          },
          error: self.errorHandler,
          dataType: 'json'
        })

      })

    }, // end bindLogin

    bindLogout: function(model){
      $('#logout-menu').on('click.menu', function(){

        var username = model.get('user')
          , sessionId = model.get('auth_token')
          
        function logOut() {
          model.set({user: null, auth_token: null, user_roles: null})
          $.removeCookie(Settings.bnauth.appName + '.session')
          Backbone.history.navigate('#/', {trigger: true}) // go to frontpage after logging out
        }

         $.ajax({
          type: "POST",
          url: Settings.bnauth.logoutUrl,
          data: {
            username: username,
            appName: Settings.bnauth.appName,
            session_id: sessionId
          },
          success: logOut,
          error: logOut,
          dataType: 'json'
        })

      })

    } // end bindLogout

  }) // end menuView
  
  return menuView

})