/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable no-var, react/jsx-closing-bracket-location, react/jsx-indent-props, react/sort-comp */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

// TODO(joel): teach KAS how to accept an answer only if it's expressed in
// terms of a certain type.
// TODO(joel): Allow sigfigs within a range rather than an exact expected
// value?

/* global i18n:false, $_:false */

const lens = require("../../hubble/index.js");
const React = require("react");
const ReactDOM = require("react-dom");
const _ = require("underscore");

const ApiClassNames = require("../perseus-api.jsx").ClassNames;
const ApiOptions = require("../perseus-api.jsx").Options;
const Changeable = require("../mixins/changeable.jsx");
const MathOutput   = require("../components/math-output.jsx");
const { SignificantFigures, displaySigFigs } = require("../sigfigs.jsx");

const ALL = "all";
const MAX_SIGFIGS = 10;

const countSigfigs = function(value) {
    return new SignificantFigures(value).sigFigs;
};

const sigfigPrint = function(num, sigfigs) {
    return displaySigFigs(num, sigfigs, -MAX_SIGFIGS, false);
};

/* I just wrote this, but it's old by analogy to `OldExpression`, in that it's
 * the version that non-mathquill platforms get stuck with. Constructed with an
 * <input>, a parser, popsicle sticks, and glue.
 *
 * In the same way as OldExpression, this parses continuously as you type, then
 * shows and hides an error buddy. The error message is only shown after a
* rolling two second delay, but hidden immediately on further typing.
 */
const OldUnitInput = React.createClass({
    mixins: [Changeable],

    propTypes: {
        apiOptions: ApiOptions.propTypes,
        onBlur: React.PropTypes.func,
        onChange: React.PropTypes.func,
        onFocus: React.PropTypes.func,
        value: React.PropTypes.string,
    },

    getDefaultProps: function() {
        return {
            apiOptions: ApiOptions.defaults,
            value: "",
        };
    },

    // TODO(joel) think about showing the error buddy
    render: function() {
        const inputType = this.props.apiOptions.staticRender ?
                React.createFactory(MathOutput) :
                React.DOM.input;
        const input = inputType({
            onChange: this.handleChange,
            ref: "input",
            className: ApiClassNames.INTERACTIVE,
            value: this.props.value,
            onFocus: this.handleFocus,
            onBlur: this.handleBlur,
        });

        return <div className="old-unit-input">
            {input}
            <div ref="error"
                 className="error"
                 style={{display: "none"}}>
                <$_>{"I don't understand that"}</$_>
            </div>
        </div>;
    },

    _errorTimeout: null,

    _showError: function() {
        if (this.props.value === "") {
            return;
        }

        const $error = $(ReactDOM.findDOMNode(this.refs.error));
        if (!$error.is(":visible")) {
            $error.css({ top: 50, opacity: 0.1 }).show()
                .animate({ top: 0, opacity: 1.0 }, 300);
        }
    },

    _hideError: function() {
        const $error = $(ReactDOM.findDOMNode(this.refs.error));
        if ($error.is(":visible")) {
            $error.animate({ top: 50, opacity: 0.1 }, 300, function() {
                $(this).hide();
            });
        }
    },

    componentDidUpdate: function() {
        clearTimeout(this._errorTimeout);
        if (KAS.unitParse(this.props.value).parsed) {
            this._hideError();
        } else {
            this._errorTimeout = setTimeout(this._showError, 2000);
        }
    },

    componentWillUnmount: function() {
        clearTimeout(this._errorTimeout);
    },

    handleBlur: function() {
        this.props.onBlur([]);
        clearTimeout(this._errorTimeout);
        if (!KAS.unitParse(this.props.value).parsed) {
            this._showError();
        }
    },

    handleChange: function(event) {
        this._hideError();
        this.props.onChange({ value: event.target.value });
    },

    simpleValidate: function(rubric, onInputError) {
        onInputError = onInputError || function() {};
        return OldUnitInput.validate(this.getUserInput(), rubric);
    },

    getUserInput: function() {
        return this.props.value;
    },

    // begin mobile stuff

    getInputPaths: function() {
        // The widget itself is an input, so we return a single empty list to
        // indicate this.
        return [[]];
    },

    focusInputPath: function(inputPath) {
        ReactDOM.findDOMNode(this.refs.input).focus();
    },

    handleFocus: function() {
        this.props.onFocus([]);
    },

    blurInputPath: function(inputPath) {
        ReactDOM.findDOMNode(this.refs.input).blur();
    },

    setInputValue: function(path, newValue, cb) {
        this.props.onChange({
            value: newValue,
        }, cb);
    },

    getDOMNodeForPath: function() {
        return ReactDOM.findDOMNode(this.refs.input);
    },

    getGrammarTypeForPath: function(inputPath) {
        return "unit";
    },

    // end mobile stuff
});

