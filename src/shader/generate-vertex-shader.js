module.exports = generateVertexShader

function generateVertexShader () {
  var vertexShader = `
    attribute vec3 aVertexPosition;

    attribute vec3 aVertexNormal;
    uniform mat3 uNMatrix;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    void main (void) {
      gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    }
  `

  return vertexShader
}
