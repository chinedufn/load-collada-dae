// We use this when auto generating our draw function code. This map
// helps us determine the size of attributes and the function that we need
// to buffer a uniform
// This could be auto generated but don't see a reason to quite yet.
// Readability wins until performance becomes an issue
// TODO: Better name than `typeInformation`
var typeInformation = {
  vec2: {
    attributeSize: 2,
    uniformType: 'uniform2fv'
  },
  vec3: {
    attributeSize: 3,
    uniformType: 'uniform3fv'
  },
  vec4: {
    attributeSize: 4,
    uniformType: 'uniform4fv'
  },
  bool: {
    uniformType: 'uniform1i'
  },
  mat4: {
    uniformType: 'uniformMatrix4fv'
  },
  sampler2D: {
    uniformType: 'uniform1i'
  }
}

module.exports = createDrawFunction

/**
 * A super experimental function that creates a draw function based on
 * the shader program
 *
 * TODO: Pull out into separate tested repo
 * TODO: Create separate disable and enable functions
 * TODO: Cite `regl` as inspiration
 * TODO: Detailed commenting
 */
function createDrawFunction (gl, program, attributeData, uniformData, elementBuffer, numIndices, textures) {
  // Loop through each attribute and generate a string of JavaScript
  // that will buffer it's data
  var allAttributesString = Object.keys(attributeData).reduce(function bufferAttributeData (allAttributesString, attributeName) {
    // Attribute locations are integers so we can just pass it right in
    var attributeLocation = attributeData[attributeName].location
    var attributeSize = typeInformation[attributeData[attributeName].type].attributeSize

    allAttributesString += `
      gl.bindBuffer(gl.ARRAY_BUFFER, drawOpts.attributes.${attributeName})
      gl.enableVertexAttribArray(${attributeLocation})
      gl.vertexAttribPointer(${attributeLocation}, ${attributeSize}, gl.FLOAT, false, 0, 0)
    `

    return allAttributesString
  }, '')

  // Uniform locations are objects so we we will pass into the generated function
  var uniformLocations = {}

  // Loop through each uniform and generate a string of JavaScript
  // that will buffer it's data
  var allUniformsString = Object.keys(uniformData)
  .sort(function (a, b) {
    var aUniformType = uniformData[a].type
    var bUniformType = uniformData[b].type
    if (aUniformType === 'sampler2D') {
      return -1
    } else if (bUniformType === 'sampler2D') {
      return 1
    }

    return 0
  })
  .reduce(function bufferAttributeData (allUniformsString, uniformName) {
    var uniformType = typeInformation[uniformData[uniformName].type].uniformType
    uniformLocations[uniformName] = uniformData[uniformName].location

    // When buffering 4x4 matrices there's a transpose parameter that we'll need to add in
    var transposeParemeter = ''
    if (uniformType === 'uniformMatrix4fv') {
      // We do not support transposing the matrix input. The user can do this themselves before passing it in if they ever need to
      transposeParemeter = 'false,'
    }

    if (uniformData[uniformName].type === 'sampler2D') {
      // Set the active texture and then pass the uniform data to the gpu
      // TODO: We don't need to do this everything. So be smarter.. Maybe allow a param to be passed in
      // TODO: Currently only supports one texture. Should we allow more than one? Do some research..
      allUniformsString += `
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, textures[0])
        gl.uniform1i(uniformLocations.${uniformName}, 0)
      `
    } else {
      // If we are not dealing with texture uniforms we don't need to set the active texture
      allUniformsString += `
        gl.${uniformType}(uniformLocations.${uniformName}, ${transposeParemeter} drawOpts.uniforms.${uniformName})
      `
    }

    return allUniformsString
  }, '')

  var elementsStatement = `
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer)
    gl.drawElements(gl.TRIANGLES, numIndices, gl.UNSIGNED_SHORT, 0)
  `

  // Get around Standard's linter. No WiFi right now so can't look up a better way...
  var Func = Function

  // TODO: Make the element buffer and num indices a part of drawOpts passed in by user
  var drawFunction = new Func(
    'gl',
    'uniformLocations',
    'elementBuffer',
    'numIndices',
    'textures',
    'drawOpts',
    allAttributesString + allUniformsString + elementsStatement
  )

  return drawFunction.bind(null, gl, uniformLocations, elementBuffer, numIndices, textures)
}
