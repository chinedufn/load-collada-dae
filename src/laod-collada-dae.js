module.exports = loadColladaDae

function loadColladaDae (gl, modelJSON, loadOpts) {
  return {
    draw: drawModel.bind(null, gl, {
    })
  }
}

function drawModel (gl, bufferData, drawOpts) {
}
