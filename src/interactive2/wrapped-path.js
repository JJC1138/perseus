/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable no-var */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

const _ = require("underscore");
const WrappedDefaults = require("./wrapped-defaults.js");

const DEFAULT_OPTIONS = {
    center: null, // gets ignored in `graphie.fixedPath` if `null`
    createPath: null, // gets defaulted in `graphie.fixedPath` if `null`
    mouselayer: false,
};

const WrappedPath = function(graphie, points, options) {
    options = _.extend({}, DEFAULT_OPTIONS, options);

    // Add `wrapper` and `visibleShape`
    _.extend(this, graphie.fixedPath(points, options.center,
        options.createPath));

    // Add remaining properties
    _.extend(this, {
        graphie: graphie,
        initialPoint: graphie.scalePoint(_.head(points)),
    });

    // Add to appropriate graphie layer
    if (options.mouselayer) {
        this.graphie.addToMouseLayerWrapper(this.wrapper);
    } else {
        this.graphie.addToVisibleLayerWrapper(this.wrapper);
    }
};

_.extend(WrappedPath.prototype, WrappedDefaults);

module.exports = WrappedPath;
