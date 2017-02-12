var generateShader = require('./shader/generate-shader.js')
var expandVertices = require('./expand-vertices.js')
var initTexture = require('./init-texture.js')

var createDrawFunction = require('./draw/create-draw-function.js')

module.exports = loadColladaDae

function loadColladaDae (gl, modelJSON, loadOpts) {
  var expandOpts = {}
  expandOpts.hasTexture = !!loadOpts.texture

  var vertexData = expandVertices(modelJSON, expandOpts)

  // Create our shader program
  var shader = generateShader(gl, {
    fragmentShaderFunc: loadOpts.fragmentShaderFunc,
    vertexShaderFunc: loadOpts.vertexShaderFunc,
    numJoints: vertexData.numJoints,
    texture: !!loadOpts.texture
  })

  var aVertexPosition = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, modelJSON.vertexPositions)
  var aVertexNormal = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, vertexData.vertexNormals)
  var aJointIndex = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, vertexData.vertexJointAffectors)
  var aJointWeight = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, vertexData.vertexJointWeights)
  var vertexPositionIndexBuffer = createBuffer(gl, 'ELEMENT_ARRAY_BUFFER', Uint16Array, vertexData.vertexPositionIndices)

    // Data that we pass into our draw call that does not change
  var bufferData = {
    shader: shader,
    // Useful for knowing how many triangles to draw
    numIndices: modelJSON.vertexPositionIndices.length,
    numJoints: vertexData.numJoints
  }
  var attributes = {
    aVertexNormal: aVertexNormal,
    aVertexPosition: aVertexPosition,
    aJointIndex: aJointIndex,
    aJointWeight: aJointWeight
  }

  // If the user's model has a texture we create our texture buffer
  var textures = []
  if (loadOpts.texture) {
    attributes.aTextureCoord = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, vertexData.vertexUVs)
    textures[0] = initTexture(gl, loadOpts)
  }

  // Generate a JavaScript draw function from the passed in shaders and our collada model data.
  // TODO: We shouldn't be enabling and disabling the vertex attributes every time. What if the consumer wants to draw the same model many times in a row?
  //        we should instead make it the consumers responsibility to enable / disable. We can give them a generated `enable()` and `disable()` function to do so
  // TODO: Turn this into a separate, tested module that anyone can use
  var generatedDrawFunction = createDrawFunction(gl, shader.program, shader.attributes, shader.uniforms, vertexPositionIndexBuffer, modelJSON.vertexPositionIndices.length, textures)

  return {
    draw: generatedDrawFunction,
    bufferData: bufferData,
    attributes: attributes,
    // Useful for letting our consumer call gl.useProgram()
    //  If they're drawing this model many times, they'll want to call `useProgram` themselves, only once, right before drawing
    shaderProgram: shader.program
  }
}

/*
 * Used to create a new WebGL buffer for pushing data to the GPU
 */
function createBuffer (gl, bufferType, DataType, data) {
  var buffer = gl.createBuffer()
  gl.bindBuffer(gl[bufferType], buffer)
  gl.bufferData(gl[bufferType], new DataType(data), gl.STATIC_DRAW)
  return buffer
}
