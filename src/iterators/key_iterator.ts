import { AbstractKeyIteratorOptions, CommonIterator } from 'abstract-level/types/abstract-iterator';
import { VkBridgeLevel } from '../index';
import { AbstractKeyIterator, AbstractSeekOptions } from 'abstract-level';
import { NodeCallback } from 'abstract-level/types/interfaces';

const ITERATOR_LIMIT = 1000;

export class VkBridgeKeyIterator extends AbstractKeyIterator<VkBridgeLevel, string> {
  private keys: string[] = [];
  private index = 0;
  private isEnd = false;

  constructor(db: VkBridgeLevel, options: AbstractKeyIteratorOptions<string>) {
    super(db, options);
  }

  protected _next(callback: NodeCallback<void>): void {
    if (this.needLoadMore()) {
      this.loadKeys(Number.isSafeInteger(this.limit) ? this.limit : ITERATOR_LIMIT)
        .then(() => this.nextInner(callback))
        .catch((e) => this.db.processBridgeError(e, callback));
    } else {
      this.nextInner(callback);
    }
  }

  protected _nextv(size: number, options: {}, callback: NodeCallback<void>): void {
    if (this.needLoadMore(size)) {
      this.loadKeys(Math.min(size, ITERATOR_LIMIT))
        .then(() => this.nextInnerMulti(size, callback))
        .catch((e) => this.db.processBridgeError(e, callback));
    } else {
      this.nextInnerMulti(size, callback);
    }
  }

  protected _seek(target: string, options: AbstractSeekOptions<string>) {
    const i = this.keys.indexOf(target);
    if (i !== -1) {
      this.index = i;
    }
  }

  private async loadKeys(count: number): Promise<void> {
    if (this.isEnd) {
      return;
    }

    const { keys } = await this.db._bridge.send('VKWebAppStorageGetKeys', { offset: this.index, count });

    if (keys.length === 0) {
      this.isEnd = true;
      return;
    }

    this.keys.push(...keys);
  }

  private needLoadMore(size: number = 1): boolean {
    return this.index + size > this.keys.length;
  }

  private nextInner(callback: NodeCallback<void>): void {
    const key = this.keys[this.index];
    this.index++;
    this.db.nextTick(callback, null, key);
  }

  private nextInnerMulti(size: number, callback: NodeCallback<void>): void {
    const keys = this.keys.slice(this.index, this.index + size);
    this.index += size;
    this.db.nextTick(callback, null, keys);
  }
}
