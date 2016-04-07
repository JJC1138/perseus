/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable indent, no-undef, no-var, react/jsx-closing-bracket-location, react/jsx-indent-props, react/jsx-sort-prop-types, react/prop-types, react/sort-comp */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

/**
 * A <select> component rendered with classes instead of natively,
 * so that the classes may be styled/animated/magics
 *
 * Usage:
 * <FancySelect value={1}>
 *     <FancySelect.Option value={0}>text0</FancySelect.Option>
 *     <FancySelect.Option value={1}>text1</FancySelect.Option>
 *     <FancySelect.Option value={2}>text2</FancySelect.Option>
 * </FancySelect>
 *
 * Here be dragons.
 */

var classNames = require("classnames");
var React = require("react");
var ReactDOM = require("react-dom");

var DROPDOWN_OFFSET = 76;
var ITEM_HEIGHT = 48;

var FancyOption = React.createClass({
    render: function() {
        throw new Error("FancyOption shouldn't ever be actually rendered");
    },
});

var FancySelect = React.createClass({

    propTypes: {
        value: React.PropTypes.any.isRequired,
        className: React.PropTypes.string,
        onChange: React.PropTypes.func,
    },

    getDefaultProps: function() {
        return {
            onChange: () => { },
        };
    },

    getInitialState: function() {
        return {
            active: false,
            // Keep track of whether we've closed this select
            // from open so that we can only run CSS animations
            // when closing/opening, and not on page load
            // If we just use active, we get a closing animation
            // when the element loads :(.
            closed: false,
            // Used to namespace $(document) event handlers
            selectorNamespace: _.uniqueId("fancy"),
            nodeOffset: 0,
        };
    },

    render: function() {
        // Some css-box magic:
        // We render all of the options on top of each other in a hidden,
        // floated span. This span then forces the <FancySelect>'s
        // width to be large enough to fit the largest option when
        // selected, so that the page doesn't have to re-flow when changing
        // select items.
        var optionSizer = <span style={{
                    display: "inline-block",
                    float: "left",
                    visibility: "hidden",
                    height: 0,
                }}>
            {React.Children.map(this.props.children, (option) => {
                return <div className="fancy-select-value-hidden"
                            style={{height: 0}}>
                    {option.props.children}
                </div>;
            })}
        </span>;

        var childCount = 0;
        var selectedOption;
        React.Children.forEach(this.props.children, (option) => {
            childCount++;
            if (option.props.value === this.props.value) {
                selectedOption = option;
            }
        });

        var selectBoxClassName = classNames({
            "fancy-select": true,
            active: this.state.active,
            closed: this.state.closed,
        });

        var selectBox = <div className={selectBoxClassName}
                onClick={this._swapActive}>
                {optionSizer}
                {/* position this absolutely so it goes on top
                    of the optionSizer, not next to it */}
                <span
                        className="fancy-select-value"
                        style={{position: "absolute"}}>
                    {selectedOption.props.children}
                </span>
        </div>;

        var options = React.Children.map(this.props.children, (option, i) => {
            // options can specify visible={true|false|null/undefined} to
            // control whether they are displayed always, never, or when
            // active (the default). `true` is useful if you want to manage
            // visibility manually via css.
            var visible = option.props.visible != null ?
                    option.props.visible :
                    this.state.active;
            if (!visible) {
                return null;
            }

            var className = classNames({
                "fancy-option": true,
                active: this.state.active,
                closed: this.state.closed,
                selected: option.props.value === this.props.value,
            });
            if (option.props.className) {
                className += " " + option.props.className;
            }

            var translate;
            var transition;
            if (this.state.active) {
                var offset = DROPDOWN_OFFSET * i + this.state.nodeOffset;
                translate = "translate3d(0, " + offset + "px, 0)";
                transition = "0.35s ease-in";
            } else {
                translate = "translate3d(0, 0, 0)";
                transition = "0.35s ease-out";
            }
            var style = _.extend({}, option.props.style, {
                WebkitTransform: translate,
                transform: translate,
                WebkitTransition: transition,
                transition: transition,
            });

            return <li
                    className={className}
                    style={style}
                    onClick={() => {
                        this._unbindClickHandler();
                        this.props.onChange(option.props.value, option);
                        this.setState({
                            active: false,
                            closed: true,
                        });
                    }}>
                {option.props.children}
            </li>;
        });

        var optionsBoxClassName = classNames({
            "fancy-select-options": true,
            active: this.state.active,
            closed: this.state.closed,
        });

        var height = DROPDOWN_OFFSET * childCount;
        var clipOffset = this.state.active ? this.state.nodeOffset : 0;
        var style = {
            clip: "rect(" + clipOffset + "px, auto, " + height + "px, 0)",
            WebkitTransition: ".35s ease-in",
        };

        return <div className={this.props.className}>
            {selectBox}
            <div className="fancy-select-options-wrapper">
                <ul className={optionsBoxClassName} style={style}>
                    {options}
                </ul>
            </div>
        </div>;
    },

    _swapActive: function() {
        var active = !this.state.active;
        var closed = !active;
        var nodeOffset = 0;

        // Prepare to detect clicks outside of the dropdown
        if (active) {
            this._bindClickHandler();
        } else {
            this._unbindClickHandler();
        }

        // We only need to know the position on screen if it's opening
        // TODO(jared): it could be useful to recalculate this when the device
        // is rotated. Maybe "onorientationchange"? Not sure if that is fired
        // in a webview though.
        if (active) {
          var nodeBox = ReactDOM.findDOMNode(this).getBoundingClientRect();
          var distToBottom = window.innerHeight - nodeBox.bottom;
          // One of the children is the placeholder
          var numOptions = React.Children.count(this.props.children) - 1;
          var overflow = (numOptions * ITEM_HEIGHT) - distToBottom;
          if (overflow > 0) {
            nodeOffset = -overflow;
          }
        }

        this.setState({
            active: active,
            closed: closed,
            nodeOffset: nodeOffset,
        });
    },

    _bindClickHandler: function() {
        // Close the dropdown when the user clicks elsewhere
        $(document).on("vclick." + this.state.selectorNamespace, (e) => {
            // Detect whether the target has our React DOM node as a parent
            var $this = $(ReactDOM.findDOMNode(this));
            var $closestWidget = $(e.target).closest($this);
            if (!$closestWidget.length) {
                this._swapActive();
            }
        });
    },

    _unbindClickHandler: function() {
        $(document).off("." + this.state.selectorNamespace);
    },

    componentWillUnmount: function() {
        this._unbindClickHandler();
    },
});

FancySelect.Option = FancyOption;

module.exports = FancySelect;
