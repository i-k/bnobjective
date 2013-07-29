define(['../settings.js',
        'lib/backbone',
        'lib/jquery'
       ],
       function(Settings, Backbone, $) {
  // TODO: rename to reflect sessionModel
  function bnPost(url, sessionModel, data, succMsg, onSuccess) { return $.ajax({
    type: "POST",
    url: url,
    data: $.extend({
      uid: sessionModel.get('user'),
      app: Settings.bnauth.appName,
      sid: sessionModel.get('auth_token')
    }, data),
    success: createSuccessHandler(succMsg, onSuccess),
    error: errorHandler,
    dataType: 'json'
  }); }
  
  function createSuccessHandler(succMsg, onSuccess) {
    return function(result) {
      if(result.result.status < 300) {
        successMsg(succMsg)
        onSuccess()
      } else 
        errorMsg(result.result.message)
    }
  }
  
  function errorHandler(jqXHR, textStatus, errorThrown) {
    if (jqXHR.responseText === '')
      errorMsg("Could not connect to service-backend!")
    else {
      try {
        var respObj = JSON.parse(jqXHR.responseText)
        if (respObj.result.message === 'user not logged in') {
          errorMsg("Et ole kirjautunut sisään")
        } else
          errorMsg(respObj.result.message)
      } catch (err) {
        errorMsg(err)
      }
    }
  }
  
  function msg(message, messageDivClass) {
    $('#messages').html('<div class="alert alert-' + messageDivClass + '"><button type="button" class="close" data-dismiss="alert">x</button><p>' + message + '</p></div>');
  }
  
  function errorMsg(message) { msg(message, "error"); }
  function successMsg(message) { msg(message, "success"); }
         
  return function(extender) {
    return Backbone.View.extend(extender).extend({
      bnPost: bnPost,
      createSuccessHandler: createSuccessHandler,
      errorHandler: errorHandler,
      msg: msg,
      errorMsg: errorMsg,
      successMsg: successMsg
    });
  }
  
});