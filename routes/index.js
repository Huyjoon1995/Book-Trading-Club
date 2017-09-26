var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/', passport.authenticate('local', {failureRedirect: '/', failureFlash: 'Invalid Username or Password'}), function(req, res) {
  req.flash('success', 'You are logged in');
  res.redirect('/');
});


module.exports = router;
