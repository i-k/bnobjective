/*
 * BNObjective
 *
 * TODO: route to add objective and entry, testpage for these
 */

var express = require('express')
var mongoose = require('mongoose')
var request = require('request')
var settings = require('./settings.js')

mongoose.connect(settings.mongoHost)

var schemaObjective = mongoose.Schema({
                        application: String, // used for BNAuth
                        username: String, // used for BNAuth
                        name: String,
                        description: String,
                        timeType: {type: String, enum: ['continuous', 'fixed']}, // TODO: make this Boolean?
                        recordInterval: {
                          years: Number,
                          months: Number,
                          weeks: Number,
                          days: Number,
                          hours: Number,
                          minutes: Number
                        },
                        recordWindow: { // offset from interval deadline
                          years: Number,
                          months: Number,
                          weeks: Number,
                          days: Number,
                          hours: Number,
                          minutes: Number
                        },
                        created_timestamp: { type: Date, default: Date.now },
                        tags: [String],
                        isActive: Boolean,
                        isPublic: Boolean,
                        groups: [String] // if not public, then only members of these groups are allowed to see this
                      })

var Objective = mongoose.model('Objective', schemaObjective)

Objective.schema.path('name').validate(function (value) {
  return value.length <= settings.maxTagNameLength
}, 'Name too long for objective. Max ' + settings.maxTagNameLength + ' characters.')

Objective.schema.path('name').validate(function (value) {
  return value.length <= settings.maxTagDescriptionLength
}, 'Description too long for objective. Max ' + settings.maxTagDescriptionLength + ' characters.')

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
                    entryId: String,
                    success: Boolean, // user records this on given interval
                    comments: String,
                    created_timestamp: { type: Date, default: Date.now }
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
                       application: application, 
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

app.post('/api/add-objective', function(req, res){
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

app.get('/api/objectives/:user', function(req, res){
  // params: by tags, by active -status
  return writeResult(res, 200, "TODO")
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
