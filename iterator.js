var util = require('util')
var through2 = require('through2')

var AbstractIterator = require('abstract-leveldown').AbstractIterator

var DynamoIterator = module.exports = function (db, options) {
  var self = this

  AbstractIterator.call(this, db)

  this.db = db
  this.ddb = db.ddb
  this._results = this.createReadStream(options)
  this._results.on('end', function() {
    self._endEmitted = true
  })
}

util.inherits(DynamoIterator, AbstractIterator)

DynamoIterator.prototype._next = function(cb) {
  var self = this

  var onEnd = function () {
    self._results.removeListener('readable', onReadable)
    cb()
  }

  var onReadable = function () {
    self._results.removeListener('end', onEnd)
    self._next(cb)
  }

  var obj = this._results.read()

  if (self._endEmitted) {
    cb()
  } else if (obj === null) {
    this._results.once('readable', onReadable)
    this._results.once('end', onEnd)
  } else {
    if (this._keyAsBuffer) {
      obj.key = new Buffer(obj.key)
    }

    if (!this._valueAsBuffer) {
      obj.value = obj.value.toString()
    }

    cb(null, obj.key, obj.value)
  }
}

DynamoIterator.prototype.createReadStream = function(opts) {
  var self = this

  opts.start = opts.start || '\00'
  opts.end = opts.end || '\xff\xff\xff\xff'
  if (opts.limit < 1) opts.limit = undefined

  var stream = through2.obj(function(data, enc, cb) {
    var output = {
      key: data.rkey.S,
      value: data.value.S
    }

    this.push(output)
    cb()
  })

  var onData = function(err, data) {
    if (err) return stream.emit('error', err)

    data.Items.forEach(function(item) {
      stream.write(item)
    })

    opts.ExclusiveStartKey = data.ExclusiveStartKey
    if (data.ExclusiveStartKey) {
      self.getRange(opts, onData)
    } else {
      stream.end()
    }
  }

  this.getRange(opts, onData)

  return stream
}

DynamoIterator.prototype.getRange = function(opts, cb) {
  var params = {
    TableName: this.db.tableName,
    KeyConditions: {
      hkey: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [
          { S: this.db.hashKey }
        ]
      },
      rkey: {
        ComparisonOperator: 'BETWEEN',
        AttributeValueList: [
          { S: opts.start },
          { S: opts.end }
        ]
      }
    },
    Limit: opts.limit,
    ScanIndexForward: !opts.reverse,
    ExclusiveStartKey: opts.ExclusiveStartKey
  }

  this.ddb.query(params, cb)
}
