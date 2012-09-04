var assert = require('assert');
var Guid = require('guid');
var Model = require('../index');

describe('Model', function() {

  var TestModel1;

  before(function() {
    TestModel1 = Model.define({
      dataStore: { type: Model.MemoryStore },
      fields: {
        id: undefined,
        username: undefined,
        age: {
          default: 1,
          set: function(value) {
            value = parseInt(value, 10);
            return (isNaN(value)) ? 30 : value ;
          }
        },
        first: 'John',
        last: 'Doe'
      },
      virtual: {
        name: function() {
          return ((this.first || '') + ' ' + (this.last || '')).trim();
        }
      }
    });
  });

  it('should be defined correctly', function() {
    // Check for the presence of all defined model properties (virtual and real)
    assert.ok("id" in TestModel1.prototype);
    assert.ok("username" in TestModel1.prototype);
    assert.ok("first" in TestModel1.prototype);
    assert.ok("last" in TestModel1.prototype);
    assert.ok("name" in TestModel1.prototype);
    
    // Only defined properties should  reside on the prototype...
    assert.equal(6, Object.keys(TestModel1.prototype).length);
    
    // Check for presence of defined properties on instance...
    var model = new TestModel1();
    
    assert.equal(TestModel1, model.constructor);

    assert.ok("id" in model);
    assert.ok("username" in model);
    assert.ok("first" in model);
    assert.ok("last" in model);
    assert.ok("name" in model);
  });

  it('should provide default property values', function() {
    var model1,
        model2;

    model1 = new TestModel1();
    
    // Check all default values...
    assert.equal(undefined, model1.username);
    assert.equal('John', model1.first);
    assert.equal('Doe', model1.last);
    assert.equal('John Doe', model1.name);
    
    // Set new value...
    model1.first = 'Rad';
    assert.equal('Rad', model1.first);
    assert.equal('Rad Doe', model1.name);
    
    // Unset value, ensure defaults...
    model1.first = undefined;
    assert.equal('John', model1.first);
    assert.equal('John Doe', model1.name);
    
    // Check function-type defaults for re-execution...
    // TODO: do this on a non-ID property
    // model1.id = undefined;
    // assert.equal(3, model1.id, 'Function-default should have executed, incrementing the ID.');

    // Instantiate with a non-default value...
    model2 = new TestModel1({ first: 'Rad' });
    assert.equal('Rad', model2.first);
    assert.equal('Rad Doe', model2.name);
    // assert.equal(4, model2.id, 'Function-default should have executed, incrementing the ID.');

    // Unset value, ensure defaults...
    model2.first = undefined;
    assert.equal('John', model2.first);
    assert.equal('John Doe', model2.name);
  });

  it('should create model definitions which do not affect each other', function() {
    var X = Model.define();
    assert.equal(1, Object.keys(X.prototype.fields).length, 'Bare bones model should have one field but does not.');
  });

  it('should create model instances which do not effect each other', function() {
    var one = new TestModel1();
    var two = new TestModel1();

    one.first = 'one';
    two.first = 'two';

    assert.notEqual(one.first, two.first);
  });

  it('should define models with property setters', function() {
    var model = new TestModel1();
    assert.equal(1, model.age);
    model.age = 10;
    assert.equal(10, model.age);
    model.age = new Date();
    assert.equal(30, model.age);
  });

  describe('instance-level events', function() {
    it('should emit when a property changes', function(done) {
      var model = new TestModel1();

      model.on('change', function(property, old, value) {
        assert.equal('username', property);
        assert.equal(undefined, old);
        assert.equal('radical', value);
        done();
      });

      model.username = 'radical';
    });

    it('should emit when a specific property change', function(done) {
      var model = new TestModel1();

      model.on('change:username', function(old, value) {
        assert.equal(undefined, old);
        assert.equal('radical', value);
        done();
      });

      model.username = 'radical';
    });

    it('should emit when a model is saved', function(done) {
      var TestModel = Model.define({
        dataStore: { type: Model.MemoryStore },
        fields: {
          id: undefined,
          username: undefined
        }
      });

      var model = new TestModel();

      model.on('save', function(instance) {
        assert.equal(model, instance);
        done();
      });

      model.save(function() {});
    });

    it('should emit when a model is deleted', function(done) {
      var TestModel = Model.define({
        dataStore: { type: Model.MemoryStore },
        fields: {
          id: undefined,
          username: undefined
        }
      });

      var model = new TestModel();

      model.on('delete', function(instance) {
        assert.equal(model, instance);
        done();
      });

      model.save(function() {
        model.delete(function() {})
      });
    });
  });

  describe('class-level events', function() {
    it('should emit when properties change', function(done) {
      var TestModel = Model.define({
        dataStore: { type: Model.MemoryStore },
        fields: {
          id: undefined,
          username: undefined
        }
      });

      var model = new TestModel();

      TestModel.on('change', function(instance, property, old, value) {
        assert.equal(model, instance);
        assert.equal('username', property);
        assert.equal(undefined, old);
        assert.equal('radical', value);
        done();
      });

      model.username = 'radical';
    });

    it('should emit when a specific property change', function(done) {
      var TestModel = Model.define({
        dataStore: { type: Model.MemoryStore },
        fields: {
          id: undefined,
          username: undefined
        }
      });

      var model = new TestModel();

      TestModel.on('change:username', function(instance, old, value) {
        assert.equal(model, instance);
        assert.equal(undefined, old);
        assert.equal('radical', value);
        done();
      });

      model.username = 'radical';
    });

    it('should emit when a model is deleted', function(done) {
      var TestModel = Model.define({
        dataStore: { type: Model.MemoryStore },
        fields: {
          id: undefined,
          username: undefined
        }
      });

      TestModel.on('delete', function(instance) {
        assert.equal(model, instance);
        done();
      });

      var model = new TestModel();
      model.save(function() {
        model.delete(function() {})
      });
    });

    it('should emit when a model is saved', function(done) {
      var TestModel = Model.define({
        dataStore: { type: Model.MemoryStore },
        fields: {
          id: undefined,
          username: undefined
        }
      });

      TestModel.on('save', function(instance) {
        assert.equal(model, instance);
        done();
      });

      var model = new TestModel();
      model.save(function() {});
    });

    it('should emit when a model is created', function(done) {
      var TestModel = Model.define({
        dataStore: { type: Model.MemoryStore },
        fields: {
          id: undefined,
          username: undefined
        }
      });

      TestModel.on('new', function(instance) {
        assert.ok(instance instanceof TestModel);
        done();
      });

      var model = new TestModel();
    });

  });

  it('should serialize models to JSON', function() {
    var model = new TestModel1(); // id == 6
    var json = model.toJSON();
    assert.equal(5, Object.keys(json).length);
    assert.ok("id" in json);
    assert.ok("username" in json);
    assert.ok("first" in json);
    assert.ok("last" in json);
    assert.ok("age" in json);
  });

  it('should work with class-level database methods', function() {
    TestModel1.save(new TestModel1({
      username: "userone",
      first: "User",
      last: "One"
    }), createUserTwo);
    
    function createUserTwo() {
      TestModel1.save(new TestModel1({
        username: "usertwo",
        first: "User",
        last: "Two"
      }), getAllRecords);
    }
    
    function getAllRecords(e, result) {
      TestModel1.all(function(e, all) {
        assert.equal(2, all.length);
        findRecord(all[0].id);
      });
    }
    
    function findRecord(id) {
      TestModel1.find(id, function(e, record) {
        assert.ok(record instanceof Model && record instanceof TestModel1);
        assert.equal("userone", record.username);
        
        getByWhereClause();
      });
    }
    
    function findUserOneAndTwo(userData) {
      return userData.username && userData.username.match(/user(one|two)/);
    }
    
    function getByWhereClause() {
      TestModel1.where({}, findUserOneAndTwo, assertWhereClauseResult);
    }
    
    function assertWhereClauseResult(e, result) {
      assert.ok(result[0] instanceof Model && result[0] instanceof TestModel1);
      assert.ok(result[1] instanceof Model && result[1] instanceof TestModel1);
      assert.equal(result.length, 2);
      
      getByWhereClauseWithArgs();
    }
    
    function getByWhereClauseWithArgs() {
      TestModel1.where(
        {
          username: "userone"
        },
        function(doc, args) {
          return doc.username && doc.username == args.username;
        }, assertWhereClauseWithArgsResult);
    }
    
    function assertWhereClauseWithArgsResult(e, result) {
      assert.ok(result[0] instanceof Model && result[0] instanceof TestModel1);
      assert.equal(result.length, 1);
      
      deleteRecord(result[0].id);
    }
    
    function deleteRecord(id) {
      TestModel1.delete(id, function(e, result) {
        TestModel1.where({}, findUserOneAndTwo, assertUserDeleted);
      });
    }
    
    function assertUserDeleted(e, result) {
      assert.ok(result[0] instanceof Model && result[0] instanceof TestModel1);
      assert.equal(result.length, 1);
    }
  });

  it('should work with instance-level database methods', function() {
    new TestModel1({
      username: "userthree",
      first: "User",
      last: "Three"
    }).save(function(e, result) {
      findRecord(result.id);
    });
    
    function findRecord(id) {
      TestModel1.find(id, function(e, record) {
        assert.ok(record instanceof Model && record instanceof TestModel1);
        assert.equal("userthree", record.username);
    
        record.delete(function(e, result) {
          TestModel1.find(id, assertUserDeleted);
        });
    
      });
    }
    
    function assertUserDeleted(e, result) {
      assert.ok(e instanceof Error);
      assert.equal(e.message, 'Document not found.');
      assert.equal(null, result);
    }
  });

  it('should allow user-defined primary key property', function() {
    var TestModel = Model.define({
      dataStore: { type: Model.MemoryStore },
      primaryKey: "username",
      fields: {
        username: undefined,
        name: 'John',
      }
    });
    
    var model = new TestModel();

    saveModel();
    
    function saveModel() {
      model.save(function(e, result) {
        findModelByCustomPrimaryKey();
      });
    }
    
    function findModelByCustomPrimaryKey() {
      TestModel.find(model.id, function(e, result) {
        assert.equal(null, e);
        assert.ok(result instanceof TestModel);
        assert.equal(result.id, result.username);
      });
    }
  });

});
