(function() {
var global = this;

module('tAMD/loader', {
	setup: function() {
		var that = this;
		stop();
		reinitialize().then(function() {

			require(['tAMD/loader'], function(loader) {
				require.config({
					baseUrl: '..'
				});
			});
			start();
		});
	},
	teardown: function() {}
});

asyncTest('loads anonymous modules', function() {
	expect(1);

	require(['test/fixture/anonymous'], function(module) {
		equal(module.anonymous, true, 'loaded module `fixture/anonymous`');
		start();
	});
});

}());
