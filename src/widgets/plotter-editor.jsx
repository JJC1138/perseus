const React = require("react");
const ReactDOM = require("react-dom");
const _ = require("underscore");

const BlurInput = require("react-components/blur-input.jsx");
const InfoTip = require("../components/info-tip.jsx");
const NumberInput = require("../components/number-input.jsx");
const RangeInput = require("../components/range-input.jsx");
const SvgImage = require("../components/svg-image.jsx");
const TextListEditor = require("../components/text-list-editor.jsx");

const Plotter = require("./plotter.jsx").widget;

const knumber = require("kmath").knumber;

const BAR = "bar";
const LINE = "line";
const PIC = "pic";
const HISTOGRAM = "histogram";
const DOTPLOT = "dotplot";

// Return a copy of array with length n, padded with given value
function padArray(array, n, value) {
    const copy = _.clone(array);
    copy.length = n;
    for (let i = array.length; i < n; i++) {
        copy[i] = value;
    }
    return copy;
}

const editorDefaults = {
    scaleY: 1,
    maxY: 10,
    snapsPerLine: 2,
};

const widgetPropTypes = {
    type: React.PropTypes.oneOf([BAR, LINE, PIC, HISTOGRAM, DOTPLOT]),
    labels: React.PropTypes.arrayOf(React.PropTypes.string),
    categories: React.PropTypes.arrayOf(React.PropTypes.oneOfType([
        React.PropTypes.number,
        React.PropTypes.string,
    ])),

    scaleY: React.PropTypes.number,
    maxY: React.PropTypes.number,
    snapsPerLine: React.PropTypes.number,

    picSize: React.PropTypes.number,
    pixBoxHeight: React.PropTypes.number,
    picUrl: React.PropTypes.string,

    plotDimensions: React.PropTypes.arrayOf(React.PropTypes.number),
    labelInterval: React.PropTypes.number,
    starting: React.PropTypes.arrayOf(React.PropTypes.number),
    static: React.PropTypes.bool,
};

const formatNumber = (num) => "$" + knumber.round(num, 2) + "$";

