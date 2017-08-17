module.exports = function (Data) {
	console.info('example_module loaded');
	Data.app.get('/example_module', async function (req, res) {
		res.render(__dirname + '/views/example_module.ejs', await Data.generateReqData(req.user, {

		}));
	});
	// NOTE: removeRoute should not be used outside of initial script (aka no using it in your pages) since it is not async
	//Data.removeRoute('/'); // this would remove the default route and let you remake it here
	Data.app.get('/', async function (req, res) {
		res.render(__dirname + '/views/example_module.ejs', await Data.generateReqData(req.user, {

		}));
	})
}