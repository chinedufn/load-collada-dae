var generateShader = require('./shader/generate-shader.js')
var drawModel = require('./draw-model.js')
var expandVertices = require('./expand-vertices.js')
var initTexture = require('./init-texture.js')

module.exports = loadColladaDae

function loadColladaDae (gl, modelJSON, loadOpts) {
  var expandOpts = {}
  expandOpts.hasTexture = !!loadOpts.texture

  var vertexData = expandVertices(modelJSON, expandOpts)

  var vertexPositionBuffer = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, modelJSON.vertexPositions)
  var vertexPositionIndexBuffer = createBuffer(gl, 'ELEMENT_ARRAY_BUFFER', Uint16Array, vertexData.vertexPositionIndices)
  var vertexNormalBuffer = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, vertexData.vertexNormals)
  var vertexJointIndexBuffer = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, vertexData.vertexJointAffectors)
  var weightBuffer = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, vertexData.vertexJointWeights)
  // If the user's model has a texture we create our texture buffer
  var modelTexture
  var vertexTextureBuffer
  if (loadOpts.texture) {
    vertexTextureBuffer = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, vertexData.vertexUVs)
    modelTexture = initTexture(gl, loadOpts)
  }

  var shader = generateShader(gl, {
    fragmentShaderFunc: loadOpts.fragmentShaderFunc,
    vertexShaderFunc: loadOpts.vertexShaderFunc,
    numJoints: vertexData.numJoints,
    texture: !!loadOpts.texture
  })

  return {
    draw: drawModel.bind(null, gl, {
      vertexNormalBuffer: vertexNormalBuffer,
      vertexPositionBuffer: vertexPositionBuffer,
      vertexPositionIndexBuffer: vertexPositionIndexBuffer,
      vertexJointIndexBuffer: vertexJointIndexBuffer,
      vertexTextureBuffer: vertexTextureBuffer,
      weightBuffer: weightBuffer,
      shader: shader,
      // The texture for our model
      modelTexture: modelTexture,
      // Useful for knowing how many triangles to draw
      numIndices: modelJSON.vertexPositionIndices.length,
      numJoints: vertexData.numJoints
    }),
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
