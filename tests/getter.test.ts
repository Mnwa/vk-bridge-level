import {describe, expect, test} from '@jest/globals';
import {VkBridgeLevel} from "../src";
import bridge from "@vkontakte/vk-bridge-mock";

describe('get exists keys', () => {
  test('somekey0', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.get('somekey0')).resolves.toStrictEqual('somevalue0');
  });
  test('somekey1', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.get('somekey1')).resolves.toStrictEqual('somevalue1');
  });
});

describe('get exists keys', () => {
  test('all keys', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.getMany(['somekey0', 'somekey1'])).resolves.toStrictEqual(['somevalue0', 'somevalue1']);
  });
});

describe('get not exists key', () => {
  test('not_exists_somekey0', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.get('not_exists_somekey0')).rejects.toThrow('Key not_exists_somekey0 was not found');
  });
});

describe('get not exists keys', () => {
  test('all', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.getMany(['not_exists_somekey0', 'not_exists_somekey1'])).resolves.toStrictEqual([undefined, undefined]);
  });
});
