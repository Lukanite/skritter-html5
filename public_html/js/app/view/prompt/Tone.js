define([
    'require.text!template/prompt-tone.html',
    'view/prompt/Canvas',
    'view/prompt/Prompt'
], function(templateTone, Canvas, Prompt) {
    /**
     * @class Tone
     */
    var Tone = Prompt.extend({
        /**
         * @method initialize
         */
        initialize: function() {
            Prompt.prototype.initialize.call(this);
            this.canvas = null;
        },
        /**
         * @method render
         * @returns {Backbone.View}
         */
        render: function() {
            skritter.timer.setReviewLimit(15);
            skritter.timer.setThinkingLimit(10);
            this.$el.html(templateTone);
            Prompt.prototype.render.call(this);
            this.canvas = new Canvas();
            this.canvas.setElement(this.$('#writing-area')).render();
            this.listenTo(this.canvas, 'canvas:click', this.handleClick);
            this.listenTo(this.canvas, 'input:down', this.handleStrokeDown);
            this.listenTo(this.canvas, 'input:up', this.handleStrokeReceived);
            this.resize();
            if (this.review.isFinished()) {
                this.show().showAnswer();
            } else {
                skritter.timer.start();
                this.show();
            }
            return this;
        },
        /**
         * @property {Object} events
         */
        events: {
            'vclick .navigate-forward': 'next'
        },
        /**
         * @method clear
         * @returns {Backbone.View}
         */
        clear: function() {
            this.gradingButtons.hide();
            this.canvas.render();
            return this;
        },
        /**
         * @method handleClick
         * @param {Object} event
         */
        handleClick: function(event) {
            if (this.review.getReview().finished) {
                this.gradingButtons.triggerSelected();
            }
            event.preventDefault();
        },
        /**
         * @method handleStrokeDown
         * @returns {undefined}
         */
        handleStrokeDown: function() {
            this.hideNavigation();
            skritter.timer.stopThinking();
        },
        /**
         * @method handleStrokeReceived
         * @param {Array} points
         * @param {CreateJS.Shape} shape
         */
        handleStrokeReceived: function(points, shape) {
            var possibleTones = _.flatten(this.review.getBaseVocab().getTones(this.review.get('position')));
            if (points.length > 2) {
                var result = this.review.getCharacterAt().recognize(points, shape);
                if (result) {
                    if (possibleTones.indexOf(result.get('tone')) > -1) {
                        this.review.setReviewAt(null, 'score', 3);
                        window.setTimeout(_.bind(function() {
                            this.canvas.tweenShape('display', result.getUserShape(), result.inflateShape());
                        }, this), 0);
                    } else {
                        this.review.setReviewAt(null, 'score', 1);
                        this.review.getCharacterAt().reset();
                        this.review.getCharacterAt().add(this.review.getCharacterAt().targets[possibleTones[0] - 1].models);
                        this.canvas.drawShape('display', this.review.getCharacterAt().getShape());
                    }
                }
            } else {
                if (possibleTones.indexOf(5) > -1) {
                    this.review.setReviewAt(null, 'score', 3);
                    this.review.getCharacterAt().add(this.review.getCharacterAt().targets[4].models);
                    this.canvas.drawShape('display', this.review.getCharacterAt().getShape());
                } else {
                    this.review.setReviewAt(null, 'score', 1);
                    this.review.getCharacterAt().add(this.review.getCharacterAt().targets[possibleTones[0] - 1].models);
                    this.canvas.drawShape('display', this.review.getCharacterAt().getShape());
                }
            }
            if (this.review.getCharacterAt().isFinished()) {
                this.showAnswer();
            } else {
                this.canvas.enableInput();
            }
        },
        /**
         * @method remove
         */
        remove: function() {
            this.canvas.remove();
            this.$('#writing-area').off();
            Prompt.prototype.remove.call(this);
        },
        /**
         * @method resize
         */
        resize: function() {
            Prompt.prototype.resize.call(this);
            var canvasSize = skritter.settings.canvasSize();
            var contentHeight = skritter.settings.contentHeight();
            var contentWidth = skritter.settings.contentWidth();
            this.canvas.resize(canvasSize);
            this.canvas.drawCharacterFromFont('background', this.review.getBaseVocab().getCharacters()[this.review.get('position') - 1], this.review.getBaseVocab().getFontName());
            if (skritter.settings.isPortrait()) {
                this.$('.prompt-container').addClass('portrait');
                this.$('.prompt-container').removeClass('landscape');
                this.$('.prompt-container').css({
                    height: '',
                    width: ''
                });
                this.$('#info-section').css({
                    height: contentHeight - canvasSize + 10,
                    width: ''
                });
                this.$('#input-section').css({
                    height: canvasSize,
                    left: (contentWidth - canvasSize) / 2,
                    width: canvasSize
                });
            } else {
                this.$('.prompt-container').addClass('landscape');
                this.$('.prompt-container').removeClass('portrait');
                this.$('.prompt-container').css({
                    height: canvasSize,
                    width: ''
                });
                this.$('#info-section').css({
                    height: canvasSize,
                    width: contentWidth - canvasSize
                });
                this.$('#input-section').css({
                    height: canvasSize,
                    left: '',
                    width: canvasSize
                });
            }
            if (this.review.getReview().finished) {
                var tone = _.flatten(this.review.getBaseVocab().getTones(this.review.get('position')))[0];
                this.canvas.drawShape('display', this.review.getCharacterAt().targets[tone - 1].getShape(null, skritter.settings.get('gradingColors')[this.review.getReviewAt().score]));
                this.canvas.injectLayerColor('display', skritter.settings.get('gradingColors')[this.review.getReviewAt().score]);
            } else {
                this.canvas.enableInput();
            }
        },
        /**
         * @method show
         * @returns {Backbone.View}
         */
        show: function() {
            this.canvas.enableInput();
            this.showNavigation();
            this.canvas.drawCharacterFromFont('background', this.review.getBaseVocab().getCharacters()[this.review.get('position') - 1], this.review.getBaseVocab().getFontName());
            this.$('#prompt-definition').html(this.review.getBaseVocab().getDefinition());
            this.$('#prompt-newness').text(this.review.getBaseItem().isNew() ? 'new' : '');
            this.$('#prompt-reading').html(this.review.getBaseVocab().getReadingBlock(this.review.get('position'), skritter.user.settings.get('hideReading')));
            if (this.review.getBaseVocab().getSentence()) {
                this.$('#prompt-sentence').html(this.review.getBaseVocab().getSentence().getWriting());
            }
            this.$('#prompt-style').html(this.review.getBaseVocab().getStyle());
            this.$('#prompt-writing').html(this.review.getBaseVocab().get('writing'));
            return this;
        },
        /**
         * @method showAnswer
         * @returns {Backbone.View}
         */
        showAnswer: function() {
            skritter.timer.stop();
            this.canvas.disableInput();
            this.showNavigation();
            window.setTimeout(_.bind(function() {
                this.canvas.injectLayerColor('display', skritter.settings.get('gradingColors')[this.review.getReviewAt().score]);
            }, this), 1);
            if (!this.review.getReview().finished) {
                this.review.setReview({
                    finished: true,
                    reviewTime: skritter.timer.getReviewTime(),
                    thinkingTime: skritter.timer.getThinkingTime()
                });
            }
            this.$('#prompt-reading').html(this.review.getBaseVocab().getReadingBlock(this.review.get('position') + 1, skritter.user.settings.get('hideReading')));
            this.gradingButtons.show().select(this.review.getReviewAt().score).collapse();
            if (this.review.isLast() && skritter.user.settings.get('audio')) {
                if (this.review.getBaseVocab().has('audio')) {
                    this.review.getBaseVocab().playAudio();
                } else {
                    this.review.getBaseVocab().playAudio(this.review.get('position'));
                }
            } else if (skritter.user.settings.get('audio')) {
                this.review.getBaseVocab().playAudio(this.review.get('position'));
            }
            if (this.review.isLast()) {
                this.$('#prompt-reading .reading').on('vclick', _.bind(this.playAudio, this));
                if (this.review.getBaseVocab().has('audio')) {
                    this.$('#prompt-reading .reading').addClass('has-audio');
                }
            }
            return this;
        }
    });
    
    return Tone;
});