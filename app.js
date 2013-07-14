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
  var id = req.body.id // if id is not null then update, otherwise add new
    , username = req.body.uid
    , application = req.body.app
    , sessionId = req.body.sid

  if (typeof username === 'undefined') 
    return writeResult(res, 412, "Missing username")
  else if (typeof application === 'undefined')
    return writeResult(res, 412, "Missing application name: misconfigured?")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session key: misconfigured?")

  var objectiveName = req.body.name
    , objectiveDescription = req.body.description
    , objectiveExpirationDate = req.body.expirationDate
    , objectiveRecordInterval = req.body.recordInterval
    , objectiveRecordWindow = req.body.recordWindow
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
  else if (typeof objectiveDescription === 'undefined')
    return writeResult(res, 412, "Missing objective description")
  else if (typeof objectiveExpirationDate === 'undefined')
    return writeResult(res, 412, "Missing objective expiration date")
  else if (typeof objectiveRecordInterval === 'undefined')
    return writeResult(res, 412, "Missing objective record interval")
  else if (typeof objectiveRecordWindow === 'undefined')
    return writeResult(res, 412, "Missing objective record window")
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


console.log('GOT: ' + id + username + ', ' + application + ', ' + sessionId + ', ' + objectiveName + 
            ', ' + objectiveDescription + ', ' + objectiveExpirationDate)

  validateUser(username, application, sessionId, function(result){
    if (result.result.message === 'validated'){
      console.log("Validated")
      
      // TODO: find existing objective:
      Objective.findOne({_id: id, username: username, application: application}, function(err, foundObjective){
        if (foundObjective){
          // update existing
          foundObjective.application = application,
          foundObjective.username = username,
          foundObjective.name = objectiveName,
          foundObjective.description = objectiveDescription,
          foundObjective.expirationDate = objectiveExpirationDate,
          foundObjective.recordInterval = objectiveRecordInterval,
          foundObjective.recordWindow = objectiveRecordWindow,
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
            var newObjective = new Objective({ application: application,
                                         username: username,
                                         name: objectiveName,
                                         description: objectiveDescription,
                                         expirationDate: objectiveExpirationDate,
                                         recordInterval: objectiveRecordInterval,
                                         recordWindow: objectiveRecordWindow,
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

})

app.post('/api/remove-objective', function(req, res){
  var id = req.body.id
    , username = req.body.uid
    , application = req.body.app
    , sessionId = req.body.sid

  if (typeof id === 'undefined')
    return writeResult(res, 412, "Missing id")
  else if (typeof username === 'undefined') 
    return writeResult(res, 412, "Missing username")
  else if (typeof application === 'undefined')
    return writeResult(res, 412, "Missing application name: misconfigured?")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session key: misconfigured?")

  validateUser(username, application, sessionId, function(result){
    if (result.result.message === 'validated'){
      console.log("Validated")

      Objective.remove({_id: id}, function(err){
        if (!err)
          return writeResult(res, 200, "success")
        else
          return writeResult(res, 500, err)
      })
    } else
      return writeResult(res, result.result.status, result.result.message)
  })
})

app.post('/api/add-entry', function(req, res){
  var username = req.body.uid
  var application = req.body.app
  var sessionId = req.body.sid

  if (typeof username === 'undefined') 
    return writeResult(res, 412, "Missing username")
  else if (typeof application === 'undefined')
    return writeResult(res, 412, "Missing application name: misconfigured?")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session key: misconfigured?")

  return writeResult(res, 200, "TODO")

})

app.post('/api/remove-entry', function(req, res){
  var username = req.body.uid
  var application = req.body.app
  var sessionId = req.body.sid

  if (typeof username === 'undefined') 
    return writeResult(res, 412, "Missing username")
  else if (typeof application === 'undefined')
    return writeResult(res, 412, "Missing application name: misconfigured?")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session key: misconfigured?")

  return writeResult(res, 200, "TODO")

})

app.post('/api/update-entry', function(req, res){
  var username = req.body.uid
  var application = req.body.app
  var sessionId = req.body.sid

  if (typeof username === 'undefined') 
    return writeResult(res, 412, "Missing username")
  else if (typeof application === 'undefined')
    return writeResult(res, 412, "Missing application name: misconfigured?")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session key: misconfigured?")

  return writeResult(res, 200, "TODO")

})

app.post('/api/add-host', function(req, res){
  var username = req.body.uid
  var application = req.body.app
  var sessionId = req.body.sid

  if (typeof username === 'undefined') 
    return writeResult(res, 412, "Missing username")
  else if (typeof application === 'undefined')
    return writeResult(res, 412, "Missing application name: misconfigured?")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session key: misconfigured?")

  return writeResult(res, 200, "TODO")

})

app.post('/api/remove-host', function(req, res){
  var username = req.body.uid
  var application = req.body.app
  var sessionId = req.body.sid

  if (typeof username === 'undefined') 
    return writeResult(res, 412, "Missing username")
  else if (typeof application === 'undefined')
    return writeResult(res, 412, "Missing application name: misconfigured?")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session key: misconfigured?")

  return writeResult(res, 200, "TODO")

})

app.post('/api/update-host', function(req, res){
  var username = req.body.uid
  var application = req.body.app
  var sessionId = req.body.sid

  if (typeof username === 'undefined') 
    return writeResult(res, 412, "Missing username")
  else if (typeof application === 'undefined')
    return writeResult(res, 412, "Missing application name: misconfigured?")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session key: misconfigured?")

  return writeResult(res, 200, "TODO")

})

app.get('/api/objectives', function(req, res){
  // TODO: by params: by tags, by active -status
  var appName = req.query["app"]
    , sessionId = req.query["sid"]
    , username = req.query["uid"]
    , id = req.query["id"]
    , searchUsername = req.query["suid"]

  validateUser(username, appName, sessionId, function(result){
    console.log("validateUser: " + result);
    if (result.result.message === 'validated'){
      console.log("Validated")
      
      var queryObj = {
                      username: searchUsername,
                      application: appName
                     }      

      if (typeof id !== 'undefined')
        queryObj._id = id

      if (username !== searchUsername)
        queryObj.isPublic = true

      console.log(queryObj)

      Objective.find(queryObj, function(err, foundObjectives){
        if (foundObjectives)
          return writeResult(res, 200, "success", foundObjectives)
        else
          return writeResult(res, 200, "success", [])
      })
    } else
      return writeResult(res, 412, result.result.message)
  })
})

app.get('/api/objectives/:objectiveId/entries', TODORES);

app.get('/api/objectives/:user/:objectiveId/entries', TODORES);

app.get('/api/entries/:user', TODORES);
// possible params: by success, by start date - end date
function TODORES(req, res) {
    return writeResult(res, 200, "TODO");
}

app.listen(settings.appPort)

console.log('BNObjective listening on port ' + settings.appPort)
