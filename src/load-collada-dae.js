var generateShader = require('./shader/generate-shader.js')
var drawModel = require('./draw-model.js')
var expandVertices = require('./expand-vertices.js')

module.exports = loadColladaDae

function loadColladaDae (gl, modelJSON, loadOpts) {
  var vertexData = expandVertices(modelJSON)

  var vertexPositionBuffer = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, modelJSON.vertexPositions)
  var vertexPositionIndexBuffer = createBuffer(gl, 'ELEMENT_ARRAY_BUFFER', Uint16Array, vertexData.vertexPositionIndices)
  // var vertexNormalBuffer = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, modelJSON.vertexNormals)
  var vertexJointIndexBuffer = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, vertexData.vertexJointAffectors)
  var weightBuffer = createBuffer(gl, 'ARRAY_BUFFER', Float32Array, vertexData.vertexJointWeights)

  var shader = generateShader(gl, {numJoints: vertexData.numJoints})

  return {
    draw: drawModel.bind(null, gl, {
      // vertexNormalBuffer: vertexNormalBuffer,
      vertexPositionBuffer: vertexPositionBuffer,
      vertexPositionIndexBuffer: vertexPositionIndexBuffer,
      vertexJointIndexBuffer: vertexJointIndexBuffer,
      weightBuffer: weightBuffer,
      shader: shader,
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
