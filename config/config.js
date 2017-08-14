// config/config.js
/* jshint esversion:6 */

module.exports = function (module_Config, func) {
    var config = func.mergeDeep({
        //Server things
        port: process.env.PORT || 8080, // the port the site will be hosted on, localhost:<port>
        secret: func.fs.readFileSync('./config/secret.txt', 'utf8'), // the secret for sessions 

        // Dev things
        isDev: true, // If this is on you will receive more info in the console
        // and more info will be displayed to people using the page
        // like errors and so on if they happen.

        users: {
            defaultEnabled: true, // If accounts are by default enabled, I WOULD LEAVE THIS AS IT IS SINCE THERE IS NO VERIFICATION METHOD YET
            defaultPicture: 'defaultpicture.png', // The default profile picture, located in /uploads/
            defaultBiography: "Nothing here..." // The default biography of the user
        },

        // Max length for different things so it's more easily modifiable
        maxLength: {
            biography: 1000,
            username: 18,
            password: 10000
        },

        // Min length for different things so it's more easily modifiable
        minLength: {
            biography: 0,
            username: 3,
            password: 6
        },

        // Allowed types, for different things
        allowed: {
            profilePictureMimeTypes: [
                'image/gif', // .gif files
                //'image/x-icon', // .ico files // TODO: Google this to see if there is any problems
                'image/jpeg', // .jpg/.jpeg files
                'image/png', // .png files
                //'image/tiff', // .tiff/.tif files // TODO: Google this to see if there is any problems
                'image/webp'
            ]
        },


        // DEFAULT PERMISSIONS FOR NORMAL LOGGED IN USERS
        // DO NOT PUT ANYTHING CONFIDENTIAL IN THIS AS IT MAY BE TRANSMITTED TO USERS
        defaultPermissions: {
            disableAccounts: { // if they can disable OTHER user's accounts (and technically their own probably)
                name: {
                    type: String,
                    default: "Disable Accounts"
                },
                description: {
                    type: String,
                    default: "Whether the users in the group can disable accounts."
                },
                can: {
                    type: Number,
                    default: 0
                }
            },
            changeUsernames: { // if they can change OTHER user's usernames (and technically their own probably)
                name: {
                    type: String,
                    default: "Change Other's Usernames"
                },
                description: {
                    type: String,
                    default: "Whether the users in the group can change OTHER user's usernames. NOTE: THIS IS UNTESTED AND MAY HAVE UNEXPECTED CONSEQUENCES"
                }, // TODO: Test this once you get it working
                can: {
                    type: Number,
                    default: 0
                },
            },
            changeBiographies: { // if they can change OTHER user's biographies (and technically their own probably)
                name: {
                    type: String,
                    default: "Change Other's Biographies"
                },
                description: {
                    type: String,
                    default: "Whether the users in the group can change OTHER user's biographies."
                },
                can: {
                    type: Number,
                    default: 0
                }
            },
            changeProfilePictures: { // if they can change OTHER user's profile pictures (and technically their own probably)
                name: {
                    type: String,
                    default: "Change Other's Profile Pictures"
                },
                description: {
                    type: String,
                    default: "Whether the users in the group can change OTHER user's profile pictures."
                },
                can: {
                    type: Number,
                    default: 0
                }
            },

            disableOwnAccount: { // if they can disable their OWN account // TODO: Implement this
                name: {
                    type: String,
                    default: "Disable Own Account"
                },
                description: {
                    type: String,
                    default: "Whether the users in the group can disable their OWN account."
                },
                can: {
                    type: Number,
                    default: 0
                }
            },
            changeOwnBiography: { // if they can change their OWN biography
                name: {
                    type: String,
                    default: "Change Own Biography"
                },
                description: {
                    type: String,
                    default: "Whether the users in the group can change their OWN biography."
                },
                can: {
                    type: Number,
                    default: 1
                }
            },
            changeOwnProfilePicture: { // if they can change their OWN profile picture
                name: {
                    type: String,
                    default: "Change Own Profile Picture"
                },
                description: {
                    type: String,
                    default: "Whether the users in the group can change their OWN profile picture."
                },
                can: {
                    type: Number,
                    default: 1
                }
            },
            changeOwnUsername: { // if they can change their OWN username // TODO: Implement this
                name: {
                    type: String,
                    default: "Change Own Username"
                },
                description: {
                    type: String,
                    default: "Whether the users in the group can change their OWN username."
                },
                can: {
                    type: Number,
                    default: 0
                }
            },

            // TODO: Add more

            /* 
            0 = false
            1 = true
            2 = fall-through to the next group
        
            Template:
                name: { type: String, default: "" },
                description: { type: String, default: "" },
                can: { type: Boolean, default: 0 }
            */
        },
        defaultParsedPermissions: {}, // later code turns `defaultPermissions` to a version not meant for schema
        adminPermissions: {}, // later code copies `defaultParsedPermissions` and turns it into all 1's (true's) on the permissions

        // A number for the different storage versions so I can convert between them as needed for upgrading
        storageVersions: {
            user: 0,
            userGroup: 0
        },
        version: "0.5.0", // SHOULD NOT BE EDITED
        // this is so i can have a savable version for any edits that should occur while the server is still running
        json: JSON.parse(require('fs').readFileSync('./config/config.json', 'utf8'))
    }, module_Config);

    // makes config.defaultParsedPermissions contain more readable, not for mongoose, object
    for (let i in config.defaultPermissions) {
        config.defaultParsedPermissions[i] = {};
        for (let j in config.defaultPermissions[i]) {
            if (config.defaultPermissions[i][j].default !== undefined) {
                config.defaultParsedPermissions[i][j] = config.defaultPermissions[i][j].default;
            } else {
                config.defaultParsedPermissions[i][j] = config.defaultPermissions[i][j];
            }
        }
    }
    // set up admin perms
    for (let i in config.defaultParsedPermissions) {
        config.adminPermissions[i] = func.copy(config.defaultParsedPermissions[i]);
        config.adminPermissions[i].can = 1;
    }

    return config;
}