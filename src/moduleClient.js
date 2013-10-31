/**
 * Tiny, modular implementation of the CommonJS
 * Modules/AsynchronousDefinition as described in
 * http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition
 *
 * This extension provides lazy loading for AMD modules in cooperation
 * with a server-side endpoint that concatenates modules with
 * dependencies on-the-fly.
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

/*global define, require */

define('tAMD/moduleClient', ['tAMD/hooks', 'require'], function(hooks, requireSync) {
    var scheduled = {}
      , loaded    = {}
      , timeout   = 0
      , baseUrl   = '/js'
      , buildUrl = defaultUrl;

    hooks['on']('config', function(key, value, next) {
        switch (key) {
            case 'timeout':
                timeout = value; break;
            case 'baseUrl':
                baseUrl = value.replace(/\/$/, ''); break;
            case 'buildUrl':
                buildUrl = value; break;
            case 'exclude':
                for (var i = 0; i < value.length; i++) {
                    loaded[value[i]] = true;
                }
                break;
        }
        next(key, value);
    });

    hooks['on']('define', function(id, dependencies, factory, next) {
        for (var i = 0; i < dependencies.length; i++) {
            if (!requireSync(dependencies[i])) {
                schedule(dependencies[i]);
            }
        }
        next(id, dependencies, factory);
    });

    function schedule(id) {
        scheduled[id] = true;
        require([id], function() {
            delete scheduled[id];
        });
        setTimeout(execute, timeout);
    }

    function execute() {
        var include = []
          , exclude = []
          , k
          , url;
        for (k in loaded) {
            exclude.push(k);
        }
        for (k in scheduled) {
            include.push(k);
            loaded[k] = true;
        }
        if (include.length) {
            scheduled = {};
            url = buildUrl(include.sort(), exclude.sort());
            load(url[k]);
        }
    }

    function load(src) {
        var firstScript = document.getElementsByTagName('script')[0]
          , head = firstScript.parentNode
          , script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onreadystatechange = script.onload = function() {
            if (!script.readyState || /loaded|complete/.test(script.readyState)) {
                script.onload = script.onreadystatechange = noop;
                head.removeChild(script);
            }
        };
        head.insertBefore(script, firstScript);
    }

    function defaultUrl(include, exclude) {
        var incList = encodeURIComponent(include.join(','))
          , excList = encodeURIComponent(exclude.join(','));
        return baseUrl +'/'+ incList + (excList ? '/'+excList : '') + '.js';
    }

    function noop() {}
});
