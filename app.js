/*
 * BNObjective
 *
 * TODO next: route to add objective and entry, testpage for these
 *   => min lengths for fields for objective
 *   => check that validations actually work
 *
 * NOTES:
 *   -expirationDate is not set up correctly when updating objective => fix this
 *   -at times c9 returns app not running html as result-param of validateUser =>
 *    add checks for existence of result.result.message etc
 *
 *   -now that the interval has been removed, no yes/no -question is needed.
 *    Only record the entry.
 *
 *   -agreed with i-k to setup predefined objectives.
 */

var express = require('express'),
    request = require('request'),
    settings = require('./settings.js'),
    db = require('./model/db.js')(settings), // settings for validations of the models
    models = db.connect(settings.mongoHost),
    Objective = models.Objective,
    Entry = models.Entry;

var app = express()

app.use(express.bodyParser()) // to parse POSTs in JSON
app.use(express.static(__dirname + '/public'))

// CORS-headers (Cross Origin ResourceS) allow AJAX-requests from other hosts 
function setCORSHeaders(res){
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Allow-Methods", "DELETE, PATCH, PUT, HEAD, OPTIONS, GET, POST")
  res.setHeader("Access-Control-Allow-Headers", "Overwrite, Destination, Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control")
}

// A little helper function for writing results in dry-manner.
function writeResult(res, status, message, data){
  res.writeHead(status, {"Content-Type": "application/json"})
  res.write(
    JSON.stringify({ 
      result: {
        status: status,
        message: message,
        data: data
      }
    })
  )
  res.end()
}

function validateUser(username, application, sessionId, callback){
  console.log('Validating user ' + username)
  request.post({url: settings.bnAuthUrl,
                json: {username: username, 
                       appName: application, 
                       session_id: sessionId}
               }, function (err, resp, body) {
    if (!err && resp.statusCode === 200) {
      console.log('Authorized %o', body)
      return callback(body)
    } else if (!err) {
      console.log('Not authorized. %o', body)
      return callback(body)
    } else {
      console.log('Error: ' + err)
      return callback({result: {status: 500, message: 'Unexpected error: ' + err, data: []}})
    }
  })
}

app.post('/api/objective', function(req, res){
  return doWithValidUsernameAppSessionIdOrWriteErrorResult(
    req.body,
    res,
    function(almostValid) {
      return postObjective(req, res, almostValid.username, almostValid.app, almostValid.sessionId);
    }
  );
});

