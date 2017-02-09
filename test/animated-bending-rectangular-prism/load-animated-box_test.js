var test = require('tape')
var fs = require('fs')
var path = require('path')

var loadDae = require('../../')
var parseDae = require('collada-dae-parser')

var createWebGLContext = require('../test-utils/create-webgl-context.js')

var ndarray = require('ndarray')
var savePixels = require('save-pixels')
var imageDiff = require('image-diff')

var mat3FromMat4 = require('gl-mat3/from-mat4')
var quatMultiply = require('gl-quat/multiply')
var quatFromMat3 = require('gl-quat/fromMat3')
var quatScale = require('gl-quat/scale')

var webglDebug = require('webgl-debug')

var mat4Perspective = require('gl-mat4/perspective')

// TODO: Not sure why the X and Y positions of the generated image are wrong
//  When using a real canvas WebGL context in the browser we aren't having any issues
test('Animated rectangular prism', function (t) {
  t.plan(2)
  var canvasWidth = 256
  var canvasHeight = 256

  // 256 * 256 canvas with a black background
  var gl = createWebGLContext()

  // Log WebGL errors
  gl = require('webgl-debug').makeDebugContext(gl, function (err, func, args) {
    t.fail(webglDebug.glEnumToString(err), func)
  })

  // Load and draw our collada model
  // In a real application you'll usually want to pre-parse your model before runtime using the CLI
  var modelJSON = parseDae(fs.readFileSync(path.resolve(__dirname, './animated-bending-rectangular-prism_fixture.dae')).toString())
  var model = loadDae(gl, modelJSON, {})

  // All of the joint matrices at animation time zero
  var jointMatrices = modelJSON.keyframes[0]
  var jointDualQuats = convertMatricesToDualQuats(jointMatrices)

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
      boneRotQuaternions1: jointDualQuats.rotQuaternions[1],
      boneTransQuaternions0: jointDualQuats.transQuaternions[0],
      boneTransQuaternions1: jointDualQuats.transQuaternions[1]
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
    t.ok(imagesAreSame, 'Successfully rendered animated box')

    // Delete our actual newly generated test cube
    fs.unlinkSync(path.resolve(__dirname, './tmp-actual.png'))
  })
})

function convertMatricesToDualQuats (jointMatrices) {
  var rotQuaternions = []
  var transQuaternions = []

  jointMatrices.forEach(function (joint, index) {
    // Create our dual quaternion
    var rotationMatrix = mat3FromMat4([], joint)
    var rotationQuat = quatFromMat3([], rotationMatrix)
    var transVec = [joint[12], joint[13], joint[14], 0]
    var transQuat = quatScale([], quatMultiply([], transVec, rotationQuat), 0.5)

    rotQuaternions.push(rotationQuat)
    transQuaternions.push(transQuat)
  })

  return {
    rotQuaternions: rotQuaternions,
    transQuaternions: transQuaternions
  }
}
