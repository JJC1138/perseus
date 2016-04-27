/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable no-var, react/jsx-closing-bracket-location, react/jsx-sort-prop-types, react/sort-comp */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

const React = require("react");
const _ = require("underscore");

const Changeable   = require("../mixins/changeable.jsx");
const EditorJsonify = require("../mixins/editor-jsonify.jsx");

const Editor = require("../editor.jsx");
const InfoTip = require("../components/info-tip.jsx");
const PropCheckBox  = require("../components/prop-check-box.jsx");

const PassageEditor = React.createClass({
    mixins: [EditorJsonify, Changeable],

    propTypes: {
        onChange: React.PropTypes.func.isRequired,
        passageTitle: React.PropTypes.string,
        passageText: React.PropTypes.string,
        footnotes: React.PropTypes.string,
        showLineNumbers: React.PropTypes.bool,
    },

    getDefaultProps: function() {
        return {
            passageTitle: "",
            passageText: "",
            footnotes: "",
            showLineNumbers: true,
        };
    },

    render: function() {
        const passageEditor = <Editor
            ref="passage-editor"
            content={this.props.passageText}
            widgetEnabled={false}
            placeholder="Type passage here..."
            onChange={(newProps) => {
                this.change({ passageText: newProps.content });
            }}
            showWordCount={true}
        />;
        const footnotesEditor = <Editor
            ref="passage-footnotes-editor"
            content={this.props.footnotes}
            widgetEnabled={false}
            placeholder="Type footnotes here..."
            onChange={(newProps) => {
                this.change({ footnotes: newProps.content });
            }}
        />;
        return <div className="perseus-widget-passage-editor">
            <div className="perseus-widget-row">
                <PropCheckBox
                    label="Show line numbers"
                    labelAlignment="right"
                    showLineNumbers={this.props.showLineNumbers}
                    onChange={this.props.onChange} />
            </div>
            <div>
                Passage title:
                <InfoTip>
                    <p>An optional title that will appear directly above the
                    passage in the same font style. (E.g. Passage 1)</p>
                </InfoTip>
                <div>
                    <input
                        type="text"
                        defaultValue={this.props.passageTitle}
                        onChange={(e) => {
                            this.change({ passageTitle: e.target.value });
                        }} />
                </div>
            </div>
            <div>
                Passage Text:
                {passageEditor}
            </div>
            <div>
                Footnotes:
                <InfoTip>
                    <p>To add footnotes, add ^ characters where they belong in
                    the passage. Then, add ^ in the footnotes area to reference
                    the footnotes in the passage.</p>
                </InfoTip>
                {footnotesEditor}
            </div>
        </div>;
    },
});

module.exports = PassageEditor;
