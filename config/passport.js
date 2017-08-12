// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var CustLocalStrategy = require('../app/custom_strategy/index.js');
//var FacebookStrategy = require('passport-facebook').Strategy;
//var TwitterStrategy  = require('passport-twitter').Strategy;
//var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;

// load the auth variables
//var configAuth = require('./auth'); // use this one for testing // not used at all since i'm not using facebook/twitter/google/other sites logins

module.exports = function (config, passport, User, UserGroup, func) {
    var isDev = config.isDev;

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    // =============================================================================
    // LOGIN =======================================================================
    // =============================================================================
    passport.use('local-login', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        async function (req, username, password, done) {
            if (typeof (username) !== 'string') {
                return done(null, false, req.flash('loginMessage', 'Username must be a string'));
            }

            if (typeof (password) !== 'string') {
                return done(null, false, req.flash('loginMessage', 'Username must be a string'));
            }


            let user = await User.findOne({
                'local.username': username.toLowerCase()
            });

            if (!user) {
                return done(null, false, req.flash('loginMessage', 'No user found.'));
            }

            return user.validPassword(password, function (err, isValid) {
                if (err) {
                    console.error("Error in login passport function, in user.validPassword callback: " + err);

                    if (isDev) {
                        return done(null, false, req.flash('loginMessage', 'There was an error: ' + err));
                    } else {
                        return done(null, false, req.flash('loginMessage', 'There was an internal server error.'));
                    }
                }

                if (!isValid) {
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                } else {
                    return done(null, user);
                }
            });
        }));

    // =============================================================================
    // SIGNUP =====================================================================
    // =============================================================================
    passport.use('local-signup', new CustLocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            confirmPasswordField: 'confirmPassword',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        async function (req, username, password, confirmPassword, done) { // TODO: Fix this up so it's less repeating
            // if the user is not already logged in:
            if (typeof (username) !== 'string') {
                return done(null, false, req.flash('signupMessage', 'Username must be a string'));
            }

            if (typeof (password) !== 'string') {
                return done(null, false, req.flash('signupMessage', 'Password must be a string'));
            }

            if (typeof (confirmPassword) !== 'string') {
                return done(null, false, req.flash('signupMessage', 'Confirm Password must be a string'));
            }

            let user = await User.findOne({ // finds a user by the username
                'local.username': username.toLowerCase()
            });

            if (user) {
                return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
            } else {

                // check if their username and password are okay
                var usernameIsValid = func.isValidUsername(username);

                if (!usernameIsValid[0]) {
                    return done(null, false, req.flash('signupMessage', usernameIsValid[1]));
                }

                var passwordIsValid = func.isValidPassword(password, confirmPassword);

                if (!passwordIsValid[0]) {
                    return done(null, false, req.flash('signupMessage', passwordIsValid[1]));
                }

                // create the user
                var newUser = new User();

                return newUser.generateHash(password, async function (err, hash) {
                    if (err) {
                        console.error(err);

                        if (isDev) {
                            return done(null, false, req.flash("signupMessage", "There was an error in generating the hash: " + err));
                        } else {
                            return done(null, false, req.flash("signupMessage", "There was an internal server error."));
                        }
                    }
                    newUser.local.password = hash


                    if (newUser.local.password === null) {
                        return done(null, false, req.flash("signupMessage", "There was an internal server error in processing your password."));
                    }

                    newUser.local.username = username.toLowerCase();
                    newUser.local.displayName = username;

                    if (config.json.makeNextUserAdmin) {
                        newUser.other.isAdmin = true;
                        config.json.makeNextUserAdmin = false;
                        await func.fs.writeFile(__dirname + '/config.json', JSON.stringify(config.json));
                    }

                    return newUser.save(function (err) {
                        if (err) {
                            console.error(err);
                            return done(err, false);
                        }

                        return done(null, newUser);
                    });
                });
            }
        }));
};