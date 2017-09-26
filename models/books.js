var mongoose = require('mongoose');

//book schema
var BookSchema = mongoose.Schema({
    title: String,
    authors: Array,
    thumbnail: String,
    owner: String,
    requestedBy: Array,
    isAvailable: Boolean,
    currentBorrower: String
});

//export the module
var Book = module.exports = mongoose.model('Book', BookSchema);

//save the book that the user search
module.exports.saveBook = function(newBook, callback){
    newBook.save(callback);
};

module.exports.getUserBooks = function(query,callback){
    Book.find(callback);
};

module.exports.deleteBook = function(query,callback){
    Book.findByIdAndRemove(query,callback);
};

module.exports.addRequest = function(id,update,callback){
  Book.findByIdAndUpdate(id,update,callback);
};

module.exports.updateRequest = function(query,update,callback){
  Book.update(query,update,callback);
};
