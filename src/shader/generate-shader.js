var generateFragmentShader = require('./generate-fragment-shader.js')
var generateVertexShader = require('./generate-vertex-shader.js')
var getAttributesUniforms = require('get-attributes-uniforms')

module.exports = generateShader

/*
 * Generate a shader that's for drawing a skinned model
 */
// TODO: Pull out into separate, tested shader generation repository
function generateShader (gl, opts) {
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  var fragmentShaderString = (opts.fragmentShaderFunc || generateFragmentShader)(opts)
  gl.shaderSource(fragmentShader, fragmentShaderString)
  gl.compileShader(fragmentShader)

  var vertexShader = gl.createShader(gl.VERTEX_SHADER)
  var vertexShaderString = (opts.vertexShaderFunc || generateVertexShader)(opts)
  gl.shaderSource(vertexShader, vertexShaderString)
  gl.compileShader(vertexShader)

  var shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, fragmentShader)
  gl.attachShader(shaderProgram, vertexShader)
  gl.linkProgram(shaderProgram)

  var vertexShaderAttributesUniforms = getAttributesUniforms(vertexShaderString)
  var fragmentShaderAttributesUniforms = getAttributesUniforms(fragmentShaderString)

  var shaderObj = {
    attributes: {},
    program: shaderProgram,
    uniforms: {}
  }

  // Loop through all of our attributes and get their locations
  Object.keys(vertexShaderAttributesUniforms.attributes).forEach(function (attributeName) {
    getAttributeLocations(attributeName, vertexShaderAttributesUniforms.attributes[attributeName])
  })
  Object.keys(fragmentShaderAttributesUniforms.attributes).forEach(function (attributeName) {
    getAttributeLocations(attributeName, fragmentShaderAttributesUniforms.attributes[attributeName])
  })

  // Loop through all of the uniforms and get their locations
  Object.keys(vertexShaderAttributesUniforms.uniforms).forEach(function (uniformName) {
    getUniformLocations(uniformName, vertexShaderAttributesUniforms.uniforms[uniformName])
  })
  Object.keys(fragmentShaderAttributesUniforms.uniforms).forEach(function (uniformName) {
    getUniformLocations(uniformName, fragmentShaderAttributesUniforms.uniforms[uniformName])
  })

  return shaderObj

  function getUniformLocations (uniformName, uniformTypw) {
    // If the uniform is not an array we get it's location
    var openBracketIndex = uniformName.indexOf('[')
    if (openBracketIndex === -1) {
      shaderObj.uniforms[uniformName] = {
        location: gl.getUniformLocation(shaderProgram, uniformName)
      }
    } else {
      // If the uniform if an array we get the location of each element in the array
      var closedBracketIndex = uniformName.indexOf(']')
      // We're converting someUniformArray[n] -> n
      var uniformArraySize = Number(uniformName.substring(openBracketIndex + 1, closedBracketIndex))
      // We're converting someUniformArray[n] -> someUniformArray
      var uniformArrayName = uniformName.substring(0, openBracketIndex)

      // Get the uniform location of each element in the array
      //  Naming convention -> someUniform1, someUniform2, ... someAtribute25
      for (var arrayElement = 0; arrayElement < uniformArraySize; arrayElement++) {
        // ex: shaderObj[someUniform2] = gl.getUniformLocation(shaderProgram, someUniform[2])
        shaderObj.uniforms[uniformArrayName + arrayElement] = {
          location: gl.getUniformLocation(shaderProgram, uniformArrayName + '[' + arrayElement + ']')
        }
      }
    }
  }

  function getAttributeLocations (attributeName, attributeType) {
    shaderObj.attributes[attributeName] = {
      location: gl.getAttribLocation(shaderProgram, attributeName)
    }
  }
}
