/* Required Modules and Mongoose Model */
var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


router.get('/login', function(req,res,next){
  res.render('login');
});

router.post('/login',
  passport.authenticate('local',{failureRedirect: '/users/login',failureFlash: 'Invalid username or password'}),
  function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    req.flash('success','You are now logged in');
    res.redirect('/users/profile');
  });

/* Show the Registration Page */
router.get('/register', function(req, res, next) {
  res.render('register');
});

/* Create a new user */
router.post('/register', function(req, res, next) {
  // Validate the for before registering
  var username = req.body.username,
      email = req.body.email,
      password = req.body.password,
      password2 = req.body.password2;

  // form validation
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('email', 'Email field is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  //check for errors
  var errors = req.validationErrors();

  // if there are validation errors, display the errors
  if (errors) {
      res.render('register', {
        errors: errors,
        username: username,
        email: email,
        password: password,
        password2: password2
      });
    // if there are no errors, create new user with User Model
  } else {
    User.getUserByUsername(username, function(err, data) {
      if(data) {
        req.flash('success', 'This user already exists');
        res.redirect('/users/register');
      } else {
          var newUser = new User({
            username: username,
            email: email,
            password: password,
            fullName: '',
            city: '',
            state: '',
            favoriteQuote: '',
            messages: []
          });
          // Save the new user to the database
          User.createUser(newUser, function(err, user) {
            if (err) throw err;
            console.log(user);
            // automatically log new user in
            req.login(user, function(err) {
              if (err) { return next(err); }
              req.flash('success', 'You are now registered!');
              return res.redirect('/users/profile');
            });
          });
        }
    });
  }
});

router.get('/profile', ensureAuthenticated, function(req, res, next) {
  User.getUserByUsername(req.user.username, function(err, user) {
    if (err) throw err;
    res.render('profile', {'userInfo': user});
  });
});

router.post('/profile', function(req,res,next){
    var fullname = req.body.full,
        email = req.body.email,
        city = req.body.city,
        state = req.body.state,
        favoriteQuote = req.body.quote;
    User.updateUser(req.user._id,{
        fullName: fullname,
        email: email,
        city: city,
        state: state,
        favoriteQuote: favoriteQuote
    },function(err,user){
      if(err) throw err;
      res.redirect('/users/profile');
    });
});

/* Passport functions. Don't touch these */
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done){
    User.getUserByUsername(username, function(err, user) {
      if (err) throw err;
      if (!user) {
        console.log('This user does not exit. Please register.');
        return done(null, false, {message: 'This user does not exit. Please register.'});
      }
      User.comparePassword(password, user.password, function(err, isMatch) {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          console.log('Invalid password or username.');
          return done(null, false, {message: 'Invalid password or username. Please try again.'});
        }
      });
    });
}));

/* Passport function for access control. */
function ensureAuthenticated(req, res, next) {
  if(req.isAuthenticated()) {
    return next();
  }
 req.flash('info','Please sign in or register to view this page.');
 res.redirect('/users/register');
}

/* Logout the current user */
router.get('/logout', function(req, res) {
  req.logout();
  req.flash('success', 'You have logged out');
  res.redirect('/');
});

module.exports = router;
