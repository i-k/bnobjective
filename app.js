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
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
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

// TODO: figure out what the routes should be!

app.post('/api/add-entry', function(req, res){
  console.log('/api/add-entry')
  setCORSHeaders(res)

  var username = req.body.username
  var application = req.body.app
  var sessionId = req.body.sid
  var entry = req.body.entry
  var tags = req.body.tags

  if (typeof username === 'undefined') 
    return writeResult(res, 412, "Missing username")
  else if (typeof application === 'undefined')
    return writeResult(res, 412, "Missing application name: misconfigured?")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session id")
  else if (typeof entry === 'undefined')
    return writeResult(res, 412, "Missing entry-data")
  
  if (typeof tags === 'undefined')
    tags = []

  // Validate user from BNAuth:
  validateUser(username, application, sessionId, function(result){
	if (result.result.message === 'validated'){
      console.log("Validated")
	  var newEntry = new Todo({ application: application,
                                username: username,
                                entry: entry,
                                created_timestamp: new Date(),
                                tags: tags,
                                done: false })

      newEntry.save(function(err){
        if (err){
          console.log('An error occured')
          return writeResult(res, 500, "Error: " + err)
        } else
          return writeResult(res, 201, "Entry created", newEntry)
      })
	  
    } else
      return writeResult(res, result.result.status, result.result.message)
  })

})


app.post('/api/update-entry', function(req, res){
  console.log('/api/update-entry')
  setCORSHeaders(res)

  var username = req.body.username
  var application = req.body.app
  var sessionId = req.body.sid
  var entryId = req.body.entryid

  var entry = req.body.entry
  var tags = req.body.tags
  var done = req.body.done

  if (typeof username === 'undefined') 
    return writeResult(res, 412, "Missing username")
  else if (typeof application === 'undefined')
    return writeResult(res, 412, "Missing application name: misconfigured?")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session id")
  else if (typeof entryId === 'undefined')
    return writeResult(res, 412, "Missing entry id")

  // Validate user from BNAuth:
  validateUser(username, application, sessionId, function(result){
	if (result.result.message === 'validated'){
      console.log("Validated")

      Todo.findOne({_id: entryId}, function(err, todo){
        if (err)
          return writeResult(res, 500, "Error: " + err)

        if (todo !== null){
          if (typeof entry !== 'undefined')
            todo.entry = entry
  
          if (typeof tags !== 'undefined')
            todo.tags = tags

          if (typeof done !== 'undefined'){
            if (done === 'true' || done === '1')
              todo.done = true
            else if (done === 'false' || done === '0')
              todo.done = false
          }
          // Does not update fields that are not in the request
          todo.save(function(err){
            if (err){
              console.log('An error occured')
              return writeResult(res, 500, "Error: " + err)
            } else
              return writeResult(res, 200, "Entry updated", todo)
          })
        } else {
            return writeResult(res, 412, "Entry not found")
        }
      }) 
    } else
        return writeResult(res, result.result.status, result.result.message)
  })

})

app.post('/api/delete-entry', function(req, res){
  console.log('/api/delete-entry')
  setCORSHeaders(res)

  var username = req.body.username
  var application = req.body.app
  var sessionId = req.body.sid
  var entryId = req.body.entryid

  if (typeof username === 'undefined') 
    return writeResult(res, 412, "Missing username")
  else if (typeof application === 'undefined')
    return writeResult(res, 412, "Missing application name: misconfigured?")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session id")
  else if (typeof entryId === 'undefined')
    return writeResult(res, 412, "Missing entry-id")

  // Validate user from BNAuth:
  validateUser(username, application, sessionId, function(result){
	if (result.result.message === 'validated'){
      console.log("Validated")

      Todo.remove({username: username, application: application, _id: entryId}, function(err){
        if (!err)
          return writeResult(res, 200, "Entry removed", [])
        else
          return writeResult(res, 500, err, [])
      })
	  
    } else
      return writeResult(res, result.result.status, result.result.message)
  })

})

