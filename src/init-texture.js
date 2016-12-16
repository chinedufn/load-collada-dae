module.exports = initTexture

function initTexture (gl, opts) {
  var modelTexture = gl.createTexture()
  handleLoadedTexture(gl, modelTexture, opts.texture)

  return modelTexture

  function handleLoadedTexture (gl, modelTexture, textureImage) {
    gl.bindTexture(gl.TEXTURE_2D, modelTexture)
    // If we're passing in a Uint8Array of image data
    if (textureImage.length) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureImage)
    } else {
      // If we're passing in an HTML image element
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage)
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }
}

