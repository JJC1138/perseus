/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable react/sort-comp */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

const React = require("react");
const TeX = require("react-components/tex.jsx");

const ButtonGroup = require("react-components/button-group.jsx");
const Changeable = require("../../mixins/changeable.jsx");
const MathInput = require("../../components/math-input.jsx");
const NumberInput = require("../../components/number-input.jsx");

const ConstraintEditor = React.createClass({
    mixins: [Changeable],

    propTypes: {
        constraint: React.PropTypes.string,
        constraintFn: React.PropTypes.string,
        constraintXMax: React.PropTypes.string,
        constraintXMin: React.PropTypes.string,
        constraintYMax: React.PropTypes.string,
        constraintYMin: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired,
        snap: React.PropTypes.number,
    },

    getDefaultProps: function() {
        return {
            constraint: "none",
            constraintFn: "0",
            constraintXMax: "10",
            constraintXMin: "-10",
            constraintYMax: "10",
            constraintYMin: "-10",
            snap: 0.5,
        };
    },

    render: function() {
        return <div>
            <div className="perseus-widget-row">
                Constraint: <ButtonGroup value={this.props.constraint}
                    allowEmpty={false}
                    buttons={[
                        {value: "none", content: "None"},
                        {value: "snap", content: "Snap"},
                        {value: "x",    content: "x="},
                        {value: "y",    content: "y="}]}
                    onChange={this.change("constraint")}
                />
            </div>
            {this.props.constraint === "snap" &&
                <div className="perseus-widget-row">
                    Snap: <NumberInput
                        value={this.props.snap}
                        placeholder={0}
                        onChange={this.change("snap")}
                    />
            </div>}
            {this.props.constraint === "x" && <div className="graph-settings">
                <div className="perseus-widget-row">
                    <TeX>x=</TeX> <MathInput
                        buttonSets={[]}
                        buttonsVisible={"never"}
                        value={this.props.constraintFn}
                        onChange={this.change("constraintFn")}
                    />
                </div>
            </div>}
            {this.props.constraint === "y" && <div className="graph-settings">
                <div className="perseus-widget-row">
                    <TeX>y=</TeX> <MathInput
                        buttonSets={[]}
                        buttonsVisible={"never"}
                        value={this.props.constraintFn}
                        onChange={this.change("constraintFn")}
                    />
                </div>
            </div>}
            Ensure these are set so nothing can be dragged off the canvas:
            <div className="perseus-widget-row">
                <div className="perseus-widget-row">
                    <TeX>x \in \Large[</TeX> <MathInput
                        buttonSets={[]}
                        buttonsVisible={"never"}
                        value={this.props.constraintXMin}
                        onChange={this.change("constraintXMin")}
                    />
                    <TeX>, </TeX> <MathInput
                        buttonSets={[]}
                        buttonsVisible={"never"}
                        value={this.props.constraintXMax}
                        onChange={this.change("constraintXMax")}
                    /> <TeX>\Large]</TeX>
                </div>
            </div>
            <div className="perseus-widget-row">
                <div className="perseus-widget-row">
                    <TeX>y \in \Large[</TeX> <MathInput
                        buttonSets={[]}
                        buttonsVisible={"never"}
                        value={this.props.constraintYMin}
                        onChange={this.change("constraintYMin")}
                    />
                    <TeX>, </TeX> <MathInput
                        buttonSets={[]}
                        buttonsVisible={"never"}
                        value={this.props.constraintYMax}
                        onChange={this.change("constraintYMax")}
                    /> <TeX>\Large]</TeX>
                </div>
            </div>
        </div>;
    },
});

module.exports = ConstraintEditor;
