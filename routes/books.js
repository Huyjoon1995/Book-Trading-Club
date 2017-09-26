var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var books = require('google-books-search');
var Book = require('../models/books');
var User = require('../models/user');
var moment = require('moment');

router.get('/mybooks', ensureAuthenticated, function(req, res, next) {
  Book.getUserBooks({owner: req.user.username}, function(err, books) {
      res.render('mybooks', {'books': books});
  });
});

router.post('/mybooks', function(req, res, next) {
  books.search(req.body.title, function(err, data) {
    if (!err) {
      Book.getUserBooks({owner: req.user.username}, function(err, books) {
          res.render('mybooks', {'books': books, 'results': data});
      });
    } else {
      res.send('there was an error!!');
    }
  });
});

router.post('/addbook', function(req, res, next) {
  var newBook = new Book({
    title: req.body.title,
    authors: req.body.authors,
    thumbnail: req.body.thumbnail,
    owner: req.user.username,
    requestedBy: [],
    isAvailable: true,
    currentBorrower: ''
  });
  Book.saveBook(newBook, function(err, book) {
    if (err) throw err;
    res.redirect('/books/mybooks');
  });
});

router.get('/delete/:id', function(req, res, next) {
  Book.deleteBook(req.params.id, function(err, doc) {
    if (err) throw err;
    console.log('Book was removed');
    res.redirect('/books/mybooks');
  });
});

router.get('/allbooks', function(req, res, next) {
  var query = {};
  if (req.user) { query = {owner: {$ne: req.user.username}}; }
  Book.getUserBooks(query, function(err, books) {
    if (err) throw err;
    res.render('allbooks', {books: books});
  });
});

router.get('/requests', ensureAuthenticated, function(req, res, next) {
  var myRequests = {requestedBy: {$elemMatch: {user: req.user.username}}};
  var othersRequests = {owner: {$eq: req.user.username}, 'requestedBy.0': {$exists: true}};

  Book.getUserBooks(myRequests, function(err, mine) {
    if (err) throw err;
    Book.getUserBooks(othersRequests, function(err, theirs) {
      if (err) throw err;
      User.getUserByUsername(req.user.username, function(err, notes) {
        if (err) throw err;
        res.render('requests', {mine: mine, theirs: theirs, notes: notes});
      });
    });
  });
});

router.post('/requests', function(req, res, next) {
  function Request(user, date, status) {
    this.user = user;
    this.date = date;
    this.status = status;
  }

  var newRequest = new Request(req.user.username, moment().format('MMMM DD, YYYY'), 'is pending');

  Book.addRequest(req.body.id, {$push: {requestedBy: newRequest}}, function(err, data) {
    if (err) throw err;
    res.redirect('/books/requests');
  });
});

router.get('/reject', function(req, res, next) {
  var id = req.query.id,
      user = req.query.user,
      query = {_id: id, "requestedBy.user": user},
      update = {$set: {"requestedBy.$.status": 'was rejected'}};

  Book.updateRequest(query, update, function(err, data) {
    if (err) throw err;
    res.redirect('/books/requests');
  });
});

router.get('/accept', function(req, res, next) {
  var id = req.query.id,
      user = req.query.user,
      query = {_id: id, "requestedBy.user": user},
      query2 = {_id: id, "requestedBy.status": 'is pending'},
      update = {$set: {"requestedBy.$.status": 'was accepted'}, isAvailable: false},
      update2 = {$set: {"requestedBy.$.status": 'was rejected'}},
      message = req.user.username + ' has accepted your book request. Contact them at ' + req.user.email + ' to arrange the trade. Happy reading!';

  Book.updateRequest(query, update, function(err, data) {
    if (err) throw err;
    Book.updateRequest(query2, update2, function(err, data2) {
      if (err) throw err;
      User.addMessage({username: user}, {$push: {messages: message}}, function(err, message) {
        if (err) throw err;
        res.redirect('/books/requests');
      });
    });
  });


});

/* Passport function for access control. */
function ensureAuthenticated(req, res, next) {
  if(req.isAuthenticated()) {
    return next();
  }
 req.flash('info','Please sign in or register to view this page.');
 res.redirect('/users/register');
}

module.exports = router;
