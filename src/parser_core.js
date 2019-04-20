'use strict';

/**
 * Local dependencies
 */

import Ruler from './ruler';
import ruleBlock from './rules_core/block';
import ruleAbbr from './rules_core/abbr';
import ruleReferences from './rules_core/references';
import ruleInline from './rules_core/inline';
import ruleFootnoteTail from './rules_core/footnote_tail';
import ruleAbbr2 from './rules_core/abbr2';
import ruleReplacements from './rules_core/replacements';
import ruleSmartquotes from './rules_core/smartquotes';
import ruleLinkify from './rules_core/linkify';

/**
 * Core parser `rules`
 */

var _rules = [
  [ 'block',                    ruleBlock],
  [ 'abbr',                     ruleAbbr],
  [ 'references',               ruleReferences],
  [ 'inline',                   ruleInline],
  [ 'footnote_tail',            ruleFootnoteTail],
  [ 'abbr2',                    ruleAbbr2],
  [ 'replacements',             ruleReplacements],
  [ 'smartquotes',              ruleSmartquotes],
  [ 'linkify',                  ruleLinkify]
];

/**
 * Class for top level (`core`) parser rules
 *
 * @api private
 */

function Core() {
  this.options = {};
  this.ruler = new Ruler();
  for (var i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1]);
  }
}

/**
 * Process rules with the given `state`
 *
 * @param  {Object} `state`
 * @api private
 */

Core.prototype.process = function (state) {
  var i, l, rules;
  rules = this.ruler.getRules('');
  for (i = 0, l = rules.length; i < l; i++) {
    rules[i](state);
  }
};

/**
 * Expose `Core`
 */

export default Core;
