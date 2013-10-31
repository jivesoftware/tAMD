tAMD [![Build Status](https://travis-ci.org/jivesoftware/tAMD.png?branch=v1.0)](https://travis-ci.org/jivesoftware/tAMD)
=====

Tiny, extensible implementation of the CommonJS [Asynchronous Module Definition (AMD)][spec]
specification.  The core implementation, `define.js`, comes to 812 bytes
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
features are provided as addon components.  Some of those are provided
in this repository to get you started.  Because of this tAMD can be
customized to suit just about any requirements while remaining as small
as possible.  You are invited to create your own components to suit your
needs.  tAMD is intended to be easy to read and easily hackable.

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

| component          | description
| ------------------ | -------------------------------------------------------
| [define][]         | minimal core
| [hooks][]          | provides extensibility via lifecycle callbacks
| [normalize][]      | automatically resolves relative module names
| [plugins][]        | supports plugins with the `pluginname!resource` syntax
| [loader][]         | downloads modules on demand, requires configuration
| [debug][]          | reports potential problems, such as missing modules
| [jquery][]         | jQuery compatibility with versioning support
| [jquery-minimal][] | jQuery compatibility without versioning support

The functionality provided by each component is described in detail
below.

[define]: #definejs---tamd
[hooks]: #hooksjs---tamdhooks
[normalize]: #normalizejs---tamdnormalize
[plugins]: #pluginsjs---tamdplugins
[loader]: #loaderjs---tamdloader
[debug]: #debugjs---tamddebug
[jquery]: #jqueryjs---tamdjquery
[jquery-minimal]: #jquery-minimaljs

If you want the smallest possible build with no extra features, use this
command:

    grunt compile --components='define'

A more typical build might look like this:

    grunt compile --components='define normalize plugins loader'

Minified builds will be output in dist/tAMD.min.js.

To make minification as effective as possible the source for `define.js`
defines global variables.  These are wrapped in a private scope as part
of the compilation process.  You can just grab files for the modules
that you want and combine them with your own system - but if you do so
you will get variable leakage.

The included grunt command has the additional advantages that it will
perform aggressive minification using Closure Compiler's advanced
optimizations and will make sure that your components are combined in
the correct order with the correct dependencies (many of the included
components have interdependencies).

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
a module.  `require()` has the same API as `define()`, but it should not
be given a module name argument.  For example:

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

The hooks component provides friendly integration points into tAMD.  You
can register callbacks to be invoked when a module is declared or before
a module is published and made available to other modules.  Your
callbacks can modify properties of a module before it is created, cancel
creation of a module, or perform some side-effect like logging or
dependency loading.

See [Customizing][] for details.

[Customizing]: #customizing

### `normalize.js` - `tAMD/normalize`

When this component is included dependencies that are given as relative
paths are automatically normalized.  Relative paths will probably not work
as you expect unless you include this component or one like it.

For example, if you have a module called `myFeature/view` and another
called `myFeature/model`, since both modules have the same  `myFeature/`
prefix, you can include one from the other with a relative reference:

    define('myFeature/view', ['./model'], function(Model) {/* ... */});

This component includes a module called `tAMD/normalize`, which exports
a function that takes a module id, which may or may not be a relative
path, and a context and returns the normalized module name.

### `plugins.js` - `tAMD/plugins`

The plugins component adds support for AMD plugins.  These allow an AMD
implementation to load resources other than JavaScript, or to load
JavaScript resources that are not written as AMD modules.

A module name that is handled by a plugin has the format
`pluginname!resource` where resource can be any string - the plugin
determines how the resource is looked up.  When this component
encounters a dependency name with that format, it requires a regular
module the same name as the plugin and hands of responsibility for
loading the special module.

One use for plugins is to download text resources that should not be
executed.  You might use this to download templates.  First define
a `text` plugin:

    define('text', ['jquery'], function($) {
        return {
            load: function(resource, require, done) {
                $.get(resource).success(done);
            }
        };
    });

The plugins component looks for the `load` function exported from the
plugin definition and calls it to load text modules.  Here is how this
plugin could be used:

    require(['text!/templates/hello.txt'], function(hello) {
        alert(hello);
    });

Plugins might also be used to load stylesheets, compile CoffeeScript, or
anything else that you can dream up.

For more details, see the [AMD plugin specification][].

[AMD plugin specification]: https://github.com/amdjs/amdjs-api/wiki/Loader-Plugins

Note that this implementation does not currently support the 'dynamic'
property on plugins or a `config` argument to the plugin `load`
function.

### `loader.js` - `tAMD/loader`

This component allows you to specify mappings between module names and
URLs.  When a module name is referenced as a dependency, if it is not
already loaded, then corresponding URLs will automatically download and
execute.

Mappings are created using the `map()` function in the `loader` module:

    require(['tAMD/loader'], function(loader) {
        loader.map(
            ['jquery'],
            ['https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js']
        );
    });

The first argument to `map()` is a list of module ids, and the second is
a list of URLs.  If any of the given module ids is referenced as
a dependency then the given URLs will be loaded in order.  If two
different dependencies match up with two different URL lists then those
lists will download in parallel.

Note that the synchronous version of `require()` does not trigger lazy
loading.  loader.js only works on asynchronous dependencies.

If you are using `normalize.js` make sure to include it before `loader.js`
so that relative paths are normalized before `loader.js` tries to look
them up.  If you use the provided compiler it will make sure that the
component ordering is correct.

With `loader.js` you have to specify a URL mapping for every module.
This component is most useful when combined with a server-side script
combining task that outputs URL mappings automatically; or when you only
have a few lazily loaded modules.

### `debug.js` - `tAMD/debug`

This component outputs various warnings and error messages to the console
that can be helpful during development.  For example, a module may
depend on another module that is supposed to be lazily loaded by
`loader.js`; but for some reason the second module never loads.  With
`debug.js` running you will see a console warning after 2 seconds in
this scenario.  Without `debug.js` The first module would silently wait
forever.

Debug checks to make sure that `console` is defined before outputting
messages - so it should not produce errors in browsers that do not
implement `console.log` and related functions.  To see messages you will
have to use a browser that implements `console.warn` and
`console.error`.

As an independent component, `debug.js` can be loaded in development for
diagnostics and can be left out in production to save space.  It can be
included as a separate file and does not have to be compiled.  But to
use debug you do have to have the [hooks][] component compiled into your
tAMD build.

### `jquery.js` - `tAMD/jquery`

jQuery can be loaded as an AMD module.  But only if the AMD
implementation has a truthy property, `define.amd.jQuery`.  This
component sets that property and also supports loading multiple jQuery
versions on the same page.

Whenever a copy of jQuery is loaded, this component publishes multiple
AMD modules with different degrees of version information.  For example
after loading jQuery 1.10.1, these module names are defined, all of
which point to that copy of jQuery:

* `jquery`
* `jquery-1`
* `jquery-1.10`
* `jquery-1.10.1`

If you then load jQuery 1.10.2 then `jquery`, `jquery-1`, and
`jquery-1.10` will be redefined to point to the newer jQuery version,
and you will get a new module id, `jquery-1.10.2`.

This component will call `jQuery.noConflict(true)` when a jQuery is
loaded that is older than one that is already present.  That means that
the global variables `jQuery` and `$` will always point to the latest
jQuery version that has been loaded.

### `jquery-minimal.js`

This is a one-line component that sets `define.amd.jQuery` to `true` so
that jQuery can be loaded as an AMD module.  Use this component if you
only need one jQuery version on a page.

Customizing
-----------

The hooks component provides friendly integration points into tAMD.  You
can register callbacks to be invoked when a module is declared or before
a module is published and made available to other modules.  Your
callbacks can modify properties of a module before it is created, cancel
creation of a module, or perform some side-effect like logging or
dependency loading.

There are three lifecycle events that you can register callbacks for:

* define : `hooks.on('define', [moduleName], function(id, dependencies, factory, next){})`
* publish : `hooks.on('publish', [moduleName], function(id, moduleValue, next){})`
* require : `hooks.on('require', [moduleName], function(id, contextId, next){})`

Use the "define" hook to run a callback as soon as a module is declared
via a call to `define()` before its dependencies are resolved or its
factory is invoked:

    require(['tAMD/hooks'], function(hooks) {
        hooks.on('define', 'someOldModule', function(id, dependencies, factory, next) {
            revisedDeps = dependencies.map(function(dep) {
                return dep === 'jquery' ? 'jquery-1.4' : dep;
            });
            next(id, revisedDependencies, factory);
        });
    });

The above example intercepts the definition of a module called
"someOldModule" and replaces its dependency on jQuery with an older
jQuery version.  The dependencies array is an array of module names.  By
modifying the arguments given to `next` you could also change the name
of the module or replace or wrap its factory.

`factory` refers to the function or object that contains the definition
for a module - the last argument to `define()`.

The last argument to a callback will always be a function that is called
to signal that the callback is complete.  In this way lifecycle
callbacks can operate asynchronously.  If that function is never called
then the define, publish, or require operation will never complete.

In a "define" hook, if you choose not to invoke `next` the module
definition will effectively be cancelled.  In that case the module's
dependencies are not resolved and its factory is never invoked.

The "publish" hook is similar; except that its callbacks are invoked
after the module's factory is executed.  In a "publish" hook you can
change the name of a module, tweak or replace the API that the module
exports, or prevent the module from becoming available as a dependency
to other modules by not invoking `next`.  For example:

    require(['tAMD/hooks'], function(hooks) {
        hooks.on('publish', 'jquery', function(id, moduleValue, next) {
            var version = moduleValue.fn.jquery;  // moduleValue === jQuery in this case
            next('jquery-'+ version, moduleValue);
        });
    });

This example changes the name of any jQuery modules to include a version
number as part of the module name.

The "require" hook is invoked during dependency lookups.  Whenever
`define()` or either the sync or async versions of `require()` are
invoked with dependencies, each dependency name is run through any
"require" hooks before the dependency is actually given.

Two arguments are given to "require" callbacks: the name of the module
that is required and the name of the module where the require event
originated.  If a dependency is referenced by async `require()` or by
a `define()` call with no module name then the second argument will be
`undefined`.  Here is a quick and dirty example of how to use
a "require" hook to normalize relative module paths:

    require(['tAMD/hooks'], function(hooks) {
        hooks.on('require', function(id, contextId, next) {
            var contextParts = contextId ? contextId.split('/') : [];
            var idParts = id.split('/');
            var dir, module, normalized;

            if (idParts[0] === '.') {
                dir = contextParts.slice(0,-1);
                module = idParts.slice(1);
                normalized = dir.concat(module);
            } else {
                normalized = idParts;
            }

            next(normalized.join('/'), contextId);
        });
    });

With this code in place, you could express express module dependencies
like this:

    define('tAMD/myComponent', ['./hooks'], function(hooks) {
        /* ... */
    });

In which case the arguments given to the "require" hook callback would
be `"./hooks"` and `"tAMD/myComponent"`.

This is just an example.  There is a better implementation of relative
path resolution in the [normalize][] component.

In the example above there was no module name argument given to the
"require" hook.  The hook can be given a module name, which will cause
it to act only on that module, as with "define" and "publish".  But with
all three hook types if you exclude the module name argument then the
hook will act on *all* modules.

As with "define" and "publish", you can cancel "require" events by not
invoking `next`.  If a "require" event is triggered by a dependency list
in a `define()` call then the corresponding "define" event will also be
cancelled.


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
