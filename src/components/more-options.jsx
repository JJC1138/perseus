/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable no-var, react/sort-comp */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

/* A div that shows/hides its children.
 * (meant for use with editor widgets)
 */
var React = require("react");

var MoreOptions = React.createClass({
    propTypes: {
        children: React.PropTypes.node,
        show: React.PropTypes.bool,
    },

    getDefaultProps: function() {
        return {
            show: false,
        };
    },

    getInitialState: function() {
        return {
            show: this.props.show,
        };
    },

    render: function() {
        return <div className="more-options-container">
            {this.state.show && this.props.children}
            <div className="more-options-title" onClick={this.toggle}>
                {this.state.show ?
                    <span><i className="icon-chevron-up"   /> Less</span> :
                    <span><i className="icon-chevron-down" /> More</span>
                } Options...
            </div>
        </div>;
    },

    toggle: function() {
        this.setState({show: !this.state.show});
    },
});

module.exports = MoreOptions;
