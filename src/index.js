/**
 * Cancelable identifier.
 */

const CANCELABLE_IDENTIFIER = '@@Cancelable';

class CancelationError extends Error {
  constructor() {
    super('Cancelable was canceled');

    this.name = 'CancelationError';
  }
}

/**
 * Export `Cancelable`.
 */

export default class Cancelable {
  canceled = false;
  children = null;
  onCancel = null;
  parent = null;

  constructor(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('Cancelable resolver undefined is not a function');
    }

    Object.defineProperty(this, CANCELABLE_IDENTIFIER, {
      value: true,
      writable: false,
      readable: true
    });

    this.promise = new Promise((resolve, reject) => {
      this._reject = reject;

      // Wraps the executor into a promise and passes `resolve`, `reject` and `onCancel` methods.
      new Promise((resolve, reject) => {
        executor(
          value => {
            resolve(value);
          },
          reason => {
            reject(reason);
          },
          callback => {
            this.onCancel = callback;
          }
        );
      })
        .then(value => {
          resolve(value);
        })
        .catch(reason => {
          reject(reason);
        });
    });
  }

  /**
   * Returns a cancelable that either fulfills when all of the values in the
   * iterable argument have fulfilled or rejects as soon as one of the
   * cancelables in the iterable argument rejects.
   *
   * This method wraps the `Promise.all` method and creates a list of
   * cancelables that are canceled when `.cancel()` is called.
   */

  static all(iterable) {
    const cancelable = Cancelable.resolve(Promise.all(iterable));

    for (const value of iterable) {
      if (!Cancelable.isCancelable(value)) {
        continue;
      }

      if (cancelable.children) {
        cancelable.children.push(value);
      } else {
        cancelable.children = [value];
      }
    }

    return cancelable;
  }

  /**
   * Determines whether the passed value is a `Cancelable`.
   */

  static isCancelable(value) {
    return !!(value && value[CANCELABLE_IDENTIFIER]);
  }

  /**
   * Returns a cancelable that fulfills or rejects as soon as one of the
   * cancelables in the iterable fulfills or rejects, with the value or reason
   * from that cancelable.
   *
   * This method wraps the `Promise.all` method and creates a list of
   * cancelables that are canceled when `.cancel()` is called.
   */

  static race(promises) {
    const cancelable = Cancelable.resolve(Promise.race(promises));

    for (const promise of promises) {
      if (!Cancelable.isCancelable(promise)) {
        continue;
      }

      if (cancelable.children) {
        cancelable.children.push(promise);
      } else {
        cancelable.children = [promise];
      }
    }

    return cancelable;
  }

  /**
   * Returns a `Cancelable` object that is resolved with the given value. If the
   * value is a thenable (i.e. has a then method), the returned promise will
   * unwrap that thenable, adopting its eventual state. Otherwise the returned
   * promise will be fulfilled with the value.
   */

  static resolve(value) {
    if (Cancelable.isCancelable(value)) {
      return value;
    }

    return new Cancelable(resolve => {
      resolve(value);
    });
  }

  /**
   * Returns a `Cancelable` object that is rejected with the given reason.
   */

  static reject(reason) {
    return Cancelable.resolve(Promise.reject(reason));
  }

  /**
   * Cancels the `Cancelable`. It iterates upwards the chain canceling all the
   * registered cancelables including its children.
   */

  cancel(cb = () => {}) {
    let current = this;

    if (current.isCanceled()) {
      return;
    }

    while (current) {
      let prev = current;

      if (current.children) {
        for (let child of current.children) {
          if (Cancelable.isCancelable(child)) {
            child.cancel();
            child = null;
          }
        }

        current.children = null;
      }

      current.setCanceled();

      if (current.onCancel && typeof current.onCancel === 'function') {
        current.onCancel(cb);
      }

      if (!current.parent) {
        current._reject(new CancelationError());
      }

      current = prev.parent;
      prev = null;
    }
  }

  /**
   * Has the same behavior of `Promise.catch` method.
   * Appends a rejection handler callback to the cancelable, and returns a new
   * `Cancelable` resolving to the return value of the callback if it is called,
   * or to its original fulfillment value if the cancelable is instead fulfilled.
   */

  catch(...args) {
    const cancelable = Cancelable.resolve(this.promise.catch(...args));

    cancelable.parent = this;

    return cancelable;
  }

  /**
   * Determines whether the created `Cancelable` is canceled.
   */

  isCanceled() {
    return this.canceled;
  }

  setCanceled() {
    this.canceled = true;
  }

  /**
   * Has the same behavior of `Promise.then` method.
   * Appends fulfillment and rejection handlers to the cancelable, and returns
   * a new `Cancelable` resolving to the return value of the called handler,
   * or to its original settled value if the promise was not handled.
   */

  then(...args) {
    const cancelable = Cancelable.resolve(this.promise.then(...args));

    cancelable.parent = this;

    return cancelable;
  }
}
