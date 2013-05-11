/* Copyright (c) 2012 Axel Rauschmayer
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * Copyright notice and license must remain intact for legal use
 */
 
////////// API //////////

/**
 * The root of all classes that adhere to "the prototypes as classes" protocol.
 * The neat thing is that the class methods "create" and "extend" are automatically
 * inherited by subclasses of this class (because Proto is in their prototype chain).
 */
module.exports = Proto;

var Proto = {
    /**
     * Class method: create a new instance and let instance method constructor() initialize it.
     * "this" is the prototype of the new instance.
     * @return {object} An instance of the desired prototype
     */
    create: function () {
        var instance = Object.create(this);
        if (instance.constructor) {
            instance.constructor.apply(instance, arguments);
        }
        return instance;
    },

    /**
     * Class method: subclass "this" (a prototype object used as a class)
     * @param  {object} subProps The properties of the sub-prototype
     * @return {object} The new prototype
     */
    extend: function (subProps) {
        // We cannot set the prototype of "subProps"
        // => copy its contents to a new object that has the right prototype
        var subProto = Object.create(this, Object.getOwnPropertyDescriptors(subProps));
        subProto.parent = this; // for parent prototype calls
        
        // Does the browser not support __proto__? Then add it manually
        // (Yes, this is also in our shim, but some browsers have Object.create and not __proto__ - IE9)
        if (!({}).__proto__) { subProto.__proto__ = this; }

        return subProto;
    },

    // Add a dynamic parent method call
    // Note that this is not the most efficient manner of doing this
    callParent: function() {
      var m = null;

      // Try to get calling method from whatever means possible...
      // NOTE: to make this more efficient, give your object methods a name!
      // var Person = Proto.extend({
      //   constructor: function constructor() { },
      //   getSpecies: function getSpecies() { return "Homo Sapien"; }
      // });
      
      if (arguments.callee.caller && arguments.callee.caller.name) {
        m = arguments.callee.caller.name;
      } else if (arguments.caller && arguments.caller.name) {
        m = arguments.caller.name;
      } else {
        // Unable to get calling method any other way, so try the call stack (least efficient)
        // First, find correct line, should be 3 down
        var caller = (new Error()).stack.split(/at/).slice(2,3)[0].match(/\s*([^\(\s]+)/);
        if (caller) {
          // If we found the correct line, see if we have a prototype and method name in there
          // should be in the form: BaseProto.CurrentProto.methodName
          caller = caller[1].match(/\.([^\s\.]+)$/);
          if (caller) { m = caller[1]; }
        }
      }

      // Call the parent method with correct context and arguments if it exists on the parent
      // Note that this will look up the chain if the parent doesn't have it directly
      if (typeof this.parent[m] == 'function') {
        // we need to split out the arguments
        var args = [];
        // is the first (and only) argument an Arguments array?
        if (arguments.length === 1 && arguments[0].callee) {
          args = args.concat(Array.prototype.slice.call(arguments[0]));
        } else { // if not, just add all arguments normally
          args = args.concat(Array.prototype.slice.call(arguments));
        }
        return this.parent[m].apply(this, args);
      }
      // If the parent method does not exist we will return undefined versus throwing an error
      // making this call safe if there is no parent method
      return undefined;
    }
};

/**
 * Optional: compatibility with constructor functions
 */
Function.prototype.extend = function(subProps) {
    var constrFunc = this;
    // Let a prototype-as-class extend a constructor function constrFunc.
    // Step 1: tmpClass is Proto, but as a sub-prototype of constrFunc.prototype
    var tmpClass = Proto.extend.call(constrFunc.prototype, Proto);
    // Step 2: tmpClass is a prototype-as-class => use as such
    return tmpClass.extend(subProps);
};

////////// Demo //////////

/***** Code *****
// Superclass
var Person = Proto.extend({
    constructor: function (name) {
        this.name = name;
    },
    describe: function() {
        return "Person called "+this.name;
    },
});

// Subclass
var Employee = Person.extend({
    constructor: function (name, title) {
        Employee.parent.constructor.call(this, name);
        this.title = title;
    },
    describe: function () {
        return Employee.parent.describe.call(this)+" ("+this.title+")";
    },
});
*/

/***** Interaction *****
var jane = Employee.create("Jane", "CTO"); // normally: new Employee(...)
> Employee.isPrototypeOf(jane) // normally: jane instanceof Employee
true
> jane.describe()
'Person called Jane (CTO)'
*/
