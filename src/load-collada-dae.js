module.exports = loadColladaDae

function loadColladaDae (gl, modelJSON, loadOpts) {
  var vertexPositionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelJSON.vertexPositions), gl.STATIC_DRAW)

  var vertexPositionIndexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexPositionIndexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelJSON.vertexPositionIndices), gl.STATIC_DRAW)

  var vertexNormalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelJSON.vertexNormals), gl.STATIC_DRAW)

  return {
    draw: drawModel.bind(null, gl, {
      vertexNormalBuffer: vertexNormalBuffer,
      vertexPositionBuffer: vertexPositionBuffer,
      vertexPositionIndexBuffer: vertexPositionIndexBuffer
    })
  }
}

function drawModel (gl, bufferData, drawOpts) {
}
