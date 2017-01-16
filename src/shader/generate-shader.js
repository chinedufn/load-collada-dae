var generateFragmentShader = require('./generate-fragment-shader.js')
var generateVertexShader = require('./generate-vertex-shader.js')

module.exports = generateShader

/*
 * Generate a shader that's for drawing a skinned model
 */
// TODO: Pull out into separate, tested shader generation repository
function generateShader (gl, opts) {
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  var fragmentShaderString = opts.fragmentShaderFunc(opts) || generateFragmentShader(opts)
  gl.shaderSource(fragmentShader, fragmentShaderString)
  gl.compileShader(fragmentShader)

  var vertexShader = gl.createShader(gl.VERTEX_SHADER)
  var vertexShaderString = opts.vertexShaderFunc(opts) || generateVertexShader(opts)
  gl.shaderSource(vertexShader, vertexShaderString)
  gl.compileShader(vertexShader)

  var shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, fragmentShader)
  gl.attachShader(shaderProgram, vertexShader)
  gl.linkProgram(shaderProgram)

  // Return our shader object data
  var shaderObj = {
    mvMatrixUniform: gl.getUniformLocation(shaderProgram, 'uMVMatrix'),
    nMatrixUniform: gl.getUniformLocation(shaderProgram, 'uNMatrix'),
    pMatrixUniform: gl.getUniformLocation(shaderProgram, 'uPMatrix'),
    program: shaderProgram,
    vertexPositionAttribute: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    vertexJointIndexAttribute: gl.getAttribLocation(shaderProgram, 'aJointIndex'),
    vertexJointWeightAttribute: gl.getAttribLocation(shaderProgram, 'aJointWeight')
  }

  if (opts.texture) {
    shaderObj.samplerUniform = gl.getUniformLocation(shaderProgram, 'uSampler')
    shaderObj.textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTextureCoord')
  }

  // TODO: Don't hard code # of joints
  for (var jointNum = 0; jointNum < opts.numJoints; jointNum++) {
    // Split our dual quaternion into two vec4's since we can't use mat2x4 in WebGL
    shaderObj['boneRotQuaternion' + jointNum] = gl.getUniformLocation(shaderProgram, 'boneRotQuaternions[' + jointNum + ']')
    shaderObj['boneTransQuaternion' + jointNum] = gl.getUniformLocation(shaderProgram, 'boneTransQuaternions[' + jointNum + ']')
  }

  return shaderObj
}
