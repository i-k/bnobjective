/*
 * BNObjective
 *
 * TODO next: route to add objective and entry, testpage for these
 *   => min lengths for fields for objective
 *   => check that validations actually work
 */

var express = require('express')
var mongoose = require('mongoose')
var request = require('request')
var settings = require('./settings.js')

mongoose.connect(settings.mongoHost)

var schemaObjective = mongoose.Schema({
                        application: String, // used for BNAuth
                        username: String, // used for BNAuth. User who created and owns this objective.
                        name: String,
                        description: String,
                        expirationDate: Date, // leave null if objective is not meant to expire
                        recordInterval: {
                          years: Number,
                          months: Number,
                          weeks: Number,
                          days: Number,
                          hours: Number,
                          minutes: Number
                        },
                        recordWindow: { // offset from recordInterval's deadline
                          years: Number,
                          months: Number,
                          weeks: Number,
                          days: Number,
                          hours: Number,
                          minutes: Number
                        },
                        createdTimestamp: { type: Date, default: Date.now },
                        changedTimestamp: Date, // set after e.g. changing objective's description
                        tags: [String], // for searching public objectives
                        isActive: Boolean,
                        isPublic: Boolean,
                        entryTitleText: String, // e.g. Did you succeed today? / How many cigarettes you smoke today?
                        entryUnitOfMeasure: String, // e.g. Kg, Kpl, kertaa. If filled with value, input box for value is shown! Otherwise it is just yes/no -option.
                        entryMinAmount: Number, // if entry's amount-field is used, this defines the min value for it.
                        entryMaxAmount: Number,
                        entrySuccessMinAmount: Number, // if value is between entrySuccessMin- / MaxAmount, then it is considered as success,
                        entrySuccessMaxAmount: Number, // all other values are considered as failures. No intermediate values (partial success) are used at this point.
// This is used to plug-in different services with BNObjective.
// Service can allow multiple different users (authenticated by BNAuth) to
// add entries for given object. Objective itself cannot be changed by users allowed.
                        allowedHosts: [{
                          hostId: String,
// objective's owner user must set password for linked host. Adding / removing users
// requires password. Password is a shared secret with the host-service and BNObjective.
                          password: String, // Sha256 hashed!
                          users: [String] // BNAuth is used to validate user if he/she tries to create entry for objective
                        }],
                        awardsAndRanks: {
                          sequentialSuccessEntries: [{
                               amount: Number, // e.g. 10 sequential entries
                               awardName: String, // '10 päivää tupakoimatta'
                               awardDescription: String,
                               medalLevel: Number, // 1-10, preset medals
                               users: [String] // users who have earned this metal
                          }],
                          entryAmount: [{
                              amount: Number, // e.g. 100 entries
                              rank: String, // e.g. 'veteraani'
                              users: [String] // users who have earned this rank
                          }]
                        }
                      })

var Objective = mongoose.model('Objective', schemaObjective)

// TODO: add validations for each field
// TODO: min lengths for fields also!

Objective.schema.path('name').validate(function (value) {
  if (typeof value === 'undefined')
    return false
  else
    return value.length > 0
}, 'Objective name is missing.')

Objective.schema.path('name').validate(function (value) {
  return value.length <= settings.maxObjectiveNameLength
}, 'Name too long for objective. Max ' + settings.maxObjectiveNameLength + ' characters.')

Objective.schema.path('description').validate(function (value) {
  if (typeof value === 'undefined')
    return false
  else
    return value.length >= 0
}, 'Objective description is missing.')

Objective.schema.path('description').validate(function (value) {
  return value.length <= settings.maxObjectiveDescriptionLength
}, 'Description too long for objective. Max ' + settings.maxObjectiveDescriptionLength + ' characters.')

Objective.schema.path('recordInterval.years').validate(function (value) {
  if (typeof value === 'undefined')
    return false

  var years = parseInt(value)
  if ( isNaN(years) === true || years > 2)
    return false
  else
    return true
}, 'Record interval has missing or invalid years-value.')

