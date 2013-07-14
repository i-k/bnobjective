module.exports = new Settings()

function Settings(){

    // returns .mongoHost from the file given by the settings path
    // returns orUseThisHost if the file was not found or if some other error occurred
    function getMongoHostFromSettingsPathOr(pathToMongoSettings, orUseThisHost) {
      var mongoHost;
      try {
        mongoHost = require(pathToMongoSettings).mongoHost;
      } catch(err) {
        console.log(err);
      }
      return mongoHost || orUseThisHost;
    }

  this.appPort = process.env.PORT,
  this.mongoHost = getMongoHostFromSettingsPathOr('./mongoSettings.js', 'localhost'),
  this.bnAuthUrl = 'http://bnauth.artiee.c9.io/api/auth',
  this.maxAmountOfTagsPerObjective = 10,
  this.maxTagLength = 50,
  this.maxObjectiveDescriptionLength = 20000,
  this.maxObjectiveNameLength = 200,
  this.maxEntryCommentsLength = 20000
}