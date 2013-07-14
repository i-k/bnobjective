module.exports = initEntry;

function initEntry(mongoose, settings) {
  var schema = mongoose.Schema({
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
  });
  
  schema.path('comments').validate(function (value) {
      return value.length <= settings.maxEntryCommentsLength
  }, 'Comments too long for entry. Max ' + settings.maxEntryCommentsLength + ' characters.');

  return mongoose.model('Entry', schema);
}