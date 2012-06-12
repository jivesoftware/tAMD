/*globals jQuery $ QUnit */
/*jshint laxcomma:true */

function reinitialize() {
    var sources = $('script.reinitialize').map(function() { return this.src; }).toArray()
      , deferred = $.Deferred();

    function runScript() {
        if (sources.length > 0) {
            $.getScript(sources.shift()).then(function() {
                runScript();
            }, function() {
                deferred.rejectWith.apply(deferred, arguments);
            });
        } else {
            deferred.resolve();
        }
    }
    runScript();

    return deferred.promise();
}


/** Default 1 second timeout for async tests **/
QUnit.config.testTimeout = 3000;
