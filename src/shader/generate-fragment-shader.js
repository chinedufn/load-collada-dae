module.exports = generateFragmentShader

// TODO: Support lighting
function generateFragmentShader (opts) {
  var textureVars = ''
  var assignFragColor = ''

  // If there is a texture we use our texture color
  if (opts.texture) {
    textureVars = `
      varying vec2 vTextureCoord;

      uniform sampler2D uSampler;
    `

    // TODO: Lighting
    assignFragColor = `
      vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
      gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);

    `
  } else {
    // If there is no texture for now we just make the model white
    // later we'll introduce normals and lighting
    assignFragColor = `
      gl_FragColor = vec4(vLightWeighting, 1.0);
    `
  }

  var precision = 'precision mediump float;'

  var fragmentShader = `
    ${precision}

    ${textureVars}

    varying vec3 vLightWeighting;

    void main (void) {
      ${assignFragColor}
    }
  `

  return fragmentShader
}
