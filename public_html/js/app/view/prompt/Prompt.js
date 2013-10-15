/**
 * @module Skritter
 * @submobule Prompt
 * @author Joshua McFarland
 */
define([
    'prompt/GradingButtons',
    'backbone'
], function(GradingButtons) {
    /**
     * @class Prompt
     */
    var Prompt = Backbone.View.extend({
        initialize: function() {
            Prompt.buttons = new GradingButtons();
            Prompt.item = null;
            Prompt.finished = false;
            Prompt.grade = 3;
            Prompt.gradeColors = {
                1: '#e68e8e',
                2: '#d95757',
                3: '#70da70',
                4: '#4097d3'
            };
            Prompt.position = 1;
            Prompt.results = [];
            Prompt.vocabs = null;
        },
        set: function(item, vocabs) {
            Prompt.definition = vocabs[0].get('definitions')[Skritter.user.get('settings').sourceLang];
            Prompt.item = item;
            Prompt.reading = vocabs[0].get('reading');
            Prompt.sentence = (vocabs[0].getSentence()) ? vocabs[0].getSentence().get('writing') : null;
            Prompt.vocabs = vocabs;
            Prompt.writing = vocabs[0].get('writing');
            return this;
        },
        resize: function() {
            this.$('#canvas-container').width(Skritter.settings.get('canvasSize'));
            this.$('#canvas-container').height(Skritter.settings.get('canvasSize'));
        },
        showGrading: function(selected) {
            Prompt.buttons = new GradingButtons();
            Prompt.buttons.setElement(this.$('#canvas-container')).render();
            if (selected)
                Prompt.buttons.select(selected);
            this.listenToOnce(Prompt.buttons, 'selected', this.handleGradeSelected);
        },
        triggerPromptComplete: function() {
            console.log('prompt complete');
            this.trigger('complete', Prompt.results);
        }
    });
    
    
    return Prompt;
});