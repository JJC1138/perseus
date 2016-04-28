/**
 * This is an example graphie-using widget
 *
 * TODO(jack): Add more comments
 */

const React = require('react');
const _ = require("underscore");

const Util = require("../util.js");
const Changeable = require("../mixins/changeable.jsx");
const WidgetJsonifyDeprecated = require("../mixins/widget-jsonify-deprecated.jsx");

const Graphie = require("../components/graphie.jsx");
const MovablePoint = Graphie.MovablePoint;

const kpoint = require("kmath").point;

/**
 * This is the widget's renderer. It shows up in the right column
 * in the demo, and is what is visible to users, and where
 * users enter their answers.
 */
const ExampleGraphieWidget = React.createClass({
    propTypes: {
        coord: React.PropTypes.arrayOf(React.PropTypes.number),
        // TODO(JJC1138): This could be replaced with a more specific prop spec:
        graph: React.PropTypes.any.isRequired,
    },

    mixins: [Changeable, WidgetJsonifyDeprecated],

    getDefaultProps: function() {
        return {
            // We want to allow our coord to be null to test if the
            // user has interacted with this widget yet when grading it
            coord: null,
            graph: {
                box: [400, 400],
                labels: ["x", "y"],
                range: [[-10, 10], [-10, 10]],
                step: [1, 1],
                gridStep: [1, 1],
                valid: true,
                backgroundImage: null,
                markings: "grid",
                showProtractor: false,
            },
        };
    },

    movePoint: function(newCoord) {
        this.change({
            coord: newCoord,
        });
    },

    _getGridConfig: function(options) {
        return _.map(options.step, function(step, i) {
            return Util.gridDimensionConfig(
                    step,
                    options.range[i],
                    options.box[i],
                    options.gridStep[i]);
        });
    },

    setupGraphie: function(graphie, options) {
        const gridConfig = this._getGridConfig(options);
        graphie.graphInit({
            range: options.range,
            scale: _.pluck(gridConfig, "scale"),
            axisArrows: "<->",
            labelFormat: function(s) { return "\\small{" + s + "}"; },
            gridStep: options.gridStep,
            tickStep: _.pluck(gridConfig, "tickStep"),
            labelStep: 1,
            unityLabels: _.pluck(gridConfig, "unityLabel"),
        });
        graphie.label([0, options.range[1][1]], options.labels[1], "above");
    },

    simpleValidate: function(rubric) {
        return ExampleGraphieWidget.validate(this.getUserInput(), rubric);
    },

    render: function() {
        return <Graphie
            ref="graphie"
            box={this.props.graph.box}
            range={this.props.graph.range}
            options={this.props.graph}
            setup={this.setupGraphie}
        >
            <MovablePoint
                pointSize={5}
                coord={this.props.coord || [0, 0]}
                constraints={[
                    MovablePoint.constraints.snap(),
                    MovablePoint.constraints.bound(),
                ]}
                onMove={this.movePoint}
            />
        </Graphie>;
    },
});


/**
 * This is the widget's grading function
 */
_.extend(ExampleGraphieWidget, {
    validate: function(state, rubric) {
        if (state.coord == null) {
            return {
                type: "invalid",
                message: null,
            };
        } else if (kpoint.equal(state.coord, rubric.correct)) {
            return {
                type: "points",
                earned: 1,
                total: 1,
                message: null,
            };
        } else {
            return {
                type: "points",
                earned: 0,
                total: 1,
                message: null,
            };
        }
    },
});

/**
 * For this widget to work, we must export it.
 * We also must require() this file in src/all-widgets.js
 */
module.exports = {
    name: "example-graphie-widget",
    displayName: "Example Graphie Widget",
    hidden: true,   // Hides this widget from the Perseus.Editor widget select
    widget: ExampleGraphieWidget,
};
