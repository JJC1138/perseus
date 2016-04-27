/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable no-var */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

const React = require('react');
const ReactDOM = require("react-dom");
const _ = require("underscore");

const ApiOptions = require("./perseus-api.jsx").Options;
const EnabledFeatures = require("./enabled-features.jsx");
const HintsRenderer = require("./hints-renderer.jsx");
const Renderer = require("./renderer.jsx");
const Util = require("./util.js");
const getHintsPlacement = require("./get-hints-placement.jsx");

const {mapObject} = require("./interactive2/objective_.js");

const RP = React.PropTypes;

const ItemRenderer = React.createClass({
    propTypes: {
        apiOptions: RP.shape({
            getAnotherHint: RP.func,
            answerableCallback: RP.func,
            interactionCallback: RP.func,
            onFocusChange: RP.func,
        }),
        // Whether this component should control hiding/showing peripheral
        // item-related components (for list, see item.answerArea below).
        // TODO(alex): Generalize this to an 'expectsToBeInTemplate' prop
        controlPeripherals: RP.bool,
        enabledFeatures: RP.any,
        hintsAreaSelector: RP.string,
        initialHintsVisible: RP.number,
        item: RP.shape({
            answerArea: RP.shape({
                calculator: RP.bool,
                chi2Table: RP.bool,
                periodicTable: RP.bool,
                tTable: RP.bool,
                zTable: RP.bool,
            }),
            hints: RP.arrayOf(RP.object),
            question: RP.object,
        }).isRequired,

        onShowCalculator: RP.func,
        onShowChi2Table: RP.func,
        onShowPeriodicTable: RP.func,
        onShowTTable: RP.func,
        onShowZTable: RP.func,

        problemNum: RP.number,
        savedState: RP.any,
        workAreaSelector: RP.string,
    },

    getDefaultProps: function() {
        return {
            apiOptions: {},  // a deep default is done in `this.update()`
            controlPeripherals: true,
            enabledFeatures: {},  // a deep default is done in `this.update()`
            hintsAreaSelector: "#hintsarea",
            initialHintsVisible: 0,
            workAreaSelector: "#workarea",
        };
    },

    getInitialState: function() {
        return {
            hintsVisible: this.props.initialHintsVisible,
            questionCompleted: false,
            questionHighlightedWidgets: [],
        };
    },

    componentDidMount: function() {
        if (this.props.controlPeripherals && Khan.scratchpad) {
            Khan.scratchpad.enable();
        }
        this._currentFocus = null;
        this.update();
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState({
            questionHighlightedWidgets: [],
        });
    },

    componentDidUpdate: function() {
        this.update();
    },

    componentWillUnmount: function() {
        ReactDOM.unmountComponentAtNode(
                document.querySelector(this.props.workAreaSelector));
        ReactDOM.unmountComponentAtNode(
                document.querySelector(this.props.hintsAreaSelector));

        if (this.props.controlPeripherals) {
            const answerArea = this.props.item.answerArea || {};
            if (answerArea.calculator) {
                $("#calculator").hide();
            }
            if (answerArea.periodicTable) {
                $(".periodic-table-info-box").hide();
            }
            if (answerArea.zTable) {
                $(".z-table-info-box").hide();
            }
            if (answerArea.tTable) {
                $(".t-table-info-box").hide();
            }
            if (answerArea.chi2Table) {
                $(".chi2-table-info-box").hide();
            }
        }
    },

    update: function() {
        const enabledFeatures = _.extend(
            {},
            EnabledFeatures.defaults,
            this.props.enabledFeatures
        );

        const apiOptions = _.extend(
            {},
            ApiOptions.defaults,
            this.props.apiOptions,
            {
                onFocusChange: this._handleFocusChange,
            }
        );

        const hintsArea = <HintsRenderer
            key="hints"
            ref={inst => this.hintsRenderer = inst}
            hints={this.props.item.hints}
            hintsVisible={this.state.hintsVisible}
            enabledFeatures={enabledFeatures}
            apiOptions={apiOptions}
        />;

        let hintsPlacement = null;
        if (enabledFeatures.dynamicHintsArea) {
            // For the DynamicHintsArea feature, the hints are rendered within
            // the questionRenderer, so we leave `hintsAreaSelector` alone.
            hintsPlacement = getHintsPlacement(this.props.item);
        } else {
            ReactDOM.render(
                hintsArea,
                document.querySelector(this.props.hintsAreaSelector));
        }

        // Since the item renderer works by rendering things into three divs
        // that have completely different places in the DOM, we have to do this
        // strangeness instead of relying on React's normal render() method.
        // TODO(alpert): Figure out how to clean this up somehow
        this.questionRenderer = ReactDOM.render(
                <Renderer
                    problemNum={this.props.problemNum}
                    onInteractWithWidget={this.handleInteractWithWidget}
                    highlightedWidgets={this.state.questionHighlightedWidgets}
                    enabledFeatures={enabledFeatures}
                    hintsPlacement={hintsPlacement}
                    hintsArea={enabledFeatures.dynamicHintsArea && hintsArea}
                    apiOptions={apiOptions}
                    questionCompleted={this.state.questionCompleted}
                    savedState={this.props.savedState}
                    {...this.props.item.question}
                />,
                document.querySelector(this.props.workAreaSelector));

        const answerArea = this.props.item.answerArea || {};
        if (this.props.controlPeripherals) {
            $("#calculator").toggle(answerArea.calculator || false);
            $(".periodic-table-info-box").toggle(
                answerArea.periodicTable || false);
            $(".z-table-info-box").toggle(answerArea.zTable || false);
            $(".t-table-info-box").toggle(answerArea.tTable || false);
            $(".chi2-table-info-box").toggle(answerArea.chi2Table || false);
        } else {
            if (answerArea.calculator) {
                this.props.onShowCalculator && this.props.onShowCalculator();
            }
            if (answerArea.periodicTable) {
                this.props.onShowPeriodicTable &&
                    this.props.onShowPeriodicTable();
            }
            if (answerArea.zTable) {
                this.props.onShowZTable && this.props.onShowZTable();
            }
            if (answerArea.tTable) {
                this.props.onShowTTable && this.props.onShowTTable();
            }
            if (answerArea.chi2Table) {
                this.props.onShowChi2Table && this.props.onShowChi2Table();
            }
        }

        if (apiOptions.answerableCallback) {
            const isAnswerable =
                this.questionRenderer.emptyWidgets().length === 0;
            apiOptions.answerableCallback(isAnswerable);
        }
    },

    _handleFocusChange: function(newFocus, oldFocus) {
        if (newFocus != null) {
            this._setCurrentFocus(newFocus);
        } else {
            this._onRendererBlur(oldFocus);
        }
    },

    // Sets the current focus path and element and
    // send an onChangeFocus event back to our parent.
    _setCurrentFocus: function(newFocus) {
        // By the time this happens, newFocus cannot be a prefix of
        // prevFocused, since we must have either been called from
        // an onFocusChange within a renderer, which is only called when
        // this is not a prefix, or between the question and answer areas,
        // which can never prefix each other.
        const prevFocus = this._currentFocus;
        this._currentFocus = newFocus;
        if (this.props.apiOptions.onFocusChange != null) {
            this.props.apiOptions.onFocusChange(this._currentFocus, prevFocus);
        }
    },

    _onRendererBlur: function(blurPath) {
        const blurringFocusPath = this._currentFocus;

        // Failsafe: abort if ID is different, because focus probably happened
        // before blur
        if (!_.isEqual(blurPath, blurringFocusPath)) {
            return;
        }

        // Wait until after any new focus events fire this tick before
        // declaring that nothing is focused.
        // If a different widget was focused, we'll see an onBlur event
        // now, but then an onFocus event on a different element before
        // this callback is executed
        _.defer(() => {
            if (_.isEqual(this._currentFocus, blurringFocusPath)) {
                this._setCurrentFocus(null);
            }
        });
    },

    /**
     * Accepts a question area widgetId, or an answer area widgetId of
     * the form "answer-input-number 1", or the string "answer-area"
     * for the whole answer area (if the answer area is a single widget).
     */
    _setWidgetProps: function(widgetId, newProps, callback) {
        this.questionRenderer._setWidgetProps(
            widgetId,
            newProps,
            callback
        );
    },

    _handleAPICall: function(functionName, path) {
        // Get arguments to pass to function, including `path`
        const functionArgs = _.rest(arguments);
        const caller = this.questionRenderer;

        return caller[functionName](...functionArgs);
    },

    setInputValue: function(path, newValue, focus) {
        return this._handleAPICall('setInputValue', path, newValue, focus);
    },

    focusPath: function(path) {
        return this._handleAPICall('focusPath', path);
    },

    blurPath: function(path) {
        return this._handleAPICall('blurPath', path);
    },

    getDOMNodeForPath: function(path) {
        return this._handleAPICall('getDOMNodeForPath', path);
    },

    getGrammarTypeForPath: function(path) {
        return this._handleAPICall('getGrammarTypeForPath', path);
    },

    getInputPaths: function() {
        const questionAreaInputPaths = this.questionRenderer.getInputPaths();
        return questionAreaInputPaths;
    },

    handleInteractWithWidget: function(widgetId) {
        const withRemoved = _.difference(this.state.questionHighlightedWidgets,
                                       [widgetId]);
        this.setState({
            questionCompleted: false,
            questionHighlightedWidgets: withRemoved,
        });
        if (this.props.apiOptions.interactionCallback) {
            this.props.apiOptions.interactionCallback();
        }
    },

    focus: function() {
        return this.questionRenderer.focus();
    },

    showHint: function() {
        if (this.state.hintsVisible < this.getNumHints()) {
            this.setState({
                hintsVisible: this.state.hintsVisible + 1,
            });
        }
    },

    getNumHints: function() {
        return this.props.item.hints.length;
    },

    /**
     * Grades the item.
     *
     * Returns a KE-style score of {
     *     empty: bool,
     *     correct: bool,
     *     message: string|null,
     *     guess: Array
     * }
     */
    scoreInput: function() {
        const guessAndScore = this.questionRenderer.guessAndScore();
        const guess = guessAndScore[0];
        const score = guessAndScore[1];

        // Continue to include an empty guess for the now defunct answer area.
        // TODO(alex): Check whether we rely on the format here for
        //             analyzing ProblemLogs. If not, remove this layer.
        const maxCompatGuess = [guess, []];

        const keScore = Util.keScoreFromPerseusScore(score, maxCompatGuess);

        const emptyQuestionAreaWidgets = this.questionRenderer.emptyWidgets();

        this.setState({
            questionCompleted: keScore.correct,
            questionHighlightedWidgets: emptyQuestionAreaWidgets,
        });

        return keScore;
    },

    /**
     * Returns an array of all widget IDs in the order they occur in
     * the question content.
     */
    getWidgetIds: function() {
        return this.questionRenderer.getWidgetIds();
    },

    /**
     * Returns an object mapping from widget ID to KE-style score.
     * The keys of this object are the values of the array returned
     * from `getWidgetIds`.
     */
    scoreWidgets: function() {
        const qScore = this.questionRenderer.scoreWidgets();
        const qGuess = this.questionRenderer.getUserInputForWidgets();
        return mapObject(qScore, (score, id) => {
            return Util.keScoreFromPerseusScore(score, qGuess[id]);
        });
    },

    /**
     * Get a representation of the current state of the item.
     */
    getSerializedState: function() {
        return {
            question: this.questionRenderer.getSerializedState(),
            hints: this.hintsRenderer.getSerializedState(),
        };
    },

    restoreSerializedState: function(state, callback) {
        // We need to wait for both the question renderer and the hints
        // renderer to finish restoring their states.
        const numCallbacks = 2;
        const fireCallback = () => {
            --numCallbacks;
            if (callback && numCallbacks === 0) {
                callback();
            }
        };

        this.questionRenderer.restoreSerializedState(
            state.question, fireCallback);
        this.hintsRenderer.restoreSerializedState(state.hints, fireCallback);
    },

    render: function() {
        return <div />;
    },
});

module.exports = ItemRenderer;
