module.exports = generateFragmentShader

function generateFragmentShader (opts) {
  var precision = 'precision mediump float;'

  var fragmentShader = `
    ${precision}

    void main (void) {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `

  return fragmentShader
}
