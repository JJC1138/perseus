/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable react/sort-comp */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

const classNames = require("classnames");
const React = require("react");
const _ = require("underscore");

const diff = require("../../lib/jsdiff");
const splitDiff = require("./split-diff.jsx");
const stringArrayDiff = require("./string-array-diff.jsx");

const BEFORE = "before";
const AFTER = "after";

const IMAGE_REGEX = /http.*?\.png/g;

const imagesInString = function(str) {
    return str.match(IMAGE_REGEX) || [];
};

const classFor = function(entry, ifAdded, ifRemoved) {
    if (entry.added) {
        return ifAdded;
    } else if (entry.removed) {
        return ifRemoved;
    } else {
        return "";
    }
};

const ImageDiffSide = React.createClass({
    propTypes: {
        images: React.PropTypes.arrayOf(React.PropTypes.shape({
            status: React.PropTypes.string.isRequired,
            value: React.PropTypes.string.isRequired,
        })).isRequired,
        side: React.PropTypes.oneOf([BEFORE, AFTER]).isRequired,
    },

    render: function() {
        return <div>
            {this.props.images.length > 0 &&
                <div className="diff-header">Images</div>}
            {_.map(this.props.images, (entry, index) => {
                const className = classNames({
                    "image": true,
                    "image-unchanged": entry.status === "unchanged",
                    "image-added": entry.status === "added",
                    "image-removed": entry.status === "removed",
                });
                return <div key={index}>
                    <img src={entry.value}
                        title={entry.value}
                        className={className}
                    />
                </div>;
            })}
        </div>;
    },
});

const TextDiff = React.createClass({
    propTypes: {
        after: React.PropTypes.string,
        before: React.PropTypes.string,
        title: React.PropTypes.string,
    },

    getDefaultProps: function() {
        return {
            after: "",
            before: "",
            title: "",
        };
    },

    getInitialState: function() {
        return {
            collapsed: this.props.before === this.props.after,
        };
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState({
            collapsed: nextProps.before === nextProps.after,
        });
    },

    render: function() {
        const diffed = diff.diffWords(this.props.before, this.props.after);

        const lines = splitDiff(diffed);

        const beforeImages = imagesInString(this.props.before);
        const afterImages = imagesInString(this.props.after);

        const images = stringArrayDiff(beforeImages, afterImages);

        const renderedLines = _.map(lines, (line) => {
            const contents = {};

            contents.before = _(line).map(function(entry, i) {
                const className =
                    classFor(entry, "not-present", "removed dark");
                return <span
                    key={i}
                    className={className}
                >
                    {entry.value}
                </span>;
            });

            contents.after = _(line).map(function(entry, i) {
                const className =
                    classFor(entry, "added dark", "not-present");
                return <span
                    key={i}
                    className={className}
                >
                    {entry.value}
                </span>;
            });
            return contents;
        });

        const className = classNames({
            "diff-row": true,
            "collapsed": this.state.collapsed,
        });

        return <div>
            <div className="ui-helper-clearfix">
                {_.map([BEFORE, AFTER], (side, index) => {
                    return <div className={"diff-row " + side} key={index}>
                        {!this.state.collapsed &&
                            _.map(renderedLines, (line, lineNum) => {
                                const changed = line[side].length > 1;
                                const lineClass = classNames({
                                    "diff-line": true,
                                    "added": side === AFTER && changed,
                                    "removed": side === BEFORE && changed,
                                });
                                return <div
                                    className={lineClass}
                                    key={lineNum}
                                >
                                    {line[side]}
                                </div>;
                            })}
                        {!this.state.collapsed &&
                            <ImageDiffSide
                                side={side}
                                images={images[side]}
                            />
                        }
                    </div>;
                })}
            </div>
            {_.map([BEFORE, AFTER], (side, index) => {
                return <div
                    className={className + " " + side}
                    key={index}
                    onClick={this.handleExpand}
                >
                    {this.state.collapsed &&
                    <span>
                        <span className="expand-button" >
                            {" "}[ show unmodified ]
                        </span>
                    </span>}
                </div>;
            })}
        </div>;
    },

    handleExpand: function() {
        this.setState({ collapsed: false });
    },
});

module.exports = TextDiff;
