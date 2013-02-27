/**
 * Tiny, modular implementation of the CommonJS
 * Modules/AsynchronousDefinition as described in
 * http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition
 *
 * This extension supports loading multiple jQuery versions
 * simultaneously.
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

define('tAMD/jquery', ['tAMD/hooks'], function(hooks) {
    var versions = { latest: -1 };

    hooks['on']('publish', 'jquery', function(id, jQuery, next) {
        var version = jQuery['fn']['jquery']
          , parts   = version.split('.')
          , ver     = []
          , factory = function() { return jQuery; };

        var absoluteLatest = (function publish(versionMap) {
            var part = parseInt(parts.shift(), 10);

            ver.push(part);
            var v              = ver.join('.')
              , latestInBranch = !parts.length || publish(
                  versionMap[part] = versionMap[part] || { latest: -1 }
              )
              , isLatest = part >= versionMap.latest && latestInBranch;

            if (latestInBranch) {
                define(id +'-'+ v, factory);
            }

            if (isLatest) { versionMap.latest = part; }
            return isLatest;
        }(versions));

        if (absoluteLatest) {
            next(id, jQuery);
        }
        else {
            jQuery['noConflict'](true);
        }
    });

    // jQuery will not export itself as an AMD module unless this
    // property is set.
    define['amd']['jQuery'] = true;
});
