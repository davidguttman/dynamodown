/*** Levelup tests
  https://github.com/maxogden/level.js/blob/master/test/test-levelup.js
***/

var levelup = require('levelup')
var dynamoDown = require('../')

var dynOpts = {
  region: 'us-east-1',
  secretAccessKey: 'abc',
  accessKeyId: '123',
  httpOptions: {
    proxy: 'http://localhost:8000'
  }
}

var opts = {
  db: dynamoDown,
  dynamo: dynOpts
}

db = levelup('levelup-test', opts)

db.put('name', 'LevelUP string', function (err) {
  if (err) return console.log('Ooops!', err) // some kind of I/O error
  db.get('name', function (err, value) {
    if (err) return console.log('Ooops!', err) // likely the key was not found
    console.log('name=' + value)
  })
})

var writeStream = db.createWriteStream()
writeStream.on('error', function (err) {
  console.log('Oh my!', err)
})
writeStream.on('close', function () {
  console.log('Stream closed')
  db.createKeyStream()
    .on('data', function (data) {
      console.log('KEYSTREAM', data)
    })
    .on('error', function (err) {
      console.log('Oh my!', err)
    })
  db.createReadStream()
    .on('data', function (data) {
      console.log('READSTREAM', data.key, '=', data.value)
    })
    .on('error', function (err) {
      console.log('Oh my!', err)
    })
  db.createValueStream()
    .on('data', function (data) {
      console.log('VALUESTREAM', data)
    })
    .on('error', function (err) {
      console.log('Oh my!', err)
    })
})
writeStream.write({ key: 'name', value: 'Yuri Irsenovich Kim' })
writeStream.write({ key: 'dob', value: '16 February 1941' })
writeStream.write({ key: 'spouse', value: 'Kim Young-sook' })
writeStream.write({ key: 'occupation', value: 'Clown' })
writeStream.end()
