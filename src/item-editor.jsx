const React = require('react');
const _ = require("underscore");

const ApiOptions = require("./perseus-api.jsx").Options;
const Editor = require("./editor.jsx");
const ItemExtrasEditor = require("./item-extras-editor.jsx");
const ITEM_DATA_VERSION = require("./version.json").itemDataVersion;

const ItemEditor = React.createClass({
    propTypes: {
        // TODO(JJC1138): This could be replaced with a more specific prop spec:
        answerArea: React.PropTypes.any,
        apiOptions: ApiOptions.propTypes,
        gradeMessage: React.PropTypes.string,
        imageUploader: React.PropTypes.func,
        onChange: React.PropTypes.func,
        previewWidth: React.PropTypes.number.isRequired,
        // TODO(JJC1138): This could be replaced with a more specific prop spec:
        question: React.PropTypes.any,
        wasAnswered: React.PropTypes.bool,
    },

    getDefaultProps: function() {
        return {
            answerArea: {},
            apiOptions: ApiOptions.defaults,
            onChange: () => {},
            question: {},
        };
    },

    // Notify the parent that the question or answer area has been updated.
    updateProps: function(newProps, cb, silent) {
        const props = _(this.props).pick("question", "answerArea");

        this.props.onChange(_(props).extend(newProps), cb, silent);
    },

    handleEditorChange: function(newProps, cb, silent) {
        const question = _.extend({}, this.props.question, newProps);
        this.updateProps({ question }, cb, silent);
    },

    handleItemExtrasChange: function(newProps, cb, silent) {
        const answerArea = _.extend({}, this.props.answerArea, newProps);
        this.updateProps({ answerArea }, cb, silent);
    },

    getSaveWarnings: function() {
        return this.refs.questionEditor.getSaveWarnings();
    },

    serialize: function(options) {
        return {
            question: this.refs.questionEditor.serialize(options),
            answerArea: this.refs.itemExtrasEditor.serialize(options),
            itemDataVersion: ITEM_DATA_VERSION,
        };
    },

    focus: function() {
        this.questionEditor.focus();
    },

    render: function() {
        const previewWidth = this.props.previewWidth;

        return <div className="perseus-editor-table">
            <div className="perseus-editor-row perseus-question-container">
                <div className="perseus-editor-left-cell">
                    <div className="pod-title">Question</div>
                    <Editor
                        ref="questionEditor"
                        placeholder="Type your question here..."
                        className="perseus-question-editor"
                        imageUploader={this.props.imageUploader}
                        onChange={this.handleEditorChange}
                        apiOptions={this.props.apiOptions}
                        showWordCount={true}
                        {...this.props.question}
                    />
                </div>

                <div
                    className="perseus-editor-right-cell"
                    style={{width: previewWidth, maxWidth: previewWidth}}
                >
                    <div id="problemarea">
                        <div id="workarea" className="workarea" />
                        <div
                            id="hintsarea"
                            className="hintsarea"
                            style={{display: "none"}}
                        />
                    </div>
                </div>
            </div>

            <div className="perseus-editor-row perseus-answer-container">
                <div className="perseus-editor-left-cell">
                    <div className="pod-title">Question extras</div>
                    <ItemExtrasEditor
                        ref="itemExtrasEditor"
                        onChange={this.handleItemExtrasChange}
                        {...this.props.answerArea}
                    />
                </div>

                <div
                    className="perseus-editor-right-cell"
                    style={{width: previewWidth, maxWidth: previewWidth}}
                >
                    <div id="answer_area" />
                </div>
            </div>
        </div>;
    },
});

module.exports = ItemEditor;
