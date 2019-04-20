'use strict';

/**
 * Local dependencies
 */

import Ruler       from './ruler';
import StateInline from './rules_inline/state_inline';
import * as utils       from './common/utils';
import ruleText    from './rules_inline/text';
import ruleNewline from './rules_inline/newline';
import ruleEscape  from './rules_inline/escape';
import ruleBackticks from './rules_inline/backticks';
import ruleDel from './rules_inline/del';
import ruleIns from './rules_inline/ins';
import ruleMark from './rules_inline/mark';
import ruleEmphasis from  './rules_inline/emphasis';
import ruleSub from './rules_inline/sub';
import ruleSup from './rules_inline/sup';
import ruleLinks from './rules_inline/links';
import ruleFootnoteInline from './rules_inline/footnote_inline';
import ruleFootnoteRef from './rules_inline/footnote_ref';
import ruleAutolink from  './rules_inline/autolink';
import ruleHtmltag from './rules_inline/htmltag';
import ruleEntity from './rules_inline/entity';

/**
 * Inline Parser `rules`
 */

var _rules = [
  [ 'text',             ruleText],
  [ 'newline',          ruleNewline],
  [ 'escape',           ruleEscape],
  [ 'backticks',        ruleBackticks],
  [ 'del',              ruleDel],
  [ 'ins',              ruleIns],
  [ 'mark',             ruleMark],
  [ 'emphasis',         ruleEmphasis],
  [ 'sub',              ruleSub],
  [ 'sup',              ruleSup],
  [ 'links',            ruleLinks],
  [ 'footnote_inline',  ruleFootnoteInline],
  [ 'footnote_ref',     ruleFootnoteRef],
  [ 'autolink',         ruleAutolink],
  [ 'htmltag',          ruleHtmltag],
  [ 'entity',           ruleEntity]
];

/**
 * Inline Parser class. Note that link validation is stricter
 * in Remarkable than what is specified by CommonMark. If you
 * want to change this you can use a custom validator.
 *
 * @api private
 */

function ParserInline() {
  this.ruler = new Ruler();
  for (var i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1]);
  }

  // Can be overridden with a custom validator
  this.validateLink = validateLink;
}

/**
 * Skip a single token by running all rules in validation mode.
 * Returns `true` if any rule reports success.
 *
 * @param  {Object} `state`
 * @api privage
 */

ParserInline.prototype.skipToken = function (state) {
  var rules = this.ruler.getRules('');
  var len = rules.length;
  var pos = state.pos;
  var i, cached_pos;

  if ((cached_pos = state.cacheGet(pos)) > 0) {
    state.pos = cached_pos;
    return;
  }

  for (i = 0; i < len; i++) {
    if (rules[i](state, true)) {
      state.cacheSet(pos, state.pos);
      return;
    }
  }

  state.pos++;
  state.cacheSet(pos, state.pos);
};

/**
 * Generate tokens for the given input range.
 *
 * @param  {Object} `state`
 * @api private
 */

ParserInline.prototype.tokenize = function (state) {
  var rules = this.ruler.getRules('');
  var len = rules.length;
  var end = state.posMax;
  var ok, i;

  while (state.pos < end) {

    // Try all possible rules.
    // On success, the rule should:
    //
    // - update `state.pos`
    // - update `state.tokens`
    // - return true
    for (i = 0; i < len; i++) {
      ok = rules[i](state, false);

      if (ok) {
        break;
      }
    }

    if (ok) {
      if (state.pos >= end) { break; }
      continue;
    }

    state.pending += state.src[state.pos++];
  }

  if (state.pending) {
    state.pushPending();
  }
};

/**
 * Parse the given input string.
 *
 * @param  {String} `str`
 * @param  {Object} `options`
 * @param  {Object} `env`
 * @param  {Array} `outTokens`
 * @api private
 */

ParserInline.prototype.parse = function (str, options, env, outTokens) {
  var state = new StateInline(str, this, options, env, outTokens);
  this.tokenize(state);
};

/**
 * Validate the given `url` by checking for bad protocols.
 *
 * @param  {String} `url`
 * @return {Boolean}
 */

function validateLink(url) {
  var BAD_PROTOCOLS = [ 'vbscript', 'javascript', 'file', 'data' ];
  var str = url.trim().toLowerCase();
  // Care about digital entities "javascript&#x3A;alert(1)"
  str = utils.replaceEntities(str);
  if (str.indexOf(':') !== -1 && BAD_PROTOCOLS.indexOf(str.split(':')[0]) !== -1) {
    return false;
  }
  return true;
}

/**
 * Expose `ParserInline`
 */

export default ParserInline;
