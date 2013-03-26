/*
 * BNObjective
 *
 */

var express = require('express')
var mongoose = require('mongoose')
var request = require('request')
var settings = require('./settings.js')

mongoose.connect(settings.mongoHost)

// TODO: figure out good names for these: timeType, recordInterval, recordWindow
var schemaObjective = mongoose.Schema({
                        application: String, // used for BNAuth
                        username: String, // used for BNAuth
                        name: String,
                        description: String,
                        timeType: String, // jatkuva / määräaikainen
                        recordInterval: String, // minutes, hours, days, weeks, months, years
                        recordWindow: String, // think how this should be done. Default should be 24 hours if interval is one day, and 7 days if interval is one week.
                        created_timestamp: { type: Date, default: Date.now },
                        tags: [String]
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
                    entry_type: String, // success / failure / empty
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

app.listen(settings.appPort)

console.log('BNObjective listening on port ' + settings.appPort)
