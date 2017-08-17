module.exports = function (func) {
	// http://mongoosejs.com/docs/guide.html
	return {
		example_module_prop: {
			b: {
				// declaring type property and default property
				// showing that it will keep all properties except one modified by later/parent modules
				type: Number,
				default: 499
			},
			e: {
				// declaring only default property
				// showing that it will keep this property and the type property added by the parent module
				default: 500
			}
		}
	}
}