/* global dat, requestAnimationFrame, alert */

var data = {
  x: 200,
  y: 150,
  angle: 0,
  scaleX: 1,
  scaleY: 1,
  fps: 0
}
var gui = new dat.GUI()
var canvas = document.getElementById('glcanvas')
var gl = canvas.getContext('webgl')

gui.remember(data)
gui.add(data, 'x', 0, 400)
gui.add(data, 'y', 0, 300)
gui.add(data, 'angle', 0, 2 * Math.PI)
gui.add(data, 'scaleX', -5, 5)
gui.add(data, 'scaleY', -5, 5)
gui.add(data, 'fps').listen()

var program = gl.createProgram()
var newShader = function (id, type) {
  var shader = gl.createShader(type)

  // wire up the shader and compile
  gl.shaderSource(shader, document.getElementById(id).import.body.innerText)
  gl.compileShader(shader)

  // if things didn't go so well alert
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader))
    return null
  }
  gl.attachShader(program, shader)
}
newShader('vert', gl.VERTEX_SHADER)
newShader('frag', gl.FRAGMENT_SHADER)

gl.linkProgram(program)

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  alert('Could not initialise main shaders')
}

gl.useProgram(program)

// look up where the vertex data needs to go.
var positionLocation = gl.getAttribLocation(program, 'a_position')
var colorLocation = gl.getAttribLocation(program, 'a_color')

// lookup uniforms
var matrixLocation = gl.getUniformLocation(program, 'u_matrix')

// Create a buffer.
var geometryBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffer)
gl.enableVertexAttribArray(positionLocation)
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

// Fill the buffer with the values that define a rectangle.
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([ -150, -100,
    150, -100, -150, 100,
    150, -100, -150, 100,
    150, 100
  ]),
  gl.STATIC_DRAW
)

// Create a buffer for the colors.
var colorBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
gl.enableVertexAttribArray(colorLocation)
gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0)

// Fill the buffer with colors for the 2 triangles
// that make the rectangle.
// Pick 2 random colors.

gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    // red, green, blue, alpha
    0, 0, 0, 1, // Black
    1, 0, 0, 1, // Red
    1, 0, 0, 1, // Red
    0, 0, 1, 1, // Blue
    0, 0, 1, 1, // Blue
    0, 0, 0, 1 // Black
  ]),
  gl.STATIC_DRAW)

// Draw the scene.
var lastTimestamp = 0

function drawScene (timestamp) {
  var dt = timestamp - lastTimestamp
  lastTimestamp = timestamp
  data.fps = 1000 / dt

  // Clear the canvas.
  gl.clear(gl.COLOR_BUFFER_BIT)

  // Compute the matrices
  var projectionMatrix = make2DProjection(canvas.clientWidth, canvas.clientHeight)
  var translationMatrix = makeTranslation(data.x, data.y)
  var rotationMatrix = makeRotation(data.angle)
  var scaleMatrix = makeScale(data.scaleX, data.scaleY)

  // Multiply the matrices.
  var matrix = matrixMultiply(scaleMatrix, rotationMatrix)
  matrix = matrixMultiply(matrix, translationMatrix)
  matrix = matrixMultiply(matrix, projectionMatrix)

  // Set the matrix.
  gl.uniformMatrix3fv(matrixLocation, false, matrix)

  // Draw the geometry.
  // gl.drawArrays( gl.TRIANGLES, 0, 3 )
  gl.drawArrays(gl.TRIANGLES, 0, 6)

  requestAnimationFrame(drawScene)
}

requestAnimationFrame(drawScene)

function make2DProjection (width, height) {
  // Note: This matrix flips the Y axis so that 0 is at the top.
  return [
    2 / width, 0, 0,
    0, -2 / height, 0, -1, 1, 1
  ]
}

function makeTranslation (tx, ty) {
  return [
    1, 0, 0,
    0, 1, 0,
    tx, ty, 1
  ]
}

function makeRotation (angleInRadians) {
  var c = Math.cos(angleInRadians)
  var s = Math.sin(angleInRadians)
  return [
    c, -s, 0,
    s, c, 0,
    0, 0, 1
  ]
}

/**
 * Takes twoMatrix3s, a and b, and computes the product in the order
 * that pre-composes b with a.  In other words, the matrix returned will
 * @param {module:webgl-2d-math.Matrix3} a A matrix.
 * @param {module:webgl-2d-math.Matrix3} b A matrix.
 * @return {module:webgl-2d-math.Matrix3} the result.
 * @memberOf module:webgl-2d-math
 */
function matrixMultiply (a, b) {
  var a00 = a[ 0 * 3 + 0 ]
  var a01 = a[ 0 * 3 + 1 ]
  var a02 = a[ 0 * 3 + 2 ]
  var a10 = a[ 1 * 3 + 0 ]
  var a11 = a[ 1 * 3 + 1 ]
  var a12 = a[ 1 * 3 + 2 ]
  var a20 = a[ 2 * 3 + 0 ]
  var a21 = a[ 2 * 3 + 1 ]
  var a22 = a[ 2 * 3 + 2 ]
  var b00 = b[ 0 * 3 + 0 ]
  var b01 = b[ 0 * 3 + 1 ]
  var b02 = b[ 0 * 3 + 2 ]
  var b10 = b[ 1 * 3 + 0 ]
  var b11 = b[ 1 * 3 + 1 ]
  var b12 = b[ 1 * 3 + 2 ]
  var b20 = b[ 2 * 3 + 0 ]
  var b21 = b[ 2 * 3 + 1 ]
  var b22 = b[ 2 * 3 + 2 ]
  return [
    a00 * b00 + a01 * b10 + a02 * b20,
    a00 * b01 + a01 * b11 + a02 * b21,
    a00 * b02 + a01 * b12 + a02 * b22,
    a10 * b00 + a11 * b10 + a12 * b20,
    a10 * b01 + a11 * b11 + a12 * b21,
    a10 * b02 + a11 * b12 + a12 * b22,
    a20 * b00 + a21 * b10 + a22 * b20,
    a20 * b01 + a21 * b11 + a22 * b21,
    a20 * b02 + a21 * b12 + a22 * b22
  ]
}

function makeScale (sx, sy) {
  return [
    sx, 0, 0,
    0, sy, 0,
    0, 0, 1
  ]
}
