/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable react/jsx-closing-bracket-location, react/jsx-indent-props, react/sort-comp */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

const React = require('react');
const ReactDOM = require("react-dom");
const _ = require("underscore");

const Util     = require("../util.js");
const Renderer = require("../renderer.jsx");

const ApiClassNames = require("../perseus-api.jsx").ClassNames;

const PREFIX = "perseus-sortable";


// A placeholder that appears in the sortable whenever an item is dragged.
const Placeholder = React.createClass({
    propTypes: {
        height: React.PropTypes.number.isRequired,
        margin: React.PropTypes.oneOfType([
            React.PropTypes.number,
            React.PropTypes.string,
        ]),
        width: React.PropTypes.number.isRequired,
    },

    render: function() {
        const className = [PREFIX + "-card", PREFIX + "-placeholder"].join(" ");
        const style = {width: this.props.width, height: this.props.height};

        if (this.props.margin != null) {
            style.margin = this.props.margin;
        }

        return <li className={className} style={style} />;
    },
});


const STATIC = "static";
const DRAGGING = "dragging";
const ANIMATING = "animating";
const DISABLED = "disabled";

// A draggable item in the sortable. Can be in one of four states:
//     Static:    The item is not being interacted with.
//     Dragging:  The item is being dragged.
//     Animating: The item has been released, and is moving to its destination.
//     Disabled:  The item cannot be interacted with.
//
// Usual flow:      Static -> Dragging -> Animating -> Static
// [Dis|en]abling:  Static|Dragging|Animating -> Disabled -> Static
const Draggable = React.createClass({
    propTypes: {
        content: React.PropTypes.string.isRequired,
        endPosition: React.PropTypes.shape({
            left: React.PropTypes.number,
            top: React.PropTypes.number,
        }).isRequired,
        height: React.PropTypes.number,
        margin: React.PropTypes.oneOfType([
            React.PropTypes.number,
            React.PropTypes.string,
        ]),
        onAnimationEnd: React.PropTypes.func.isRequired,
        onMouseDown: React.PropTypes.func.isRequired,
        onMouseMove: React.PropTypes.func.isRequired,
        onMouseUp: React.PropTypes.func.isRequired,
        onRender: React.PropTypes.func.isRequired,
        type: React.PropTypes.oneOf([STATIC, DRAGGING, ANIMATING, DISABLED]),
        width: React.PropTypes.number,
    },

    getDefaultProps: function() {
        return {
            type: STATIC,
        };
    },

    getInitialState: function() {
        return {
            startPosition: {left: 0, top: 0},
            startMouse: {left: 0, top: 0},
            mouse: {left: 0, top: 0},
        };
    },

    componentDidMount: function() {
        this.isMouseMoveUpBound = false;
    },

    componentWillUnmount: function() {
        // Event handlers should be unbound before component unmounting, but
        // just in case...
        if (this.isMouseMoveUpBound) {
            this.unbindMouseMoveUp();
        }
    },

    getCurrentPosition: function() {
        return {
            left: this.state.startPosition.left +
                  this.state.mouse.left -
                  this.state.startMouse.left,
            top: this.state.startPosition.top +
                 this.state.mouse.top -
                 this.state.startMouse.top,
        };
    },

    render: function() {
        const className = [
            PREFIX + "-card",
            PREFIX + "-draggable",
            PREFIX + "-" + this.props.type,
            ApiClassNames.INTERACTIVE,
        ].join(" ");

        const style = {
            position: "static",
        };

        if (this.props.type === DRAGGING || this.props.type === ANIMATING) {
            _.extend(style, {position: "absolute"}, this.getCurrentPosition());
        }

        if (this.props.width) {
            style.width = this.props.width + 1; // Fix for non-integer widths
        }
        if (this.props.height) {
            style.height = this.props.height;
        }
        if (this.props.margin != null) {
            style.margin = this.props.margin;
        }

        return <li
                    className={className}
                    style={style}
                    onMouseDown={this.onMouseDown}
                    onTouchStart={this.onMouseDown}
                    onTouchMove={this.onMouseMove}
                    onTouchEnd={this.onMouseUp}
                    onTouchCancel={this.onMouseUp} >
            <Renderer
                content={this.props.content}
                onRender={this.props.onRender} />
        </li>;
    },

    componentDidUpdate: function(prevProps) {
        if (this.props.type === prevProps.type) {
            return;
        }

        if (this.props.type === ANIMATING) {
            // Start animating
            const current = this.getCurrentPosition();
            const duration = 15 * Math.sqrt(
                Math.sqrt(
                    Math.pow(this.props.endPosition.left - current.left, 2) +
                    Math.pow(this.props.endPosition.top - current.top, 2)
                )
            );

            $(ReactDOM.findDOMNode(this)).animate(this.props.endPosition, {
                duration: Math.max(duration, 1),
                // Animating -> Static
                complete: this.props.onAnimationEnd,
            });
        } else if (this.props.type === STATIC) {
            // Ensure that any animations are done
            $(ReactDOM.findDOMNode(this)).finish();
        }
    },

    bindMouseMoveUp: function() {
        this.isMouseMoveUpBound = true;
        $(document).on("mousemove", this.onMouseMove);
        $(document).on("mouseup", this.onMouseUp);
    },

    unbindMouseMoveUp: function() {
        this.isMouseMoveUpBound = false;
        $(document).off("mousemove", this.onMouseMove);
        $(document).off("mouseup", this.onMouseUp);
    },


    onMouseDown: function(event) {
        if (this.props.type !== STATIC) {
            return;
        }

        if (!(event.button === 0 ||
                (event.touches != null && event.touches.length === 1))) {
            return;
        }

        event.preventDefault();
        const loc = Util.extractPointerLocation(event);
        if (loc) {
            this.setState({
                startPosition: $(ReactDOM.findDOMNode(this)).position(),
                startMouse: loc,
                mouse: loc,
            }, function() {
                this.bindMouseMoveUp();

                // Static -> Dragging
                this.props.onMouseDown();
            });
        }
    },

    onMouseMove: function(event) {
        if (this.props.type !== DRAGGING) {
            return;
        }

        event.preventDefault();
        const loc = Util.extractPointerLocation(event);
        if (loc) {
            this.setState({
                mouse: loc,
            }, this.props.onMouseMove);
        }
    },

    onMouseUp: function(event) {
        if (this.props.type !== DRAGGING) {
            return;
        }

        event.preventDefault();
        const loc = Util.extractPointerLocation(event);
        if (loc) {
            this.unbindMouseMoveUp();

            // Dragging -> Animating
            this.props.onMouseUp();
        }
    },
});


