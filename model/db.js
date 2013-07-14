module.exports = createBnObjectiveDb;

function createBnObjectiveDb(settings) {

  var mongoose = require('mongoose'),
      initEntry = require('./Entry.js'),
      initObjective = require('./Objective.js');
    
  return {
      connect: function(host) {
        mongoose.connect(host);
        return {
          Entry: initEntry(mongoose, settings),
          Objective: initObjective(mongoose, settings)
        };
      }
  };
}