load-collada-dae [![npm version](https://badge.fury.io/js/load-collada-dae.svg)](http://badge.fury.io/js/load-collada-dae) [![Build Status](https://travis-ci.org/chinedufn/load-collada-dae.svg?branch=master)](https://travis-ci.org/chinedufn/load-collada-dae)
====================

WORK IN PROGRESS
================

> Loads the WebGL graphics buffer data from a [.dae file](https://en.wikipedia.org/wiki/COLLADA) that's been parsed using a [.dae parser](https://github.com/chinedufn/collada-dae-parser) and return a draw command that accepts options

[TODO: View demo]()

## To Install

```
$ npm install --save load-collada-dae
```

## Running the demo locally

// TODO

## Usage

```js
var loadDae = require('load-collada-dae')

// You would usually parse your .dae files before runtime and then `xhr` GET request the pre-parsed JSON
var parseDae = require('collada-dae-parser')
var modelJSON = parseDae(GetColladaFileSomehow())

// Get your WebGL context directly from a canvas, or the context exposed by your favorite library / framework
var gl = GetCanvasWebGLContextSomehow()

// This can be a DOM image element or a Uint8Array of pixel data
var image = document.getElementById('some-already-loaded-image')

var model = loadDae(gl, modelJSON, {texureImage: image})

// Later inside of your render function
model.draw({
  position: [0, -1, -5],
  interpolatedDualQuaternions: [[], [], []],
  viewMatrix: [],
  perspectiveMatrix: []
})
```

See something broken, confusing or ripe for improvement? Feel free to open an issue or PR!

## API

### `loadDae(parsedDae, loadOptions)` -> `object`

#### parsedDae

*Required*

Type: `string`

A collada `.dae` file that has been parsed into JSON.

Usually you'd use [collada-dae-parser](https://github.com/collada-dae-parser) to parser the `.dae` file pre-runtime.
But any parser that outputs the same format will do.

#### loadOptions

*Optional*

type: `object`

`load-collada-dae` comes with default options, but you'll likely want to override some.

```js
var myOptions = {
  textureImage: document.getElementById('some-already-loaded-image') || new Uint8Array([255, 0, 0, 255])
}
```

##### loadOptions.textureImage

*type* `HTMLImageElement` or `Uint8Array`

You pass in an [HTMLImageElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement) or [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) for your model's texture

If using an image element, make sure that the onload event has already fired

```js
// example of loading the image
var image = document.getElementById('my-image') || new window.Image()
image.onload = function () {
  loadDae(gl, modelJSON, {texture: image})
}
image.src = 'https://cool-image-texture.com/cool-image.jpg'
```

TODO: Uint8Array example

##### loadOptions.fragmentShaderFunc

*Optional*

lorem ipsum...

##### loadOptions.vertexShaderFunc

*Optional*

lorem ipsum...

### Returned Model Object

We return a `model` object with a `draw` function

#### `model.draw([drawOptions])` -> `render to canvas`

##### drawOptions

```js
// Example overrides
var myOptions = {
  perspective: require('gl-mat4/perspective')([], Math.PI / 3, 512 / 512, 0.1, 30),
  position: [5.0, 1.0, -20.0],
  viewMatrix: [1, 0, 0, 0, 1, 0, 0, 0, 1, 10, 10, 10, 1],
  xRotation: Math.PI / 3,
  yRotation: Math.PI / 2,
  zRotation: Math.PI / 4
}
```

###### drawOptions.perspective

Type: Array[16]

Default: `require('gl-mat4/perspective')([], Math.PI / 4, 256 / 256, 0.1, 100)`

Your perspective matrix

###### drawOptions.position

Type: `Array[3]`

Default: `[0.0, 0.0, -5.0]`

The x, y and z position of your model in the world.

###### drawOptions.viewMatrix

Type: `Array[16]`

Default: `[1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]` (Identity Matrix)

Your camera's view matrix

##### drawOptions.interpolatedDualQuaternions

type: `Array[n][8]`

lorem ipsum

##### drawOptions.xRotation

type: `Number (radians)`

lorem ipsum

##### drawOptions.yRotation

type: `Number (radians)`

lorem ipsum

##### drawOptions.zRotation

type: `Number (radians)`

lorem ipsum

## TODO:

- [ ] Demo in raw WebGL using an orbiting light source and materials
- [ ] Add unit test with default lighting turned on

## To Test:

*Our test suite requires [imagemagick](http://www.imagemagick.org/script/index.php) to be installed locally, due to our `image-diff` dependency*

```sh
$ npm run test
```

## See Also

- [collada-dae-parser](https://github.com/chinedufn/collada-dae-parser)
- [skeletal-animation-system](https://github.com/chinedufn/skeletal-animation-system)
- [wavefront-obj-parser](https://github.com/chinedufn/wavefront-obj-parser)
- [load-wavefront-obj](https://github.com/chinedufn/load-wavefront-obj)

## License

MIT
