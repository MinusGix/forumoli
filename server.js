/*jshint esversion:6*/
// server.js

var colors = require('colors/safe');


function copy(o) {
    // taken from : https://stackoverflow.com/a/43235072/4923167
    var out, v, key;
    out = Array.isArray(o) ? [] : {};
    for (key in o) {
        v = o[key];
        out[key] = (typeof v === "object") ? copy(v) : v;
    }
    return out;
}


async function getPermission(user, permName) {

    var can = config.defaultParsedPermissions[permName];
    if (can !== undefined) {
        can = can.can;
    } else {
        return false; //done(`Error: "${permName}" is not a permission name.`, null);
    }

    for (let i = 0; i < user.UserGroups.length; i++) {
        try {
            let usergroup = await UserGroup.findById(user.UserGroups[i]);

            if (usergroup.permissions[permName] === undefined) {
                // assume it's a fall through
            } else {
                if (usergroup.permissions[permName].can === 2) {
                    // fall through
                } else {
                    can = usergroup.permissions[permName].can;
                    return can;
                }
            }
        } catch (err) {
            console.error('Error, at getPermission function: ' + err);

            return false; // default to false just in case
        }
    }

    return can;
    /*var can = config.defaultParsedPermissions[permName];
    if (can !== undefined) {
        can = can.can;
    } else {
        return done(`Error: "${permName}" is not a permission name.`, null);
    }

    for (let i = 0; i < user.UserGroups.length; i++) {
        try {
            let usergroup = await UserGroup.findById(user.UserGroups[i]);

            if (usergroup.permissions[permName] === undefined) {
                // assume it's a fall through
            } else {
                if (usergroup.permissions[permName].can === 2) {
                    // fall through
                } else {
                    can = usergroup.permissions[permName].can;
                    return done(null, can);
                }
            }
        } catch (err) {
            console.error('Error, at getPermission function: ' + err);

            return done(null, false); // default to false just in case
        }
    }

    done(null, can);*/

    /*
    var findUserGroup = function (userGroupId) {
        return UserGroup.findById(userGroupId);
    };
    var doStuff = function (userGroup) {
        return new Promise(resolve => {
            if (userGroup.permissions[permName] === undefined) {
                // assume it's a fall through
            } else {
                if (userGroup.permissions[permName].can === 2) {
                    // fall through
                } else {
                    can = userGroup.permissions[permName].can;
                    return done(null, can);
                }
            }
            resolve();
        });
    };

    let chain = new Promise(resolve => {
        resolve();
    });

    user.UserGroups.forEach(function (userGroup) {
        chain = chain.then(() => findUserGroup(userGroup)).then(doStuff);
    }, this);

    chain.then(() => done(null, can));*/
}

