import { repairJson, parsePartialJson } from '../json-repair';

describe('JSON Repair Utility', () => {
  test('should return valid JSON untouched', () => {
    const input = '{"name": "test", "active": true, "values": [1, 2, 3]}';
    expect(JSON.parse(repairJson(input))).toEqual({
      name: 'test',
      active: true,
      values: [1, 2, 3],
    });
  });

  test('should repair unclosed string', () => {
    const input = '{"name": "tes';
    expect(JSON.parse(repairJson(input))).toEqual({
      name: 'tes',
    });
  });

  test('should repair unclosed array', () => {
    const input = '{"values": [1, 2';
    expect(JSON.parse(repairJson(input))).toEqual({
      values: [1, 2],
    });
  });

  test('should repair nested structures', () => {
    const input = '{"user": {"profile": {"name": "John", "tags": ["admin"';
    expect(JSON.parse(repairJson(input))).toEqual({
      user: {
        profile: {
          name: 'John',
          tags: ['admin'],
        },
      },
    });
  });

  test('should handle trailing commas', () => {
    const input = '{"items": [{"id": 1},';
    expect(JSON.parse(repairJson(input))).toEqual({
      items: [{ id: 1 }],
    });
  });

  test('should handle trailing colons', () => {
    const input = '{"status":';
    expect(JSON.parse(repairJson(input))).toEqual({
      status: null,
    });
  });

  test('parsePartialJson should fall back gracefully on invalid formats', () => {
    const emptyInput = '';
    expect(parsePartialJson(emptyInput)).toEqual({});

    const unparseable = '{"invalid": ';
    expect(parsePartialJson(unparseable)).toEqual({ invalid: null });
  });
});
