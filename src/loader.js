/**
 * Tiny, modular implementation of the CommonJS
 * Modules/AsynchronousDefinition as described in
 * http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition
 *
 * This extension provides lazy loading for AMD modules.  The
 * loader.map() function is used to map module names to script URLs.
 * When a module is required it is automatically downloaded from the
 * given URL(s).
 *
 * Example usage:
 *
 *     require(['myModule'], function(myModule) {
 *         // ...
 *     });
 *
 *     require(['tAMD/loader'], function(loader) {
 *         loader.map(['myModule'], ['/scripts/myModule.js']);
 *     });
 *
 * Copyright 2012-2013 Jive Software
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*global define */
/*jshint boss:true expr:true */

define('tAMD/loader', ['tAMD/hooks', 'require'], function(hooks, require) {
    var mappings = {}
      , callbacks = {}
      , loaded = {}
      , requested = {};

    function map(ids, urls, callback) {
        var id, i;
        for (i = 0; i < ids.length; i++) {
            id = ids[i];
            mappings[id] = urls;
            callbacks[id] = callback;
            if (requested[id]) {
                maybeLoad(id);
            }
        }
    }

    hooks['on']('define', function(id, dependencies, factory, next) {
        for (var i = 0; i < dependencies.length; i++) {
            maybeLoad(dependencies[i]);
        }
        next(id, dependencies, factory);
    });

    function maybeLoad(id) {
        var urls;
        if (!require(id) && (urls = mappings[id])) {
            loadInOrder(urls, callbacks[id]);
            delete mappings[id];
            delete callbacks[id];
        } else {
            requested[id] = true;
        }
    }

    function loadInOrder(urls, callback) {
        if (urls[0]) {
            load(urls[0], function() {
                loadInOrder(urls.slice(1), callback);
            });
        } else if (callback) {
            callback();
        }
    }

    function noop() {}

    function load(src, callback) {
        var prevCallback = loaded[src];
        if (true === prevCallback) {
            callback && callback();
        } else if (callback) {
            loaded[src] = chain(prevCallback, callback);
        }

        if (prevCallback) {
            return;
        }

        var firstScript = document.getElementsByTagName('script')[0]
          , head = firstScript.parentNode
          , script = document.createElement('script');

        script.src = src;
        script.async = true;
        script.onreadystatechange = script.onload = function() {
            if (!script.readyState || /loaded|complete/.test(script.readyState)) {
                script.onload = script.onreadystatechange = noop;
                head.removeChild(script);

                (loaded[src] || noop)();
                loaded[src] = true;
            }
        };

        head.insertBefore(script, firstScript);
    }

    function chain(f, g) {
        return function() {
            f && f();
            g();
        };
    }

    return {
        'map': map
    };
});
