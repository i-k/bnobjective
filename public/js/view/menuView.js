define(['./../js/settings.js',
        'lib/handlebars', 
        'lib/backbone',
        'lib/jquery',
        'lib/text!../../template/menuTemplate.hbs',
        'lib/sha256',
        'lib/jquery.cookie'
       ],
       function (Settings, Handlebars, Backbone, $, ItemTemplateSource) {

  var menuView = Backbone.View.extend({
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
      var self = this
      // Take care that no listener is bound twice:
      $('#main *').off("click.menu")
      
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
                    $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">x</button><p>' + result.result.message + '</p></div>')
                  }
                },
                error: function(jqXHR, textStatus, errorThrown){
                  if (jqXHR.responseText === '')
                    $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">x</button><p>Could not connect to auth-service backend!</p></div>')
                  else {
                    try {
                      var respObj = JSON.parse(jqXHR.responseText)
                      $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">x</button><p>' + respObj.result.message + '</p></div>')
                    } catch (err){
                      $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">x</button><p>' + err + '</p></div>')
                    }
                  }
                },
                dataType: 'json'
              })

            } else {
              console.log("Couldn't retrieve login token! " + result.result.status)
              $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">x</button><p>' + result.result.message + '</p></div>')
            }
          },
          error: function(jqXHR, textStatus, errorThrown){
            if (jqXHR.responseText === '')
              $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">x</button><p>Could not connect to auth-service backend!</p></div>')
            else {
              try {
                var respObj = JSON.parse(jqXHR.responseText)
                $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">x</button><p>' + respObj.result.message + '</p></div>')
              } catch (err){
                $('#messages').html('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">x</button><p>' + err + '</p></div>')
              }
            }
          },
          dataType: 'json'
        })

      })

    }, // end bindLogin

    bindLogout: function(model){
      $('#logout-menu').on('click.menu', function(){

        var username = model.get('user')
          , sessionId = model.get('auth_token')

         $.ajax({
          type: "POST",
          url: Settings.bnauth.logoutUrl,
          data: {
            username: username,
            appName: Settings.bnauth.appName,
            session_id: sessionId
          },
          success: function(result){
            console.log(result)
            if(result.result.status < 300){
              model.set({user: null, auth_token: null, user_roles: null})
              $.removeCookie(Settings.bnauth.appName + '.session')
              Backbone.history.navigate('#/', {trigger: true}) // go to frontpage after logging out
            } else {
              model.set({user: null, auth_token: null, user_roles: null})
              $.removeCookie(Settings.bnauth.appName + '.session')
              Backbone.history.navigate('#/', {trigger: true}) // go to frontpage, user already logged out.
            }
          },
          error: function(jqXHR, textStatus, errorThrown){
            model.set({user: null, auth_token: null, user_roles: null})
            $.removeCookie(Settings.bnauth.appName + '.session')
            Backbone.history.navigate('#/', {trigger: true}) // go to frontpage, user already logged out.
          },
          dataType: 'json'
        })

      })

    } // end bindLogout

  }) // end menuView
  
  return menuView

})