const HORIZONTAL = "horizontal";
const VERTICAL = "vertical";

// The main sortable component.
const Sortable = React.createClass({
    propTypes: {
        constraints: React.PropTypes.any,
        disabled: React.PropTypes.bool,
        layout: React.PropTypes.oneOf([HORIZONTAL, VERTICAL]),
        margin: React.PropTypes.number,
        onChange: React.PropTypes.func,
        onMeasure: React.PropTypes.func,
        options: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
        padding: React.PropTypes.bool,
    },

    getDefaultProps: function() {
        return {
            constraints: {},
            disabled: false,
            layout: HORIZONTAL,
            margin: 5,
            onChange: function() {},
            onMeasure: function() {},
            padding: true,
        };
    },

    getInitialState: function() {
        return {
            items: this.itemsFromProps(this.props),
        };
    },

    componentWillReceiveProps: function(nextProps) {
        const prevProps = this.props;

        if (!_.isEqual(nextProps.options, prevProps.options)) {

            // Regenerate items
            this.setState({
                items: this.itemsFromProps(nextProps),
            });

        } else if (nextProps.layout !== prevProps.layout ||
                   nextProps.padding !== prevProps.padding ||
                   nextProps.disabled !== prevProps.disabled ||
                   !_.isEqual(nextProps.constraints, prevProps.constraints)) {

            // Clear item measurements
            this.setState({
                items: this.clearItemMeasurements(this.state.items),
            });
        }
    },

    componentDidUpdate: function(prevProps) {
        // Measure items if their dimensions have been reset
        if (this.state.items.length && !this.state.items[0].width) {
            this.measureItems();
        }
    },

    itemsFromProps: function(props) {
        const type = props.disabled ? DISABLED : STATIC;
        return _.map(props.options, function(option, i) {
            return {
                option: option,
                key: i,
                type: type,
                endPosition: {},
                width: 0,
                height: 0,
            };
        });
    },

    clearItemMeasurements: function(items) {
        return _.map(items, function(item) {
            return _.extend(item, {
                width: 0,
                height: 0,
            });
        });
    },

    measureItems: function() {
        // Measure all items and cache what their dimensions should be, taking
        // into account constraints and the current layout. This allows syncing
        // widths and heights for pretty rows/columns. Note that dimensions are
        // explictly set on Draggables - this prevents them from changing size
        // or shape while being dragged.

        let items = _.clone(this.state.items);
        const $items = _.map(items, function(item) {
            return $(ReactDOM.findDOMNode(this.refs[item.key]));
        }, this);

        const widths = _.invoke($items, "outerWidth");
        const heights = _.invoke($items, "outerHeight");

        const constraints = this.props.constraints;
        const layout = this.props.layout;

        let syncWidth;
        if (constraints.width) {
            // Items must be at least as wide as the specified constraint
            syncWidth = _.max(widths.concat(constraints.width));
        } else if (layout === VERTICAL) {
            // Sync widths to get a clean column
            syncWidth = _.max(widths);
        }

        let syncHeight;
        if (constraints.height) {
            // Items must be at least as high as the specified constraint
            syncHeight = _.max(heights.concat(constraints.height));
        } else if (layout === HORIZONTAL) {
            // Sync widths to get a clean row
            syncHeight = _.max(heights);
        }

        items = _.map(items, function(item, i) {
            item.width = syncWidth || widths[i];
            item.height = syncHeight || heights[i];
            return item;
        });

        this.setState({items: items}, () => {
            this.props.onMeasure({widths: widths, heights: heights});
        });
    },

    remeasureItems: _.debounce(function() {
        this.setState({
            // Clear item measurements
            items: this.clearItemMeasurements(this.state.items),
        }, this.measureItems);
    }, 20),

    render: function() {
        let className = [PREFIX, "layout-" + this.props.layout].join(" ");
        const cards = [];

        className += this.props.padding ? "" : " unpadded";

        _.each(this.state.items, function(item, i, items) {
            const isLast = (i === items.length - 1);
            const isStatic = (item.type === STATIC || item.type === DISABLED);
            let margin;

            if (this.props.layout === HORIZONTAL) {
                margin = "0 " + this.props.margin + "px 0 0"; // right
            } else if (this.props.layout === VERTICAL) {
                margin = "0 0 " + this.props.margin + "px 0"; // bottom
            }

            cards.push(
                <Draggable
                    content={item.option}
                    key={item.key}
                    type={item.type}
                    ref={item.key}
                    width={item.width}
                    height={item.height}
                    margin={isLast && isStatic ? 0 : margin}
                    endPosition={item.endPosition}
                    onRender={this.remeasureItems}
                    onMouseDown={this.onMouseDown.bind(this, item.key)}
                    onMouseMove={this.onMouseMove.bind(this, item.key)}
                    onMouseUp={this.onMouseUp.bind(this, item.key)}
                    onTouchMove={this.onMouseMove.bind(this, item.key)}
                    onTouchEnd={this.onMouseUp.bind(this, item.key)}
                    onTouchCancel={this.onMouseUp.bind(this, item.key)}
                    onAnimationEnd={this.onAnimationEnd.bind(this,
                        item.key)} />
            );

            if (item.type === DRAGGING || item.type === ANIMATING) {
                cards.push(
                    <Placeholder
                        key={"placeholder_" + item.key}
                        ref={"placeholder_" + item.key}
                        width={item.width}
                        height={item.height}
                        margin={isLast ? 0 : margin} />
                );
            }
        }, this);

        return <ul className={className}>
            {cards}
        </ul>;
    },

    onMouseDown: function(key) {
        // Static -> Dragging
        const items = _.map(this.state.items, function(item) {
            if (item.key === key) {
                item.type = DRAGGING;
            }
            return item;
        });

        this.setState({items: items});
    },

    onMouseMove: function(key) {
        // Dragging: Rearrange items based on draggable's position
        const $draggable = $(ReactDOM.findDOMNode(this.refs[key]));
        const $sortable = $(ReactDOM.findDOMNode(this));
        const items = _.clone(this.state.items);
        const item = _.findWhere(this.state.items, {key: key});
        const margin = this.props.margin;
        const currentIndex = _.indexOf(items, item);
        let newIndex = 0;

        items.splice(currentIndex, 1);

        if (this.props.layout === HORIZONTAL) {
            const midWidth = $draggable.offset().left - $sortable.offset().left;
            let sumWidth = 0;
            let cardWidth;

            _.each(items, function(item) {
                cardWidth = item.width;
                if (midWidth > sumWidth + cardWidth / 2) {
                    newIndex += 1;
                }
                sumWidth += cardWidth + margin;
            });

        } else {
            const midHeight = $draggable.offset().top - $sortable.offset().top;
            let sumHeight = 0;
            let cardHeight;

            _.each(items, function(item) {
                cardHeight = item.height;
                if (midHeight > sumHeight + cardHeight / 2) {
                    newIndex += 1;
                }
                sumHeight += cardHeight + margin;
            });
        }

        if (newIndex !== currentIndex) {
            items.splice(newIndex, 0, item);
            this.setState({items: items});
        }
    },

    onMouseUp: function(key) {
        // Dragging -> Animating
        const items = _.map(this.state.items, function(item) {
            if (item.key === key) {
                item.type = ANIMATING;
                item.endPosition = $(ReactDOM.findDOMNode(
                    this.refs["placeholder_" + key])).position();
            }
            return item;
        }, this);

        this.setState({items: items});
        // HACK: We need to know *that* the widget changed, but currently it's
        // not set up in a nice way to tell us *how* it changed, since the
        // permutation of the items is stored in state.
        this.props.onChange({});
    },

    onAnimationEnd: function(key) {
        // Animating -> Static
        const items = _.map(this.state.items, function(item) {
            if (item.key === key) {
                item.type = STATIC;
            }
            return item;
        });

        this.setState({items: items});
    },

    getOptions: function() {
        return _.pluck(this.state.items, "option");
    },
});

module.exports = Sortable;
