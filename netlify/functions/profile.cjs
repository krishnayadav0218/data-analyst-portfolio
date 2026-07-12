const profile = require('../../src/data/content.json');

exports.handler = async () => ({
  statusCode: 200,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(profile),
});
