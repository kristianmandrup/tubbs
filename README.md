Tubbs
=====

![Build Status](https://travis-ci.org/dandean/tubbs.png)

**Tubbs** is Data Model Layer which makes working with your data much easier.


Features
--------

* ActiveModel-style validation
* Observe property value changes
* Observe deletion and save
* Abstract data store interface. So far:
  * In-memory (built-in: `Tubbs.MemoryStore`)
  * Riak (via tubbs-riakstorage - server-side only at the moment)
  * REST (via rubbs-reststorage - browser-only, at the moment)


Examples
--------

```js
function User(data) {
  this.setData(data);
}

User.prototype.clazz = 'user';

Tubbs(User, {
  dataStore: new Memory(User),
  basicProperties: ['username', 'first', 'last'],
  validation: [
    Validate.required("username"),
    Validate.lengthOf("username", { min: 5 })
  ],
});

Tubbs(User, {
  dataStore: new RaceCar(User),
  basicProperties: ['username', 'first', 'last'],
  validation: [
    Validate.required("username"),
    Validate.lengthOf("username", { min: 5 })
  ],
});


Object.defineProperty(User, 'name', {
  get: function() {
    return ((this.first || '') + ' ' + (this.last || '')).trim();
  },
  enumerable: true
});
```


**Create a new user**

```js
var user = new User({
  username: "kbacon",
  first: "Kevin",
  last: "Bacon"
});
```


**Get one of its virtual properties**

```js
console.log(user.name);
// -> 'Kevin Bacon'
```


**Observe property value changes**

```js
User.on('change', function(instance, property, old, value) {
  // When any property changes on any User instance
});

User.on('change:name', function(instance, old, value) {
  // When the "name" property changes on any User instance
});

var user = new User();

user.on('change', function(property, old, value) {
  // When any property changes on a specific User instance
});

user.on('change:name', function(old, value) {
  // When the "name" property changes on a specific User instance
});
```


**Observe model creation and deletion and save**

```js
User.on('save', function(instance) {
  // When any User model is saved.
});

User.on('delete', function(instance) {
  // When any User model is deleted.
});

var user = new User();

user.on('save', function(instance) {
  // When a specific User model is saved.
});

user.on('delete', function(instance) {
  // When a specific User model is deleted.
});
```


**Serialize the instance to pure JSON**

```js
console.log(JSON.stringify(user));
// ->
// {
//   "username": "kbacon",
//   "first": "Kevin",
//   "last": "Bacon"
// }
```


Roadmap (Also, see TODO.md)
---------------------------

* Validation
  * `allowBlank` option?
  * shortcut format validator strings, such as "email" and "phone"
* Add a `beforeSave` option: beforeSave: function() { this.dateModified = new Date(); }
* Figure out how to notify others when an error is thrown.
* More unit test coverage
* Schema-based generated class methods: Person.findAllByAge(50, cb)
* Documentation Pages
  * Model instance API
  * Model class API
  * Validators
* CouchStore
* MongoStore
* RedisStore
* LocalStorageStore