async function getAllPermissions(user) {

    var can = copy(config.defaultParsedPermissions);

    for (let i = 0; i < user.UserGroups.length; i++) {
        try {
            let usergroup = await UserGroup.findById(user.UserGroups[i]);
            if (usergroup.permissions === undefined) {
                // assume all of them are fall throughs
            } else {
                for (let j in usergroup.permissions) {
                    if (usergroup.permissions[j] === undefined) {
                        // assume it's a fall through
                    } else {
                        if (usergroup.permissions[j].can === 2 || can[j]._frozen === true) {
                            // fall through
                        } else {
                            can[j].can = usergroup.permissions[j].can;
                            can[j]._frozen = true; // freeze the value so it will now change
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error, at getAllPermissions function: ' + err);

            return config.defaultParsedPermissions;
        }
    }

    return can;

    /*var can = copy(config.defaultParsedPermissions);

    for (let i = 0; i < user.UserGroups.length; i++) {
        try {
            let usergroup = await UserGroup.findById(user.UserGroups[i]);
            if (usergroup.permissions === undefined) {
                // assume all of them are fall throughs
            } else {
                for (let j in usergroup.permissions) {
                    if (usergroup.permissions[j] === undefined) {
                        // assume it's a fall through
                    } else {
                        if (usergroup.permissions[j].can === 2 || can[j]._frozen === true) {
                            // fall through
                        } else {
                            can[j].can = usergroup.permissions[j].can;
                            can[j]._frozen = true; // freeze the value so it will now change
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error, at getAllPermissions function: ' + err);

            return done(null, false);
        }
    }

    done(null, can);*/
    /*
    var findUserGroup = function (userGroupId) {
        return UserGroup.findById(userGroupId);
    };

    var doStuff = function (userGroup) {
        return new Promise(resolve => {
            if (userGroup.permissions === undefined) {
                // assume all of them are fall throughs
            } else {
                // TODO: Make this skip
                for (let i in userGroup.permissions) {
                    if (userGroup.permissions[i] === undefined) {
                        // assume it's a fall through
                    } else {
                        if (userGroup.permissions[i].can === 2 || can[i]._frozen === true) {
                            // fall through
                        } else {
                            //if (can[i] === undefined) {
                            //    can[i] = copy(userGroup.permissions[i]);
                            //} else {
                            can[i].can = userGroup.permissions[i].can;
                            can[i]._frozen = true; // freeze the value so that it will not change
                            //}
                        }
                    }
                }
            }
            resolve();
        });
    };

    let chain = new Promise(resolve => {
        resolve();
    });

    user.UserGroups.forEach(function (userGroup) {
        chain = chain.then(() => findUserGroup(userGroup)).then(doStuff);
    }, this);

    chain.then(() => done(null, can));*/
}

function isAdmin(user) {
    if (user !== null && typeof (user) === 'object') {
        if (user.isAdmin()) {
            return true;
        }
    }
    return false;
}

function isValidUser(user) {
    if (user !== undefined && user !== null && typeof (user) === 'object') { // checks if the user exists
        if (user.other !== undefined && user.other !== null) { // checks if that property exists
            if (user.other.enabled) { // checks if enabled is true
                return true;
            }
        }
    }
    return false;
}

function getImage(user) {
    if (isValidUser(user)) {
        return user.profile.picture; // returns the user's picture's name    
    }
    return '';
}

function isValidUsername(username) {
    if (typeof (username) !== 'string') {
        return [false, 'Username must be text.'];
    }

    if (/([^A-Za-z0-9_])/.test(username)) { // if it contains any other characters than A-Za-z0-9_
        return [false, 'Username can only contain letters in the English Alphabet, numbers, and underscores.'];
    }

    if (username.length < config.minLength.username) { // default: 3
        return [false, `Username must be at least ${config.minLength.username} characters long.`];
    }

    if (username.length > config.maxLength.username) { // default: 18
        return [false, `Username must be at most ${config.maxLength.username} characters long`];
    }

    return [true, 'Success'];

}

function isValidPassword(password, confirmPassword = null) {
    if (typeof (password) !== 'string') {
        return [false, 'Password must be text.'];
    }

    if (password.length < config.minLength.password) { // default: 6
        return [false, 'Password has to be at least 6 characters long.'];
    }

    if (password.length > config.maxLength.password) { // default: 10000
        return [false, 'Password must be below 10k characters long. (Really, bloody hell man.)'];
    }

    if (confirmPassword !== null) { // for if I ever want to check if a password is valid, but not require the confirmPassword param
        if (password !== confirmPassword) {
            return [false, 'Passwords must match.'];
        }
    }

    return [true, 'Success'];
}

function isValidBiography(bio) {
    if (typeof (bio) !== 'string') {
        return [false, 'Page must send biography.'];
    }
    if (bio.length > config.maxLength.biography) {
        return [false, `Biography can not be over ${config.maxLength.biography} characters long.`];
    }
    if (bio.length < config.minLength.biography) {
        return [false, `Biography can not be under ${config.minLength.biography} characters long.`];
    }
    return [true, 'Success'];
}

function isValidProfilePicture(picture) {
    if (typeof (picture.mimetype) !== 'string') { // just in case
        return [false, 'There was an error uploading that file.'];
    }
    if (config.allowed.profilePictureMimeTypes.indexOf(picture.mimetype.toLowerCase()) === -1) {
        return [false, 'That type of file for profile pictures is not allowed.'];
    }
    return [true, 'Success'];
}


// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/');
}

// checks if the user is logged in and is an admin
function isAdminM(req, res, next) {
    if (req.isAuthenticated()) {
        if (func.isAdmin(req.user)) {
            return next();
        }
    }
    res.redirect('/');
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, {
                    [key]: {}
                });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, {
                    [key]: source[key]
                });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

var func = {
    copy,
    isObject,
    mergeDeep,
    getPermission,
    getAllPermissions,
    isAdmin,
    isValidUser,
    isValidUsername,
    isValidPassword,
    isValidBiography,
    isValidProfilePicture,
    getImage,
    generateReqData,
    middleware: {
        getProfileUserByName,
        isAdminM,
        isLoggedIn,
    },
    fs: require('fs'),
    colors
};
// find a profile user by their username
async function getProfileUserByName(req, res, next) {
    // makes sure it's a string
    if (typeof (req.params.username) !== 'string') {
        return res.render('_error.ejs', await func.generateReqData(req.user, {
            message: 'Please give a username.'
        }));
    }

    try {
        let user = await User.findOne({
            'local.username': req.params.username.toLowerCase()
        });

        if (!func.isValidUser(user)) {
            return res.render('_error.ejs', await func.generateReqData(req.user, {
                message: `A user with the name "${req.params.username}" was not found.`
            }));
        }

        req.profileUser = user;
        req.isThemself = false;

        // decides whether they are viewing themself or not
        if (func.isValidUser(req.user) && func.isValidUser(user)) {
            req.isThemself = user.id === req.user.id;
        }

        // goes to the next function in an express function
        return next();
    } catch (err) {
        console.error(err);

        // if there is an error and we are in dev mode it will display it on the page for simplicity
        if (isDev) {
            return res.render('_error.ejs', await func.generateReqData(req.user, {
                message: err
            }));
        } else {
            return res.render('_error.ejs', await func.generateReqData(req.user, {
                message: 'Error #0001, contact the administrator if this problem continues.'
            }));
        }
    }
};
async function generateReqData(user, extraObj) {
    let obj = {
        config, // the config, so if we want to do anything based on it
        user, // the user who is requesting the page
        isValidUser, // a function that tells if it is a valid user, checks if they are 'enabled'
        getImage, // gets the users image
        func, // some functions which are useful
        message: '', // so anything that relies on this won't break if the message is undefined
        get: function () { // returns this obj so we can pass it to the titlebar in ejs's include()
            return this;
        }
    };

    if (isValidUser(user)) {
        obj.permissions = await user.getPermissions();
    }

    if (typeof (extraObj) === 'object' && extraObj !== null) {
        Object.assign(obj, extraObj); // mixes the two objects, extraObj properties will take precedence over obj's properties
    }

    return obj;
}


var module_parser = require('./main/modules.js')(__dirname, func);

var modules = module_parser.loadAllModules('modules');


//====================================
//======= SETUP/REQUIRES =============
//====================================

var config = require('./config/config.js')(modules, func); // the config file. // TODO: Find if it would be better to use .js or .json
var isDev = config.isDev; // if it is in dev mode, show errors on page if it is


var express = require('express'); // for sending pages to the client
var app = express(); // creates the app

var multer = require('multer');
var upload = multer({
    dest: 'uploads/'
});

var mongoose = require('mongoose'); // database stuff
var passport = require('passport'); // password/account things
var flash = require('connect-flash'); // i don't remember // TODO: Find what this is

var morgan = require('morgan'); // database stuff
var cookieParser = require('cookie-parser'); // parse cookies
var bodyParser = require('body-parser'); // parse some other stuff // TODO: Find what this is
var session = require('express-session'); // keeps sessions between opening/closing the browser etc

var configDB = require('./config/database.js'); // loads the database config
var store = new(require('express-sessions'))(configDB.db); // loads the sessions with that database // TODO: find what this is

var UserGroup = require('./app/models/userGroups.js')(modules, mongoose, config, func);
var User = require('./app/models/user.js')(modules, mongoose, config, func, UserGroup);

//====================================
//======= CONFIGURATION ==============
//====================================

mongoose.Promise = global.Promise; // apparently shouldn't use default promises http://mongoosejs.com/docs/promises.html

mongoose.createConnection(configDB.url); // connect to our database

var db = mongoose.connection; //

db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function () {
    console.info("connected to Database");
});

//====================================
//======= OTHER ======================
//====================================
process.on('unhandledRejection', (err) => {
    console.error('Async/Await error: ' + err);
    process.exit(1);
});
require('./config/passport')(modules, config, passport, User, UserGroup, func); // pass passport for configuration
//====================================
//======= EXPRESS ====================
//====================================

app.use(morgan('dev')); // log every request to the console

app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms

app.use(bodyParser.urlencoded({
    extended: true
}));


app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ // TODO: Move the secret to a config file
    secret: config.secret,
    resave: true,
    saveUninitialized: true,
    cookie: {},
    store: store
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

//====================================
//======= ROUTES =====================
//====================================
//======= CSS & JS & IMGS ============

app.use('/css', express.static('./views/css'));
app.use('/js', express.static('./views/js'));
app.use('/images', express.static('./views/images'));
app.use('/u', express.static('./uploads'));

require('./app/routes.js')(modules, config, User, UserGroup, app, express, passport, upload, func); // load our routes and pass in our app and fully configured passport

//====================================
//======= Modules =================
//====================================

var Data = Object.assign({
    config,
    isDev,
    express,
    app,
    multer,
    upload,
    mongoose,
    passport,
    flash,
    morgan,
    cookieParser,
    bodyParser,
    session,
    configDB,
    store,
    db,
    
    modules,
    // NOTE: removeRoute should not be used outside of initial script (aka no using it in your pages) since it is not async
    removeRoute: function (path) {
        app._router.stack.forEach((stack, index) => {
            if (stack === undefined || stack === null) return;
            if (stack.route === undefined || stack.route === null) return;
            if (stack.route.path === path) {
                app._router.stack.splice(index, 1);
            }
        });
    },

    // models
    UserGroup,
    User,

}, func);



modules.run('entryscript', Data);
//moduleData[module_folders[j][0].name] = require(`./modules/${module_folders[j][1]}/${module_folders[j][0].entryScript}`)(Data);


//====================================
//======= Launching =================
//====================================

app.listen(config.port); // makes the app listen on localhost:<port>
console.info('Server started on port: ' + config.port); // just tells me when the server has started up