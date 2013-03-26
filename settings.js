module.exports = new Settings()

function Settings(){
  this.appPort = 3002,
  this.mongoHost = 'localhost',
  this.bnAuthUrl = 'http://localhost:3000/api/auth',
  this.maxAmountOfTagsPerObjective = 10,
  this.maxTagLength = 50,
  this.maxTagDescriptionLength = 20000,
  this.maxTagNameLength = 200,
  this.maxEntryCommentsLength = 20000
}
