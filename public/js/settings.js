define(function(){

  var Settings = function(){

    // This is the base-URL for Node.js -based API:
    this.baseUrl = "http://localhost:8081/",
    this.bnauth = {},
    this.bnobjective = {},
    this.bnauth.appName = "kimppatsemppari",
    this.bnauth.loginTokenUrl = 'http://localhost:8080/api/login_token',
    this.bnauth.loginUrl = 'http://localhost:8080/api/login',
    this.bnauth.logoutUrl = 'http://localhost:8080/api/logout',
    this.bnauth.registerUrl = 'http://localhost:8080/api/register',
    this.bnobjective.addOrUpdateObjective = 'http://localhost:8081/api/objective',
    this.bnobjective.objectives = 'http://localhost:8081/api/objectives'
  }

  return new Settings()

})