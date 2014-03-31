/**
 * @module Skritter
 * @submodule Views
 * @param templateTests
 * @author Joshua McFarland
 */
define([
    'require.text!templates/tests.html'
], function(templateTests) {
    /**
     * @class Tests
     */
    var Tests = Backbone.View.extend({
        /**
         * @method initialize
         */
        initialize: function() {
        },
        /**
         * @method render
         * @returns {Backbone.View}
         */
        render: function() {
            this.$el.html(templateTests);
            require(['jasmine-boot'], function() {
                require([
                    'specs/models/data/Item',
                    'specs/models/data/Vocab',
                    'specs/Functions',
                    'specs/functions/Shortstraw',
                    'specs/functions/SimpTradMap'
                ], function() {
                    window.runJasmine();
                });
            });
            return this;
        }
    });
    
    return Tests;
});