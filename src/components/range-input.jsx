/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable no-var, react/jsx-closing-bracket-location, react/jsx-sort-prop-types, react/sort-comp */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

var React = require('react');
var NumberInput = require("../components/number-input.jsx");

var truth = () => true;

/* A minor abstraction on top of NumberInput for ranges
 *
 */
var RangeInput = React.createClass({
    propTypes: {
        value: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
        onChange: React.PropTypes.func.isRequired,
        placeholder: React.PropTypes.arrayOf(React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.number,
        ])),
        checkValidity: React.PropTypes.func,
    },

    getDefaultProps: function() {
        return {
            placeholder: [null, null],
        };
    },

    render: function() {
        var value = this.props.value;
        var checkValidity = this.props.checkValidity || truth;

        return <div className="range-input">
            <NumberInput
                {...this.props}
                value={value[0]}
                checkValidity={val => checkValidity([val, value[1]])}
                onChange={this.onChange.bind(this, 0)}
                placeholder={this.props.placeholder[0]} />
            <NumberInput
                {...this.props}
                value={value[1]}
                checkValidity={val => checkValidity([value[0], val])}
                onChange={this.onChange.bind(this, 1)}
                placeholder={this.props.placeholder[1]} />
        </div>;
    },

    onChange: function(i, newVal) {
        var value = this.props.value;
        if (i === 0) {
            this.props.onChange([newVal, value[1]]);
        } else {
            this.props.onChange([value[0], newVal]);
        }
    },

});

module.exports = RangeInput;
