/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable react/sort-comp */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

const React = require("react");
const _ = require("underscore");

const JsonEditor = React.createClass({

    propTypes: {
        onChange: React.PropTypes.func.isRequired,
        value: React.PropTypes.any,
    },

    getInitialState: function() {
        return {
            currentValue: JSON.stringify(this.props.value, null, 4),
            valid: true,
        };
    },

    componentWillReceiveProps: function(nextProps) {
        const shouldReplaceContent = !this.state.valid ||
            !_.isEqual(
                nextProps.value,
                JSON.parse(this.state.currentValue)
            );

        if (shouldReplaceContent) {
            this.setState(this.getInitialState());
        }
    },

    render: function() {
        const classes = "perseus-json-editor " +
            (this.state.valid ? "valid" : "invalid");

        return <textarea
            className={classes}
            value={this.state.currentValue}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
            onBlur={this.handleBlur}
        />;
    },

    handleKeyDown: function(e) {
        // This handler allows the tab character to be entered by pressing
        // tab, instead of jumping to the next (non-existant) field
        if (e.key === "Tab") {
            const cursorPos = e.target.selectionStart;
            const v = e.target.value;
            const textBefore = v.substring(0, cursorPos);
            const textAfter = v.substring(cursorPos, v.length);
            e.target.value = textBefore + "    " + textAfter;
            e.target.selectionStart = textBefore.length + 4;
            e.target.selectionEnd = textBefore.length + 4;

            e.preventDefault();
            this.handleChange(e);
        }
    },

    handleChange: function(e) {
        const nextString = e.target.value;
        try {
            let json = JSON.parse(nextString);
            // Some extra handling to allow copy-pasting from /api/vi
            if (_.isString(json)) {
                json = JSON.parse(json);
            }
            // This callback unfortunately causes multiple renders,
            // but seems to be necessary to avoid componentWillReceiveProps
            // being called before setState has gone through
            this.setState({
                currentValue: nextString,
                valid: true,
            }, function() {
                this.props.onChange(json);
            });
        } catch (ex) {
            this.setState({
                currentValue: nextString,
                valid: false,
            });
        }
    },

    // You can type whatever you want as you're typing, but if it's not valid
    // when you blur, it will revert to the last valid value.
    handleBlur: function(e) {
        const nextString = e.target.value;
        try {
            let json = JSON.parse(nextString);
            // Some extra handling to allow copy-pasting from /api/vi
            if (_.isString(json)) {
                json = JSON.parse(json);
            }
            // This callback unfortunately causes multiple renders,
            // but seems to be necessary to avoid componentWillReceiveProps
            // being called before setState has gone through
            this.setState({
                currentValue: JSON.stringify(json, null, 4),
                valid: true,
            }, function() {
                this.props.onChange(json);
            });
        } catch (ex) {
            this.setState({
                currentValue: JSON.stringify(this.props.value, null, 4),
                valid: true,
            });
        }
    },
});

module.exports = JsonEditor;
