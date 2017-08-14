module.exports = function (Data) {
	console.log('example_module loaded');
	console.log(__dirname);
	Data.app.get('/example_module', async function (req, res) {
		res.render(__dirname + '/views/example_module.ejs', await Data.generateReqData(req.user, {

		}));
	});
}