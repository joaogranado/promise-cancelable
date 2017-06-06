# Cancelable

[![Greenkeeper badge](https://badges.greenkeeper.io/joaogranado/promise-cancelable.svg)](https://greenkeeper.io/)

> Wrapper to create cancelable promises.

A `Promise` cannot be canceled since once it is created and fulfillment or a rejection handler is registered to it, there is no external mechanism to stop its progression.
A `Cancelable` wraps the ES6 standard `Promise`, and it is compatible with whatever promise-consuming tool.

## Status

[![Travis](https://img.shields.io/travis/joaogranado/promise-cancelable.svg?style=flat-square)](https://travis-ci.org/joaogranado/promise-cancelable)

## Installation

```sh
npm install --save promise-cancelable
```

or

```
yarn add promise-cancelable
```

## What is a Cancelable

A `Cancelable` implements the same methods of a standard ES6 `Promise`, however:

- It can be canceled. Once the `.cancel()` method is called it notifies all registered resolution handlers.
- The `constructor` executor parameter receives an additional `onCancel` argument is executed once the `.cancel()` is called.

## API

### `Cancelable`

The constructor has a single parameter - the `Cancelable` resolver, which is a function that is passed with the arguments `resolve`, `reject` and `onCancel`. The `onCancel` is a function that receives an handler which that is called once the `Cancelable` is canceled.

```js
const delay = delta => {
  return new Cancelable((resolve, reject, onCancel) => {
    const id = setTimeout(() => {
      resolve(id);
    }, delta);

    // Called when canceled.
    onCancel(() => {
      clearTimeout(id);

      console.log(`Cancelled! ${id}`);
    });
  });
};

// Without cancelation.
delay(100)
  .then(console.log); // > '1'

// With cancelation.
delay(100)
  .then(console.log) // Not called.
  .cancel(); // > 'Cancelled 1'
```

### `Cancelable.all(iterable: Iterable<T>): Cancelable<Array<T>>`
Has the same behaviour as the `Promise.all` method, except when it is canceled it cancels all `Cancelable`s included on the iterable argument.

Returns a cancelable that either fulfills when all of the values in the iterable argument have fulfilled or rejects as soon as one of the cancelables in the iterable argument rejects. This method wraps the `Promise.all` method and creates a list of cancelables that are canceled when `.cancel()` is called.

```js
// Without cancelation.
Cancelable
  .all(['foo', delay(1), delay(2)])
  .then(console.log); // > ['foo', 1, 2]

// With cancelation.
Cancelable
  .all([delay(1), delay(2)])
  .then(console.log); // Not called.
  .cancel()
  // > Cancelled 1
  // > Cancelled 2
```

### `Cancelable.race(iterable: Iterable<T>): Cancelable<T>`
Has the same behaviour as the `Promise.race` method, except when it is canceled it cancels all `Cancelable`s included on the iterable argument.
Returns a cancelable that fulfills or rejects as soon as one of the cancelables in the iterable fulfills or rejects, with the value or reason from that cancelable. This method wraps the `Promise.all` method and creates a list of cancelables that are canceled when `.cancel()` is called.

```js
// Without cancelation.
Cancelable
  .race([delay(1), delay(2)])
  .then(console.log); // > 1

// With cancelation.
Cancelable
  .all([delay(1), delay(2)])
  .then(console.log); // Not called.
  .cancel()
  // > Cancelled 1
  // > Cancelled 2
```

### `Cancelable.resolve(value: any)`
Has the same behavior as the `Promise.resolve` method.
Returns a `Cancelable` object that is resolved with the given value. If the value is a thenable (i.e. has a then method), the returned cancelable will unwrap that thenable, adopting its eventual state. Otherwise the returned cancelable will be fulfilled with the value.

### `Cancelable.reject(value: any)`
Has the same behavior as the `Promise.reject` method.
Returns a `Cancelable` object that is rejected with the given reason.

### `Cancelable.isCancelable(value: any): boolean`
Determines whether the passed value is a `Cancelable`.

### `Cancelable.prototype.isCanceled(): boolean`
Determines whether the created `Cancelable` is canceled.

### `Cancelable.prototype.cancel()`
Cancels the `Cancelable`. It iterates upwards the chain canceling all the registered cancelables including its children.

### `Cancelable.prototype.catch(onRejected: Function): Cancelable`
Has the same behavior of `Promise.catch` method.
Appends a rejection handler callback to the cancelable, and returns a new `Cancelable` resolving to the return value of the callback if it is called, or to its original fulfillment value if the cancelable is instead fulfilled.

### `Cancelable.prototype.then(onFullfilled: Function, onRejected: Function): Cancelable`
Has the same behavior of `Promise.then` method.
Appends fulfillment and rejection handlers to the cancelable, and returns a new `Cancelable` resolving to the return value of the called handler, or to its original settled value if the promise was not handled.

## Licence

MIT © [João Granado](https://github.com/joaogranado)
