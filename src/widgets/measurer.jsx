/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable no-var, react/jsx-closing-bracket-location, react/jsx-indent-props, react/jsx-sort-prop-types, react/sort-comp */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

const React        = require('react');
const ReactDOM = require("react-dom");
const _ = require("underscore");

const GraphUtils = require("../util/graph-utils.js");

const defaultImage = {
    url: null,
    top: 0,
    left: 0,
};

const Measurer = React.createClass({
    propTypes: {
        box: React.PropTypes.arrayOf(React.PropTypes.number),
        image: React.PropTypes.shape({
            url: React.PropTypes.string,
            top: React.PropTypes.number,
            left: React.PropTypes.number,
        }),
        showProtractor: React.PropTypes.bool,
        protractorX: React.PropTypes.number,
        protractorY: React.PropTypes.number,
        showRuler: React.PropTypes.bool,
        rulerLabel: React.PropTypes.string,
        rulerTicks: React.PropTypes.number,
        rulerPixels: React.PropTypes.number,
        rulerLength: React.PropTypes.number,
    },

    getDefaultProps: function() {
        return {
            box: [480, 480],
            image: {},
            showProtractor: true,
            protractorX: 7.5,
            protractorY: 0.5,
            showRuler: false,
            rulerLabel: "",
            rulerTicks: 10,
            rulerPixels: 40,
            rulerLength: 10,
        };
    },

    getInitialState: function() {
        return {};
    },

    render: function() {
        const image = _.extend({}, defaultImage, this.props.image);
        return <div
                className={
                    "perseus-widget perseus-widget-measurer " +
                    "graphie-container above-scratchpad"
                }
                style={{width: this.props.box[0], height: this.props.box[1]}}>
            {image.url &&
                <img
                    src={image.url}
                    style={{
                        top: image.top,
                        left: image.left,
                    }} />
            }
            <div className="graphie" ref="graphieDiv" />
        </div>;
    },

    componentDidMount: function() {
        this.setupGraphie();
    },

    componentDidUpdate: function(prevProps) {
        const shouldSetupGraphie = _.any(
            [
                "box", "showProtractor", "showRuler", "rulerLabel",
                "rulerTicks", "rulerPixels", "rulerLength",
            ],
            function(prop) {
                return prevProps[prop] !== this.props[prop];
            },
            this
        );

        if (shouldSetupGraphie) {
            this.setupGraphie();
        }
    },

    setupGraphie: function() {
        const graphieDiv = ReactDOM.findDOMNode(this.refs.graphieDiv);
        $(graphieDiv).empty();
        const graphie = this.graphie = GraphUtils.createGraphie(graphieDiv);

        const scale = [40, 40];
        const range = [
            [0, this.props.box[0] / scale[0]],
            [0, this.props.box[1] / scale[1]],
        ];
        graphie.init({
            range: range,
            scale: scale,
        });
        graphie.addMouseLayer({
            allowScratchpad: true,
        });

        if (this.protractor) {
            this.protractor.remove();
        }

        if (this.props.showProtractor) {
            this.protractor = graphie.protractor([
                this.props.protractorX,
                this.props.protractorY,
            ]);
        }

        if (this.ruler) {
            this.ruler.remove();
        }

        if (this.props.showRuler) {
            this.ruler = graphie.ruler({
                center: [
                    (range[0][0] + range[0][1]) / 2,
                    (range[1][0] + range[1][1]) / 2,
                ],
                label: this.props.rulerLabel,
                pixelsPerUnit: this.props.rulerPixels,
                ticksPerUnit: this.props.rulerTicks,
                units: this.props.rulerLength,
            });
        }
    },

    getUserInput: function() {
        return {};
    },

    simpleValidate: function(rubric) {
        // TODO(joel) - I don't understand how this is useful!
        return Measurer.validate(this.getUserInput(), rubric);
    },

    focus: $.noop,
});


_.extend(Measurer, {
    validate: function(state, rubric) {
        return {
            type: "points",
            earned: 1,
            total: 1,
            message: null,
        };
    },
});

const propUpgrades = {
    1: (v0props) => {
        const v1props = _(v0props).chain()
            .omit("imageUrl", "imageTop", "imageLeft")
            .extend({
                image: {
                    url: v0props.imageUrl,
                    top: v0props.imageTop,
                    left: v0props.imageLeft,
                },
            })
            .value();
        return v1props;
    },
};

module.exports = {
    name: "measurer",
    displayName: "Measurer",
    widget: Measurer,
    version: {major: 1, minor: 0},
    propUpgrades: propUpgrades,
};
