module.exports = function (baseDir, func) {
	class Module {
		constructor(manifest, folder) {
			this.manifest = manifest;
			this.folder = folder;
			this.models = {};
		}

		getMerged(item, toMerge) {
			if (typeof (item) === 'string') item = item.toLowerCase();

			var obj = {};

			if (item === 'user') {
				obj = this.models.user;
			} else if (item === 'usergroup') {
				obj = this.models.usergroup
			} else if (item === 'config') {
				obj = this.config;
			}

			obj = func.copy(obj); // copies the object so we aren't altering the original at all, just in case
			console.log('---------------');
			console.log('item: ', item, '\n');
			console.log('obj: ', obj, '\n');
			console.log('toMerge: ', toMerge, '\n');
			return func.mergeDeep(toMerge, obj);
		}

		setDefaults() {
			if (!this.manifest.name) this.manifest.name = this.folder;
			if (!this.manifest.version) this.manifest.version = '0.0.1';
			if (!this.manifest.forVersion) this.manifest.forVersion = '*.*.*';
			if (!this.manifest.author) this.manifest.author = 'Unknown';

			if (!this.manifest.entryScript) this.manifest.entryScript = "index.js";
			if (!this.manifest.models) this.manifest.models = {};
			if (!this.manifest.config) this.manifest.config = '';
			if (!this.manifest.routes) this.manifest.routes = '';
			if (!this.manifest.passport) this.manifest.passport = '';
			
			if (!this.manifest.models) this.manifest.models = {};
		}

		run(item, Data) {
			item = item.toLowerCase();
			var req = undefined;
			if (item === 'entry' || item === 'entryscript') {
				if (func.fs.existsSync(this.folder + '/' + this.manifest.entryScript) && this.manifest.entryScript !== '') {
					req = require(this.folder + '/' + this.manifest.entryScript);
				}
			} else if (item === 'routes' || item === 'express' || item === 'app') {
				if (func.fs.existsSync(this.folder + '/' + this.manifest.routes) && this.manifest.routes !== '') {
					req = require(this.folder + '/' + this.manifest.routes);
				}
			} else if (item === 'passport') {
				if (func.fs.existsSync(this.folder + '/' + this.manifest.passport) && this.manifest.passport !== '') {
					req = require(this.folder + '/' + this.manifest.passport);
				}
			}

			if (typeof(req) === 'function') {
				req = req(Data);
			}

			return req;
		}

		setValues() {
			this.name = this.manifest.name;
			this.author = this.manifest.author;
			this.version = this.manifest.version;
			//obj.isForThisVersion = isForThisVersion(obj.manifest.forVersion);
			this.models.user = {};

			if (this.manifest.models.user) {
				console.log(func.colors.bgGreen('Has a manifest user'));
				this.models.user = this.manifest.models.user;

				if (func.fs.existsSync(this.folder + '/' + this.models.user)) {
					console.log(func.colors.bgGreen('manifest user file exists'));
					this.models.user = require(this.folder + '/' + this.models.user);
					if (typeof (this.models.user) === 'function') {
						console.log(func.colors.bgGreen('manifest user is a functon, running....'));
						this.models.user = this.models.user({
							baseDir,
							self: this,
							func
						});
					}
				} else {
					console.warn(`WARNING: ${this.folder}/manifest.json looks for a file for adding properties to users at ${this.folder}/${this.models.user}, but it was not found.`);

					this.models.user = {};
				}
			} else {
				console.log(func.colors.bgRed('manifest user is not defined'));
				this.models.user = {};
			}

			if (this.manifest.models.usergroup) {
				this.models.usergroup = this.manifest.models.usergroup;

				if (func.fs.existsSync(this.folder + '/' + this.models.usergroup)) {
					this.models.usergroup = require(this.folder + '/' + this.models.usergroup);

					if (typeof (this.models.usergroup) === 'function') {
						this.models.usergroup = this.models.usergroup({
							baseDir,
							self: this,
							func
						});
					}
				} else {
					console.warn(`WARNING: ${this.folder}/manifest.json looks for a file for adding properties to users at ${this.folder}/${this.models.usergroup}, but it was not found.`);

					this.models.usergroup = {};
				}
			} else {
				this.models.usergroup = {};
			}

			if (this.manifest.config) {
				this.config = this.manifest.config;

				if (func.fs.existsSync(this.folder + '/' + this.config)) {
					this.config = require(this.folder + '/' + this.config);
					if (typeof (this.config) === 'function') {
						this.config = this.config({
							baseDir,
							self: this,
							func
						});
					}
				} else {
					console.warn(`WARNING: ${this.folder}/manifest.json looks for a file for adding properties to users at ${this.folder}/${this.models.user}, but it was not found.`);

					this.config = {};
				}
			} else {
				this.config = {};
			}
		}
	}


	class ModuleList {
		constructor(parent, modules) {
			this.modules = [];
			this.parent = null;

			if (modules) {
				this.modules = modules;
			}

			if (parent) {
				this.parent = parent;
			} else {
				this.parent = new Module({}, ''); // blank module for the parent;
			}
		}

		run (item, Data) {
			var reqData = [];
			for (let i = 0; i < this.modules.length; i++) {
				reqData.push(this.modules[i].run(item, Data));
			}
			reqData.push(this.parent.run(item, Data));
			return reqData;
		}

		setDefaults () {
			for (let i = 0; i < this.modules.length; i++) {
				this.modules[i].setDefaults();
			}
			this.parent.setDefaults();
		}

		setValues () {
			for (let i = 0; i < this.modules.length; i++) {
				this.modules[i].setValues();
			}
			this.parent.setValues();
		}

		getMerged(item, toMerge) {
			console.log(func.colors.red(this.modules.constructor));
			if (this.modules.constructor === ModuleList) {
				toMerge = this.modules.getMerged(item, toMerge);
			} else {
				for (let i = 0; i < this.modules.length; i++) {
					toMerge = this.modules[i].getMerged(item, toMerge);
				}
			}

			if (this.isValidParent()) {
				//parent module gets last say on what appears
				toMerge = this.parent.getMerged(item, toMerge);
			}
			return toMerge;
		}

		isValidParent() {
			return this.parent.constructor === Module;
		}
	}

	function loadModule(dir, folderName) {
		var folder = baseDir + '/' + dir + '/' + folderName;

		var manifest_location = `${folder}/manifest.json`;


		var manifest = func.fs.existsSync(manifest_location);

		if (!manifest) {
			console.warn(`WARNING: Module in: "${folder}" does not have a manifest.json`);
			manifest = {};
		} else {
			manifest = JSON.parse(func.fs.readFileSync(manifest_location, 'utf8'));
		}


		var modules_list = [];

		if (func.fs.existsSync(`${folder}/modules`)) { // TODO: make an option to set a custom modules folder
			modules_list = loadAllModules(`${dir}/${folderName}/modules`);
		}

		var module_instance = new ModuleList(new Module(manifest, folder), modules_list);
		module_instance.setDefaults();
		module_instance.setValues();
		//module_instance.cache('user');
		//module_instance.cache('usergroup');
		//module_instance.cache('config');



		return module_instance;
	}

	function loadAllModules(dir) {
		var module_folders = func.fs.readdirSync(baseDir + '/' + dir);
		var module_list = [];
		for (let i = 0; i < module_folders.length; i++) {
			module_list.push(loadModule(dir, module_folders[i]));
		}

		var list = new ModuleList(null, module_list);

		return list;
	}


	return {
		Module,
		ModuleList,


		loadModule,
		loadAllModules,


	};
}