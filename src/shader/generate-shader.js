var generateFragmentShader = require('./generate-fragment-shader.js')
var generateVertexShader = require('./generate-vertex-shader.js')

module.exports = generateShader

/*
 * Generate a shader that's optimized for drawing the particular model
 */
// TODO: Pull out into separate, tested shader generation repository
function generateShader (gl, opts) {
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fragmentShader, generateFragmentShader(opts))
  gl.compileShader(fragmentShader)

  var vertexShader = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vertexShader, generateVertexShader(opts))
  gl.compileShader(vertexShader)

  var shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, fragmentShader)
  gl.attachShader(shaderProgram, vertexShader)
  gl.linkProgram(shaderProgram)

  // Return our shader object data
  return {
    mvMatrixUniform: gl.getUniformLocation(shaderProgram, 'uMVMatrix'),
    nMatrixUniform: gl.getUniformLocation(shaderProgram, 'uNMatrix'),
    pMatrixUniform: gl.getUniformLocation(shaderProgram, 'uPMatrix'),
    program: shaderProgram,
    vertexPositionAttribute: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    vertexNormalAttribute: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
    vertexJointIndexAttribute: gl.getAttribLocation(shaderProgram, 'aJointIndex'),
    vertexJointWeightAttribute: gl.getAttribLocation(shaderProgram, 'aJointWeight')
  }
}
