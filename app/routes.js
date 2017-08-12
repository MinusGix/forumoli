/* jshint esversion:6 */

module.exports = function (config, User, UserGroup, app, express, passport, upload, func) {
    var isDev = config.isDev; // if it is in dev mode

    // =============================================================================
    // ====================== Middleware ===========================================
    // =============================================================================
    // gets the profile user by their id
    // currently not used at all 
    /*
    var getProfileUserById = async function (req, res, next) {
        if (typeof (req.params.userId) !== 'string') {
            return res.render('_error.ejs', await generateReqData(req.user, {
                message: "Please enter an actual user's id."
            }));
        }
        try {
            let user = await User.findById(req.params.userId);

            if (!func.isValidUser(user)) { // if that is not a valid user
                return res.render('_error.ejs', await generateReqData(req.user, {
                    message: "Sorry, but that does not appear to be a user."
                }));
            }

            req.profileUser = user;

            next();
        } catch (err) {
            console.error(err);

            // if there is an error and we are in dev mode it will display it on the page for simplicity
            if (isDev) {
                return res.render('_error.ejs', await generateReqData(req.user, {
                    message: err
                }));
            } else {
                return res.render('_error.ejs', await generateReqData(req.user, {
                    message: 'Internal Server Error #0002'
                }));
            }
        }
    };*/


    // find a profile user by their username
    var getProfileUserByName = async function (req, res, next) {
        // makes sure it's a string
        if (typeof (req.params.username) !== 'string') {
            return res.render('_error.ejs', await generateReqData(req.user, {
                message: 'Please give a username.'
            }));
        }

        try {
            let user = await User.findOne({
                'local.username': req.params.username.toLowerCase()
            });

            if (!func.isValidUser(user)) {
                return res.render('_error.ejs', await generateReqData(req.user, {
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
                return res.render('_error.ejs', await generateReqData(req.user, {
                    message: err
                }));
            } else {
                return res.render('_error.ejs', await generateReqData(req.user, {
                    message: 'Error #0001, contact the administrator if this problem continues.'
                }));
            }
        }
    };

    // =============================================================================
    // =================== normal routes ===========================================
    // =============================================================================

    // show the home page (will also have our login links)
    app.get('/', async function (req, res) {
        res.render('index.ejs', await generateReqData(req.user));
    });

    // LOGOUT ==============================
    app.get('/logout', function (req, res) { // log them out of their account and redirect to the front page
        req.logout();
        res.redirect('/');
    });

    // =============================================================================
    // USER PROFILES ===============================================================
    // =============================================================================    

    app.get('/users/:username', getProfileUserByName, async function (req, res) {
        // Set them all to 0 by default, since someone could be not logged in and view this page
        var changeOwnBiography = 0;
        var changeOwnProfilePicture = 0;
        var changeOwnUsername = 0;

        var changeBiographies = 0;
        var changeProfilePicture = 0;
        var changeUsernames = 0;

        // if they are a valid user get the actual permissions.
        if (func.isValidUser(req.user)) {
            changeOwnBiography = await req.user.can('changeOwnBiography'); // if they can change their own bio
            changeOwnProfilePicture = await req.user.can('changeOwnProfilePicture'); // if they can change their own pfp
            changeOwnUsername = await req.user.can('changeOwnUsername'); // if they can change their own username
            changeBiographies = await req.user.can('changeBiographies'); // if they can change OTHER's bios
            changeProfilePicture = await req.user.can('changeProfilePicture'); // if they can change OTHER's pfps
            changeUsernames = await req.user.can('changeUsernames'); // if they can change OTHER's usernames
        }

        // basically decides if they are themselves it uses the changeOwn permissions, if they are editing someone else it uses the change permissions
        var change = {
            biography: req.isThemself ? changeOwnBiography : changeBiographies,
            profilePicture: req.isThemself ? changeOwnProfilePicture : changeProfilePicture,
            username: req.isThemself ? changeOwnUsername : changeUsernames
        };

        res.render('userProfile.ejs', await generateReqData(req.user, {
            profileUser: req.profileUser,
            isThemself: req.isThemself,
            canEdit: change.biography || change.profilePicture || change.username
        }));
    });

    app.post('/users/:username/edit', getProfileUserByName, isLoggedIn, upload.single('profilePic'), async function (req, res) {
        var changeOwnBiography = 0;
        var changeOwnProfilePicture = 0;
        var changeOwnUsername = 0;

        var changeBiographies = 0;
        var changeProfilePicture = 0;
        var changeUsernames = 0;

        var username = req.params.username;

        if (func.isValidUser(req.user)) {
            // TODO: make these only  check if it allows it so maybe it won't load every one at once if they can only do X
            changeOwnBiography = await req.user.can('changeOwnBiography'); // if they can change their own bio
            changeOwnProfilePicture = await req.user.can('changeOwnProfilePicture'); // if they can change their own pfp
            changeOwnUsername = await req.user.can('changeOwnUsername'); // if they can change their own username

            changeBiographies = await req.user.can('changeBiographies'); // if they can change OTHER's bios
            changeProfilePicture = await req.user.can('changeProfilePicture'); // if they can change OTHER's pfps
            changeUsernames = await req.user.can('changeUsernames'); // if they can change OTHER's usernames
        }


        if (req.isThemself) {
            // the person they are editing is themselves
            if (changeOwnBiography === 0 && changeOwnProfilePicture === 0 && changeOwnUsername === 0) {
                req.flash('profileEditMessage', 'You do not have the permissions for editing your profile!');
                return res.redirect('/users/' + username + '/edit');
            }
        } else {
            if (changeBiographies === 0 && changeProfilePicture === 0 && changeUsernames === 0) {
                req.flash('profileEditMessage', 'You do not have the permissions for editing their profile!');
                return res.redirect('/users/' + username + '/edit');
            }
        }

        var change = {
            biography: req.isThemself ? changeOwnBiography : changeBiographies,
            profilePicture: req.isThemself ? changeOwnProfilePicture : changeProfilePicture,
            username: req.isThemself ? changeOwnUsername : changeUsernames
        };


        if (change.biography === 1) {
            if (typeof (req.body.biography) === 'string') {
                var bioIsValid = func.isValidBiography(req.body.biography);

                if (!bioIsValid[0]) {
                    req.flash('profileEditMessage', bioIsValid[1]);
                    return res.redirect('/users/' + username + '/edit');
                }

                req.profileUser.profile.biography = req.body.biography;
                req.profileUser.markModified('profile.biography');
            }
        }


        if (change.profilePicture === 1) {
            if (req.file !== undefined) {

                var picIsValid = func.isValidProfilePicture(req.file);

                if (!picIsValid[0]) {
                    req.flash('profileEditMessage', picIsValid[1]);
                    return res.redirect('/users/' + username + '/edit');
                }

                req.profileUser.profile.picture = req.file.filename;
                req.profileUser.markModified('profile.picture');
            }
        }

        if (change.username) {
            var newUsername = req.body.username;

            if (newUsername) { // if its truthy, so not '' or undefined
                var nameIsValid = func.isValidUsername(newUsername);

                if (!nameIsValid[0]) {
                    req.flash('profileEditMessage', nameIsValid[1]);
                    return res.redirect('/users/' + username + '/edit');
                }

                req.profileUser.local.username = newUsername.toLowerCase();
                req.profileUser.local.displayName = newUsername;
                req.profileUser.markModified('local.username');
                req.profileUser.markModified('local.displayName');
            }
        }

        try {
            await req.profileUser.save();
            return res.redirect('/users/' + req.profileUser.local.displayName + '/'); // uses display name for if they changed it
        } catch (err) {
            console.error(`Error in express /users/${req.params.username}/edit at saving the user: ${err}`);

            if (isDev) {
                req.flash("profileEditMessage", "There was an error: " + err);
                return res.redirect('/users/' + username + '/edit');
            } else {
                req.flash("profileEditMessage", "There was an unknown error in saving this profile.");
                return res.redirect('/users/' + username + '/edit');
            }
        }

    });

    app.get('/users/:username/edit', getProfileUserByName, isLoggedIn, async function (req, res) {
        var changeOwnBiography = 0;
        var changeOwnProfilePicture = 0;
        var changeOwnUsername = 0;

        var changeBiographies = 0;
        var changeProfilePicture = 0;
        var changeUsernames = 0;

        if (req.user !== undefined && req.user !== null && typeof (req.user) === 'object') {
            // TODO: make these only  check if it allows it so maybe it won't load every one at once if they can only do X
            changeOwnBiography = await req.user.can('changeOwnBiography'); // if they can change their own bio
            changeOwnProfilePicture = await req.user.can('changeOwnProfilePicture'); // if they can change their own pfp
            changeOwnUsername = await req.user.can('changeOwnUsername'); // if they can change their own username

            changeBiographies = await req.user.can('changeBiographies'); // if they can change OTHER's bios
            changeProfilePicture = await req.user.can('changeProfilePicture'); // if they can change OTHER's pfps
            changeUsernames = await req.user.can('changeUsernames'); // if they can change OTHER's usernames
        }


        if (req.isThemself) {
            // the person they are editing is themselves
            if (changeOwnBiography === 0 && changeOwnProfilePicture === 0 && changeOwnUsername === 0) {
                // they can not do any of those
                return res.render('_error.ejs', await generateReqData(req.user, {
                    message: 'Sorry, but you do not have any editing permissions for your own profile.'
                }));
            }
        } else {
            if (changeBiographies === 0 && changeProfilePicture === 0 && changeUsernames === 0) {
                return res.render('_error.ejs', await generateReqData(req.user, {
                    message: "Sorry, but you do not have any editing permissions for this person's profile"
                }));
            }
        }

        res.render('userProfileEdit.ejs', await generateReqData(req.user, {
            profileUser: req.profileUser,
            username: req.params.username,
            isThemself: req.isThemself,

            message: req.flash('profileEditMessage'),
            // so even if they are editing someone else i don't have to make weird if statements
            change: {
                biography: req.isThemself ? changeOwnBiography : changeBiographies,
                profilePicture: req.isThemself ? changeOwnProfilePicture : changeProfilePicture,
                username: req.isThemself ? changeOwnUsername : changeUsernames
            },

            // might as well pass these along so they don't manually get them, // TODO: remove these
            changeOwnBiography,
            changeOwnProfilePicture,
            changeOwnUsername,

            changeBiographies,
            changeProfilePicture,
            changeUsernames
        }));
    });

    app.get('/profile', isLoggedIn, function (req, res) {
        // redirects to /users/theirname/ for simplicity
        res.redirect('/users/' + req.user.local.displayName + '/');
    });

    app.get('/profile/edit', isLoggedIn, function (req, res) {
        // redirects to /users/theirname/edit for simplicity
        res.redirect('/users/' + req.user.local.displayName + '/edit');
    });

    // =============================================================================
    // ADMINISTRATOR PAGES =========================================================
    // =============================================================================

    app.get('/admin/', isAdmin, async function (req, res) {
        res.render('admin/admin.ejs', await generateReqData(req.user));
    });

    // for testing permissions
    app.get('/admin/permtest', isAdmin, async function (req, res) {
        res.render('admin/permTest.ejs', await generateReqData(req.user));
    });

    // for making and editing usergroups
    app.get('/admin/usergroups', isAdmin, async function (req, res) {
        var usergroups = await UserGroup.find({});

        res.render('admin/userGroups.ejs', await generateReqData(req.user, {
            usergroups
        }));
    });

    app.get('/admin/usergroups/:username', isAdmin, getProfileUserByName, async function (req, res) {
        var usergroups = await req.profileUser.getUserGroups();

        res.render('admin/userUserGroups.ejs', await generateReqData(req.user, {
            usergroups,
            isThemself: req.isThemself,
            profileUser: req.profileUser
        }));
    });

    app.post('/admin/api/saveUsersUsergroups', isAdmin, async function (req, res) {
        var usergroups = req.body.groups;
        var username = req.body.username;

        if (typeof(usergroups) !== 'string') {
            return res.send('Error: groups was not a string');
        }
        if (typeof(username) !== 'string') {
            return res.send('Error: username was not a string');
        }

        try {
            usergroups = JSON.parse(usergroups);
        } catch (err) {
            return res.send('Error in parsing usergroups');
        }
        var user;

        try {
            user = await User.findOne({
                'local.username': username.toLowerCase()
            });
        } catch (err) {
            console.error(err);
            return res.send('There was an unknown error.');
        }


        if (!func.isValidUser(user)) {
            return res.send('Cannot edit a user that doesn\'t exist! (Perhaps their name was changed as you were doing this)');
        }
        console.log(usergroups);
        user.UserGroups = usergroups.filter((v, i) => usergroups.indexOf(v) === i).filter(v => typeof(v) === 'string');
        console.log(user.UserGroups);
        user.markModified('UserGroups');
        user.save(function() {
            return res.send('Saved');
        });
    });
    
    app.post('/admin/api/getAllUsergroups', isAdmin, async function (req, res) {
        var usergroups = await UserGroup.find({});
        res.send(JSON.stringify(usergroups));
    });
    app.post('/admin/api/getUsergroups', isAdmin, async function (req, res) {
        var wants = req.body.wants;
        var usergroups = await UserGroup.find({}); // gets all usergroups
        
        if (typeof(wants) === 'string') {
            try {
                wants = JSON.parse(wants);
            } catch (err) {
                console.error(err);
                return res.send("Error: Bad 'wants' property.");
            }
        } else {
            return res.send(JSON.stringify(usergroups));
        }
        let wantsLength = wants.length;

        

        var arr = [];

        for (let i = 0; i < usergroups.length; i++) {
            if (wantsLength > 1) {
                arr.push([]);
            }
            
            // has this loop because i'm not gonna let them access any property they want even if they are admins
            for (let j = 0; j < wantsLength; j++) {
                if (wants[j] === 'name') {
                    arr[i].push(usergroups[i].name);
                } else if (wants[j] === 'displayName') {
                    arr[i].push(usergroups[i].displayName);
                } else if (wants[j] === 'id') {
                    arr[i].push(usergroups[i].id);
                }
            }
        }

        res.send(JSON.stringify(arr));
    });

    // save the permissions of a usergroup, if it doesn't exist it creates it.
    app.post('/admin/api/savePermissions', isAdmin, async function (req, res) {
        var name = req.body.name;
        var type = req.body.type;
        var perms = req.body.perms;

        if (typeof (name) !== 'string') {
            return res.send("There was an error supplying the 'name' property.");
        }

        var nameLower = name.toLowerCase().trim();

        // checks if they tried to name it after a reserved group, though it shouldn't cause any problems if they did it would be confusing
        if (nameLower === "administrator" || nameLower === "admin" || nameLower === "basic user" || nameLower === "member") {
            return res.send("Sorry but those are reserved group names.");
        } else if (nameLower === "") { // TODO: Question existence and decide whether to just let them make ones with blank names.
            return res.send("Sorry but Usergroup name is not allowed to be blank.");
        }

        // if name is not a string default it to 'name', otherwise set it to name if it is not name or id, otherwise lowercase it
        if (typeof (type) !== 'string') {
            type = 'name';
        } else {
            if (type !== 'name' && type !== 'id') {
                type = 'name';
            } else {
                type = type.toLowerCase();
            }
        }


        if (typeof (perms) !== 'string') {
            return res.send("There was an error supplying the 'perms' property.");
        } else {
            try {
                perms = JSON.parse(perms);
            } catch (err) {
                return res.send("There was an error parsing the 'perms' property.");
            }
        }

        try {
            var usergroup;

            if (type === 'name') {
                usergroup = await UserGroup.findOne({
                    'name': nameLower
                });
            } else if (type === 'id') {
                usergroup = await UserGroup.findById(name); // not lower because if it's an id then it might not like being lowered
            }
            // TODO: make an isValidUserGroup function for usergroups.
            if (usergroup === undefined || usergroup === false || usergroup === null) {
                // Creating a new usergroup, yay.
                usergroup = new UserGroup();

                usergroup.name = name;
                usergroup.displayName = name.toLowerCase();

                for (let i in perms) {
                    if (usergroup.permissions[i] === undefined) {
                        usergroup.permissions[i] = {
                            name: i,
                            description: "Unknown"
                        };
                    }
                    usergroup.permissions[i].can = Number(perms[i]); // convert to number just in case
                }
            } else {
                // Modifying an existing usergroup
                for (let i in perms) {
                    if (usergroup.permissions[i] === undefined) {
                        usergroup.permissions[i] = {
                            name: i,
                            description: "Unknown"
                        };
                    }
                    usergroup.permissions[i].can = Number(perms[i]); // convert to number just in case
                }
            }

            usergroup.markModified('permissions'); // because it doesn't bloody save right otherwise unlesss it's a new one :I

            return usergroup.save(function () {
                return res.send("Saved");
            });
        } catch (err) {
            console.error(err);

            if (isDev) {
                return res.send("Sorry, but there was an error: " + err);
            } else {
                return res.send("Sorry, but there was an error.");
            }
        }
    });

    // get the permissions for a usergroup, if that usergroup doesn't exist it returns the default permissions
    app.get('/admin/api/getPermissions', isAdmin, async function (req, res) {
        var name = req.query.name;
        var type = req.query.type;

        if (typeof (name) !== 'string') {
            // TODO: Should this be made into an isDev and else? this only appears for admins and they should be trustworthy?
            return res.send(JSON.stringify({
                message: 'There was an error, "name" was not a string'
            }));
        } else {
            name = name.toLowerCase();
        }

        if (typeof (type) !== 'string') {
            return res.send(JSON.stringify({
                message: 'There was an error, "type" was not a string'
            }));
        } else {
            type = type.toLowerCase();
        }

        var usergroup;
        try {
            if (type === "name") {
                usergroup = await UserGroup.findOne({
                    'displayName': name
                });
            } else if (type === "id") {
                usergroup = await UserGroup.findById(name);
            } else {
                return res.send(JSON.stringify({
                    message: 'There was an error, type was not an allowed type.'
                }));
            }

            if (usergroup === undefined || usergroup === null) {
                // means it wasn't found
                return res.send(JSON.stringify({
                    command: "create",
                    perms: config.defaultParsedPermissions
                }));
            }

            return res.send(JSON.stringify({
                command: "create",
                perms: await usergroup.getPermissions()
            }));

        } catch (err) {
            console.error(err);

            if (isDev) {
                return res.send(JSON.stringify({
                    message: "Err: " + err
                }));
            } else {
                return res.send(JSON.stringify({
                    message: "Sorry, but there was an error. Please try again later."
                }));
            }
        }
    });

    // =============================================================================
    // LOGIN PAGES =================================================================
    // =============================================================================

    // show the login form
    app.get('/login', async function (req, res) {
        res.render('login.ejs', await generateReqData(req.user, {
            message: req.flash('loginMessage')
        }));
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =============================================================================
    // SIGNUP PAGES ================================================================
    // =============================================================================
    // show the signup form
    app.get('/signup', async function (req, res) {
        res.render('signup.ejs', await generateReqData(req.user, {
            message: req.flash('signupMessage')
        }));
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));







    // =============================================================================
    // OTHER =======================================================================
    // =============================================================================


    // Delete accounts
    app.get('/deleteaccount', isLoggedIn, function (req, res) {
        res.render('deleteAccount.ejs', generateReqData(req.user));
    });

    // route middleware to ensure user is logged in
    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }

        res.redirect('/');
    }

    // checks if the user is logged in and is an admin
    function isAdmin(req, res, next) {
        if (req.isAuthenticated()) {
            if (func.isAdmin(req.user)) {
                return next();
            }
        }
        res.redirect('/');
    }

    // generates data for each page, for simplicity and non-repetitiveness
    async function generateReqData(user, extraObj) {
        let obj = {
            config, // the config, so if we want to do anything based on it
            user, // the user who is requesting the page
            isValidUser: func.isValidUser, // a function that tells if it is a valid user, checks if they are 'enabled'
            getImage: func.getImage, // gets the users image
            func, // some functions which are useful
            message: '', // so anything that relies on this won't break if the message is undefined
            get: function () { // returns this obj so we can pass it to the titlebar in ejs's include()
                return this;
            }
        };

        if (func.isValidUser(user)) {
            obj.permissions = await user.getPermissions();
        }

        if (typeof (extraObj) === 'object' && extraObj !== null) {
            Object.assign(obj, extraObj); // mixes the two objects, extraObj properties will take precedence over obj's properties
        }

        return obj;
    }
};