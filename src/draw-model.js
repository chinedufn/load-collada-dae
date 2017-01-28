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
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.aVertexPosition)
  // TODO: See if we can move all of these enable calls to the top, or if order matters
  //  easier to refactor the enabling process later if they're all together
  gl.enableVertexAttribArray(bufferData.shader.attributes.aVertexPosition.location)
  gl.vertexAttribPointer(bufferData.shader.attributes.aVertexPosition.location, 3, gl.FLOAT, false, 0, 0)

  // TODO: Instead of having if statements we should generate our JavaScript
  //  Haven't done this before.. maybe we can use eval?
  if (bufferData.modelTexture) {
    // Texture
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.vertexTextureBuffer)
    gl.enableVertexAttribArray(bufferData.shader.attributes.aTextureCoord.location)
    gl.vertexAttribPointer(bufferData.shader.attributes.aTextureCoord.location, 2, gl.FLOAT, false, 0, 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, bufferData.modelTexture)
    gl.uniform1i(bufferData.shader.uniforms.uSampler.location, 0)
  }

  // Vertex normals
  if (bufferData.shader.attributes.aVertexNormal) {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.aVertexNormal)
    gl.enableVertexAttribArray(bufferData.shader.attributes.aVertexNormal.location)
    gl.vertexAttribPointer(bufferData.shader.attributes.aVertexNormal.location, 3, gl.FLOAT, false, 0, 0)
  }

  // Vertex joints
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.aJointIndex)
  gl.enableVertexAttribArray(bufferData.shader.attributes.aJointIndex.location)
  gl.vertexAttribPointer(bufferData.shader.attributes.aJointIndex.location, 4, gl.FLOAT, false, 0, 0)

  // Vertex joint weights
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.aJointWeight)
  gl.enableVertexAttribArray(bufferData.shader.attributes.aJointWeight.location)
  gl.vertexAttribPointer(bufferData.shader.attributes.aJointWeight.location, 4, gl.FLOAT, false, 0, 0)

  // Joint uniforms
  for (var jointNum = 0; jointNum < bufferData.numJoints; jointNum++) {
    gl.uniform4fv(bufferData.shader.uniforms['boneRotQuaternions' + jointNum].location, drawOpts.rotQuaternions[jointNum])
    gl.uniform4fv(bufferData.shader.uniforms['boneTransQuaternions' + jointNum].location, drawOpts.transQuaternions[jointNum])
  }

  // Lighting
  var lightingDirection = [1, -0.5, -1]
  var normalizedLD = []
  vec3Normalize(normalizedLD, lightingDirection)
  vec3Scale(normalizedLD, normalizedLD, -1)

  if (bufferData.shader.uniforms.uAmbientColor) {
    gl.uniform3fv(bufferData.shader.uniforms.uAmbientColor.location, [0.5, 0.5, 0.5])
    gl.uniform3fv(bufferData.shader.uniforms.uLightingDirection.location, normalizedLD)
    gl.uniform3f(bufferData.shader.uniforms.uDirectionalColor.location, 1.0, 1.0, 1.0)
    gl.uniform1i(bufferData.shader.uniforms.uUseLighting.location, drawOpts.lighting.useLighting)
  }

  // Model-view and perspective matrices
  gl.uniformMatrix4fv(bufferData.shader.uniforms.uPMatrix.location, false, drawOpts.perspective)
  gl.uniformMatrix4fv(bufferData.shader.uniforms.uMVMatrix.location, false, modelMatrix)

  // Draw our model
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferData.vertexPositionIndexBuffer)
  gl.drawElements(gl.TRIANGLES, bufferData.numIndices, gl.UNSIGNED_SHORT, 0)

  // Clean up
  // TODO: Only disable when we're done re-drawing a model multiple times
  gl.disableVertexAttribArray(bufferData.shader.attributes.aVertexPosition.location)
  gl.disableVertexAttribArray(bufferData.shader.attributes.aJointIndex.location)
  gl.disableVertexAttribArray(bufferData.shader.attributes.aJointWeight.location)
  if (bufferData.shader.attributes.aVertexNormal) {
    gl.disableVertexAttribArray(bufferData.shader.attributes.aVertexNormal.location)
  }
  if (bufferData.modelTexture) {
    gl.disableVertexAttribArray(bufferData.shader.attributes.aTextureCoord.location)
  }
}
