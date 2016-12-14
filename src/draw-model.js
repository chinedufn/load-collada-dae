var mat4Create = require('gl-mat4/create')
var mat4Multiply = require('gl-mat4/multiply')
var mat4Perspective = require('gl-mat4/perspective')
var mat4Translate = require('gl-mat4/translate')
var mat3NormalFromMat4 = require('gl-mat3/normal-from-mat4')

module.exports = drawModel

var defaultDrawOpts = {
  perspective: mat4Perspective([], Math.PI / 4, 256 / 256, 0.1, 100),
  position: [0.0, 0.0, -5.0],
  viewMatrix: mat4Create()
}

/*
 * Draw a collada model onto a canvas
 */
// TODO: Test and optimize for multiple calls in a row for the same model
//  certain things don't need to happen the second time you draw the same model
function drawModel (gl, bufferData, drawOpts) {
  drawOpts = Object.assign({}, defaultDrawOpts, drawOpts)

  // Move our model to the specified position
  var modelMatrix = mat4Create()
  mat4Translate(modelMatrix, modelMatrix, drawOpts.position)
  mat4Multiply(modelMatrix, drawOpts.viewMatrix, modelMatrix)

  // TODO: Should we just let the consumer handle this?
  gl.useProgram(bufferData.shader.program)

  // TODO: Don't need to enable vertex attribs if we are re-drawing the same model
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.vertexPositionBuffer)
  // TODO: See if we can move all of these enable calls to the top, or if order matters
  //  easier to refactor the enabling process later if they're all together
  gl.enableVertexAttribArray(bufferData.shader.vertexPositionAttribute)
  gl.vertexAttribPointer(bufferData.shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0)

  /*
  // Vertex normals
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.shader.vertexNormalBuffer)
  gl.enableVertexAttribArray(bufferData.shader.vertexNormalAttribute)
  gl.vertexAttribPointer(bufferData.shader.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0)
  */

  // TODO: Need to use dual quaternions if we are not using matrices
  var normalMatrix = []
  mat3NormalFromMat4(normalMatrix, modelMatrix)
  gl.uniformMatrix3fv(bufferData.shader.nMatrixUniform, false, normalMatrix)

  // Vertex joints
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.vertexJointIndexBuffer)
  gl.enableVertexAttribArray(bufferData.shader.vertexJointIndexAttribute)
  gl.vertexAttribPointer(bufferData.shader.vertexJointIndexAttribute, 4, gl.FLOAT, false, 0, 0)

  // Vertex joint weights
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.weightBuffer)
  gl.enableVertexAttribArray(bufferData.shader.vertexJointWeightAttribute)
  gl.vertexAttribPointer(bufferData.shader.vertexJointWeightAttribute, 4, gl.FLOAT, false, 0, 0)

  // TODO: Just pre-multiply these?
  gl.uniformMatrix4fv(bufferData.shader.pMatrixUniform, false, drawOpts.perspective)
  gl.uniformMatrix4fv(bufferData.shader.mvMatrixUniform, false, modelMatrix)

  // Draw our model
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferData.vertexPositionIndexBuffer)
  gl.drawElements(gl.TRIANGLES, bufferData.numIndices, gl.UNSIGNED_SHORT, 0)

  // Clean up
  // TODO: Only disable when we're done re-drawing a model multiple times
  gl.disableVertexAttribArray(bufferData.shader.vertexPositionAttribute)
  // gl.disableVertexAttribArray(bufferData.shader.vertexNormalAttribute)
  gl.disableVertexAttribArray(bufferData.shader.vertexJointIndexAttribute)
  gl.disableVertexAttribArray(bufferData.shader.vertexJointWeightAttribute)
}
