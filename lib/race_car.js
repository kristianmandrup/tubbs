var inflection = require( 'inflection' );
// var _ = require( 'underscore' );

var createId = (function() {
  var id = 0;
  return function() {
    return id++;
  };
})();

module.exports = RaceCar;

// TODO: rename Model to RacerModel in racer project!?
var RacerModel = Model;

/**
 * new Memory(constructor, data)
 * - constructor (Tubbs): Tubbs model constructor.
**/
function RaceCar(constructor) {
  this.DataModel = constructor  
  this.DataModel.prototype = new RacerModel; // Racer model is always the prototype!
  this.data = {};

  // set class if defined for constructor
  if (_.isString(constructor.clazz)) {
    var clazz = constructor.clazz;
    this.clazzName = clazz.camelize();
    this.collectionName = inflector.pluralize(clazz).camelize();
  } else {
    throw "The Tubbs RaceCar adapter requires a 'clazz': option in the Model constructor data hash"
  } 
}


RaceCar.prototype = Object.create({}, {

  /**
   * Memory#all(callback(e, result))
   *
   * Provides an Array of all records in the dataset.
  **/
  all: {
    value: function(callback) {      
      var path = this.collectionName + '.*';
      var result = this.model.get(path);

      callback(null, result);
    },
    enumerable: true
  },

  /**
   * Memory#find(id, callback(e, result))
   * - id (?): The record ID in the database
   *
   * Finds a single record in the database.
  **/
  find: {
    value: function(id, callback) {
        var path = this.collectionName + '.' + id.toString();
        var doc = this.model.get(path);
        callback(null, doc);
        return;
      }
      callback(new Error("Document not found."), null);
    },
    enumerable: true
  },

  /**
   * Memory#where(args, filter, callback(e, result))
   * - args (Object): An object hash of named arguments which becomes the 2nd arg passed to `filter`.
   * - filter (Function): A function executed against each document which returns
   * `true` if the document should be included in the result.
   *
   * Provides an Array of all records which pass the `filter`.
  **/
  where: {
    value: function(args, filter, callback) {
      // TODO: decompose and recompose filter so that it is executed outside of
      // TODO: its originating clusure. This is needed so that the MemoryStore
      // TODO: API operates the same as other server-based map/reduce API's.
      var query = this.model.query(this.collectionName);
      args.forEach(function(key) {        
        query.where(key).equals(args[key])
      }      
      var result = query;
      callback(null, result);
    },
    enumerable: true
  },

  /**
   * Memory#fetch(record, callback(e, result))
   * - record (Object): An object (or JSON serializable object) to be fetched from the database.
   *
   * Fetches an updated object from the database.
  **/
  fetchOne: {
    value: function(record, callback) {
      var id = record.id;
      var path = this.collectionName + '.' + id.toString();

      this.model.get(path);

      // #fetch is basically no-op since everything is already local.
      return callback(null, record);
    },
    enumerable: true
  },

  /**
   * Memory#save(record, callback(e, result))
   * - record (Object): An object (or JSON serializable object) to be saved to the database.
   *
   * Saves the provides object to the database.
  **/
  save: {
    value: function(record, callback) {
      if (record instanceof this.DataModel === false) {
        record = new this.DataModel(record);
      }

      if (record.isNew)
        record.id = createId();

      var id = record.id;
      var path = this.collectionName + '.' + id.toString();

      this.model.set(path, record);
      if(callback) callback(null, record);
    },
    enumerable: true
  },

  /**
   * Memory#delete(record, callback(e, result))
   * - record (Object): An object (or JSON serializable object) to be deleted from the database.
   *
   * Deletes the provides object from the database.
  **/
  delete: {
    value: function(record, callback) {
      if (Object.prototype.toString.call(record).match(/\[object (String|Number)\]/)) {
        var Model = this.DataModel;
        var primaryKey = Model.primaryKey;
        var r = record;
        record = {};
        record[primaryKey] = r;
      }

      var id = record.id;

      if (this.find(id)) {

        var path = this.collectionName + '.' + id.toString();

        this.model.del(path);

        if (callback) callback(null, record);
      } else if(callback) callback(new Error('Document [' + id + '] not found'), null);
    },
    enumerable: true
  },

  fetch: {
    value: function(callback) {
      if (callback) callback();
    },
    enumerable: true
  },

  use: {
    value: function(data, callback) {
      var DataModel = this.DataModel;
      var primaryKey = DataModel.primaryKey;
      var t = this;
      this.data = {};

      if (Array.isArray(data)) {
        data.forEach(function(item) {
          DataModel.emit('add', t.data[item[primaryKey]] = new DataModel(item))
        });

      } else {
        Object.keys(data).forEach(function(key) {
          DataModel.emit('add', t.data[key] = new DataModel(data[key]));
        });
      }
      this.ready = true;
      if (callback) callback();
    },
    enumerable: true
  }
});
