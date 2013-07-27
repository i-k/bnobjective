define(function(){

  var Settings = function(){
    var authBase = "http://bnauth.artiee.c9.io/api/" //"http://localhost:8081/api/"; 
    
    // This is the base-URL for Node.js -based API:
    this.baseUrl = "http://bnobjective.artiee.c9.io/api/", //"http://localhost:8080/api/"
    this.bnauth = {},
    this.bnobjective = {},
    this.bnauth.appName = "kimppatsemppari",
    this.bnauth.loginTokenUrl = authBase + "login_token",
    this.bnauth.loginUrl = authBase + "login",
    this.bnauth.logoutUrl = authBase + "logout",
    this.bnauth.registerUrl = authBase + "register",
    this.bnobjective.removeObjectiveUrl = this.baseUrl + "remove-objective",
    this.bnobjective.addOrUpdateObjective = this.baseUrl + "objective",
    this.bnobjective.objectives = this.baseUrl + "objectives",
    this.bnobjective.addEntryUrl = this.baseUrl + "entry"
  }

  return new Settings()

})