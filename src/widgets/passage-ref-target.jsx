/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable no-var, react/jsx-closing-bracket-location, react/sort-comp */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

var React = require("react");
var _ = require("underscore");

var Changeable   = require("../mixins/changeable.jsx");
var WidgetJsonifyDeprecated = require("../mixins/widget-jsonify-deprecated.jsx");
var Renderer = require("../renderer.jsx");

var PassageRefTarget = React.createClass({
    mixins: [WidgetJsonifyDeprecated, Changeable],

    propTypes: {
        // We don't use ApiOptions.propTypes or EnabledFeatures.PropTypes here
        // because they require the props and they're optional for this
        // component.
        apiOptions: React.PropTypes.any,
        content: React.PropTypes.string,
        enabledFeatures: React.PropTypes.any,
    },

    getDefaultProps: function() {
        return {
            content: "",
        };
    },

    render: function() {
        return <Renderer
            content={this.props.content}
            inline={true}
            enabledFeatures={this.props.enabledFeatures}
            apiOptions={this.props.apiOptions}
            />;
    },

    simpleValidate: function(rubric) {
        return PassageRefTarget.validate(this.getUserInput(), rubric);
    },
});

_.extend(PassageRefTarget, {
    validate: function(state, rubric) {
        return {
            type: "points",
            earned: 0,
            total: 0,
            message: null,
        };
    },
});

module.exports = {
    name: "passage-ref-target",
    displayName: "PassageRefTarget",
    defaultAlignment: "inline",
    widget: PassageRefTarget,
    hidden: true,
    transform: (editorProps) => {
        return _.pick(editorProps, "content");
    },
    version: {major: 0, minor: 0},
};
