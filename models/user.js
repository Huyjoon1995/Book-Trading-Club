var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var UserSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String,
    fullName: String,
    city: String,
    state: String,
    favoriteQuote: String,
    messages: Array
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.getUserById = function(id,callback){
  User.findById(id,callback);
}

module.exports.getUserByUsername = function(username,callback){
  var query = {username:  username};
  User.findOne(query,callback);
}
module.exports.comparePassword = function(candidatePassword,hash,callback){
  bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
  // res === true
  if(err) return callback(err);
  callback(null,isMatch);
  });
}

module.exports.addMessage = function(query, update, callback) {
  User.update(query, update, callback);
};

module.exports.updateUser = function(id, update, callback) {
  User.findByIdAndUpdate(id, update, callback);
};

module.exports.createUser = function(newUser, callback){
var bcrypt = require('bcryptjs');
bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(newUser.password, salt, function(err, hash) {
        // Store hash in your password DB.
        newUser.password = hash;
        newUser.save(callback);
    });
});
}
