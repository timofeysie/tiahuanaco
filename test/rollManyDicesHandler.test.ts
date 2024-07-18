import { handler } from '../lib/rollManyDices/handler';

describe('handler', () => {
  it('should return 400 if nbOfDices is not a number', async () => {
    const event = { pathParameters: { nbOfDices: 'abc' } };
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it('should return 200 and a valid total if nbOfDices is a number', async () => {
    const event = { pathParameters: { nbOfDices: '3' } };
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBeGreaterThanOrEqual(3);
    expect(result.body).toBeLessThanOrEqual(18);
  });

  it('should return 200 and 0 if nbOfDices is 0', async () => {
    const event = { pathParameters: { nbOfDices: '0' } };
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(0);
  });
});