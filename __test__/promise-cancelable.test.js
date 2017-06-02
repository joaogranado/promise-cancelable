/**
 * Module dependencies.
 */

import Cancelable from '../src';

/**
 * Test `Cancelable`.
 */

describe('Cancelable', () => {
  describe('constructor', () => {
    it('throws an error if the given executor is not a function', () => {
      expect(() => new Cancelable()).toThrow(
        'Cancelable resolver undefined is not a function'
      );
    });

    it('creates an object with default properties', () => {
      const cancelable = new Cancelable(() => {});

      expect(cancelable).toHaveProperty('@@Cancelable', true);
      expect(cancelable).toHaveProperty('canceled', false);
      expect(cancelable).toHaveProperty('children', null);
      expect(cancelable).toHaveProperty('onCancel', null);
      expect(cancelable).toHaveProperty('parent', null);
      expect(cancelable).toHaveProperty('promise');
      expect(typeof cancelable.then === 'function').toBe(true);
    });

    it('creates a cancelable that resolves the given executor', async () => {
      const cancelable = new Cancelable(resolve => {
        resolve('foo');
      });

      expect(await cancelable).toBe('foo');
    });

    it('passes a cancelation handler to the executor which is called when it is canceled', () => {
      const cb = jest.fn();

      new Cancelable((resolve, reject, onCancel) => {
        onCancel(cb);
      }).cancel();

      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('isCancelable', () => {
    it('returns false if a value is not provided', () => {
      expect(Cancelable.isCancelable()).toBe(false);
    });

    it('returns false if the given value is not a cancelable', () => {
      expect(Cancelable.isCancelable('foo')).toBe(false);
    });

    it('returns true if the given value is a cancelable', () => {
      const cancelable = Cancelable.resolve();

      expect(Cancelable.isCancelable(cancelable)).toBe(true);
    });
  });

  describe('reject', () => {
    it('rejects the promise', () => {
      return Cancelable.reject('foo').catch(value => {
        expect(value).toBe('foo');
      });
    });
  });

  describe('then', () => {
    it('returns a new Cancelable', () => {
      expect(Cancelable.isCancelable(Cancelable.resolve().then()));
    });

    it('can be chained', () => {
      return Cancelable.resolve(1).then(value => value).then(value => {
        expect(value).toBe(1);
      });
    });
  });

  describe('isCanceled', () => {
    it('returns false by default', () => {
      expect(Cancelable.resolve().isCanceled()).toBe(false);
    });

    it('returns true if the cancelable was canceled', () => {
      const cancelable = Cancelable.resolve();

      cancelable.cancel();

      expect(cancelable.isCanceled()).toBe(true);
    });
  });

  describe('resolve', () => {
    it('returns a Cancelable', () => {
      expect(Cancelable.isCancelable(Cancelable.resolve())).toBe(true);
    });

    it('returns the given cancelable', () => {
      const cancelable = Cancelable.resolve();

      expect(Cancelable.resolve(cancelable) === cancelable).toBe(true);
    });
  });

  describe('all', () => {
    it('resolves the given values', async () => {
      const cancelable = Cancelable.resolve('foo');
      const promise = Promise.resolve('bar');

      expect(await Cancelable.all([cancelable, promise])).toEqual([
        'foo',
        'bar'
      ]);
    });

    it('stores the cancelables', () => {
      const cancelable1 = Cancelable.resolve();
      const cancelable2 = Cancelable.resolve();
      const all = Cancelable.all([cancelable1, 1, cancelable2, 2, 3]);

      expect(all.children.length).toBe(2);
      expect(all.children).toEqual([cancelable1, cancelable2]);
    });

    it('cancels all the given cancelables', () => {
      const cancelable1 = Cancelable.resolve();
      const cancelable2 = Cancelable.resolve();
      const all = Cancelable.all([cancelable1, cancelable2]);

      expect(all.children.length).toBe(2);
      expect(all.children).toEqual([cancelable1, cancelable2]);
      expect(all.isCanceled()).toBe(false);
      expect(cancelable1.isCanceled()).toBe(false);
      expect(cancelable2.isCanceled()).toBe(false);

      all.cancel();

      expect(all.children).toBeNull();
      expect(all.isCanceled()).toBe(true);
      expect(cancelable1.isCanceled()).toBe(true);
      expect(cancelable2.isCanceled()).toBe(true);
    });
  });

  describe('race', () => {
    it('resolves the given values', async () => {
      return Cancelable.race([1, 2]).then(value => {
        expect(value).toBe(1);
      });
    });

    it('stores the cancelables', () => {
      const cancelable1 = Cancelable.resolve();
      const cancelable2 = Cancelable.resolve();
      const race = Cancelable.race([cancelable1, 1, cancelable2, 2, 3]);

      expect(race.children.length).toBe(2);
      expect(race.children).toEqual([cancelable1, cancelable2]);
    });

    it('cancels all the given cancelables', () => {
      const cancelable1 = Cancelable.resolve();
      const cancelable2 = Cancelable.resolve();
      const race = Cancelable.race([cancelable1, cancelable2]);

      expect(race.children.length).toBe(2);
      expect(race.children).toEqual([cancelable1, cancelable2]);
      expect(race.isCanceled()).toBe(false);
      expect(cancelable1.isCanceled()).toBe(false);
      expect(cancelable2.isCanceled()).toBe(false);

      race.cancel();

      expect(race.children).toBeNull();
      expect(race.isCanceled()).toBe(true);
      expect(cancelable1.isCanceled()).toBe(true);
      expect(cancelable2.isCanceled()).toBe(true);
    });
  });
});
