#Mongoose-keywordize Plugin

Provides keyword derivation for [Mongoose](http://mongoosejs.com) documents.

[![Build Status](https://secure.travis-ci.org/aheckmann/mongoose-keywordize.png)](http://travis-ci.org/aheckmann/mongoose-keywordize)

Options:

  - fields: an array of paths you want watched and converted into keywords
  - fn: a custom function to execute when keywordize() runs
  - filter: a custom function where you can filter and then replace the values that will be converted into keywords

Example:

```js
var schema = new Schema({ name: String, title: String });
schema.plugin(keywordize, { fields: 'name title'.split(' ') });
```

This will introduce a new `keywordize()` document method which detects if any of the passed fields have been modified and updates the new `keywords` property appropriately.

Example:

```js
var Person = mongoose.model('Person', schema);
var me = new Person({ name: 'aaron' });
me.keywordize();
console.log(me.keywords) // ['aaron']
```

The `keywordize` method is always called upon saving each document, auto-updating to the latest keywords.

```js
me.title = 'Mr';
me.save(function (err) {
  console.log(me.keywords) // ['aaron', 'Mr']
})
```

One may also pass an optional function to run custom logic within the call to `keywordize`.

```js

var opts = {};
opts.fields = ['name', 'title']
opts.fn = function custom () {
  if ('Mister' === this.title) {
    return 'Mr';
  }
}
opts.filter = function(values){
  for(var i = 0; i < values.length; i++){
    values[i] = values[i].replace(/[^\w\d\s]|_/g, '');
  }
  return values;
}
var schema = new Schema({ name: String, title: String });
schema.plugin(keywordize, opts);

var Person = mongoose.model('Person', schema);
var me = new Person({ name: 'aaron' });
me.title = 'Mister';
me.keywordize();
console.log(me.keywords) // ['aaron', 'Mister', 'Mr']
```

The optional function will be executed within the context of the document meaning we have access to the documents properties through the `this` keyword.

Either a an Array or single string may be returned from the function and will be pushed onto the keywords array.

## Casing

By default mongoose-keywordize lowercases the keywords. To preserve casing pass the `upper: true` option to the plugin.

## Mongoose Version
`>= 2.x`

[LICENCE](https://github.com/aheckmann/mongoose-keywordize/blob/master/LICENSE)





