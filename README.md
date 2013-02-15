tAMD
=====

Tiny, extensible implementation of the CommonJS [Asynchronous Module Definition (AMD)][spec]
specification.  The core implementation, `define.js`, comes to 808 bytes
when compressed using [Closure Compiler][] with advanced optimizations
and [UglifyJS][].  Integration points in module definition and loading
allow for any kind of custom behavior to be added.

[spec]: http://github.com/amdjs/amdjs-api/wiki/AMD
[Closure Compiler]: https://developers.google.com/closure/compiler/
[UglifyJS]: https://github.com/mishoo/UglifyJS

Why another AMD implementation?
--------------------------------

There are a quite a few implementations out there already:

* [RequireJS](http://requirejs.org/)
* [almond](https://github.com/jrburke/almond)
* [curl.js](http://github.com/unscriptable/curl)
* [bdLoad](http://bdframework.org/bdLoad)
* [JSLocalnet](http://www.localnet.org.es/)
* [Yabble](http://github.com/jbrantly/yabble)
* [PINF](http://github.com/pinf/loader-js)
* [Nodules](https://github.com/kriszyp/nodules)

The implementations that I have seen tend to be monolithic, including
all the features that you might want in one package.  What I wanted was
a micro-library.

tAMD is very small and makes few assumptions about your use case.  The
core implementation, `define.js`, includes the features that the AMD
specification says must be included and very little else.  All other
features are provided as addons.  Some of those are provided in this
repository to get you started.  You are invited to create your own
addons to suit your needs.  tAMD is intended to be easy to read and
easily hackable.

Building
---------

tAMD is made up of several files that provide required and optional
functionality.  A ready-made combined file that includes all optional
functionality is available at [dist/tAMD.min.js][minified]

[minified]: https://raw.github.com/jivesoftware/tAMD/master/dist/tAMD.min.js

It is recommended that you build your own custom file to get a smaller
size.  There is a grunt task provided for this purpose.  To use it you
will have to clone this repository and [install grunt][].  You will also
need to have [Java][] installed to run Closure Compiler.

[install grunt]: https://github.com/gruntjs/grunt/tree/0.3-stable#installing-grunt
[Java]: http://www.java.com/en/download/index.jsp

In the project directory run `grunt compile --components='...'` with
a space-separated list of the components that you want to include in
your custom build.  The components that are available are:

* define : this is the only component that is required
* hooks : depends on define
* resolve : depends on hooks
* loader : depends on hooks
  used
* debug : depends on hooks

The functionality provided by each component is described in detail
below.

If you want the smallest possible build with no extra features, use this
command:

    grunt compile --components='define'

A more typical build might look like this:

    grunt compile --components='define hooks resolve loader'

Minified builds will be output in dist/tAMD.min.js.

If your project has its own resource combining system you can just take
the individual files that you want.  But the included grunt command has
the advantages that it will perform aggressive minification using
Closure Compiler's advanced optimizations and will make sure that your
components are combined in the correct order with the correct
dependencies.

Included modules
------------------

### `define.js` - `tAMD`

This is the core of tAMD and is the only required component.  It does
not implement module loading, resolution of relative paths, multiple
module versions, or any of that fancy stuff.  Look for these features in
the other modules below.

`define.js` places two functions into the global namespace, `define()`
and `require()`.  The first, `define()`, behaves exactly as is specified
in the [AMD specification][spec].  `require()` is similar in that it
lets you load dependencies asynchronously; but it does not define
a module.  `require()` has the same API as `define()`, but it does not
take a module name argument.  For example:

    require(['jquery'], function($) {
        setInterval(function() {
            $('.blink').css('visibility', 'hidden');
        }, 500);
        setTimeout(function() {
            setInterval(function() {
                $('.blink').css('visibility', 'visible');
            }, 500);
        }, 500);
    });

There is also a synchronous version of `require()` available that
matches the behavior of `require()` in traditional CommonJS modules.  To
get the synchronous version grab it as a dependency in a module or in an
async `require()` callback:

    // The outer require() is asynchronous.
    require(['require'], function(require) {
        var $ = require('jquery');  // This is synchronous!
        $('body').append('<p>greetings</p>');
    });

If you have a project where all of your JavaScript assets are loaded
together and you want the organizational powers of AMD modules in the
smallest package possible, then `define.js` by itself may be ideal for
you.  Just include `define.js` before any calls to the `define()`
function.

### `hooks.js` - `tAMD/hooks`

This addon provides friendly integration points into tAMD.  You can
register callbacks to be invoked when a module is declared or before
a module is published and made available to other modules.  Your
callbacks can modify properties of a module before it is created, cancel
creation of a module, or perform some side-effect like logging or
dependency loading.

There are three lifecycle events that you can register callbacks for:

* define : `hooks.on('define', [moduleName], function(id, dependencies, factory){})`
* publish : `hooks.on('publish', [moduleName], function(id, moduleValue){})`
* require : `hooks.on('require', [moduleName], function(id, contextId){})`

Use the "define" hook to run a callback as soon as a module is declared
via a call to `define()` before its dependencies are resolved or its
factory is invoked:

    require(['tAMD/hooks'], function(hooks) {
        hooks.on('define', 'someOldModule', function(id, dependencies, factory) {
            revisedDeps = dependencies.map(function(dep) {
                return dep === 'jquery' ? 'jquery-1.4' : dep;
            });
            return [id, revisedDependencies, factory];
        });
    });

The above example intercepts the definition of a module called
"someOldModule" and replaces its dependency on jQuery with an older
jQuery version.  By modifying the array that is returned you could also
change the name of the module or replace or wrap its factory.

You can return `false` from a "define" hook to cancel the module.  In
that case the module's dependencies are not resolved and its factory is
never invoked.

If you do not return a value from a "define" hook then the module is
created normally.  You can use this feature for whatever kind of
side-effects you might want.  For example, `loader.js` initiates lazy
dependency loading via a "define" hook.

The "publish" hook is similar; except that its callbacks are invoked
after the module's factory is executed.  In a "publish" hook you can
change the name of a module, tweak or replace the value that the module
exports, or return `false` to prevent the module from becoming available
as a dependency to other modules.  For example:

    require(['tAMD/hooks'], function(hooks) {
        hooks.on('publish', 'jquery', function(id, moduleValue) {
            var version = moduleValue.fn.jquery;  // moduleValue === jQuery in this case
            return ['jquery-'+ version, moduleValue];
        });
    });

This example changes the name of any jQuery modules to include a version
number as part of the module name.

The "require" hook is invoked during dependency lookups.  Whenever
`define()` or either the sync or async versions of `require()` are
invoked with dependencies, each dependency name is run through any
"require" hooks before the dependency is actually looked up.

Two arguments are given to "require" callbacks: the name of the module
that was requested and the name of the module that did the requesting.
If a dependency is referenced by async `require()` or by a `define()`
call with no module name then the second argument will be `undefined`.
Here is a quick and dirty example of how to use a "require" hook to
resolve relative module paths:

    require(['tAMD/hooks'], function(hooks) {
        hooks.on('require', function(id, contextId) {
            var contextParts = contextId ? contextId.split('/') : [];
            var idParts = id.split('/');
            var dir, module, resolved;

            if (idParts[0] === '.') {
                dir = contextParts.slice(0,-1);
                module = idParts.slice(1);
                resolved = dir.concat(module);
            } else {
                resolved = idParts;
            }

            return [resolved.join('/'), contextId];
        });
    });

With this code in place, you could express express module dependencies
like this:

    define('tAMD/myAddon', ['./hooks'], function(hooks) {
        /* ... */
    });

In which case the arguments given to the "require" hook callback would
be `"./hooks"` and `"tAMD/myAddon"`.

This is just an example.  There is a better implementation of relative
path resolution in `resolve.js`.

In the example above there was no module name argument given to the
"require" hook.  The hook can be given a module name, which will cause
it to act only on that module, as with "define" and "publish".  But with
all three hook types if you exclude the module name argument then the
hook will act on *all* modules.

You cannot cancel a "require" event.  However, if you have multiple
"require" hooks registered, returning `false` from one will prevent
later callbacks from running.  The behavior is sort of like
`event.stopImmediatePropagation()` in DOM event handlers.

### `resolve.js` - `tAMD/resolve`

When this addon is included dependencies that are given as relative
paths are automatically resolved.  Relative paths will probably not work
as you expect unless you include this addon or one like it.

This addon includes a module called `tAMD/resolve`, which exports
a function that takes a module id, which may or may not be a relative
path, and a context and returns the resolved module name.

### `loader.js` - `tAMD/loader`

This addon allows you to specify mappings between module names and URLs.
When a module name is referenced as a dependency if it is not already
loaded the corresponding URLs will automatically download and execute.

Mappings are created using the `map()` function in the `loader` module:

    require(['tAMD/loader'], function(loader) {
        loader.map(
            ['jquery'],
            ['https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js']
        );
    });

The first argument to `map()` is a list of module ids, and the second is
a list of URLs.  If any of the given module ids is referenced as
a dependency then the given URLs will be loaded in order.

Note that the synchronous version of `require()` does not trigger lazy
loading.  loader.js only works on asynchronous dependencies.

If you are using `resolve.js` make sure to include it before `loader.js`
so that relative paths are resolved before `loader.js` tries to look
them up.

With `loader.js` you have to specify a URL mapping for every module.
This addon is most useful when combined with a server-side script
combining task that outputs URL mappings automatically; or when you only
have a few lazily loaded modules.

### `debug.js` - `tAMD/debug`

This addon outputs various warnings and error messages to the console
that can be helpful during development.  For example, a module may
depend on another module that is supposed to be lazily loaded by
`loader.js`; but for some reason the second module never loads.  With
`debug.js` running you will see a console warning after 2 seconds in
this scenario.  Without `debug.js` The first module would silently wait
forever.

As an independent addon, `debug.js` can be loaded in development for
diagnostics and can be left out in production to save space.  Or you can
include it all the time.  Whatever you want to do.

License
--------

Copyright 2012-2013 Jive Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
