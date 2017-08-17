module.exports = function (func) {
	// http://mongoosejs.com/docs/guide.html
	return {
		example_module_random_name: {
			type: String,
			default: function () {
				return Math.random().toString(36).slice(2);
			}
		},
		example_module_prop: {
			a: {
				type: Number,
				default: 10
			},
			b: {
				default: 50
			},
			c: {
				type: Number,
				default: 20
			},
			e: {
				type: Number
			}
		}
	}
}