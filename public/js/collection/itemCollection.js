define(['./../js/settings.js',
        'lib/jquery',
        'lib/backbone',
        'lib/underscore',
        'model/item'], function (Settings, $, Backbone, _, Item) {

  var itemCollection = Backbone.Collection.extend({
    url: Settings.baseUrl + 'objectives', // default url when loading this first time
    model: Item,
    parse: function(items){
      // console.log('parsing...%o' , items)
      var parsedModels = new Array()
      _.each(items.result.data, function(item){
      //  _.each(itemArray, function(item){
          console.log(item)
          parsedModels.push(new Item(item))
        //})
      })
      return parsedModels
    },
    setCredentials: function(username, appName, sessionId){
      this.url = Settings.baseUrl + 'objectives'
      this.url = this.url + '?uid=' + username + '&app=' + appName + '&sid=' + sessionId
      console.log("Url is now: " + this.url)
    },
    setId: function(id){
      this.url = this.url + '&id=' + id
      console.log("Url is now: " + this.url)
    },
    setSearchUserId: function(suid){
      this.url = this.url + '&suid=' + suid
      console.log("Url is now: " + this.url)
    }
  })
  return itemCollection

})