/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable no-var, react/jsx-closing-bracket-location, react/jsx-indent-props */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

/* globals KA */
const _ = require("underscore");

const SimpleMarkdown = require("simple-markdown");
const TeX = require("react-components/tex.jsx");
const Util = require("./util.js");

/**
 * This match function matches math in `$`s, such as:
 *
 * $y = x + 1$
 *
 * It functions roughly like the following regex:
 * /\$([^\$]*)\$/
 *
 * Unfortunately, math may have other `$`s inside it, as
 * long as they are inside `{` braces `}`, mostly for
 * `\text{ $math$ }`.
 *
 * To parse this, we can't use a regex, since we
 * should support arbitrary nesting (even though
 * MathJax actually only supports two levels of nesting
 * here, which we *could* parse with a regex).
 *
 * Non-regex matchers like this are now a first-class
 * concept in simple-markdown. Yay!
 *
 * This can also match block-math, which is math alone in a paragraph.
 */
const mathMatcher = (source, state, isBlock) => {
    const length = source.length;
    let index = 0;

    // When looking for blocks, skip over leading spaces
    if (isBlock) {
        if (state.inline) {
            return null;
        }
        while (index < length && source[index] === " ") {
            index++;
        }
    }

    // Our source must start with a "$"
    if (!(index < length && source[index] === "$")) {
        return null;
    }

    index++;
    const startIndex = index;
    let braceLevel = 0;

    // Loop through the source, looking for a closing '$'
    // closing '$'s only count if they are not escaped with
    // a `\`, and we are not in nested `{}` braces.
    while (index < length) {
        const character = source[index];

        if (character === "\\") {
            // Consume both the `\` and the escaped char as a single
            // token.
            // This is so that the second `$` in `$\\$` closes
            // the math expression, since the first `\` is escaping
            // the second `\`, but the second `\` is not escaping
            // the second `$`.
            // This also handles the case of escaping `$`s or
            // braces `\{`
            index++;

        } else if (braceLevel <= 0 && character === "$") {

            let endIndex = index + 1;
            if (isBlock) {
                // Look for two trailing newlines after the closing `$`
                const match = /^(?: *\n){2,}/.exec(source.slice(endIndex));
                endIndex = match ? endIndex + match[0].length : null;
            }

            // Return an array that looks like the results of a
            // regex's .exec function:
            // capture[0] is the whole string
            // capture[1] is the first "paren" match, which is the
            //   content of the math here, as if we wrote the regex
            //   /\$([^\$]*)\$/
            if (endIndex) {
                return [
                    source.substring(0, endIndex),
                    source.substring(startIndex, index),
                ];
            }
            return null;

        } else if (character === "{") {
            braceLevel++;

        } else if (character === "}") {
            braceLevel--;

        } else if (character === "\n" &&
                source[index - 1] === "\n") {
            // This is a weird case we supported in the old
            // math implementation--double newlines break
            // math. I'm preserving it for now because content
            // creators might have questions with single '$'s
            // in paragraphs...
            return null;
        }

        index++;
    }

    // we didn't find a closing `$`
    return null;
};
const mathMatch = (source, state) => mathMatcher(source, state, false);
const blockMathMatch = (source, state) => mathMatcher(source, state, true);

const TITLED_TABLE_REGEX = new RegExp(
    "^\\|\\| +(.*) +\\|\\| *\\n" +
    "(" +
    // The simple-markdown nptable regex, without
    // the leading `^`
    SimpleMarkdown.defaultRules.nptable.match.regex.source.substring(1) +
    ")"
);

const crowdinJiptMatcher = SimpleMarkdown.blockRegex(/^(crwdns.*)\n\s*\n/);

