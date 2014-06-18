var DynamoDOWN = require('../')
var levelup = require('levelup')

var db = levelup('table_name', {
  db: DynamoDOWN,

  // required AWS config
  dynamo: {
    // Capacity can be specified, these are the defaults:
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    },
    region: 'us-east-1',
    secretAccessKey: 'abc',
    accessKeyId: '123',
    httpOptions: {
      proxy: 'http://localhost:8000'
    }
  }
})

db.batch([
  {type: 'put', key: 'name', value: 'Yuri Irsenovich Kim'},
  {type: 'put', key: 'dob', value: '16 February 1941'},
  {type: 'put', key: 'spouse', value: 'Kim Young-sook'},
  {type: 'put', key: 'occupation', value: 'Clown'}
], function(err) {
  db.createReadStream()
    .on('data', console.log)
    .on('close', function () {
      console.log("Show's over folks!")
    })
})