app.post('/api/toggle-done', function(req, res){
  console.log('/api/toggle-done')
  setCORSHeaders(res)

  var username = req.body.username
  var application = req.body.app
  var sessionId = req.body.sid
  var entryId = req.body.entryid

  if (typeof username === 'undefined') 
    return writeResult(res, 412, "Missing username")
  else if (typeof application === 'undefined')
    return writeResult(res, 412, "Missing application name: misconfigured?")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session id")
  else if (typeof entryId === 'undefined')
    return writeResult(res, 412, "Missing entry-id")

  // Validate user from BNAuth:
  validateUser(username, application, sessionId, function(result){
	if (result.result.message === 'validated'){
      console.log("Validated")

      Todo.findOne({username: username, application: application, _id: entryId},
                  function(err, todo){

        Todo.update({username: username, application: application, _id: entryId},
                    {$set: {done: ! todo.done, done_timestamp: new Date()}},
                    function(err, result){
          if (!err && result === 1)
            Todo.findOne({username: username, application: application, _id: entryId},
                  function(err, updatedTodo){
                    return writeResult(res, 200, "Entry updated", updatedTodo)
            })
          else
            return writeResult(res, 500, err, [])
        })
      })
	  
    } else
      return writeResult(res, result.result.status, result.result.message)
  })

})

// Get all entries for given user
app.get('/api/entries/:user', function(req, res){
  var user = req.params.user
  var appName = req.query["app"]
  var sessionId = req.query["sid"]
  var status = req.query["status"] // 'done' or 'undone'
  var tags = req.query["tags"] // a list of 'tagA,tagB,tagC'
  
  if (typeof user === 'undefined')
    return writeResult(res, 412, "Missing username")
  else if (typeof appName === 'undefined')
    return writeResult(res, 412, "Missing application name")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session key.")

  console.log('Got: user: ' + user + ', appName: ' + appName + ', session-id:' + sessionId)
  validateUser(user, appName, sessionId, function(result){
    console.log(result)
    if (result.result.message === 'validated'){
      // Find todos from mongodb:
      var queryObj = {
                      username: user,
                      application: appName
                     }
      if (typeof status !== 'undefined')
        if (status === 'done')
          queryObj.done = true
        else if (status === 'undone')
          queryObj.done = false

      if (typeof tags !== 'undefined'){
        var tagsArray = tags.split(',').map(function(tag){return tag.trim()})
        queryObj.tags = {$all: tagsArray}     
      }  

      Todo.find(queryObj, function(err, todos){
        if (todos.length === 0){
          console.log("Todos not found.")
          return writeResult(res, 200, "Todos not found", [])
        } else {
          return writeResult(res, 200, "Success", todos)
        }
      })
	} else {
	  return writeResult(res, 412, result.result.message)
	}
  })
})

// Get single entry from given user
app.get('/api/entries/:user/id/:entryid', function(req, res){
  var user = req.params.user
  var entryId = req.params.entryid
  var appName = req.query["app"]
  var sessionId = req.query["sid"]
  
  if (typeof user === 'undefined')
    return writeResult(res, 412, "Missing username")
  else if (typeof entryId === 'undefined')
    return writeResult(res, 412, "Missing entry id")
  else if (typeof appName === 'undefined')
    return writeResult(res, 412, "Missing application name")
  else if (typeof sessionId === 'undefined')
    return writeResult(res, 412, "Missing session key.")

  console.log('Got: user: ' + user + ', appName: ' + appName + ', session-id:' + sessionId + ', entry-id:' + entryId)
  validateUser(user, appName, sessionId, function(result){
    console.log(result)
    if (result.result.message === 'validated'){
      // Find particular todo from mongodb:
      Todo.findOne({username: user, application: appName, _id: entryId}, function(err, todo){
        if (!todo){
          console.log("Todo not found.")
          return writeResult(res, 200, "Todo not found", [])
        } else {
          return writeResult(res, 200, "Success", todo)
        }
      })
	} else {
	  return writeResult(res, 412, result.result.message)
	}
  })
})

app.get('/api/version', function(req, res){
  console.log('=== Version ===')
  setCORSHeaders(res)
  writeResult(res, 200, "success", {version: "1.0.0",
                                    routes: ['/api/version',
                                             '/api/entries/:user/id/:entryid',
                                             '/api/entries/:user',
                                             '/api/toggle-done',
                                             '/api/delete-entry',
                                             '/api/update-entry',
                                             '/api/add-entry'
                                            ]})
})

app.listen(settings.appPort)

console.log('BNTodo listening on port ' + settings.appPort)

