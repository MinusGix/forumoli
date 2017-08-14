module.exports = function (func) {
	// http://mongoosejs.com/docs/guide.html
	return {
		example_module_random_name: {
			type: String,
			default: function () {
				return Math.random().toString(36).slice(2);
			}
		}
	}
}