const rules = _.extend({}, SimpleMarkdown.defaultRules, {
    // NOTE: basically ignored by JIPT. wraps everything at the outer layer
    columns: {
        order: -2,
        match: SimpleMarkdown.blockRegex(/^([\s\S]*\n\n)={5,}\n\n([\s\S]*)/),
        parse: (capture, parse, state) => {
            return {
                col1: parse(capture[1], state),
                col2: parse(capture[2], state),
            };
        },
        react: (node, output, state) => {
            return <div className="perseus-two-columns" key={state.key}>
                <div className="perseus-column">
                    {output(node.col1, state)}
                </div>
                <div className="perseus-column">
                    {output(node.col2, state)}
                    {/* HACK(#sat) This is a cheap way to allow hints to be
                      * displayed in two-column items in the SAT mission. The
                      * hint renderer will be rendered into this div. Do not
                      * write code outside of the SAT mission that relies on
                      * this because this will be cleaned up with other SAT
                      * technical debt. */}
                    <div className="sat-grafting-area"/>
                </div>
            </div>;
        },
    },
    // Match paragraphs consisting solely of crowdin IDs
    // (they look roughly like crwdns9238932:0), which means that
    // crowdin is going to take the DOM node that ID is rendered into
    // and count it as the top-level translation node. They mutate this
    // node, so we need to make sure it is an outer node, not an inner
    // span. So here we parse this separately and just output the
    // raw string, which becomes the body of the <QuestionParagraph>
    // created by the Renderer.
    // This currently (2015-09-01) affects only articles, since
    // for exercises the renderer just renders the crowdin id to the
    // renderer div.
    crowdinId: {
        order: -1,
        match: (source, state, prevCapture) => {
            // Only match on the just-in-place translation site
            if (state.isJipt) {
                return crowdinJiptMatcher(source, state, prevCapture);
            } else {
                return null;
            }
        },
        parse: (capture, parse, state) => ({ id: capture[1] }),
        react: (node, output, state) => node.id,
    },
    // This is pretty much horrible, but we have a regex here to capture an
    // entire table + a title. capture[1] is the title. capture[2] of the
    // regex is a copy of the simple-markdown nptable regex. Then we turn
    // our capture[2] into tableCapture[0], and any further captures in
    // our table regex into tableCapture[1..], and we pass tableCapture to
    // our nptable regex
    titledTable: {
        // process immediately before nptables
        order: SimpleMarkdown.defaultRules.nptable.order - 0.5,
        match: SimpleMarkdown.blockRegex(TITLED_TABLE_REGEX),
        parse: (capture, parse, state) => {
            const title = SimpleMarkdown.parseInline(parse, capture[1], state);

            // Remove our [0] and [1] captures, and pass the rest to
            // the nptable parser
            const tableCapture = _.rest(capture, 2);
            const table = SimpleMarkdown.defaultRules.nptable.parse(
                tableCapture,
                parse,
                state
            );
            return {
                title: title,
                table: table,
            };
        },
        react: (node, output, state) => {
            const tableOutput = node.table ?
                SimpleMarkdown.defaultRules.table.react(
                    node.table,
                    output,
                    state
                ) :  // :( (middle of the ternary expression)
                "//invalid table//";
            return <div className="perseus-titled-table" key={state.key}>
                <div className="perseus-table-title">
                    {output(node.title, state)}
                </div>
                <div>{tableOutput}</div>
            </div>;
        },
    },
    widget: {
        order: SimpleMarkdown.defaultRules.link.order - 0.75,
        match: SimpleMarkdown.inlineRegex(Util.rWidgetRule),
        parse: (capture, parse, state) => {
            return {
                id: capture[1],
                widgetType: capture[2],
            };
        },
        react: (node, output, state) => {
            // The actual output is handled in the renderer, where
            // we know the current widget props/state. This is
            // just a stub for testing.
            return <em key={state.key}>
                [Widget: {node.id}]
            </em>;
        },
    },
    blockMath: {
        order: SimpleMarkdown.defaultRules.codeBlock.order + 0.5,
        match: blockMathMatch,
        parse: (capture, parse, state) => {
            return {
                content: capture[1],
            };
        },
        react: (node, output, state) => {
            // The actual output is handled in the renderer, because
            // it needs to pass in an `onRender` callback prop. This
            // is just a stub for testing.
            return <TeX key={state.key}>{node.content}</TeX>;
        },
    },
    math: {
        order: SimpleMarkdown.defaultRules.link.order - 0.25,
        match: mathMatch,
        parse: (capture, parse, state) => {
            return {
                content: capture[1],
            };
        },
        react: (node, output, state) => {
            // The actual output is handled in the renderer, because
            // it needs to pass in an `onRender` callback prop. This
            // is just a stub for testing.
            return <TeX key={state.key}>{node.content}</TeX>;
        },
    },
    fence: _.extend({}, SimpleMarkdown.defaultRules.fence, {
        parse: (capture, parse, state) => {
            const node = SimpleMarkdown.defaultRules.fence.parse(
                capture,
                parse,
                state
            );

            // support screenreader-only text with ```alt
            if (node.lang === "alt") {
                return {
                    type: "codeBlock",
                    lang: "alt",
                    // default codeBlock parsing doesn't parse the contents.
                    // We need to parse the contents for things like table
                    // support :).
                    // The \n\n is because the inside of the codeblock might
                    // not end in double newlines for block rules, because
                    // ordinarily we don't parse this :).
                    content: parse(node.content + "\n\n", state),
                };
            } else {
                return node;
            }
        },
    }),
    // Extend the SimpleMarkdown link parser to make the link
    // zero-rating-friendly if necessary. No changes will be made for
    // non-zero-rated requests, but zero-rated requests will be re-pointed at
    // either the zero-rated version of khanacademy.org or the external link
    // warning interstitial.
    link: _.extend({}, SimpleMarkdown.defaultRules.link, {
        react: function(node, output, state) {
            const link = SimpleMarkdown.defaultRules.link.react(node, output,
                                                                state);
            if (typeof KA === "undefined" || !KA.isZeroRated) {
                return link;
            }

            let href = link.props.href;
            if (href.match(/https?:\/\/[^\/]*khanacademy.org/)) {
                href = href.replace('khanacademy.org', 'zero.khanacademy.org');
            } else {
                href = '/zero/external-link?url=' + encodeURIComponent(href);
            }
            return React.cloneElement(link, {...link.props, href});
        },
    }),
    codeBlock: _.extend({}, SimpleMarkdown.defaultRules.codeBlock, {
        react: (node, output, state) => {
            // ideally this should be a different rule, with only an
            // output function, but right now that breaks the parser.
            if (node.lang === "alt") {
                return <div
                    key={state.key}
                    className="perseus-markdown-alt perseus-sr-only"
                >
                    {output(node.content, state)}
                </div>;
            } else {
                return SimpleMarkdown.defaultRules.codeBlock.react(
                    node,
                    output,
                    state
                );
            }
        },
    }),
    list: _.extend({}, SimpleMarkdown.defaultRules.list, {
        match: (source, state, prevCapture) => {
            // Since lists can contain double newlines and we have special
            // handling of double newlines while parsing jipt content, just
            // disable the list parser.
            if (state.isJipt) {
                return null;
            } else {
                return SimpleMarkdown.defaultRules.list.match(
                    source, state, prevCapture);
            }
        },
    }),
});

