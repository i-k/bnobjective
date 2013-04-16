define(function(){

  var Settings = function(){

    // This is the base-URL for Node.js -based API:
    this.baseUrl = "http://bnobjective.artiee.c9.io:8080/",
    this.bnauth = {},
    this.bnobjective = {},
    this.bnauth.appName = "kimppatsemppari",
    this.bnauth.loginTokenUrl = 'http://bnauth.artiee.c9.io:80/api/login_token',
    this.bnauth.loginUrl = 'http://bnauth.artiee.c9.io:80/api/login',
    this.bnauth.logoutUrl = 'http://bnauth.artiee.c9.io:80/api/logout',
    this.bnauth.registerUrl = 'http://bnauth.artiee.c9.io:80/api/register',
    this.bnobjective.addObjective = 'http://bnobjective.artiee.c9.io:80/api/add-objective',
    this.bnobjective.objectives = 'http://bnobjective.artiee.c9.io:80/api/objectives'
  }

  return new Settings()

})