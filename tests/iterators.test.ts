import {describe, expect, test} from '@jest/globals';
import {VkBridgeLevel} from "../src";
import bridge from "@vkontakte/vk-bridge-mock";

describe('iterate', () => {
  test('all', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.iterator().all()).resolves.toStrictEqual([['somekey0', 'somevalue0'], ['somekey1', 'somevalue1']]);
  });
  test('first', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.iterator().next()).resolves.toStrictEqual(['somekey0', 'somevalue0']);
  });
  test('second', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    const iterator = db.iterator()
    await iterator.next()
    await expect(iterator.next()).resolves.toStrictEqual(['somekey1', 'somevalue1']);
  });
  test('seek', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    const iterator = db.iterator()
    await iterator.next()
    iterator.seek('somekey0')
    await expect(iterator.next()).resolves.toStrictEqual(['somekey0', 'somevalue0']);
  });
  test('get_two', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.iterator().nextv(2)).resolves.toStrictEqual([['somekey0', 'somevalue0'], ['somekey1', 'somevalue1']]);
  });
});

describe('iterate keys', () => {
  test('all', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.keys().all()).resolves.toStrictEqual(['somekey0', 'somekey1']);
  });
  test('first', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.keys().next()).resolves.toStrictEqual('somekey0');
  });
  test('second', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    const iterator = db.keys()
    await iterator.next()
    await expect(iterator.next()).resolves.toStrictEqual('somekey1');
  });
  test('seek', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    const iterator = db.keys()
    await iterator.next()
    iterator.seek('somekey0')
    await expect(iterator.next()).resolves.toStrictEqual('somekey0');
  });
  test('get_two', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.keys().nextv(2)).resolves.toStrictEqual(['somekey0', 'somekey1']);
  });
});

describe('iterate values', () => {
  test('all', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.values().all()).resolves.toStrictEqual(['somevalue0', 'somevalue1']);
  });
  test('first', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.values().next()).resolves.toStrictEqual('somevalue0');
  });
  test('second', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    const iterator = db.values()
    await iterator.next()
    await expect(iterator.next()).resolves.toStrictEqual('somevalue1');
  });
  test('seek', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    const iterator = db.values()
    await iterator.next()
    iterator.seek('somekey0')
    await expect(iterator.next()).resolves.toStrictEqual('somevalue0');
  });
  test('get_two', async () => {
    const db = new VkBridgeLevel(bridge, {valueEncoding: 'utf8'})
    await expect(db.values().nextv(2)).resolves.toStrictEqual(['somevalue0', 'somevalue1']);
  });
});