const PlotterEditor = React.createClass({
    propTypes: widgetPropTypes,

    getDefaultProps: function() {
        return _.extend({}, editorDefaults, {
            correct: [1],
            starting: [1],

            type: BAR,
            labels: ["", ""],
            categories: [""],

            picSize: 30,
            picBoxHeight: 36,
            picUrl: Khan.imageBase + "badges/earth-small.png",

            plotDimensions: [275, 200],
            labelInterval: 1,
        });
    },

    getInitialState: function() {
        return {
            editing: "correct",
            pic: null,
            loadedUrl: null,
            minX: null,
            maxX: null,
            tickStep: null,
        };
    },

    componentWillMount: function() {
        this.fetchPic(this.props.picUrl);
    },

    componentWillReceiveProps: function(nextProps) {
        this.fetchPic(nextProps.picUrl);
    },

    fetchPic: function(url) {
        if (this.state.loadedUrl !== url) {
            const pic = new Image();
            pic.src = url;
            pic.onload = () => {
                this.setState({
                    pic: pic,
                    loadedUrl: url,
                });
            };
        }
    },

    handleChangeTickStep: function(value) {
        this.setState({
            tickStep: value,
        });
    },

    handleChangeRange: function(newValue) {
        this.setState({
            minX: newValue[0],
            maxX: newValue[1],
        });
    },

    changeLabelInterval: function(value) {
        this.props.onChange({
            labelInterval: value,
        });
    },

    handlePlotterChange: function(newProps) {
        const props = {};
        props[this.state.editing] = newProps.values;
        this.props.onChange(props);
    },

    changeType: function(type) {
        let categories;
        if (type === HISTOGRAM) {
            // Switching to histogram, add a label (0) to the left
            categories = [formatNumber(0)].concat(this.props.categories);
            this.props.onChange({type: type, categories: categories});
        } else if (this.props.type === HISTOGRAM) {
            // Switching from histogram, remove a label from the left
            categories = this.props.categories.slice(1);
            this.props.onChange({type: type, categories: categories});
        } else {
            this.props.onChange({type: type});
        }

        if (categories) {
            ReactDOM.findDOMNode(this.refs.categories).value =
                categories.join(", ");
        }
    },

    changeLabel: function(i, e) {
        const labels = _.clone(this.props.labels);
        labels[i] = e.target.value;
        this.props.onChange({labels: labels});
    },

    changePicUrl: function(value) {
        // We don't need the labels and other data in the plotter, so just
        // extract the raw image and use that.
        // TODO(emily): Maybe indicate that such a change has happened?
        const url = SvgImage.getRealImageUrl(value);

        this.props.onChange({picUrl: url});
    },

    changeCategories: function(categories) {
        let n = categories.length;
        if (this.props.type === HISTOGRAM) {
            // Histograms with n labels/categories have n - 1 buckets
            n--;
        }
        const value = this.props.scaleY;

        this.props.onChange({
            categories: categories,
            correct: padArray(this.props.correct, n, value),
            starting: padArray(this.props.starting, n, value),
        });
    },

    changeScale: function(e) {
        const oldScale = this.props.scaleY;
        const newScale = +e.target.value || editorDefaults.scaleY;

        const scale = function(value) {
            return value * newScale / oldScale;
        };

        const maxY = scale(this.props.maxY);

        this.props.onChange({
            scaleY: newScale,
            maxY: maxY,
            correct: _.map(this.props.correct, scale),
            starting: _.map(this.props.starting, scale),
        });

        ReactDOM.findDOMNode(this.refs.maxY).value = maxY;
    },

    changeMax: function(e) {
        this.props.onChange({
            maxY: +e.target.value || editorDefaults.maxY,
        });
    },

    changeSnaps: function(e) {
        this.props.onChange({
            snapsPerLine: +e.target.value || editorDefaults.snapsPerLine,
        });
    },

    changeEditing: function(editing) {
        this.setState({editing: editing});
    },

    setCategoriesFromScale: function() {
        const scale = this.state.tickStep || 1;
        const min = this.state.minX || 0;
        const max = this.state.maxX || 0;
        const length = Math.floor((max - min) / scale) * scale;

        let categories;
        if (this.props.type === HISTOGRAM || this.props.type === DOTPLOT) {
            // Ranges for histogram and dotplot labels should start at zero
            categories = _.range(0, length + scale, scale);
        } else {
            categories = _.range(scale, length + scale, scale);
        }

        categories = _.map(categories, (num) => num + min);
        categories = _.map(categories, formatNumber);

        this.changeCategories(categories);

        ReactDOM.findDOMNode(this.refs.categories).value =
            categories.join(", ");
    },

    serialize: function() {
        const json = _.pick(this.props, "correct", "starting", "type", "labels",
            "categories", "scaleY", "maxY", "snapsPerLine", "labelInterval");

        if (this.props.type === PIC) {
            json.picUrl = this.props.picUrl;
        }

        return json;
    },

    render: function() {
        const setFromScale = _.contains([LINE, HISTOGRAM, DOTPLOT],
                                      this.props.type);
        const canChangeSnaps = !_.contains([PIC, DOTPLOT], this.props.type);
        const props = {
            trackInteraction: () => {},
            ...this.props,
        };

        return <div className="perseus-widget-plotter-editor">
            <div>
                Chart type:{' '}
                {_.map([BAR, LINE, PIC, HISTOGRAM, DOTPLOT], function(type) {
                    return <label key={type}>
                        <input
                            type="radio"
                            name="chart-type"
                            checked={this.props.type === type}
                            onChange={_.partial(this.changeType, type)}
                        />
                        {type}
                    </label>;
                }, this)}
            </div>
            <div>
                Labels:{' '}
                {_.map(["x", "y"], function(axis, i) {
                    return <label key={axis}>
                        {axis + ":"}
                        <input
                            type="text"
                            onChange={_.partial(this.changeLabel, i)}
                            defaultValue={this.props.labels[i]}
                        />
                    </label>;
                }, this)}
            </div>

            {setFromScale && <div className="set-from-scale-box">
                <span className="categories-title">
                    Set Categories From Scale
                </span>
                <div>
                    <label>
                        Tick Step:{' '}
                        <NumberInput
                            placeholder={1}
                            useArrowKeys={true}
                            value={this.state.tickStep}
                            onChange={this.handleChangeTickStep}
                        />
                    </label>
                    <InfoTip>
                        <p>The difference between adjacent ticks.</p>
                    </InfoTip>
                </div>
                <div>
                    <label>
                        Range:{' '}
                        <RangeInput
                            placeholder={[0, 10]}
                            useArrowKeys={true}
                            value={[this.state.minX, this.state.maxX]}
                            onChange={this.handleChangeRange}
                        />
                    </label>
                </div>
                <div>
                    <button onClick={this.setCategoriesFromScale}>
                        Set Categories{' '}
                    </button>
                </div>
            </div>}
            <div>
                <label>
                    Label Interval:{' '}
                    <NumberInput
                        useArrowKeys={true}
                        value={this.props.labelInterval}
                        onChange={this.changeLabelInterval}
                    />
                </label>
                <InfoTip>
                    <p>Which ticks to display the labels for. For instance,
                    setting this to "4" will only show every 4th label (plus
                    the last one)</p>
                </InfoTip>
            </div>
            {this.props.type === PIC && <div>
                <label>
                    Picture:{' '}
                    <BlurInput
                        className="pic-url"
                        value={this.props.picUrl}
                        onChange={this.changePicUrl}
                    />
                <InfoTip>
                    <p>Use the default picture of Earth, or insert the URL for
                    a different picture using the "Add image" function.</p>
                </InfoTip>
                </label>
                {this.state.pic &&
                    this.state.pic.width !== this.state.pic.height &&
                    <p className="warning">
                        <b>Warning</b>: You are using a picture which is not
                        square.  This means the image will get distorted. You
                        should probably crop it to be square.
                    </p>}
            </div>}
            <div>
                <label>
                    Categories:{' '}
                    <TextListEditor
                        ref="categories"
                        layout="horizontal"
                        options={this.props.categories}
                        onChange={this.changeCategories}
                    />
                </label>
            </div>
            <div>
                <label>
                    Scale (y):{' '}
                    <input
                        type="text"
                        onChange={this.changeScale}
                        defaultValue={this.props.scaleY}
                    />
                </label>
            </div>
            <div>
                <label>
                    Max y:{' '}
                    <input
                        type="text"
                        ref="maxY"
                        onChange={this.changeMax}
                        defaultValue={this.props.maxY}
                    />
                </label>
            </div>
            {canChangeSnaps && <div>
                <label>
                    Snaps per line:{' '}
                    <input
                        type="text"
                        onChange={this.changeSnaps}
                        defaultValue={this.props.snapsPerLine}
                    />
                </label>
                <InfoTip>
                    <p>Creates the specified number of divisions between the
                    horizontal lines. Fewer snaps between lines makes the graph
                    easier for the student to create correctly.</p>
                </InfoTip>
            </div>}
            <div>
                Editing values:{' '}
                {_.map(["correct", "starting"], function(editing) {
                    return <label key={editing}>
                        <input
                            type="radio"
                            name="editing"
                            checked={this.state.editing === editing}
                            onChange={_.partial(this.changeEditing, editing)}
                        />
                        {editing}
                    </label>;
                }, this)}
                <InfoTip><p>
                    Use this toggle to switch between editing the correct
                    answer (what the student will be graded on) and the
                    starting values (what the student will see plotted when
                    they start the problem). Note: These cannot be the same.
                </p><p>
                    In static mode, the starting values are rendered out to the
                    displayed widget.
                </p></InfoTip>
            </div>
            <Plotter
                {...props}
                starting={this.props[this.state.editing]}
                onChange={this.handlePlotterChange}
            />
        </div>;
    },
});

module.exports = PlotterEditor;
