module('tAMD/plugins', {
    setup: function() {
        var that = this;
        stop();
        reinitialize().then(function() {

            that.load = function(resource, require, load) {
                require([resource], function(res) {
                    res.myPlugin = true;
                    load(res);
                });
            };
            define('myPlugin', { load: that.load });

            that.obj = {};
            define('obj', that.obj);

            start();

        });
    },
    teardown: function() {}
});

asyncTest('loads a resource via a plugin', 2, function() {
    require(['myPlugin!obj'], function(res) {
        ok(res, 'loaded myPlugin!obj');
        strictEqual(res.myPlugin, true, 'resource has a "myPlugin" property');
        start();
    });
});

test('supports requiring plugin resource synchronously', 1, function() {
    require(['myPlugin!obj'], function(res) {
        ok(res, 'loaded myPlugin!obj synchronously');
    });
});

test('supports requiring plugin resource via sync require', 1, function() {
    require(['require'], function(require) {
        var res = require('myPlugin!obj');
        ok(res, 'loaded myPlugin!obj via sync require');
    });
});

test('normalizes plugin id', 2, function() {
    define('a/plugin', { load: this.load });
    define('a/resource', ['./plugin!obj'], function(res) {
        ok(res, 'loaded ./plugin!obj');
    });
    define('b/resource', ['../a/plugin!obj'], function(res) {
        ok(res, 'loaded ../a/plugin!obj');
    });
});

test('normalizes resource id', 2, function() {
    define('a/obj', this.obj);
    define('a/test', ['myPlugin!./obj'], function(res) {
        ok(res, 'loaded myPlugin!./obj');
    });
    define('b/test', ['myPlugin!../a/obj'], function(res) {
        ok(res, 'loaded myPlugin!../a/obj');
    });
});

test('supports custom resource id normalization', 1, function() {
    var that = this;
    define('anotherPlugin', {
        load: this.load,
        normalize: function(resourceId) {
            return resourceId.toLowerCase();
        }
    });
    require(['anotherPlugin!OBJ'], function(res) {
        strictEqual(res, that.obj, 'loaded anotherPlugin!OBJ');
    });
});

test('combines custom and standard resource id normalization', 2, function() {
    var that = this;
    define('anotherPlugin', {
        load: this.load,
        normalize: function(resourceId, normalize) {
            return normalize(resourceId.toLowerCase());
        }
    });
    define('a/obj', this.obj);
    define('a/test', ['anotherPlugin!./OBJ'], function(res) {
        strictEqual(res, that.obj, 'loaded anotherPlugin!./OBJ');
    });
    define('b/test', ['anotherPlugin!../a/OBJ'], function(res) {
        strictEqual(res, that.obj, 'loaded anotherPlugin!../a/OBJ');
    });
});

asyncTest('supports asynchronous plugin lookup', 1, function() {
    var that = this;
    require(['asyncPlugin!__obj__'], function(res) {
        strictEqual(res, that.obj, 'asynchronously normalized resource id');
        start();
    });
    setTimeout(function() {
        define('asyncPlugin', {
            load: that.load,
            normalize: function(resourceId) {
                return resourceId.replace(/_/g, '');
            }
        });
    }, 100);
});

test('supports plugin chains', 4, function() {
    var that = this;

    define('a/test', ['foo!bar!nao!obj'], function(res) {
        strictEqual(res, that.obj, 'loaded resource through three plugins');
        strictEqual(res.foo, true, 'resource gets a "foo" attribute');
        strictEqual(res.bar, true, 'resource gets a "bar" attribute');
        strictEqual(res.nao, true, 'resource gets a "nao" attribute');
    });

    define('foo', { load: loader('foo') });
    define('bar', { load: loader('bar') });
    define('nao', { load: loader('nao') });

    function loader(label) {
        return function(resourceId, require, load) {
            require([resourceId], function(res) {
                res[label] = true;
                load(res);
            });
        };
    }
});

// TODO: Is this how chained plugins with relative ids should be
// handled?
//test('supports plugin chains with relative plugin ids', 4, function() {
//    var that = this;
//
//    define('a/test', ['foo!./bar!../b/nao!./obj'], function(res) {
//        strictEqual(res, that.obj, 'loaded resource through three plugins');
//        strictEqual(res.foo, true, 'resource gets a "foo" attribute');
//        strictEqual(res.bar, true, 'resource gets a "bar" attribute');
//        strictEqual(res.nao, true, 'resource gets a "nao" attribute');
//    });
//
//    define('foo',   { load: loader('foo') });
//    define('a/bar', { load: loader('bar') });
//    define('b/nao', { load: loader('nao') });
//
//    function loader(label) {
//        return function(resourceId, require, load) {
//            require([resourceId], function(res) {
//                res[label] = true;
//                load(res);
//            });
//        };
//    }
//});