function postObjective(req, res, username, application, sessionId) {
  
  var id = req.body.id // if id is not null then update, otherwise add new
    , objectiveName = req.body.name
    , objectiveDescription = req.body.description
    , objectiveExpirationDate = req.body.expirationDate
    , objectiveTags = req.body.tags
    , objectiveIsPublic = req.body.isPublic
    , objectiveEntryTitleText = req.body.entryTitleText
    , objectiveEntryUnitOfMeasure = req.body.entryUnitOfMeasure
    , objectiveEntryMinAmount = req.body.entryMinAmount
    , objectiveEntryMaxAmount = req.body.entryMaxAmount
    , objectiveEntrySuccessMinAmount = req.body.entrySuccessMinAmount
    , objectiveEntrySuccessMaxAmount = req.body.entrySuccessMaxAmount
//    , objectiveAllowedHosts = req.body.allowedHosts
//    , objectiveAwardsAndRanks = req.body.awardsAndRanks

  if (typeof objectiveName === 'undefined')
    return writeResult(res, 412, "Missing objective name")
  else if (typeof objectiveExpirationDate === 'undefined')
    return writeResult(res, 412, "Missing objective expiration date")
  else if (typeof objectiveTags === 'undefined')
    return writeResult(res, 412, "Missing objective tags")
  else if (typeof objectiveIsPublic === 'undefined')
    return writeResult(res, 412, "Missing objective is public")
  else if (typeof objectiveEntryTitleText === 'undefined')
    return writeResult(res, 412, "Missing objective entry title text")
  else if (typeof objectiveEntryUnitOfMeasure === 'undefined')
    return writeResult(res, 412, "Missing objective entry unit of measure")
  else if (typeof objectiveEntryMinAmount === 'undefined')
    return writeResult(res, 412, "Missing objective entry min amount")
  else if (typeof objectiveEntryMaxAmount === 'undefined')
    return writeResult(res, 412, "Missing objective entry max amount")
  else if (typeof objectiveEntrySuccessMinAmount === 'undefined')
    return writeResult(res, 412, "Missing objective entry success min amount")
  else if (typeof objectiveEntrySuccessMaxAmount === 'undefined')
    return writeResult(res, 412, "Missing objective entry success max amount")

  if (objectiveDescription === 'undefined')
    objectiveDescription = ""

console.log('GOT: ' + id + username + ', ' + application + ', ' + sessionId + ', ' + objectiveName + 
            ', ' + objectiveExpirationDate)

  validateUser(username, application, sessionId, function(result){
    if (result.result.message === 'validated'){
      console.log("Validated")

      // find existing objective:
      Objective.findOne({_id: id, username: username}, function(err, foundObjective){
        if (foundObjective){
          // update existing
          foundObjective.username = username,
          foundObjective.name = objectiveName,
          foundObjective.description = objectiveDescription,
          foundObjective.expirationDate = objectiveExpirationDate,
          foundObjective.tags = objectiveTags,
          foundObjective.isPublic = objectiveIsPublic,
          foundObjective.entryTitleText = objectiveEntryTitleText,
          foundObjective.entryUnitOfMeasure = objectiveEntryUnitOfMeasure,
          foundObjective.entryMinAmount = objectiveEntryMinAmount,
          foundObjective.entryMaxAmount = objectiveEntryMaxAmount,
          foundObjective.entrySuccessMinAmount = objectiveEntrySuccessMinAmount,
          foundObjective.entrySuccessMaxAmount = objectiveEntrySuccessMaxAmount,
          foundObjective.allowedHosts = [],
          foundObjective.awardsAndRanks = {},
          foundObjective.changedTimestamp = new Date()
          
          foundObjective.save(function(err){
            if (err){
              console.log('An error occured')
              return writeResult(res, 500, "Error: " + err)
            } else
              return writeResult(res, 200, "Objective updated", foundObjective)
          })
          
        } else {
          // create new
            var newObjective = new Objective({
                                         username: username,
                                         name: objectiveName,
                                         description: objectiveDescription,
                                         expirationDate: objectiveExpirationDate,
                                         tags: objectiveTags,
                                         isPublic: objectiveIsPublic,
                                         entryTitleText: objectiveEntryTitleText,
                                         entryUnitOfMeasure: objectiveEntryUnitOfMeasure,
                                         entryMinAmount: objectiveEntryMinAmount,
                                         entryMaxAmount: objectiveEntryMaxAmount,
                                         entrySuccessMinAmount: objectiveEntrySuccessMinAmount,
                                         entrySuccessMaxAmount: objectiveEntrySuccessMaxAmount,
                                         allowedHosts: [],
                                         awardsAndRanks: {},
                                         createdTimestamp: new Date(),
                                         changedTimestamp: new Date()
                         })

            newObjective.save(function(err){
              if (err){
                console.log('An error occured')
                return writeResult(res, 500, "Error: " + err)
              } else
                return writeResult(res, 201, "Objective created", newObjective)
            })

        }
      })
	  
    } else
      return writeResult(res, result.result.status, result.result.message)
  })

}

app.post('/api/remove-objective', function(req, res){
  var id = req.body.id;

  if (typeof id === 'undefined')
    return writeResult(res, 412, "Missing id")
  
  return doWithValidUsernameAppSessionIdOrWriteErrorResult(
    req.body,
    res,
    function(almostValid) { return validateUser(
      almostValid.username,
      almostValid.app,
      almostValid.sessionId,
      function(result){
        if (result.result.message === 'validated'){
          console.log("Validated")
          Entry.remove({ objectiveId: id }, function(err){
            // No-op
          })
          Objective.remove({_id: id}, function(err){
            if (!err)
              return writeResult(res, 200, "success")
            else
              return writeResult(res, 500, err)
          })
        } else
          return writeResult(res, result.result.status, result.result.message)
      }
    ); }
  );
});

app.get('/api/objectives', function(req, res){
  // TODO: by params: by tags, by active -status
  var appName = req.query["app"]
    , sessionId = req.query["sid"]
    , username = req.query["uid"]
    , id = req.query["id"]
    , searchUsername = req.query["suid"]

  validateUser(username, appName, sessionId, function(result){
    if (result.result.message === 'validated'){
      
      var query = {
        username: searchUsername
      }

      if(id) {
        console.log("setting _id to " + id)
        query._id = id
      }
      
      if(username !== searchUsername)
        query.isPublic = true // isPublic = false doesn't seem to work 

      Objective.find(query, function(err, foundObjectives) {
        // TODO: for each found objective, attach the related entries:
        if(err)
          console.log(err);
        else console.log("Objectives found: " + foundObjectives.length);
        if(foundObjectives) {
          return writeResult(res, 200, "success", foundObjectives.map(function(o) {
            Entry.find(
              { objectiveId: o._id },
              function(err, entries) {
                console.log("Entries found: " + entries.map(function(e) { return e.amount; }));
                o.entries = entries;
              }
            );
            return o;
          }));
        } else return writeResult(res, 412, err);
      })
    } else
      return writeResult(res, 412, result.result.message)
  })
})