// Extract the primitive units from a unit expression. This first simplifies
// `expr` to a `Mul` like "5 kg m / s^2" then removes the first term.
const primUnits = function(expr) {
    return expr.simplify().asMul().partition()[1].flatten().simplify();
};

_.extend(OldUnitInput, {
    validate: function(state, rubric) {
        const answer = KAS.unitParse(rubric.value).expr;
        const guess = KAS.unitParse(state);
        if (!guess.parsed) {
            return  {
                type: "invalid",
                message: i18n._("I couldn't understand those units."),
            };
        }

        // Note: we check sigfigs, then numerical correctness, then units, so
        // the most significant things come last, that way the user will see
        // the most important message.
        const message = null;

        // did the user specify the right number of sigfigs?
        // TODO(joel) - add a grading mode where the wrong number of sigfigs
        // isn't marked wrong
        const sigfigs = rubric.sigfigs;
        const sigfigsCorrect = countSigfigs(guess.coefficient) === sigfigs;
        if (!sigfigsCorrect) {
            message = i18n._("Check your significant figures.");
        }

        // now we need to check that the answer is correct to the precision we
        // require.
        const numericallyCorrect;
        try {
            const x = new KAS.Var("x");
            const equality = new KAS.Eq(
                answer.simplify(),
                "=",
                new KAS.Mul(x, guess.expr.simplify())
            );

            const conversion = equality.solveLinearEquationForVariable(x);

            // Make sure the conversion factor between the user's input answer
            // and the canonical answer is 1, to sigfig places.
            // TODO(joel) is this sound?
            numericallyCorrect =
                Number(conversion.eval()).toPrecision(sigfigs) ===
                Number(1).toPrecision(sigfigs);
        } catch (e) {
            numericallyCorrect = false;
        }

        if (!numericallyCorrect) {
            message = i18n._("That answer is numerically incorrect.");
        }

        const kasCorrect;
        const guessUnit = primUnits(guess.expr.simplify());
        const answerUnit = primUnits(answer.simplify());

        if (rubric.accepting === ALL) {
            // We're accepting all units - KAS does the hard work of figuring
            // out if the user's unit is equivalent to the author's unit.
            kasCorrect = KAS.compare(
                guessUnit,
                answerUnit
            ).equal;
        } else {
            // Are any of the accepted units the same as what the user entered?
            kasCorrect = _(rubric.acceptingUnits).any(unit => {
                const thisAnswerUnit = primUnits(
                    KAS.unitParse(unit).unit.simplify()
                );
                return KAS.compare(
                    thisAnswerUnit,
                    guessUnit
                    // TODO(joel) - make this work as intended.
                    // { form: true }
                ).equal;
            });
        }
        if (!kasCorrect) {
            message = i18n._("Check your units.");
        }

        const correct = kasCorrect && numericallyCorrect && sigfigsCorrect;

        return {
            type: "points",
            earned: correct ? 1 : 0,
            total: 1,
            message,
        };
    },
});

module.exports = {
    name: "unit-input",
    displayName: "Unit",
    defaultAlignment: "inline-block",
    getWidget: (enabledFeatures) => {
        // Allow toggling between the two versions of the widget
        return OldUnitInput;
    },
    transform: x => lens(x).del(["value"]).freeze(),
    version: { major: 0, minor: 1 },
    countSigfigs,
    sigfigPrint,
    hidden: true,
};