Objective.schema.path('recordInterval.months').validate(function (value) {
  if (typeof value === 'undefined')
    return false

  var months = parseInt(value)
  if ( isNaN(months) === true || months > 12)
    return false
  else
    return true
}, 'Record interval has missing or invalid months-value.')

Objective.schema.path('recordInterval.weeks').validate(function (value) {
  if (typeof value === 'undefined')
    return false

  var weeks = parseInt(value)
  if ( isNaN(weeks) === true || weeks > 4)
    return false
  else
    return true
}, 'Record interval has missing or invalid weeks-value.')

Objective.schema.path('recordInterval.days').validate(function (value) {
  if (typeof value === 'undefined')
    return false

  var days = parseInt(value)
  if ( isNaN(days) === true || days > 31)
    return false
  else
    return true
}, 'Record interval has missing or invalid days-value.')

Objective.schema.path('recordInterval.hours').validate(function (value) {
  if (typeof value === 'undefined')
    return false

  var hours = parseInt(value)
  if ( isNaN(hours) === true || hours > 24)
    return false
  else
    return true
}, 'Record interval has missing or invalid hours-value.')

Objective.schema.path('recordInterval.minutes').validate(function (value) {
  if (typeof value === 'undefined')
    return false

  var minutes = parseInt(value)
  if ( isNaN(minutes) === true || minutes > 12)
    return false
  else
    return true
}, 'Record interval has missing or invalid minutes-value.')

Objective.schema.path('tags').validate(function (value) {
  return value instanceof Array
}, 'Malformed tags')

Objective.schema.path('tags').validate(function (value) {
  if (value instanceof Array)
    value.length <= settings.maxAmountOfTagsPerObjective
}, 'Too many tags. Max ' + settings.maxAmountOfTagsPerObjective + ' tags.')

Objective.schema.path('tags').validate(function (value) {
  if (value instanceof Array)
    value.forEach(function(tag){
      if (tag.length > settings.maxTagLength)
        return false
    })
}, 'Some tag is too long. Tag max length ' + settings.maxTagLength + ' characters.')

var schemaEntry = mongoose.Schema({
                    application: String, // used for BNAuth
                    username: String, // used for BNAuth
                    objectiveId: String,
// user records this on given interval. If no success is given with entry, the amount -field needs
// to be filled. Success will then be deduced from entrySuccessMin/MaxAmount -values 
// that are set in the objective. If these are not set, then an error is returned
                    success: Boolean,
                    comments: String,
// Objective can be numerical, therefore BNObjective must be able to record numerical 
// values for each entry. E.g. how many kilos you lost weight this month,
// or how many kilometers did you run this week? This value can be used to
// aggregate user's results or whole group's result
                    amount: Number,
                    createdTimestamp: { type: Date, default: Date.now },
                    changedTimestamp: Date // entry can be updated within the record-interval
                  })

var Entry = mongoose.model('Entry', schemaEntry)

Entry.schema.path('comments').validate(function (value) {
  return value.length <= settings.maxEntryCommentsLength
}, 'Comments too long for entry. Max ' + settings.maxEntryCommentsLength + ' characters.')

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

  validateUser(username, appName, sessionId, function(result){
    if (result.result.message === 'validated'){
      console.log("Validated")
      
      var queryObj = {
                      username: username,
                      application: appName
                     }      

      if (typeof id !== 'undefined')
        queryObj._id = id

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

app.get('/api/objectives/:objectiveId/entries', function(req, res){
  // possible params: by tags, by active -status
  return writeResult(res, 200, "TODO")
})

app.get('/api/objectives/:user/:objectiveId/entries', function(req, res){
  // possible params: by tags, by active -status
  return writeResult(res, 200, "TODO")
})

app.get('/api/entries/:user', function(req, res){
  // possible params: by success, by start date - end date
  return writeResult(res, 200, "TODO")
})

app.listen(settings.appPort)

console.log('BNObjective listening on port ' + settings.appPort)
