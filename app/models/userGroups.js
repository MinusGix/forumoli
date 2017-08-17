module.exports = function (modules, mongoose, config, func) {

	// define the schema for our user model
	var userGroupSchema = mongoose.Schema(modules.getMerged('usergroup', {
		name: {
			type: String,
			default: 'unnamed usergroup'
		},
		displayName: {
			type: String,
			default: 'Unnamed Usergroup'
		},

		permissions: {
			type: mongoose.Schema.Types.Mixed,
			default: func.copy(config.defaultParsedPermissions) // copied, just in case
		},

		other: {
			showOnUserPage: {
				type: Boolean,
				default: true
			},
			storageVersion: {
				type: Number,
				default: config.storageVersions.userGroup
			}, // 0 is the first version
		}
	}));

	
	userGroupSchema.method.getPermission = async function (permName) {
		var perm = this.permissions[permName];

		if (perm === undefined) perm = config.defaultParsedPermissions[permName];

		return perm;
	}

	userGroupSchema.methods.getPermissions = async function () {
		var perms = func.copy(config.defaultParsedPermissions);

		for (let i in this.permissions) {
			perms[i] = this.permissions[i];
		}
		return perms;
	}


	// create the model for users and expose it to our app
	return mongoose.model('UserGroup', userGroupSchema);
}