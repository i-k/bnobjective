module.exports = initObjective;

function initObjective(mongoose, settings) {
    var schema = mongoose.Schema({
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
    });

// TODO: add validations for each field
// TODO: min lengths for fields also!

schema.path('name').validate(function (value) {
  if (typeof value === 'undefined')
    return false
  else
    return value.length > 0
}, 'Objective name is missing.')

schema.path('name').validate(function (value) {
  return value.length <= settings.maxObjectiveNameLength
}, 'Name too long for objective. Max ' + settings.maxObjectiveNameLength + ' characters.')

schema.path('description').validate(function (value) {
  if (typeof value === 'undefined')
    return false
  else
    return value.length >= 0
}, 'Objective description is missing.')

schema.path('description').validate(function (value) {
  return value.length <= settings.maxObjectiveDescriptionLength
}, 'Description too long for objective. Max ' + settings.maxObjectiveDescriptionLength + ' characters.')

schema.path('recordInterval.years').validate(function (value) {
  if (typeof value === 'undefined')
    return false

  var years = parseInt(value)
  if ( isNaN(years) === true || years > 2)
    return false
  else
    return true
}, 'Record interval has missing or invalid years-value.')

schema.path('recordInterval.months').validate(function (value) {
  if (typeof value === 'undefined')
    return false

  var months = parseInt(value)
  if ( isNaN(months) === true || months > 12)
    return false
  else
    return true
}, 'Record interval has missing or invalid months-value.')

schema.path('recordInterval.weeks').validate(function (value) {
  if (typeof value === 'undefined')
    return false

  var weeks = parseInt(value)
  if ( isNaN(weeks) === true || weeks > 4)
    return false
  else
    return true
}, 'Record interval has missing or invalid weeks-value.')

schema.path('recordInterval.days').validate(function (value) {
  if (typeof value === 'undefined')
    return false

  var days = parseInt(value)
  if ( isNaN(days) === true || days > 31)
    return false
  else
    return true
}, 'Record interval has missing or invalid days-value.')

schema.path('recordInterval.hours').validate(function (value) {
  if (typeof value === 'undefined')
    return false

  var hours = parseInt(value)
  if ( isNaN(hours) === true || hours > 24)
    return false
  else
    return true
}, 'Record interval has missing or invalid hours-value.')

schema.path('recordInterval.minutes').validate(function (value) {
  if (typeof value === 'undefined')
    return false

  var minutes = parseInt(value)
  if ( isNaN(minutes) === true || minutes > 12)
    return false
  else
    return true
}, 'Record interval has missing or invalid minutes-value.')

schema.path('tags').validate(function (value) {
  return value instanceof Array
}, 'Malformed tags')

schema.path('tags').validate(function (value) {
  if (value instanceof Array)
    value.length <= settings.maxAmountOfTagsPerObjective
}, 'Too many tags. Max ' + settings.maxAmountOfTagsPerObjective + ' tags.')

schema.path('tags').validate(function (value) {
  if (value instanceof Array)
    value.forEach(function(tag){
      if (tag.length > settings.maxTagLength)
        return false
    })
}, 'Some tag is too long. Tag max length ' + settings.maxTagLength + ' characters.');

  var Objective = mongoose.model('Objective', schema);
  
  return Objective;
};