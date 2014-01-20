/**
 * @module Skritter
 * @param templateDefn
 * @param LeapController
 * @param Prompt
 * @author Joshua McFarland
 */
define([
    'require.text!templates/prompt-defn.html',
    'models/LeapController',
    'views/prompts/Prompt'
], function(templateDefn, LeapController, Prompt) {
    /**
     * @class PromptDefn
     */
    var Defn = Prompt.extend({
        /**
         * @method initialize
         */
        initialize: function() {
            Prompt.prototype.initialize.call(this);
            skritter.timer.setReviewLimit(30);
            skritter.timer.setThinkingLimit(15);
            Defn.leap = new LeapController();
        },
        /**
         * @method render
         * @returns {Backbone.View}
         */
        render: function() {
            this.$el.html(templateDefn);
            hammer(this.$('#prompt-text')[0]).on('tap', this.handleTap);
            Prompt.prototype.render.call(this);
            return this;
        },
        /**
         * @method handleTap
         */
        handleTap: function() {
            if (Prompt.dataItem.isFinished()) {
                Prompt.this.handleGradeSelected(Prompt.gradingButtons.grade());
            } else {
                skritter.timer.stopThinking();
                Prompt.dataItem.set('finished', true);
                Prompt.this.load();
            }
        },
        /**
         * @method load
         */
        load: function() {
            Prompt.prototype.load.call(this);
            Prompt.data.show.reading();
            Prompt.data.show.style();
            Prompt.data.show.tip("What's the definition?");
            Prompt.data.show.writing();
            if (Prompt.dataItem.isFinished()) {
                skritter.timer.stop();
                Prompt.data.hide.tip();
                Prompt.data.show.definition();
                Prompt.gradingButtons.show();
            } else {
                skritter.timer.start();
            }
        }
    });

    return Defn;
});