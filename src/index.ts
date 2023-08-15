import ModuleError from 'module-error';

import {
  AbstractDelOptions,
  AbstractGetOptions,
  AbstractLevel,
  AbstractKeyIterator,
  AbstractGetManyOptions,
  AbstractIterator,
  AbstractIteratorOptions,
  AbstractSeekOptions,
} from 'abstract-level';
import { AbstractDatabaseOptions, AbstractOpenOptions, AbstractPutOptions } from 'abstract-level/types/abstract-level';
import { NodeCallback } from 'abstract-level/types/interfaces';
import { AbstractKeyIteratorOptions } from 'abstract-level/types/abstract-iterator';
import bridge from '@vkontakte/vk-bridge';

const ITERATOR_LIMIT = 1000;

const KEY_SIZE_LIMIT = 100;
const VALUE_SIZE_LIMIT = 4096;

export class VkBridgeLevel extends AbstractLevel<string, string, string> {
  _bridge = bridge;

  constructor(options?: AbstractDatabaseOptions<string, string> | undefined) {
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
      .catch((e) => {
        this.nextTick(
          callback,
          new ModuleError(JSON.stringify(e), {
            code: 'LEVEL_REMOTE_ERROR',
          }),
        );
      });
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
      .catch((e) => {
        this.nextTick(
          callback,
          new ModuleError(JSON.stringify(e), {
            code: 'LEVEL_REMOTE_ERROR',
          }),
        );
      });
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
      .catch((e) => {
        this.nextTick(
          callback,
          new ModuleError(JSON.stringify(e), {
            code: 'LEVEL_REMOTE_ERROR',
          }),
        );
      });
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
      .catch((e) => {
        this.nextTick(
          callback,
          new ModuleError(JSON.stringify(e), {
            code: 'LEVEL_REMOTE_ERROR',
          }),
        );
      });
  }

  private _iterator(options: AbstractIteratorOptions<string, string>) {
    return new VkBridgeIterator(this, options);
  }

  private _keys(options: AbstractKeyIteratorOptions<string>) {
    return new VkBridgeKeyIterator(this, options);
  }
}

export class VkBridgeIterator extends AbstractIterator<VkBridgeLevel, string, string> {
  private keys?: string[];
  private index = 0;

  constructor(
    db: VkBridgeLevel,
    private readonly options: AbstractIteratorOptions<string, string>,
  ) {
    super(db, options);
  }

  private _next(callback: NodeCallback<void>): void {
    if (this.keys === undefined) {
      const count = Number.isSafeInteger(this.limit) ? this.limit : ITERATOR_LIMIT;
      if (count > ITERATOR_LIMIT) {
        return this.db.nextTick(
          callback,
          new ModuleError(`limit must be les then ${ITERATOR_LIMIT}`, {
            code: 'LEVEL_ITERATOR_NOT_OPEN',
          }),
        );
      }
      this.db._bridge
        .send('VKWebAppStorageGetKeys', { offset: 0, count })
        .then(async ({ keys }) => {
          if (keys === undefined) {
            return this.db.nextTick(
              callback,
              new ModuleError('bridge was not inited', {
                code: 'LEVEL_ITERATOR_NOT_OPEN',
              }),
            );
          }
          this.keys = keys;
          const i = this.index;

          if (this.keys.length <= i) {
            return this.db.nextTick(callback, null);
          }

          this.index++;

          const { keys: returnedKeys } = await this.db._bridge.send('VKWebAppStorageGet', {
            keys: [this.keys[i]],
          });
          if (returnedKeys.length === 0) {
            return this.db.nextTick(callback, null);
          }
          const [{ key, value }] = returnedKeys;
          this.db.nextTick(callback, null, key, value);
        })
        .catch((e) => {
          this.db.nextTick(
            callback,
            new ModuleError(JSON.stringify(e), {
              code: 'LEVEL_REMOTE_ERROR',
            }),
          );
        });
    } else {
      const i = this.index;
      if (this.keys.length <= i) {
        return this.db.nextTick(callback, null);
      }

      this.index++;

      this.db._bridge
        .send('VKWebAppStorageGet', {
          keys: [this.keys[i]],
        })
        .then(({ keys: returnedKeys }) => {
          if (returnedKeys.length === 0) {
            return this.db.nextTick(callback, null);
          }
          const [{ key, value }] = returnedKeys;
          this.db.nextTick(callback, null, key, value);
        })
        .catch((e) => {
          this.db.nextTick(
            callback,
            new ModuleError(JSON.stringify(e), {
              code: 'LEVEL_REMOTE_ERROR',
            }),
          );
        });
    }
  }

  private _seek(target: string, options: AbstractSeekOptions<string>) {
    const i = this.keys?.indexOf(target);
    if (i !== undefined) {
      this.index = i;
    }
  }
}

export class VkBridgeKeyIterator extends AbstractKeyIterator<VkBridgeLevel, string> {
  private keys?: string[];
  private index = 0;

  constructor(db: VkBridgeLevel, options: AbstractKeyIteratorOptions<string>) {
    super(db, options);
  }

  private _next(callback: NodeCallback<void>): void {
    if (this.keys === undefined) {
      const count = Number.isSafeInteger(this.limit) ? this.limit : ITERATOR_LIMIT;
      if (count > ITERATOR_LIMIT) {
        return this.db.nextTick(
          callback,
          new ModuleError(`limit must be les then ${ITERATOR_LIMIT}`, {
            code: 'LEVEL_ITERATOR_NOT_OPEN',
          }),
        );
      }
      this.db._bridge
        .send('VKWebAppStorageGetKeys', { offset: 0, count })
        .then(({ keys }) => {
          if (keys === undefined) {
            return this.db.nextTick(
              callback,
              new ModuleError('bridge was not inited', {
                code: 'LEVEL_ITERATOR_NOT_OPEN',
              }),
            );
          }

          this.keys = keys;
          const i = this.index;
          if (this.keys.length <= i) {
            return this.db.nextTick(callback, null);
          }

          this.index++;
          this.db.nextTick(callback, null, this.keys[i]);
        })
        .catch((e) => {
          this.db.nextTick(
            callback,
            new ModuleError(JSON.stringify(e), {
              code: 'LEVEL_REMOTE_ERROR',
            }),
          );
        });
    } else {
      const i = this.index;
      if (this.keys.length <= i) {
        return this.db.nextTick(callback, null);
      }

      this.index++;
      this.db.nextTick(callback, null, this.keys[i]);
    }
  }

  private _seek(target: string, options: AbstractSeekOptions<string>) {
    const i = this.keys?.indexOf(target);
    if (i !== undefined) {
      this.index = i;
    }
  }
}
