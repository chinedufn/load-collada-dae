var test = require('tape')

// We create a custom shader that's similar to the default shader
// Only difference is that accepts an extra attribute that we don't use for anything
// other than verifying that we're able to use our own custom attributes
// This lets re-use our model from another test and it's expected result since,
// in this case, our test custom shader happens to produce the same output as the default.
test('Animated textured recntagular prism with custom shader', function (t) {
  t.end()
})
