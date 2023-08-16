import { AbstractIterator, AbstractIteratorOptions, AbstractKeyIterator, AbstractSeekOptions } from 'abstract-level';
import { NodeCallback } from 'abstract-level/types/interfaces';
import ModuleError from 'module-error';
import { VkBridgeLevel } from '../index';

export class VkBridgeIterator extends AbstractIterator<VkBridgeLevel, string, string> {
  private innerIterator: AbstractKeyIterator<VkBridgeLevel, string>;

  constructor(
    db: VkBridgeLevel,
    private readonly options: AbstractIteratorOptions<string, string>,
  ) {
    super(db, options);
    this.innerIterator = db.keys(options);
  }

  private _next(callback: NodeCallback<void>): void {
    this.innerIterator.next().then(async (key) => {
      if (key !== undefined) {
        const value = await this.db.get(key);
        if (value !== undefined) {
          return this.db.nextTick(callback, null, key, value);
        }
      }

      this.db.nextTick(callback, null);
    });
  }

  private _nextv(size: number, options: {}, callback: NodeCallback<void>): void {
    this.innerIterator.nextv(size, options).then(async (keys) => {
      const values = await this.db.getMany(keys);
      const results = keys.reduce((acc: string[][], key, index) => {
        acc.push([key, values[index]]);

        return acc;
      }, []);

      return this.db.nextTick(callback, null, results);
    });
  }

  private _seek(target: string, options: AbstractSeekOptions<string>) {
    this.innerIterator.seek(target, options);
  }
}
