'use strict';

/**
 * Local dependencies
 */

import Ruler      from './ruler';
import StateBlock from './rules_block/state_block';
import ruleCode from './rules_block/code';
import ruleFences from './rules_block/fences';
import ruleBlockquote from './rules_block/blockquote';
import ruleHr from './rules_block/hr';
import ruleList from './rules_block/list';
import ruleFootnote from './rules_block/footnote';
import ruleHeading from './rules_block/heading';
import ruleLheading from './rules_block/lheading';
import ruleHtmlblock from './rules_block/htmlblock';
import ruleTable from './rules_block/table';
import ruleDeflist from './rules_block/deflist';
import ruleParagraph from './rules_block/paragraph';

/**
 * Parser rules
 */

var _rules = [
  [ 'code',       ruleCode],
  [ 'fences',     ruleFences,     [ 'paragraph', 'blockquote', 'list' ] ],
  [ 'blockquote', ruleBlockquote, [ 'paragraph', 'blockquote', 'list' ] ],
  [ 'hr',         ruleHr,         [ 'paragraph', 'blockquote', 'list' ] ],
  [ 'list',       ruleList,       [ 'paragraph', 'blockquote' ] ],
  [ 'footnote',   ruleFootnote,   [ 'paragraph' ] ],
  [ 'heading',    ruleHeading,    [ 'paragraph', 'blockquote' ] ],
  [ 'lheading',   ruleLheading],
  [ 'htmlblock',  ruleHtmlblock,  [ 'paragraph', 'blockquote' ] ],
  [ 'table',      ruleTable,      [ 'paragraph' ] ],
  [ 'deflist',    ruleDeflist,    [ 'paragraph' ] ],
  [ 'paragraph',  ruleParagraph]
];

/**
 * Block Parser class
 *
 * @api private
 */

function ParserBlock() {
  this.ruler = new Ruler();
  for (var i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1], {
      alt: (_rules[i][2] || []).slice()
    });
  }
}

/**
 * Generate tokens for the given input range.
 *
 * @param  {Object} `state` Has properties like `src`, `parser`, `options` etc
 * @param  {Number} `startLine`
 * @param  {Number} `endLine`
 * @api private
 */

ParserBlock.prototype.tokenize = function (state, startLine, endLine) {
  var rules = this.ruler.getRules('');
  var len = rules.length;
  var line = startLine;
  var hasEmptyLines = false;
  var ok, i;

  while (line < endLine) {
    state.line = line = state.skipEmptyLines(line);
    if (line >= endLine) {
      break;
    }

    // Termination condition for nested calls.
    // Nested calls currently used for blockquotes & lists
    if (state.tShift[line] < state.blkIndent) {
      break;
    }

    // Try all possible rules.
    // On success, rule should:
    //
    // - update `state.line`
    // - update `state.tokens`
    // - return true

    for (i = 0; i < len; i++) {
      ok = rules[i](state, line, endLine, false);
      if (ok) {
        break;
      }
    }

    // set state.tight iff we had an empty line before current tag
    // i.e. latest empty line should not count
    state.tight = !hasEmptyLines;

    // paragraph might "eat" one newline after it in nested lists
    if (state.isEmpty(state.line - 1)) {
      hasEmptyLines = true;
    }

    line = state.line;

    if (line < endLine && state.isEmpty(line)) {
      hasEmptyLines = true;
      line++;

      // two empty lines should stop the parser in list mode
      if (line < endLine && state.parentType === 'list' && state.isEmpty(line)) { break; }
      state.line = line;
    }
  }
};

var TABS_SCAN_RE = /[\n\t]/g;
var NEWLINES_RE  = /\r[\n\u0085]|[\u2424\u2028\u0085]/g;
var SPACES_RE    = /\u00a0/g;

/**
 * Tokenize the given `str`.
 *
 * @param  {String} `str` Source string
 * @param  {Object} `options`
 * @param  {Object} `env`
 * @param  {Array} `outTokens`
 * @api private
 */

ParserBlock.prototype.parse = function (str, options, env, outTokens) {
  var state, lineStart = 0, lastTabPos = 0;
  if (!str) { return []; }

  // Normalize spaces
  str = str.replace(SPACES_RE, ' ');

  // Normalize newlines
  str = str.replace(NEWLINES_RE, '\n');

  // Replace tabs with proper number of spaces (1..4)
  if (str.indexOf('\t') >= 0) {
    str = str.replace(TABS_SCAN_RE, function (match, offset) {
      var result;
      if (str.charCodeAt(offset) === 0x0A) {
        lineStart = offset + 1;
        lastTabPos = 0;
        return match;
      }
      result = '    '.slice((offset - lineStart - lastTabPos) % 4);
      lastTabPos = offset - lineStart + 1;
      return result;
    });
  }

  state = new StateBlock(str, this, options, env, outTokens);
  this.tokenize(state, state.line, state.lineMax);
};

/**
 * Expose `ParserBlock`
 */

export default ParserBlock;
