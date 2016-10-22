var test = require('tape')
var fs = require('fs')
var path = require('path')

var loadDae = require('../../')
var parseDae = require('collada-dae-parser')

var createContext = require('gl')

var ndarray = require('ndarray')
var savePixels = require('save-pixels')
var imageDiff = require('image-diff')

// TODO: Not sure why the X and Y positions of the generated image are wrong
//  When using a real canvas WebGL context in the browser we aren't having any issues
test('Default blender cube collada', function (t) {
  t.plan(2)
  var canvasWidth = 256
  var canvasHeight = 256

  // 256 * 256 canvas with a black background
  var gl = createContext(canvasWidth, canvasHeight)
  gl.clearColor(0, 0, 0, 1)
  gl.enable(gl.DEPTH_TEST)
  gl.viewport(0, 0, canvasWidth, canvasHeight)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Load and draw our collada model
  // In a real application you'll usually want to pre-parse your model before runtime using the CLI
  var modelJSON = parseDae(fs.readFileSync(path.resolve(__dirname, './default-blender-cube_fixture.dae')).toString())
  var model = loadDae(gl, modelJSON, {})

  model.draw({
    position: [-1.0, 1.0, -3.0]
  })

  var pixels = new Uint8Array(canvasWidth * canvasHeight * 4)
  gl.readPixels(0, 0, canvasWidth, canvasHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  var nd = ndarray(pixels, [canvasWidth, canvasHeight, 4])

  // Save the model that we just drew so that we can test it against our expected model
  savePixels(nd, 'png').pipe(fs.createWriteStream(path.resolve(__dirname, './tmp-actual.png')))

  // Test that our actual rendered model matches our expected model fixture
  imageDiff({
    actualImage: path.resolve(__dirname, './tmp-actual.png'),
    expectedImage: path.resolve(__dirname, './expected-default-blender-cube.png')
  }, function (err, imagesAreSame) {
    t.notOk(err, 'No error while comparing images')
    t.ok(imagesAreSame, 'Successfully rendered our default blender cube')

    // Delete our actual newly generated test cube
    fs.unlinkSync(path.resolve(__dirname, './tmp-actual.png'))
  })
})
