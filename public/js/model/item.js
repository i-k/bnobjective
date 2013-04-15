define(['./../js/settings.js',
        'lib/backbone'], function (Settings, Backbone) {

  var itemModel = Backbone.Model.extend({
    url: Settings.baseUrl + 'test/data/post_1.json', // this is not used!
    initialize: function(){
      // console.log("initialized itemModel.");
    }
  });
  
  return itemModel;

});