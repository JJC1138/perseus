/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable no-var */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

/**
 * A library of options to pass to add/draw/remove/constraints
 */
const _ = require("underscore");

const WrappedEllipse = require("./wrapped-ellipse.js");
const kpoint = require("kmath").point;

const add = {
    constrain: function() {
        this.constrain();
    },
};

add.standard = [add.constrain];


const modify = {
    draw: function() {
        this.draw();
    },
};

modify.standard = [modify.draw];


const draw = {
    basic: function(state, prevState) {
        const graphie = this.graphie;
        if (!this.state.visibleShape) {
            const radii = [
                this.pointSize() / graphie.scale[0],
                this.pointSize() / graphie.scale[1],
            ];
            const options = {
                maxScale: Math.max(
                    this.highlightStyle().scale, this.normalStyle().scale),
            };
            this.state.visibleShape = new WrappedEllipse(graphie, this.coord(),
                radii, options);
            this.state.visibleShape.attr(_.omit(this.normalStyle(), "scale"));
            this.state.visibleShape.toFront();

            // Keep mouseTarget in front of visible shape
            if (this.mouseTarget()) {
                this.mouseTarget().toFront();
            }
        }
        if (state.normalStyle !== prevState.normalStyle &&
                !_.isEqual(state.normalStyle, prevState.normalStyle)) {
            this.state.visibleShape.attr(this.normalStyle());
        }

        this.state.visibleShape.moveTo(this.coord());
        if (this.mouseTarget()) {
            this.mouseTarget().moveTo(this.coord());
        }
    },

    highlight: function(state, prevState) {
        if (state.isHovering && !prevState.isHovering) {
            state.visibleShape.animate(
                this.highlightStyle(),
                50
            );
        } else if (!state.isHovering && prevState.isHovering) {
            state.visibleShape.animate(
                this.normalStyle(),
                50
            );
        }
    },
};

draw.standard = [draw.basic, draw.highlight];


const remove = {
    basic: function() {
        if (this.state.visibleShape) {
            this.state.visibleShape.remove();
            this.state.visibleShape = null;
        }
    },
};

remove.standard = remove.basic;


const constraints = {
    fixed: function() {
        return function() { return false; };
    },

    snap: function(snap) {
        return function(coord) {
            if (snap === null) {
                return true;
            }
            snap = snap || this.graphie.snap;
            return kpoint.roundTo(coord, snap);
        };
    },

    bound: function(range, snap, paddingPx) {
        if (paddingPx === undefined) {
            if (range === undefined) {
                paddingPx = 10;
            } else {
                paddingPx = 0;
            }
        }
        return function(coord) {
            const graphie = this.graphie;
            range = range || graphie.range;
            if (snap === undefined) {
                snap = graphie.snap;
            }

            const lower = graphie.unscalePoint([
                paddingPx,
                graphie.ypixels - paddingPx,
            ]);
            const upper = graphie.unscalePoint([
                graphie.xpixels - paddingPx,
                paddingPx,
            ]);
            if (snap) {
                lower = kpoint.ceilTo(lower, snap);
                upper = kpoint.floorTo(upper, snap);
            }
            const coordX = Math.max(lower[0], Math.min(upper[0], coord[0]));
            const coordY = Math.max(lower[1], Math.min(upper[1], coord[1]));
            return [coordX, coordY];
        };
    },
};

constraints.standard = null;

module.exports = {
    add: add,
    modify: modify,
    draw: draw,
    remove: remove,

    onMoveStart: {standard: null},
    constraints: constraints,
    onMove: {standard: null},
    onMoveEnd: {standard: null},
    onClick: {standard: null},
};
