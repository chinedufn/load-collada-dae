var test = require('tape')
var fs = require('fs')
var path = require('path')

var loadDae = require('../../')
var parseDae = require('collada-dae-parser')

var createContext = require('gl')

var ndarray = require('ndarray')
var savePixels = require('save-pixels')
var imageDiff = require('image-diff')

var mat3FromMat4 = require('gl-mat3/from-mat4')
var quatMultiply = require('gl-quat/multiply')
var quatFromMat3 = require('gl-quat/fromMat3')
var quatScale = require('gl-quat/scale')

var webglDebug = require('webgl-debug')

// TODO: Not sure why the X and Y positions of the generated image are wrong
//  When using a real canvas WebGL context in the browser we aren't having any issues
test('Animated textured rectangular prism', function (t) {
  t.plan(2)
  var canvasWidth = 256
  var canvasHeight = 256

  // 256 * 256 canvas with a black background
  var gl = createContext(canvasWidth, canvasHeight)
  gl.clearColor(0, 0, 0, 1)
  gl.enable(gl.DEPTH_TEST)
  gl.viewport(0, 0, canvasWidth, canvasHeight)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Log WebGL errors
  gl = require('webgl-debug').makeDebugContext(gl, function (err, func, args) {
    t.fail(webglDebug.glEnumToString(err), func)
  })

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
  var jointDualQuats = convertMatricesToDualQuats(jointMatrices)

  model.draw({
    position: [0.0, 0.0, -17.0],
    rotQuaternions: jointDualQuats.rotQuaternions,
    transQuaternions: jointDualQuats.transQuaternions
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
    t.ok(imagesAreSame, 'Successfully rendered our default blender cube')

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

