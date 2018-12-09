const mongoose = require('mongoose');
const { DATABASE_URL } = require("./appConfig")

module.exports = function() {
  const db = mongoose.createConnection(DATABASE_URL);
  db.on('error', function(err){
    console.log(err);
  });
  db.once('open', function() {
    console.log("DB is running on "+DATABASE_URL);
  });
}