const builtParser = SimpleMarkdown.parserFor(rules);
const parse = (source, state) => {
    const paragraphedSource = source + "\n\n";

    return builtParser(paragraphedSource, _.extend(
        { inline: false },
        state
    ));
};
const inlineParser = (source, state) => {
    return builtParser(source, _.extend(
        { inline: true },
        state
    ));
};

/**
 * Traverse all of the nodes in the Perseus Markdown AST. The callback is
 * called for each node in the AST.
 */
const traverseContent = (ast, cb) => {
    if (_.isArray(ast)) {
        _.each(ast, (node) => traverseContent(node, cb));
    } else if (_.isObject(ast)) {
        cb(ast);
        if (ast.type === "table") {
            traverseContent(ast.header, cb);
            traverseContent(ast.cells, cb);
        } else if (ast.type === "list") {
            traverseContent(ast.items, cb);
        } else if (ast.type === "titledTable") {
            traverseContent(ast.table, cb);
        } else if (ast.type === "columns") {
            traverseContent(ast.col1, cb);
            traverseContent(ast.col2, cb);
        } else if (_.isArray(ast.content)) {
            traverseContent(ast.content, cb);
        }
    }
};

/**
 * Pull out text content from a Perseus Markdown AST.
 * Returns an array of strings.
 */
const getContent = (ast) => {
    // Simplify logic by dealing with a single AST node at a time
    if (_.isArray(ast)) {
        return _.flatten(_.map(ast, getContent));
    }

    // Base case: This is where we actually extract text content
    if (ast.content && _.isString(ast.content)) {
        // Collapse whitespace within content unless it is code
        if (ast.type.toLowerCase().indexOf('code') !== -1) {
            // In case this is the sole child of a paragraph,
            // prevent whitespace from being trimmed later
            return ['', ast.content, ''];
        } else {
            return [ast.content.replace(/\s+/g, ' ')];
        }
    }

    // Recurse through child AST nodes
    // Assumptions made:
    // 1) Child AST nodes are either direct properties or inside
    //    arbitrarily nested lists that are direct properties.
    // 2) Only AST nodes have a 'type' property.
    const children = _.chain(ast)
        .values()
        .flatten()
        .filter((object) => object != null && _.has(object, 'type'))
        .value();

    if (!children.length) {
        return [];
    } else {
        const nestedContent = getContent(children);
        if (ast.type === 'paragraph' && nestedContent.length) {
            // Trim whitespace before or after a paragraph
            nestedContent[0] = nestedContent[0].replace(/^\s+/, '');
            const last = nestedContent.length - 1;
            nestedContent[last] = nestedContent[last].replace(/\s+$/, '');
        }
        return nestedContent;
    }
};

/**
 * Count the number of characters in Perseus Markdown source.
 * Markdown markup and widget references are ignored.
 */
const characterCount = (source) => {
    const ast = parse(source);
    const content = getContent(ast).join('');
    return content.length;
};

module.exports = {
    characterCount: characterCount,
    traverseContent: traverseContent,
    parse: parse,
    parseInline: inlineParser,
    reactFor: SimpleMarkdown.reactFor,
    ruleOutput: SimpleMarkdown.ruleOutput(rules, "react"),
    basicOutput: SimpleMarkdown.reactFor(
        SimpleMarkdown.ruleOutput(rules, "react")
    ),
    sanitizeUrl: SimpleMarkdown.sanitizeUrl,
};

