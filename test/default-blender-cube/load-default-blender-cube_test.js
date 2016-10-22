var test = require('tape')
var loadDae = require('../../')
var fs = require('fs')

var createContext = require('gl')

var parseDae = require('collada-dae-parser')

test('Default blender cube collada', function (t) {
  t.plan(1)

  // 256 * 256 canvas
  var gl = createContext(256, 256)

  var modelJSON = parseDae(fs.readFileSync('./default-blender-cube_fixture.dae').toString())
  var model = loadDae(gl, modelJSON, {})

  model.draw({
  })
})
