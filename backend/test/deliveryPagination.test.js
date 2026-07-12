const test = require('node:test');
const assert = require('node:assert/strict');
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
const { getPagination } = require('../services/webhookService');

test('calculates delivery pages and clamps an out-of-range page', () => {
  assert.deepEqual(getPagination(12, 2, 5), {
    page: 2,
    pageSize: 5,
    totalItems: 12,
    totalPages: 3,
    offset: 5,
  });
  assert.equal(getPagination(12, 99, 5).page, 3);
});
