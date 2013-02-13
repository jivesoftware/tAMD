(function() {
var global = this;

module('tAMD/debug', {
    setup: function() {
        var that = this;

        this.origConsoleWarn  = global.console ? global.console.warn  : null;
        this.origConsoleError = global.console ? global.console.error : null;

        if (!global.console) {
            global.console = {};
        }

        stop();
        reinitialize().then(function() {
            that.foo = {};
            that.bar = {};

            define('foo', that.foo);
            define('bar', that.bar);

            start();
        });
    },
    teardown: function() {
        delete global.console.warn;
        delete global.console.error;

        if (this.origConsoleWarn) {
            global.console.warn = this.origConsoleWarn;
        }
        if (this.origConsoleError) {
            global.console.error = this.origConsoleError;
        }
    }
});

test('warns if module factory/value is not valid', 2, function() {
    global.console.warn = function(msg, name) {
        ok(/definition must be an object or a function/i.test(msg), 'got message about bad module value');
        equal(name, 'moduleWithBadValue', 'message relates to `moduleWithBadValue`');
    };

    define('moduleWithBadValue', 3);
});

test('emits error if relative module id is assigned to a module', 2, function() {
    global.console.error = function(msg, name) {
        ok(/cannot be relative/i.test(msg), 'got message about bad module id');
        equal(name, './relativeModule', 'message relates to `./relativeModule`');
    };

    define('./relativeModule', {});
});

asyncTest('warns if required module is not loaded within 2 seconds', 1, function() {
    require(['nonexistentModule'], function() {
        ok(false, '`nonexistentModule` does not exist');
    });

    global.console.warn = function(msg, name) {
        if (name === 'nonexistentModule') {
            ok(/missing/i.test(msg), 'got message about missing module');
            start();
        }
    };
});

test('warns of duplicate module definitions', 2, function() {
    global.console.warn = function(msg, name) {
        ok(/already defined/i.test(msg), 'got message about duplicate module definition');
        equal(name, 'duplicatedModule', 'message relates to `duplicatedModule`');
    };

    define('duplicatedModule', {});
    define('duplicatedModule', {});
});

}());
