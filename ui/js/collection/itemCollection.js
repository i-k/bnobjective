define(['./../js/settings.js',
        'lib/jquery',
        'lib/backbone',
        'lib/underscore',
        'model/item'], function (Settings, $, Backbone, _, Item) {

  var itemCollection = Backbone.Collection.extend({
    url: Settings.baseUrl + 'api/objectives', // default url when loading this first time
    model: Item,
    parse: function(items){
      // console.log('parsing...%o' , items);
      var parsedModels = new Array();
      _.each(items, function(itemArray){
        _.each(itemArray, function(item){
          // console.log(item);
          parsedModels.push(new Item(item));
        })
      })
      return parsedModels;
    },
    setUrl: function(url){
      this.url = url;
      console.log("Url is now: " + this.url);
    }
  });
  return itemCollection;

});