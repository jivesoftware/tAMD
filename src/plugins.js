/**
 * Tiny, modular implementation of the CommonJS
 * Modules/AsynchronousDefinition as described in
 * http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition
 *
 * This extension adds support for loader plugins using ! notation.
 * Loader plugins are specified in:
 * https://github.com/amdjs/amdjs-api/wiki/Loader-Plugins
 *
 * Note that this implementation does not currently support the
 * 'dynamic' property on plugins or the the `config` argument to the
 * plugin `load()` method.
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

/*global define require */

define('tAMD/plugins', ['tAMD/hooks', 'tAMD/normalize'], function(hooks, normalize) {
    var started = {}
      , exp = /^(.*?)!(.*)/;

    hooks['on']('require', function(id, contextId, next) {
        //// TODO: is this shorter?
        //var parts    = id ? id.split('!') : []
        //  , plugin   = parts.shift()
        //  , resource = parts.join('!');

        var matches = exp.exec(id), plugin, resource;

        if (!matches) {
            next(id, contextId);
        }
        else {
            plugin   = normalize(matches[1], contextId);  // TODO: this normalize call is redundant
            resource = matches[2];

            require([plugin], function(p) {
                var normResource;
                if (p.normalize) {
                    normResource = p.normalize(resource, function(r) {
                        return normalize(r, contextId);
                    });
                }
                else {
                    normResource = normalize(resource, contextId);
                }

                var normDep = plugin +'!'+ normResource;

                if (!started[normDep]) {
                    started[normDep] = true;
                    p.load(normResource, require, function(value) {
                        define(normDep, function() { return value; });
                    });
                }

                next(normDep, contextId);
            });
        }
    });
});
