var natural			= require('natural'),
	phonetic		= natural.Metaphone,
	stemmer			= natural.PorterStemmer,
	metaphone		= phonetic.process;

stemmer.attach();
phonetic.attach();

// mongoose-keywordize

module.exports = exports = function keywordize (schema, options) {
  if (!Array.isArray(options.fields)) options.fields = [options.fields];

  var fields = options.fields.slice()
    , fn = 'function' == typeof options.fn && options.fn
    , upper = !! options.upper // if true, keywords will not be lowercased

  schema.add({ keywords: [String] });
  schema.path('keywords').index( true );

  /**
   * Keywordize.
   *
   * Breaks apart field values into separate keywords.
   * @return {MongooseArray}
   * @api public
   */

  schema.methods.keywordize = function () {
    var self = this;

    var values = fields.map(function (field) {
      return self.get(field);
    });

    if (fn) {
      var res = fn.call(self);
      if (undefined !== res) {
        if (!Array.isArray(res)) res = [res];
        values = values.concat(res);
      }
    }
	
    this.set('keywords', []);
    var keywords = this.keywords;
    var i = values.length;

    while (i--) {
      exports.process(values[i]).forEach(function (word) {
        if (word) {
          if (upper)
            keywords.addToSet(word);
          else
            keywords.addToSet(word.toLowerCase());
        }
      })
    }

    return keywords;
  }

  /**
   * Update the keywords if any field changed.
   */

  schema.pre('save', function (next) {
    var self = this;

    var changed = this.isNew || fields.some(function (field) {
      return self.isModified(field);
    });

    if (changed) this.keywordize();
    next();
  });
}

/**
 *	Expose chunk of text process
 */

exports.process = function(value){
	var arr = value.tokenizeAndStem();
	for(var i = 0; i < arr.length; i++){
		arr[i] = metaphone( arr[i] ).toLowerCase();
	}
	return arr;
};

/**
 * Expose version.
 */

exports.version = JSON.parse(
    require('fs').readFileSync(__dirname + '/../package.json')
).version;
