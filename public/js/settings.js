define(function(){

  var Settings = function(){

    // This is the base-URL for Node.js -based API:
    this.baseUrl = "http://bnobjective.artiee.c9.io/",
    this.bnauth = {},
    this.bnobjective = {},
    this.bnauth.appName = "kimppatsemppari",
    this.bnauth.loginTokenUrl = 'http://bnauth.artiee.c9.io/api/login_token',
    this.bnauth.loginUrl = 'http://bnauth.artiee.c9.io/api/login',
    this.bnauth.logoutUrl = 'http://bnauth.artiee.c9.io/api/logout',
    this.bnauth.registerUrl = 'http://bnauth.artiee.c9.io/api/register',
    this.bnobjective.removeObjectiveUrl = 'http://bnobjective.artiee.c9.io/api/remove-objective',
    this.bnobjective.addOrUpdateObjective = 'http://bnobjective.artiee.c9.io/api/objective',
    this.bnobjective.objectives = 'http://bnobjective.artiee.c9.io/api/objectives',
    this.bnobjective.addEntryUrl = 'http://bnobjective.artiee.c9.io/api/entry'
  }

  return new Settings()

})