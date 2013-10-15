/**
 * @module Skritter
 * @submodule Prompt
 * @param PinyinConverter
 * @param Recognizer
 * @param CanvasCharacter
 * @param CanvasStroke
 * @param GradingButtons
 * @param Canvas
 * @param templateRune
 * @author Joshua McFarland
 */
define([
    'PinyinConverter',
    'Recognizer',
    'collection/CanvasCharacter',
    'model/CanvasStroke',
    'prompt/Prompt',
    'prompt/PromptCanvas',
    'require.text!template/prompt-rune.html',
    'backbone',
    'jquery.hammer'
], function(PinyinConverter, Recognizer, CanvasCharacter, CanvasStroke, Prompt, Canvas, templateRune) {
    /**
     * @class PromptRune
     */
    var Rune = Prompt.extend({
        initialize: function() {
            Prompt.prototype.initialize.call(this);
            Skritter.timer.setReviewLimit(30000);
            Skritter.timer.setThinkingLimit(15000);
            Rune.canvas = new Canvas();
            Rune.failedAttempts = 0;
            Rune.maxFailedAttempts = 3;
            Rune.minStrokeDistance = 25;
            Rune.userCharacter = null;
            Rune.userTargets = [];
            this.listenTo(Rune.canvas, 'mouseup', this.handleInputRecieved);
        },
        /**
         * @method render
         * @returns {PromptRune}
         */
        render: function() {
            this.$el.html(templateRune);
            Rune.canvas.setElement(this.$('#canvas-container')).render();
            this.$('#prompt-canvas').hammer().on('doubletap.Rune', this.handleDoubleTap);
            this.$('#prompt-canvas').hammer().on('hold.Rune', _.bind(this.handleHold, this));
            this.$('#prompt-canvas').hammer().on('swipeleft.Rune', _.bind(this.handleSwipeLeft, this));
            return this;
        },
        /**
         * @method clear
         */
        clear: function() {
            Prompt.buttons.remove();
            Rune.canvas.clear();
            Rune.userCharacter = new CanvasCharacter();
        },
        /**
         * @method handleInputRecieved
         * @param {Array} points
         */
        handleInputRecieved: function(points) {
            //check to see if the input recieved points
            if (points.length === 0)
                return;
            //check that a minimum distance is met
            if (Skritter.fn.getDistance(points[0], points[points.length - 1]) > Rune.minStrokeDistance) {
                //fade any hints that were previously visible
                Rune.canvas.fadeOverlay();
                //create the stroke from the points to analyze
                var stroke = new CanvasStroke().set('points', points);
                //recognize a stroke based on user input and targets
                var result = new Recognizer(Rune.userCharacter, stroke, Rune.userTargets).recognize();
                //check if a result exists and that it's not a duplicate
                if (result && !Rune.userCharacter.containsStroke(result)) {
                    //reset the failed attempts counter
                    Rune.failedAttempts = 0;
                    //add the stroke to the users character
                    Rune.userCharacter.add(result);
                    //choose whether to draw the stroke normally or using raw squigs
                    if (Skritter.user.get('settings').squigs) {
                        Rune.canvas.drawSquig(result);
                        this.handleStrokeComplete();
                    } else {
                        Rune.canvas.drawStroke(result, _.bind(this.handleStrokeComplete, this));
                    }
                } else {
                    Rune.failedAttempts++;
                    //if failed too many times show a hint
                    if (Rune.failedAttempts > Rune.maxFailedAttempts) {
                        console.log('hinting');
                        Prompt.grade = 1;
                        Rune.canvas.drawPhantomStroke(this.getNextStroke());
                    }
                }
            }
        },
        handleCharacterComplete: function() {
            Prompt.finished = true;
            this.showAnswer();
            //checks if we should snap or just glow the result
            if (Skritter.user.get('settings').squigs) {
                for (var i in Rune.userCharacter.models)
                {
                    var stroke = Rune.userCharacter.models[i];
                    Rune.canvas.drawStroke(stroke);
                }
                Rune.canvas.glowCharacter(Rune.userTargets[0], Prompt.gradeColors[Prompt.grade]);
            } else {
                Rune.canvas.glowCharacter(Rune.userTargets[0], Prompt.gradeColors[Prompt.grade]);
            }
            //show the grading buttons and listen for a selection
            this.showGrading(Prompt.grade);
        },
        handleDoubleTap: function() {
            if (!Prompt.finished) {
                Rune.canvas.drawCharacter(Rune.userTargets[0], 0.3);
                Prompt.grade = 1;
            }
        },
        handleGradeSelected: function(selected) {
            Prompt.grade = selected;
            Prompt.buttons.remove();
            this.next();
        },
        handleHold: function() {
            this.clear();
            Rune.canvas.enableInput();
        },
        handleStrokeComplete: function() {
            //check if the character has been completed yet or not
            if (Rune.userCharacter.getStrokeCount() > this.getTargetStrokeCount()) {
                this.handleCharacterComplete();
            }
        },
        handleSwipeLeft: function() {
            if (Prompt.finished) {
                Prompt.buttons.remove();
                this.next();
            }
        },
        getNextStroke: function() {
            //todo: make this handle strokes with alternatives
            //right now it's just using the first target
            var target = Rune.userTargets[0];
            var stroke = target.at(Rune.userCharacter.length);
            return stroke;
        },
        getTargetStrokeCount: function() {
            var strokeCount = 0;
            for (var a in Rune.userTargets)
            {
                if (Rune.userTargets[a].getStrokeCount() > strokeCount) {
                    strokeCount = Rune.userTargets[a].getStrokeCount();
                }
            }
            return strokeCount - 1;
        },
        next: function() {
            console.log('next', Prompt.position, Prompt.vocabs[0].getCharacterCount());
            Prompt.position++;
            //check to see if there are more characters in the prompt
            if (Prompt.position <= Prompt.vocabs[0].getCharacterCount()) {
                Prompt.finished = false;
                //clear the canvas for the new character
                this.clear();
                //resets the targets
                Rune.userTargets = [];
                //lets go ahead and show the net character in the item
                this.showHidden();
                //enable the canvas to begin next prompt
                Rune.canvas.enableInput();
            } else {
                this.triggerPromptComplete();
            }
        },
        showAnswer: function() {
            Skritter.timer.stop();
            Rune.canvas.disableInput();
            this.$('#writing').html(Prompt.vocabs[0].getWritingDisplayAt(Prompt.position));
            console.log(Prompt.position, Prompt.vocabs[0].getCharacterCount());
            if (Prompt.position >= Prompt.vocabs[0].getCharacterCount())
                this.$('#sentence').text(Skritter.fn.maskCharacters(Prompt.sentence));
        },
        showHidden: function() {
            console.log('Prompt', 'RUNE', Prompt.vocabs[0].get('writing'));
            Skritter.timer.start();
            Rune.userCharacter = new CanvasCharacter();
            Rune.userTargets = Prompt.vocabs[0].getCanvasCharacters(Prompt.position - 1, 'rune');
            Rune.canvas.enableInput();
            this.$('#writing').html(Prompt.vocabs[0].getWritingDisplayAt(Prompt.position - 1));
            this.$('#reading').text(PinyinConverter.toTone(Prompt.reading));
            this.$('#definition').text(Prompt.definition);
            this.$('#sentence').text(Skritter.fn.maskCharacters(Prompt.sentence, Prompt.writing, ' _ '));
        }
    });


    return Rune;
});