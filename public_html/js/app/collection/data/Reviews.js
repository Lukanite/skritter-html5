/**
 * @module Skritter
 * @submodule Collections
 * @param Review
 * @author Joshua McFarland
 */
define([
    'model/data/Review'
], function(Review) {
    /**
     * @class DataReviews
     */
    var Reviews = Backbone.Collection.extend({
        /**
         * @method initialize
         */
        initialize: function() {
        },
        /**
         * @property {Backbone.Model} model
         */
        model: Review,
        /**
         * @method comparator
         * @param {Backbone.Model} review
         * @returns {Number}
         */
        comparator: function(review) {
            return -review.attributes.reviews[0].submitTime;
        },
        /**
         * @method getReviews
         * @returns {Array}
         */
        getReviewArray: function() {
            var reviews = [];
            for (var i = 1, length = this.length; i < length; i++)
                reviews = reviews.concat(this.at(i).get('reviews'));
            return reviews;
        },
        /**
         * @method loadAll
         * @param {Function} callback
         */
        loadAll: function(callback) {
            skritter.storage.getAll('reviews', _.bind(function(reviews) {
                this.add(reviews, {merge: true, silent: true});
                callback();
            }, this));
        }
    });

    return Reviews;
});