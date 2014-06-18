# DynamoDOWN

**A drop in replacement for [LevelDOWN](https://github.com/rvagg/node-leveldown) that works with DynamoDB as its storage. Can be used as a back-end for [LevelUP](https://github.com/rvagg/node-levelup) rather than an actual LevelDB store.**

As of version 0.7, LevelUP allows you to pass a `'db'` option when you create a new instance. This will override the default LevelDOWN store with a LevelDOWN API compatible object. DynamoDOWN conforms exactly to the LevelDOWN API but performs operations against a DynamoDB database.

Caution: this _should_ work for most cases, but some LevelDOWN tests are failing. See `test/index.js`

## Example

```js
var levelup = require('levelup')
var db = levelup('table_name', {
  db: require('dyanmodown'),
  // required AWS config
  dynamo: {
    region: 'us-east-1',
    secretAccessKey: 'abc',
    accessKeyId: '123'
  }
})

db.put('name', 'Yuri Irsenovich Kim')
db.put('dob', '16 February 1941')
db.put('spouse', 'Kim Young-sook')
db.put('occupation', 'Clown')

db.createReadStream()
  .on('data', console.log)
  .on('close', function () { console.log('Show\'s over folks!') })
```

Running our example gives:

```
{ key: 'dob', value: '16 February 1941' }
{ key: 'name', value: 'Yuri Irsenovich Kim' }
{ key: 'occupation', value: 'Clown' }
{ key: 'spouse', value: 'Kim Young-sook' }
Show's over folks!
```

## Notes

DynamoDOWN is opinionated about the structure of the table and may not work with a table it did not create. This is related to how DynamoDB uses primary keys and how to get "level-like" behavior. It should work fine in most cases, but read below for more info.

### Table Creation ###

If the table doesn't exist, DynamoDOWN will try auto-create a table for you. You can specify the read/write throughput (if not specified it will default to 1/1). If the table already exists, the specified throughput will have no effect (existing table throughput can be changed using the AWS Console or SDK).

See [LevelUP options](https://github.com/rvagg/node-levelup#options) for info on `createIfMissing` and `errorIfExists` options.

```js
var levelup = require('levelup')
var db = levelup('table_name', {
  db: require('dyanmodown'),
  // required AWS config
  dynamo: {
    // Capacity can be specified, defaults to 1/1:
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    },
    region: 'us-east-1',
    secretAccessKey: 'abc',
    accessKeyId: '123'
})

```

### Hash Keys ###

In DynamoDB, keys are made up of two parts, a `hash key` and a `range key`. To achieve leveldb-like behavior, all keys in a db instance are given the same `hash key` (you can't do a range query over keys with different hash keys). The default `hash key` for a db instance is `!`, but can be specified with the location/table name argument:

```js
var db = levelup('tableName/yourHashKey', {
  db: require('dyanmodown'),
  dynamo: {
    // required AWS config
  }
})

db.put('some-key', 'some-value', function(err) {
  // the object in DynamoDB would look like this:
  // {
  //   hkey: 'yourHashKey',
  //   rkey: 'some-key',
  //   value: 'some-value'
  // }
})

```

If you're fine with sharing Capacity Units across db instances/applications, you can reuse the same tableName with different hash keys -- saving you from having to create a new table.

## Special Thanks

Big thanks to @nlf and his [RiakDOWN](https://github.com/nlf/riakdown) module, @rvagg for [LevelUP](https://github.com/rvagg/node-levelup), and everyone else in the level ecosystem.

Database actions are performed using the [AWS SDK for JavaScript](https://github.com/aws/aws-sdk-js).

## License

MIT