app.post('/api/entry', function(req, res){
  return doWithValidUsernameAppSessionIdOrWriteErrorResult(
    req.body,
    res,
    function(almostValid) {
      return postEntry(req, res, almostValid.username, almostValid.app, almostValid.sessionId)
    }
  )
})

function postEntry(req, res, username, application, sessionId) {  
  var entryObjectiveId = req.body.objectiveId
    , entryComments = req.body.comments
    , entryAmount = req.body.amount

  if (typeof entryObjectiveId === 'undefined')
    return writeResult(res, 412, "Missing entry objective id")

  validateUser(username, application, sessionId, function(result){
    if (result.result.message === 'validated'){
      console.log("Validated")

      // find existing objective:
      Objective.findOne({_id: entryObjectiveId, username: username}, function(err, foundObjective){
        if (foundObjective){
          // check that objective belongs to given user, so new entry can be attached into it:
          if (foundObjective.username === username){

            var entrySuccess = true
            
            // check if we expect numerical amount:
            if (foundObjective.entryUnitOfMeasure.length >= 1){
              if (typeof entryAmount === 'undefined')
                return writeResult(res, 412, "Missing entry amount")
              else if (parseInt(entryAmount) === 'NaN')
                return writeResult(res, 412, "Invalid entry amount")
              // TODO: check allowed lower and upper bounds
              
              if (foundObjective.entrySuccessMinAmount <= entryAmount &&
                  foundObjective.entrySuccessMaxAmount >= entryAmount)
                entrySuccess = true
              else
                entrySuccess = false
            } else {
              entryAmount = 0
            }
            // create new entry
            var newEntry = new Entry({ objectiveId: entryObjectiveId,
                                       comment: entryComments,
                                       success: entrySuccess,
                                       amount: entryAmount,
                                       createdTimestamp: new Date(),
                                       changedTimestamp: new Date()
                           })

            newEntry.save(function(err){
              if (err){
                console.log('An error occured')
                return writeResult(res, 500, "Error: " + err)
              } else
                return writeResult(res, 201, "Entry added", newEntry)
            })
            
          }          
        } else {
          return writeResult(res, 412, "Could not find the objective!")
        }
      })
      
    } else // user not validated
      return writeResult(res, result.result.status, result.result.message)
  })
}

// runs the given function if .uid, .sid and .app can be found from body.
// writes 412 with the errors if any one of them are missing
function doWithValidUsernameAppSessionIdOrWriteErrorResult(body, res, doWithValid) {
  var userAppSess = new UsernameAppSessionId(body)
  
  if (userAppSess.validate()) {
    return doWithValid(userAppSess)
  } else
    return writeResult(res, 412, userAppSess.errors.toString())
}
// returns a Prototype for a validatable body.uid, body.app and body.sid
// After calling .validate() the object will have the possible validation errors in .errors
// TODO: Move into start of validateUser?
function UsernameAppSessionId(body) {
  var self = this,
      members,
      errCodes;
  self.username = body.uid
  self.app = body.app
  self.sessionId = body.sid
  self.errors = []
  
  members = [self.username, self.app, self.sessionId]
  errCodes = ["username", "application name: misconfigured?", "session key: misconfigured?"].map(function(e) {
    return "Missing " + e
  })

  self.validate = function() {
    self.errors = members.filter(function(m) { return !m; }).map(function(m, i) {
        return errCodes[i]
    })
    return self.errors.length === 0
  }
}

// endpoints to TODO
var todoWithChecks = ["add-entry", "remove-entry", "update-entry", "add-host", "remove-host", "update-host"];
todoWithChecks.forEach(function(url) {
  app.post("/api/" + url, TODORESWITHCHECKS);
});

// endpoints to TODO
var todos = ["objectives/:objectiveId/entries", "objectives/:user/:objectiveId/entries", "/api/entries/:user"];
todos.forEach(function(url) {
  app.get("/api/" + url, TODORES);
});

// the TODO-funcs below are simple placeholders for the actual code
// possible params: by success, by start date - end date
function TODORES(req, res) {
    return writeResult(res, 200, "TODO");
}

function TODORESWITHCHECKS(req, res) {
  return doWithValidUsernameAppSessionIdOrWriteErrorResult(req.body, res, function() {
      return TODORES(req, res);
  });
}

app.listen(settings.appPort)

console.log('BNObjective listening on port ' + settings.appPort)
