var generateFragmentShader = require('./generate-fragment-shader.js')
var generateVertexShader = require('./generate-vertex-shader.js')
var createShaderProgam = require('create-shader-program')

module.exports = generateShader

/*
 * Generate a shader that's for drawing a skinned model
 */
function generateShader (gl, opts) {
  var vertexShaderString = (opts.vertexShaderFunc || generateVertexShader)(opts)
  var fragmentShaderString = (opts.fragmentShaderFunc || generateFragmentShader)(opts)

  return createShaderProgam(gl, vertexShaderString, fragmentShaderString)
}
