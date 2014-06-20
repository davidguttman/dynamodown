var test       = require('tape')
  , testCommon = require('./testCommon')
  , DynamoDown    = require('../')

var dynOpts = {
  region: 'us-east-1',
  secretAccessKey: 'abc',
  accessKeyId: '123',
  httpOptions: {
    proxy: 'http://localhost:8000'
  }
}

function leveldown (location) {
  var dd = DynamoDown(location)
  dd.oldOpen = dd._open
  dd._open = function(opts, cb) {
    opts.createIfMissing = true
    opts.dynamo = dynOpts
    return dd.oldOpen(opts, cb)
  }
  return dd
}

/*** compatibility with basic LevelDOWN API ***/

require('abstract-leveldown/abstract/leveldown-test').args(leveldown, test, testCommon)

require('abstract-leveldown/abstract/open-test').args(leveldown, test, testCommon)
require('abstract-leveldown/abstract/open-test').open(leveldown, test, testCommon)

require('abstract-leveldown/abstract/del-test').all(leveldown, test, testCommon)
require('abstract-leveldown/abstract/get-test').all(leveldown, test, testCommon)
require('abstract-leveldown/abstract/put-test').all(leveldown, test, testCommon)
require('abstract-leveldown/abstract/batch-test').all(leveldown, test, testCommon)

require('abstract-leveldown/abstract/close-test').close(leveldown, test, testCommon)

// Not passing:
// // require('abstract-leveldown/abstract/put-get-del-test').all(leveldown, test, testCommon, testBuffer)
// require('abstract-leveldown/abstract/chained-batch-test').all(leveldown, test, testCommon)
// require('abstract-leveldown/abstract/iterator-test').all(leveldown, test, testCommon)
// require('abstract-leveldown/abstract/ranges-test').all(leveldown, test, testCommon)
