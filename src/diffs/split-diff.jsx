/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable no-var */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

// Split a word-wise diff generated by jsdiff into multiple lines, for the
// purpose of breaking up the diffs into lines, so that modified lines can be
// faintly highlighted

const _ = require("underscore");

const splitDiff = function(diffEntries) {
    const lines = [];
    let currentLine = [];
    _.each(diffEntries, (entry) => {
        const values = entry.value.split("\n");
        _.each(values, (value, i) => {
            const isNewline = i > 0;
            if (isNewline) {
                lines.push(currentLine);
                currentLine = [];
            }
            const newEntry = _.extend({}, entry, { value: value });
            currentLine.push(newEntry);
        });
    });

    if (currentLine.length) {
        lines.push(currentLine);
    }
    return lines;
};


module.exports = splitDiff;
