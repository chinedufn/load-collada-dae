var createContext = require('gl')
var webglDebug = require('webgl-debug')

module.exports = createWebGLContext

// Create a WebGL context that we can use
// to test load-collada-dae
function createWebGLContext () {
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
    throw new Error(webglDebug.glEnumToString(err) + ' ' + func)
  })

  return gl
}
