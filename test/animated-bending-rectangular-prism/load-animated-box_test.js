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

// TODO: Not sure why the X and Y positions of the generated image are wrong
//  When using a real canvas WebGL context in the browser we aren't having any issues
test('Animated rectangular prism', function (t) {
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
  // TODO: These should fail test
  gl = require('webgl-debug').makeDebugContext(gl, function (err, func, args) {
    console.log(require('webgl-debug').glEnumToString(err), func)
  })

  // Load and draw our collada model
  // In a real application you'll usually want to pre-parse your model before runtime using the CLI
  var modelJSON = parseDae(fs.readFileSync(path.resolve(__dirname, './animated-bending-rectangular-prism_fixture.dae')).toString())
  var model = loadDae(gl, modelJSON, {})

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

  savePixels(nd, 'png').pipe(fs.createWriteStream(path.resolve(__dirname, './foo.png')))
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
