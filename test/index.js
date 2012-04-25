
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , keywords = require('../')
  , should = require('should')

mongoose.connect('localhost', 'mongoose_keywordize');

var schema = new Schema({
    name: { first: String, last: String }
  , tags: [String]
});

var opts = {};
opts.fields = ['name.first', 'name.last'];
opts.fn = function () {
  if (this.isModified('tags')) {
    return this.tags[1];
  }
}
opts.clean = function(val){
	return val.replace(/[^\w\d\s]|_/g, '');
}

schema.plugin(keywords, opts);

var Person = mongoose.model('Person', schema);

describe('plugin', function () {
  before(function (next) {
    mongoose.connection.on('open', next);
  });

  it('should have a version', function () {
    keywords.should.have.property('version');
  });

  it('should create a keywords property of type array', function () {
    Person.schema.path('keywords').casterConstructor.name.should.equal('SchemaString');
    var p = new Person;
    Array.isArray(p.keywords).should.be.true;
  });

  it('should add a keywordize method to the schema', function () {
    Person.prototype.keywordize.should.be.a('function');
  });

  describe('keywordize', function () {
    it('should populate the keywords', function () {
      var p = new Person({ name: { last: 'heckmann' }});
      p.keywords.length.should.equal(0);
      p.keywordize();
      p.keywords.length.should.equal(1);
      p.name.first = 'aaron';
      p.keywordize();
      p.keywords.length.should.equal(2);
      p.tags = "one two three".split(" ");
      p.keywordize();
      p.keywords.length.should.equal(3);
      p.keywordize();
      p.keywords.length.should.equal(3);
    });

    it('should return the keywords', function () {
      var p = new Person({ name: { last: 'agent', first: 'smith' }});
      p.keywordize().should.be.an.instanceof(Array);
      p.keywordize().length.should.equal(2);
    });

    it('should not allow duplicate keywords', function () {
      var p = new Person({ name: { last: 'smith', first: 'smith' }});
      p.keywordize().length.should.equal(1);
    });

    it('should trim the keywords', function () {
      var p = new Person({ name: { last: ' smith  ' }});
      p.keywordize()[0].should.equal('smith');
    });

    it('should lowercase the keywords', function () {
      var p = new Person({ name: { last: 'SmiTh' }});
      p.keywordize()[0].should.equal('smith');
    });

    it('should not lowercase keywords', function () {
      var s = new Schema({
          name: String
      });
      var opts = { fields: 'name', upper: true };
      s.plugin(keywords, opts);
      var A = mongoose.model('A', s);
      var a = new A;
      a.name = 'Stravinsky'
      a.keywordize()[0].should.equal('Stravinsky');
    });
  });

  describe('hooks', function () {
    it('should add the keywords when new', function (next) {
      var p = new Person({ name: { last: 'heckmann' }});
      p.keywords.length.should.equal(0);
      p.save(function (err) {
        if (err) return next(err);
        p.keywords.length.should.equal(1);
        p.keywords[0].should.equal('heckmann');
        next();
      });
    });

    it('should update the keywords if any field changed', function (next) {
      var p = new Person({ name: { last: 'heckmann' }});
      p.keywords.length.should.equal(0);
      p.save(function (err) {
        if (err) return next(err);
        p.keywords.length.should.equal(1);
        p.keywords[0].should.equal('heckmann');
        p.name.last = 'fuerstenau';
        p.save(function (err) {
          if (err) return next(err);
          p.keywords.length.should.equal(1);
          p.keywords[0].should.equal('fuerstenau');
          next();
        });
      });
    });
  });

	describe('callback options', function(){
	
		it('should have a filter option where value can be changed altogether', function(done){
			var schema = new Schema({
				title		: String,
				description	: String
			});
			var options = {
				fields: [ 'title', 'description' ],
				filter: function(values){
					for(var i = 0; i < values.length; i++){
						values[i] = values[i].replace(/[^\w\d\s]|_/g, '');
					}
					return values;
				}
			}
			schema.plugin(keywords, options);
			
			var Post = mongoose.model('Post', schema);
			var p = new Post({
				title		: 'testing: filter',
				description	: 'punctuation... should be stripped!'
			});
			p.keywords.should.have.length( 0 );
			p.save(function(err){
				if(err) return next(err);
				p.keywords.should.have.length( 6 );
				p.keywords.should.includeEql('punctuation');
				
				done();
			})
		})
	});

  after(function () {
    mongoose.disconnect();
  });

});


