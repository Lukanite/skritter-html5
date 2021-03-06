/**
 * @module Skritter
 * @submodule Models
 * @author Joshua McFarland
 */
define(function() {
    /**
     * @class DataParam
     */
    var Param = Backbone.Model.extend({
        /**
         * @method angle
         * @returns {Number}
         */
        getAngle: function() {
            return skritter.fn.angle(this.get('corners'));
        },
        /**
         * @method getCornerLength
         * @returns {Number}
         */
        getCornerLength: function() {
            var cornersLength = 0;
            var corners = this.get('corners');
            for (var i = 0, length = corners.length - 1; i < length; i++)
                cornersLength += skritter.fn.distance(corners[i], corners[i + 1]);
            return cornersLength;
        },
        /**
         * @method getRectangle
         * @returns {Object}
         */
        getRectangle: function() {
            var size = skritter.settings.contentWidth();
            return skritter.fn.boundingRectangle(_.clone(this.get('corners')), size, size, 14);
        },
        /**
         * @method getStartingAngle
         * @returns {Number}
         */
        getStartingAngle: function() {
            var corners = [];
            corners.push(this.get('corners')[0]);
            corners.push(this.get('corners')[1]);
            return skritter.fn.angle(corners);
        }
    });

    return Param;
});