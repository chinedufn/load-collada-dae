var mat4Create = require('gl-mat4/create')
var mat4Multiply = require('gl-mat4/multiply')
var mat4Perspective = require('gl-mat4/perspective')
var mat4Translate = require('gl-mat4/translate')

var mat4RotateX = require('gl-mat4/rotateX')
var mat4RotateY = require('gl-mat4/rotateY')
var mat4RotateZ = require('gl-mat4/rotateZ')

var vec3Normalize = require('gl-vec3/normalize')
var vec3Scale = require('gl-vec3/scale')

module.exports = drawModel

var defaultDrawOpts = {
  perspective: mat4Perspective([], Math.PI / 4, 256 / 256, 0.1, 100),
  position: [0.0, 0.0, -5.0],
  viewMatrix: mat4Create(),
  lighting: {
    useLighting: false
  },
  xRotation: 0.0,
  yRotation: 0.0,
  zRotation: 0.0
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

  // Rotate the model in place. If you want to rotate that about an axis
  // you can handle externally and then pass in the corresponding position
  mat4RotateX(modelMatrix, modelMatrix, drawOpts.xRotation)
  mat4RotateY(modelMatrix, modelMatrix, drawOpts.yRotation)
  mat4RotateZ(modelMatrix, modelMatrix, drawOpts.zRotation)

  mat4Multiply(modelMatrix, drawOpts.viewMatrix, modelMatrix)

  // TODO: Should we just let the consumer handle this?
  gl.useProgram(bufferData.shader.program)

  // TODO: Don't need to enable vertex attribs if we are re-drawing the same model
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.vertexPositionBuffer)
  // TODO: See if we can move all of these enable calls to the top, or if order matters
  //  easier to refactor the enabling process later if they're all together
  gl.enableVertexAttribArray(bufferData.shader.aVertexPosition)
  gl.vertexAttribPointer(bufferData.shader.aVertexPosition, 3, gl.FLOAT, false, 0, 0)

  // TODO: Instead of having if statements we should generate our JavaScript
  //  Haven't done this before.. maybe we can use eval?
  if (bufferData.modelTexture) {
    // Texture
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.vertexTextureBuffer)
    gl.enableVertexAttribArray(bufferData.shader.aTextureCoord)
    gl.vertexAttribPointer(bufferData.shader.aTextureCoord, 2, gl.FLOAT, false, 0, 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, bufferData.modelTexture)
    gl.uniform1i(bufferData.shader.uSampler, 0)
  }

  // Vertex normals
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.vertexNormalBuffer)
  gl.enableVertexAttribArray(bufferData.shader.aVertexNormal)
  gl.vertexAttribPointer(bufferData.shader.aVertexNormal, 3, gl.FLOAT, false, 0, 0)

  // Vertex joints
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.vertexJointIndexBuffer)
  gl.enableVertexAttribArray(bufferData.shader.aJointIndex)
  gl.vertexAttribPointer(bufferData.shader.aJointIndex, 4, gl.FLOAT, false, 0, 0)

  // Vertex joint weights
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.weightBuffer)
  gl.enableVertexAttribArray(bufferData.shader.aJointWeight)
  gl.vertexAttribPointer(bufferData.shader.aJointWeight, 4, gl.FLOAT, false, 0, 0)

  // Joint uniforms
  for (var jointNum = 0; jointNum < bufferData.numJoints; jointNum++) {
    gl.uniform4fv(bufferData.shader['boneRotQuaternions' + jointNum], drawOpts.rotQuaternions[jointNum])
    gl.uniform4fv(bufferData.shader['boneTransQuaternions' + jointNum], drawOpts.transQuaternions[jointNum])
  }

  // Lighting
  var lightingDirection = [1, -0.5, -1]
  var normalizedLD = []
  vec3Normalize(normalizedLD, lightingDirection)
  vec3Scale(normalizedLD, normalizedLD, -1)

  gl.uniform3fv(bufferData.shader.uAmbientColor, [0.5, 0.5, 0.5])
  gl.uniform3fv(bufferData.shader.uLightingDirection, normalizedLD)
  gl.uniform3f(bufferData.shader.uDirectionalColor, 1.0, 1.0, 1.0)
  gl.uniform1i(bufferData.shader.uUseLighting, drawOpts.lighting.useLighting)

  // Model-view and perspective matrices
  gl.uniformMatrix4fv(bufferData.shader.uPMatrix, false, drawOpts.perspective)
  gl.uniformMatrix4fv(bufferData.shader.uMVMatrix, false, modelMatrix)

  // Draw our model
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferData.vertexPositionIndexBuffer)
  gl.drawElements(gl.TRIANGLES, bufferData.numIndices, gl.UNSIGNED_SHORT, 0)

  // Clean up
  // TODO: Only disable when we're done re-drawing a model multiple times
  gl.disableVertexAttribArray(bufferData.shader.aVertexPosition)
  gl.disableVertexAttribArray(bufferData.shader.aVertexNormal)
  gl.disableVertexAttribArray(bufferData.shader.aJointIndex)
  gl.disableVertexAttribArray(bufferData.shader.aJointWeight)
  gl.disableVertexAttribArray(bufferData.shader.aTextureCoord)
}
