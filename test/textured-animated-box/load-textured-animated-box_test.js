var test = require('tape')
var fs = require('fs')
var path = require('path')

var loadDae = require('../../')
var parseDae = require('collada-dae-parser')

var ndarray = require('ndarray')
var savePixels = require('save-pixels')
var imageDiff = require('image-diff')

var createWebGLContext = require('../test-utils/create-webgl-context.js')
var keyframesToDualQuats = require('../test-utils/keyframes-to-dual-quats.js')

var mat4Perspective = require('gl-mat4/perspective')

// TODO: Not sure why the X and Y positions of the generated image are wrong
//  When using a real canvas WebGL context in the browser we aren't having any issues
test('Animated textured rectangular prism', function (t) {
  t.plan(2)

  var gl = createWebGLContext()
  var canvasWidth = 256
  var canvasHeight = 256

  // Generate some image data since `require('gl)` only allows Uint8Array texture data
  var imageData = new Uint8Array(canvasWidth * canvasHeight * 4)
  for (var i = 0; i < 256; ++i) {
    for (var j = 0; j < 256; ++j) {
      imageData[canvasWidth * i + (4 * j)] = (i + j) % 255
      imageData[canvasWidth * i + (4 * j)] = 255
      imageData[canvasWidth * i + (4 * j) + 1] = (i + j) % 255
      imageData[canvasWidth * i + (4 * j) + 2] = (i + j) % 255
      imageData[canvasWidth * i + (4 * j) + 3] = 255
    }
  }

  // Load and draw our collada model
  // In a real application you'll usually want to pre-parse your model before runtime using the CLI
  var modelJSON = parseDae(fs.readFileSync(path.resolve(__dirname, './textured-animated-box_fixture.dae')).toString())
  var model = loadDae(gl, modelJSON, {texture: imageData})

  // All of the joint matrices at animation time zero
  var jointMatrices = modelJSON.keyframes[0]
  var jointDualQuats = keyframesToDualQuats(jointMatrices)

  gl.useProgram(model.shaderProgram)

  model.draw({
    attributes: model.attributes,
    uniforms: {
      uUseLighting: false,
      uAmbientColor: [0, 0, 0],
      uLightingDirection: [0, 0, 0],
      uDirectionalColor: [0, 0, 0],
      // Translation matrix with model positioned at [0, 0, -17]
      uMVMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.0, 0.0, -17.0, 1],
      uPMatrix: mat4Perspective([], Math.PI / 4, 256 / 256, 0.1, 100),
      boneRotQuaternions0: jointDualQuats.rotQuaternions[0],
      boneTransQuaternions0: jointDualQuats.transQuaternions[0]
    }
  })

  var pixels = new Uint8Array(canvasWidth * canvasHeight * 4)
  gl.readPixels(0, 0, canvasWidth, canvasHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  var nd = ndarray(pixels, [canvasWidth, canvasHeight, 4])

  // Save the model that we just drew so that we can test it against our expected model
  savePixels(nd, 'png').pipe(fs.createWriteStream(path.resolve(__dirname, './tmp-actual.png')))

  // Test that our actual rendered model matches our expected model fixture
  imageDiff({
    actualImage: path.resolve(__dirname, './tmp-actual.png'),
    expectedImage: path.resolve(__dirname, './expected-animated-bending-rectangular-prism_fixture.png')
  }, function (err, imagesAreSame) {
    t.notOk(err, 'No error while comparing images')
    t.ok(imagesAreSame, 'Successfully rendered our animated bending rectangular prism')

    // Delete our actual newly generated test cube
    fs.unlinkSync(path.resolve(__dirname, './tmp-actual.png'))
  })
})
