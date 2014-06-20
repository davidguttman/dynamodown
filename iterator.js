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
  // var defaultStart = '\00'
  // var defaultEnd =  '\xff\xff\xff\xff\xff\xff\xff\xff'

  var rkey = createRKey(opts)


  // if (opts.reverse) {
  //   opts.start = opts.end || defaultEnd
  //   opts.end = opts.start || defaultStart
  // } else {
  //   opts.start = opts.start || defaultStart
  //   opts.end = opts.end || defaultEnd
  // }

  var params = {
    TableName: this.db.tableName,
    KeyConditions: {
      hkey: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [
          { S: this.db.hashKey }
        ]
      },
      rkey: rkey
    },
    Limit: opts.limit,
    ScanIndexForward: !opts.reverse,
    ExclusiveStartKey: opts.ExclusiveStartKey
  }

  // console.log('params', JSON.stringify(params, null, 2));
  this.ddb.query(params, cb)
}

function createRKey (opts) {
  var defaultStart = '\00'
  var defaultEnd =  '\xff\xff\xff\xff\xff\xff\xff\xff'

  if (!opts.start && !opts.end) {

    return {
      ComparisonOperator: 'BETWEEN',
      AttributeValueList: [
        { S: defaultStart },
        { S: defaultEnd }
      ]
    }
  }

  if (!opts.end) {
    var op = opts.reverse ? 'LE' : 'GE'
    return {
      ComparisonOperator: op,
      AttributeValueList: [
        { S: opts.start }
      ]
    }
  }

  if (!opts.start) {
    var op = opts.reverse ? 'GE' : 'LE'
    return {
      ComparisonOperator: op,
      AttributeValueList: [
        { S: opts.end }
      ]
    }
  }

  if (opts.reverse) {
    return {
      ComparisonOperator: 'BETWEEN',
      AttributeValueList: [
        { S: opts.end },
        { S: opts.start }
      ]
    }
  }

  return {
    ComparisonOperator: 'BETWEEN',
    AttributeValueList: [
      { S: opts.start },
      { S: opts.end }
    ]
  }
}
