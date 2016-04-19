/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable no-var, react/jsx-closing-bracket-location, react/jsx-indent-props, react/sort-comp */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

var React = require('react');
var _ = require("underscore");

/* A checkbox that syncs its value to props using the
 * renderer's onChange method, and gets the prop name
 * dynamically from its props list
 */
var PropCheckBox = React.createClass({
    propTypes: {
        label: React.PropTypes.node,
        labelAlignment: React.PropTypes.oneOf(["left", "right"]),
        onChange: React.PropTypes.func,
    },

    DEFAULT_PROPS: {
        label: null,
        onChange: null,
        labelAlignment: "left",
    },

    getDefaultProps: function() {
        return this.DEFAULT_PROPS;
    },

    propName: function() {
        var propName = _.find(_.keys(this.props), function(localPropName) {
            return !_.has(this.DEFAULT_PROPS, localPropName);
        }, this);

        if (!propName) {
            throw new Error("Attempted to create a PropCheckBox with no " +
                    "prop!");
        }

        return propName;
    },

    _labelAlignLeft: function() {
        return this.props.labelAlignment === "left";
    },

    render: function() {
        var propName = this.propName();
        return <label>
            {this._labelAlignLeft() && this.props.label}
            <input type="checkbox"
                    checked={this.props[propName]}
                    onChange={this.toggle} />
            {!this._labelAlignLeft() && this.props.label}
        </label>;
    },

    toggle: function() {
        var propName = this.propName();
        var changes = {};
        changes[propName] = !this.props[propName];
        this.props.onChange(changes);
    },
});

module.exports = PropCheckBox;
