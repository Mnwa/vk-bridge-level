import ModuleError from 'module-error';

import {
  AbstractDelOptions,
  AbstractGetOptions,
  AbstractLevel,
  AbstractGetManyOptions,
  AbstractIteratorOptions, AbstractBatchOperation, AbstractBatchOptions,
} from 'abstract-level';
import { AbstractDatabaseOptions, AbstractOpenOptions, AbstractPutOptions } from 'abstract-level/types/abstract-level';
import { NodeCallback } from 'abstract-level/types/interfaces';
import { AbstractKeyIteratorOptions } from 'abstract-level/types/abstract-iterator';
import { type VKBridge } from '@vkontakte/vk-bridge';
import { VkBridgeKeyIterator } from './iterators/key_iterator';
import { VkBridgeIterator } from './iterators/full_iterator';

const KEY_SIZE_LIMIT = 100;
const VALUE_SIZE_LIMIT = 4096;

export class VkBridgeLevel extends AbstractLevel<string, string, string> {
  constructor(
    readonly _bridge: VKBridge,
    options?: AbstractDatabaseOptions<string, string> | undefined,
  ) {
    const encodings = { utf8: true };
    super({ encodings, getMany: true, keyIterator: true, seek: true, snapshots: false }, options);
  }

  private _open(_options: AbstractOpenOptions, callback: NodeCallback<void>): void {
    this.nextTick(callback);
  }

  private _put(
    key: string,
    value: string,
    options: AbstractPutOptions<string, string>,
    callback: NodeCallback<void>,
  ): void {
    if (key.length > KEY_SIZE_LIMIT) {
      return this.nextTick(
        callback,
        new ModuleError(`key size must be less or equal ${KEY_SIZE_LIMIT}`, {
          code: 'LEVEL_INVALID_KEY',
        }),
      );
    }
    if (value.length > VALUE_SIZE_LIMIT) {
      return this.nextTick(
        callback,
        new ModuleError(`value size must be less or equal ${VALUE_SIZE_LIMIT}`, {
          code: 'LEVEL_INVALID_VALUE',
        }),
      );
    }
    this._bridge
      .send('VKWebAppStorageSet', {
        key,
        value,
      })
      .then(() => {
        this.nextTick(callback);
      })
      .catch((e) => this.processBridgeError(e, callback));
  }

  private _get(key: string, options: AbstractGetOptions<string, string>, callback: NodeCallback<void>): void {
    this._bridge
      .send('VKWebAppStorageGet', {
        keys: [key],
      })
      .then(({ keys }) => {
        if (keys.length === 0) {
          return this.nextTick(
            callback,
            new ModuleError(`Key ${key} was not found`, {
              code: 'LEVEL_NOT_FOUND',
            }),
          );
        }

        const [{ value }] = keys;

        this.nextTick(callback, null, value);
      })
      .catch((e) => this.processBridgeError(e, callback));
  }

  private _del(key: string, options: AbstractDelOptions<string>, callback: NodeCallback<void>): void {
    this._bridge
      .send('VKWebAppStorageSet', {
        key,
        value: '',
      })
      .then(() => {
        this.nextTick(callback);
      })
      .catch((e) => this.processBridgeError(e, callback));
  }

  private _getMany(
    keys: string[],
    options: AbstractGetManyOptions<string, string>,
    callback: NodeCallback<void>,
  ): void {
    this._bridge
      .send('VKWebAppStorageGet', {
        keys,
      })
      .then(({ keys: returnedKeys }) => {
        const values = keys.map((key) => {
          const value = returnedKeys.find(({ key: returnedKey }) => key === returnedKey);

          return value?.value;
        });

        this.nextTick(callback, null, values);
      })
      .catch((e) => this.processBridgeError(e, callback));
  }

  private _iterator(options: AbstractIteratorOptions<string, string>) {
    return new VkBridgeIterator(this, options);
  }

  private _keys(options: AbstractKeyIteratorOptions<string>) {
    return new VkBridgeKeyIterator(this, options);
  }

  private _batch(operations: AbstractBatchOperation<VkBridgeLevel, string, string>[], options: AbstractBatchOptions<string, string>, callback: NodeCallback<void>) {
    const fetchedOperations = operations.map(operation => {
      switch (operation.type) {
        case 'del':
          return this.del(operation.key)
        case 'put':
          return this.put(operation.key, operation.value, operation)
      }
    })

    Promise.all(fetchedOperations)
      .then(() => this.nextTick(callback))
      .catch(e => this.processBridgeError(e, callback))
  }

  processBridgeError(e: unknown, callback: NodeCallback<void>) {
    this.nextTick(
      callback,
      new ModuleError(JSON.stringify(e), {
        code: 'LEVEL_REMOTE_ERROR',
      }),
    );
  }
}
