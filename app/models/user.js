module.exports = function (module_User, mongoose, config, func, UserGroup) {
    // load the things we need
    var bcrypt = require('bcrypt-nodejs');

    // define the schema for our user model
    var userSchema = mongoose.Schema(func.mergeDeep({

        UserGroups: [String],

        local: {
            displayName: String,
            username: String,
            //email        : String,
            password: String,

        },

        profile: {
            biography: {
                type: String,
                default: config.users.defaultBiography
            },
            picture: {
                type: String,
                default: config.users.defaultPicture
            }
        },

        other: {
            isAdmin: {
                type: Boolean,
                default: false
            },

            loginLog: [String], // array of ips who logged in and their browser

            storageVersion: {
                type: Number,
                default: config.storageVersions.user
            }, // 0 is the first version

            enabled: {
                type: Boolean,
                default: config.users.defaultEnabled
            },
        }


        /* facebook         : {
             id           : String,
             token        : String,
             email        : String,
             name         : String
         },
         twitter          : {
             id           : String,
             token        : String,
             displayName  : String,
             username     : String
         },
         google           : {
             id           : String,
             token        : String,
             email        : String,
             name         : String
         }*/

    }, module_User));

    // TODO: Find a way to use async/await with this
    // generating a hash
    userSchema.methods.generateHash = function (password, done) {
        /* can't use bcrypt with await because it requires callbacks
        try {
            var salt = await bcrypt.genSalt(8);
            return await bcrypt.hash(password, salt);
        } catch (err) {
            console.error("Error, at userScheme generateHash function: " + err);
            return null;
        }*/
        bcrypt.genSalt(8, function (err, salt) {
            if (err) {
                console.error("Error in userSchema generateHash bcrypt.genSalt function: " + err);
                return done(null, null);
            }
            bcrypt.hash(password, salt, null, function (err1, hash) {
                if (err1) {
                    console.error("Error in userSchema generateHash bcrypt.hash function: " + err1);
                    return done(null, null);
                }
                return done(null, hash);
            });
        });
        //return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };

    // checking if password is valid
    userSchema.methods.validPassword = function (password, done) {
        bcrypt.compare(password, this.local.password, function (err, isValid) {
            if (err) {
                console.error("Error in userSchema validPassword function: " + err);
                return done(null, null);
            }
            return done(null, isValid);
        });
        //return bcrypt.compareSync(password, this.local.password);
    };

    userSchema.methods.can = async function(permName) {
        if (this.isAdmin()) {
            return 1; // admins can do everything.
        }
        var perm = await func.getPermission(this, permName);
        return perm;
    }

    userSchema.methods.getUserGroups = async function () {
        var usergroups = [];

        try {
            for (let i = 0; i < this.UserGroups.length; i++) {
                usergroups.push(await UserGroup.findById(this.UserGroups[i]));
            }
        } catch (err) {
            // TODO: Make a better happening for an error than this.
            console.error(err);
            return [];
        }

        return usergroups;
    }

    userSchema.methods.getPermissions = async function () {
        return await func.getAllPermissions(this);
    }

    userSchema.methods.isAdmin = function () {
        return this.other.isAdmin;
    }

    // create the model for users and expose it to our app
    return mongoose.model('User', userSchema);
}