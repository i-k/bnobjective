/*
 * Initialize the application by loading the required modules
 *   Note: for Handlebars.js use https://github.com/SlexAxton/require-handlebars-plugin
 */
requirejs.config({
  baseUrl: 'js',
  paths: {
    "i18nprecompile": "lib/i18nprecompile",
    "json2": "lib/json2",
    "handlebars": "lib/handlebars",
    "underscore": "lib/underscore",
    "backbone": "lib/backbone",
    "bootstrap": "lib/bootstrap",
    "jquery": "lib/jquery",
    "fixedmenu": "lib/jquery.fixheadertable"
  },
  
  shim: {
    enforceDefine: true,
    'lib/jquery': {
      exports: '$'
    },
    'lib/backbone': {
       //These script dependencies should be loaded before loading backbone.js
       deps: ['lib/underscore', 'lib/jquery'],
       //Once loaded, use the global 'Backbone' as the module value.
       exports: 'Backbone'
     },
     'lib/underscore': {
       exports: '_' // global value for underscore
     },
     'bootstrap': {
       deps: ['jquery'],
       exports: '$.fn.popover'
     },
     'fixedmenu': {
       deps: ['jquery'],
       exports: '$.fn.fixheadertable'
     },
     "lib/bootstrap-alert": ["jquery"],
     "lib/bootstrap-dropdown": ["jquery"],
     "lib/bootstrap-tooltip": ["jquery"]
  }
});

// Start the main app logic.
define(['./router/router', './js/settings.js', './lib/jquery', './lib/bootstrap', 
       'lib/handlebars' /*, 'http://localhost:8080/socket.io/socket.io.js'*/],
  function(Router, Settings, $, Bootstrap, Handlebars /*, io*/) {
/*
    var socket = io.connect('http://localhost:8080')
    socket.on('news', function (data) {
      console.log("============================")
      console.log(data)
      console.log("============================")
    })
*/
    Router.initialize()
  }
)
