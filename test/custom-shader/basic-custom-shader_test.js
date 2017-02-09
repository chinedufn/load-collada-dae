var test = require('tape')
var fs = require('fs')
var path = require('path')

var loadDae = require('../../')
var parseDae = require('collada-dae-parser')

var ndarray = require('ndarray')
var savePixels = require('save-pixels')
var imageDiff = require('image-diff')

var createWebGLContext = require('../test-utils/create-webgl-context.js')
var keyframesToDualQuats = require('../test-utils/keyframes-to-dual-quats.js')

var mat4Perspective = require('gl-mat4/perspective')

// We create a custom shader that's similar to the default shader
// Only difference is that accepts an extra attribute that we don't use for anything
// other than verifying that we're able to use our own custom attributes
// This lets re-use our model from another test and it's expected result since,
// in this case, our test custom shader happens to produce the same output as the default.
test('Animated rectangular prism with custom shader', function (t) {
  var gl = createWebGLContext()

  var modelJSON = parseDae(fs.readFileSync(path.resolve(__dirname, '../animated-bending-rectangular-prism/animated-bending-rectangular-prism_fixture.dae')))
  var model = loadDae(gl, modelJSON, {
    fragmentShaderFunc: createCustomFragShader,
    vertexShaderFunc: createCustomVertShader
  })

  // All the joint dual quaternions at animation time zero
  var jointDualQuats = keyframesToDualQuats(modelJSON.keyframes[0])

  gl.useProgram(model.shaderProgram)

  model.draw({
    attributes: model.attributes,
    uniforms: {
      uUseLighting: false,
      uAmbientColor: [0, 0, 0],
      uLightingDirection: [0, 0, 0],
      uDirectionalColor: [0, 0, 0],
      // Translation matrix with model positioned at [0, 0, -17]
      uMVMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.0, 0.0, -17.0, 1],
      uPMatrix: mat4Perspective([], Math.PI / 4, 256 / 256, 0.1, 100),
      boneRotQuaternions0: jointDualQuats.rotQuaternions[0],
      boneTransQuaternions0: jointDualQuats.transQuaternions[0],
      boneRotQuaternions1: jointDualQuats.rotQuaternions[1],
      boneTransQuaternions1: jointDualQuats.transQuaternions[1]
    }
  })

  var pixels = new Uint8Array(256 * 256 * 4)
  gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  var nd = ndarray(pixels, [256, 256, 4])

  // Save the model that we just drew so that we can test it against our expected model
  savePixels(nd, 'png').pipe(fs.createWriteStream(path.resolve(__dirname, './tmp-actual.png')))

  // Test that our actual rendered model matches our expected model fixture
  imageDiff({
    actualImage: path.resolve(__dirname, './tmp-actual.png'),
    expectedImage: path.resolve(__dirname, '../animated-bending-rectangular-prism/expected-animated-bending-rectangular-prism_fixture.png')
  }, function (err, imagesAreSame) {
    t.notOk(err, 'No error while comparing images when using custom shader')
    t.ok(imagesAreSame, 'Successfully rendered our animated rectangular prism using a custom shader')

    // Delete our actual newly generated test cube
    fs.unlinkSync(path.resolve(__dirname, './tmp-actual.png'))
  })

  t.end()
})

function createCustomFragShader (opts) {
  var precision = 'precision mediump float;'

  var fragmentShader = `
  ${precision}

  void main (void) {
   gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
  `

  return fragmentShader
}

function createCustomVertShader (opts) {
  var vertexShader = `
    attribute vec3 aVertexPosition;

    attribute vec4 aJointIndex;
    attribute vec4 aJointWeight;
    uniform vec4 boneRotQuaternions[${opts.numJoints}];
    uniform vec4 boneTransQuaternions[${opts.numJoints}];

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    void main (void) {
      vec4 rotQuaternion[4];
      vec4 transQuaternion[4];

      for (int i = 0; i < ${opts.numJoints}; i++) {
        if (aJointIndex.x == float(i)) {
          rotQuaternion[0] = boneRotQuaternions[i];
          transQuaternion[0] = boneTransQuaternions[i];
        }
        if (aJointIndex.y == float(i)) {
          rotQuaternion[1] = boneRotQuaternions[i];
          transQuaternion[1] = boneTransQuaternions[i];
        }
        if (aJointIndex.z == float(i)) {
          rotQuaternion[2] = boneRotQuaternions[i];
          transQuaternion[2] = boneTransQuaternions[i];
        }
        if (aJointIndex.w == float(i)) {
          rotQuaternion[3] = boneRotQuaternions[i];
          transQuaternion[3] = boneTransQuaternions[i];
        }
      }

      vec4 weightedRotQuat = rotQuaternion[0] * aJointWeight.x +
      rotQuaternion[1] * aJointWeight.y +
      rotQuaternion[2] * aJointWeight.z +
      rotQuaternion[3] * aJointWeight.w;

      vec4 weightedTransQuat = transQuaternion[0] * aJointWeight.x +
      transQuaternion[1] * aJointWeight.y +
      transQuaternion[2] * aJointWeight.z +
      transQuaternion[3] * aJointWeight.w;

      float xRot = weightedRotQuat[0];
      float yRot = weightedRotQuat[1];
      float zRot = weightedRotQuat[2];
      float wRot = weightedRotQuat[3];
      float rotQuatMagnitude = sqrt(xRot * xRot + yRot * yRot + zRot * zRot + wRot * wRot);
      weightedRotQuat = weightedRotQuat / rotQuatMagnitude;
      weightedTransQuat = weightedTransQuat / rotQuatMagnitude;

      float xR = weightedRotQuat[0];
      float yR = weightedRotQuat[1];
      float zR = weightedRotQuat[2];
      float wR = weightedRotQuat[3];

      float xT = weightedTransQuat[0];
      float yT = weightedTransQuat[1];
      float zT = weightedTransQuat[2];
      float wT = weightedTransQuat[3];

      float t0 = 2.0 * (-wT * xR + xT * wR - yT * zR + zT * yR);
      float t1 = 2.0 * (-wT * yR + xT * zR + yT * wR - zT * xR);
      float t2 = 2.0 * (-wT * zR - xT * yR + yT * xR + zT * wR);

      mat4 weightedMatrix = mat4(
        1.0 - (2.0 * yR * yR) - (2.0 * zR * zR),
        (2.0 * xR * yR) + (2.0 * wR * zR),
        (2.0 * xR * zR) - (2.0 * wR * yR),
        0,
        (2.0 * xR * yR) - (2.0 * wR * zR),
        1.0 - (2.0 * xR * xR) - (2.0 * zR * zR),
        (2.0 * yR * zR) + (2.0 * wR * xR),
        0,
        (2.0 * xR * zR) + (2.0 * wR * yR),
        (2.0 * yR * zR) - (2.0 * wR * xR),
        1.0 - (2.0 * xR * xR) - (2.0 * yR * yR),
        0,
        t0,
        t1,
        t2,
        1
      );

      vec4 leftWorldSpace = weightedMatrix * vec4(aVertexPosition, 1.0);
      float y = leftWorldSpace.z;
      float z = -leftWorldSpace.y;
      leftWorldSpace.y = y;
      leftWorldSpace.z = z;

      gl_Position = uPMatrix * uMVMatrix * leftWorldSpace;
    }
  `

  return vertexShader
}
