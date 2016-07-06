/* global dat, requestAnimationFrame, alert */

var data = {
  x: 0,
  y: 0,
  z: -360,
  angleX: Math.PI / 16,
  angleY: Math.PI * 0.8,
  angleZ: Math.PI,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  animate: true,
  fov: 1.0471975511965976,
  zNear: 1,
  zFar: 1000,
  fps: 0
}
var gui = new dat.GUI()
var canvas = document.getElementById('glcanvas')
var gl = canvas.getContext('webgl')

gui.remember(data)
gui.add(data, 'x', -canvas.width, canvas.width)
gui.add(data, 'y', -canvas.height, canvas.height)
gui.add(data, 'z', -600, 0)
gui.add(data, 'angleX', 0, 2 * Math.PI)
gui.add(data, 'angleY', 0, 2 * Math.PI).listen()
gui.add(data, 'angleZ', 0, 2 * Math.PI)
gui.add(data, 'scaleX', -5, 5)
gui.add(data, 'scaleY', -5, 5)
gui.add(data, 'scaleZ', -5, 5)
gui.add(data, 'fov', 0, Math.PI)
gui.add(data, 'zNear', 1, 1000)
gui.add(data, 'zFar', 0, 1000)
gui.add(data, 'animate')
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
gl.enable(gl.CULL_FACE)
gl.enable(gl.DEPTH_TEST)

// look up where the vertex data needs to go.
var positionLocation = gl.getAttribLocation(program, 'a_position')
var colorLocation = gl.getAttribLocation(program, 'a_color')
var matrixLocation = gl.getUniformLocation(program, 'u_matrix')

// Create a buffer.
var geometryBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffer)
gl.enableVertexAttribArray(positionLocation)
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)

setGeometry(gl)

// Create a buffer for colors.
var colorBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
gl.enableVertexAttribArray(colorLocation)

// We'll supply RGB as bytes.
gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0)

// Set Colors.
setColors(gl)

// Draw the scene.
var lastTimestamp = 0

function drawScene (timestamp) {
  var dt = timestamp - lastTimestamp
  lastTimestamp = timestamp
  data.fps = 1000 / dt

  // Clear the canvas AND the depth buffer.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  if (data.animate) {
    data.angleY = data.angleY > Math.PI * 2 ? 0 : data.angleY + 0.005 * dt
  }

  // Compute the matrices
  var aspect = canvas.width / canvas.height
  var projectionMatrix = makePerspective(data.fov, aspect, data.zNear, data.zFar)
  var translationMatrix = makeTranslation(data.x, data.y, data.z)
  var rotationXMatrix = makeXRotation(data.angleX)
  var rotationYMatrix = makeYRotation(data.angleY)
  var rotationZMatrix = makeZRotation(data.angleZ)
  var scaleMatrix = makeScale(data.scaleX, data.scaleY, data.scaleZ)

  // Multiply the matrices.
  var matrix = matrixMultiply(scaleMatrix, rotationZMatrix)
  matrix = matrixMultiply(matrix, rotationYMatrix)
  matrix = matrixMultiply(matrix, rotationXMatrix)
  matrix = matrixMultiply(matrix, translationMatrix)
  matrix = matrixMultiply(matrix, projectionMatrix)

  // Set the matrix.
  gl.uniformMatrix4fv(matrixLocation, false, matrix)

  // Draw the geometry.
  // gl.drawArrays(gl.TRIANGLES, 0, 18)
  gl.drawArrays(gl.TRIANGLES, 0, 16 * 6)

  requestAnimationFrame(drawScene)
}

requestAnimationFrame(drawScene)

function makeTranslation (tx, ty, tz) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1
  ]
}

function makeXRotation (angleInRadians) {
  var c = Math.cos(angleInRadians)
  var s = Math.sin(angleInRadians)

  return [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ]
}

function makeYRotation (angleInRadians) {
  var c = Math.cos(angleInRadians)
  var s = Math.sin(angleInRadians)

  return [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ]
}

function makeZRotation (angleInRadians) {
  var c = Math.cos(angleInRadians)
  var s = Math.sin(angleInRadians)
  return [
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]
}

function makeScale (sx, sy, sz) {
  return [
    sx, 0, 0, 0,
    0, sy, 0, 0,
    0, 0, sz, 0,
    0, 0, 0, 1
  ]
}

function makePerspective (fieldOfViewInRadians, aspect, near, far) {
  var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians)
  var rangeInv = 1.0 / (near - far)

  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ]
}

function matrixMultiply (a, b) {
  var a00 = a[0 * 4 + 0]
  var a01 = a[0 * 4 + 1]
  var a02 = a[0 * 4 + 2]
  var a03 = a[0 * 4 + 3]
  var a10 = a[1 * 4 + 0]
  var a11 = a[1 * 4 + 1]
  var a12 = a[1 * 4 + 2]
  var a13 = a[1 * 4 + 3]
  var a20 = a[2 * 4 + 0]
  var a21 = a[2 * 4 + 1]
  var a22 = a[2 * 4 + 2]
  var a23 = a[2 * 4 + 3]
  var a30 = a[3 * 4 + 0]
  var a31 = a[3 * 4 + 1]
  var a32 = a[3 * 4 + 2]
  var a33 = a[3 * 4 + 3]
  var b00 = b[0 * 4 + 0]
  var b01 = b[0 * 4 + 1]
  var b02 = b[0 * 4 + 2]
  var b03 = b[0 * 4 + 3]
  var b10 = b[1 * 4 + 0]
  var b11 = b[1 * 4 + 1]
  var b12 = b[1 * 4 + 2]
  var b13 = b[1 * 4 + 3]
  var b20 = b[2 * 4 + 0]
  var b21 = b[2 * 4 + 1]
  var b22 = b[2 * 4 + 2]
  var b23 = b[2 * 4 + 3]
  var b30 = b[3 * 4 + 0]
  var b31 = b[3 * 4 + 1]
  var b32 = b[3 * 4 + 2]
  var b33 = b[3 * 4 + 3]
  return [a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
    a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
    a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
    a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,
    a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
    a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
    a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
    a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
    a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
    a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
    a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
    a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
    a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
    a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
    a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
    a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33]
}

// Fill the buffer with colors for the 'F'.

function setColors (gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Uint8Array([
      // left column front
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,

      // top rung front
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,

      // middle rung front
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,

      // left column back
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,

      // top rung back
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,

      // middle rung back
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,

      // top
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,

      // top rung right
      200, 200, 70,
      200, 200, 70,
      200, 200, 70,
      200, 200, 70,
      200, 200, 70,
      200, 200, 70,

      // under top rung
      210, 100, 70,
      210, 100, 70,
      210, 100, 70,
      210, 100, 70,
      210, 100, 70,
      210, 100, 70,

      // between top rung and middle
      210, 160, 70,
      210, 160, 70,
      210, 160, 70,
      210, 160, 70,
      210, 160, 70,
      210, 160, 70,

      // top of middle rung
      70, 180, 210,
      70, 180, 210,
      70, 180, 210,
      70, 180, 210,
      70, 180, 210,
      70, 180, 210,

      // right of middle rung
      100, 70, 210,
      100, 70, 210,
      100, 70, 210,
      100, 70, 210,
      100, 70, 210,
      100, 70, 210,

      // bottom of middle rung.
      76, 210, 100,
      76, 210, 100,
      76, 210, 100,
      76, 210, 100,
      76, 210, 100,
      76, 210, 100,

      // right of bottom
      140, 210, 80,
      140, 210, 80,
      140, 210, 80,
      140, 210, 80,
      140, 210, 80,
      140, 210, 80,

      // bottom
      90, 130, 110,
      90, 130, 110,
      90, 130, 110,
      90, 130, 110,
      90, 130, 110,
      90, 130, 110,

      // left side
      160, 160, 220,
      160, 160, 220,
      160, 160, 220,
      160, 160, 220,
      160, 160, 220,
      160, 160, 220]),
    gl.STATIC_DRAW)
}

// Fill the buffer with the values that define a letter 'F'.
function setGeometry (gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      // left column front
      0, 0, 0,
      0, 150, 0,
      30, 0, 0,
      0, 150, 0,
      30, 150, 0,
      30, 0, 0,

      // top rung front
      30, 0, 0,
      30, 30, 0,
      100, 0, 0,
      30, 30, 0,
      100, 30, 0,
      100, 0, 0,

      // middle rung front
      30, 60, 0,
      30, 90, 0,
      67, 60, 0,
      30, 90, 0,
      67, 90, 0,
      67, 60, 0,

      // left column back
      0, 0, 30,
      30, 0, 30,
      0, 150, 30,
      0, 150, 30,
      30, 0, 30,
      30, 150, 30,

      // top rung back
      30, 0, 30,
      100, 0, 30,
      30, 30, 30,
      30, 30, 30,
      100, 0, 30,
      100, 30, 30,

      // middle rung back
      30, 60, 30,
      67, 60, 30,
      30, 90, 30,
      30, 90, 30,
      67, 60, 30,
      67, 90, 30,

      // top
      0, 0, 0,
      100, 0, 0,
      100, 0, 30,
      0, 0, 0,
      100, 0, 30,
      0, 0, 30,

      // top rung right
      100, 0, 0,
      100, 30, 0,
      100, 30, 30,
      100, 0, 0,
      100, 30, 30,
      100, 0, 30,

      // under top rung
      30, 30, 0,
      30, 30, 30,
      100, 30, 30,
      30, 30, 0,
      100, 30, 30,
      100, 30, 0,

      // between top rung and middle
      30, 30, 0,
      30, 60, 30,
      30, 30, 30,
      30, 30, 0,
      30, 60, 0,
      30, 60, 30,

      // top of middle rung
      30, 60, 0,
      67, 60, 30,
      30, 60, 30,
      30, 60, 0,
      67, 60, 0,
      67, 60, 30,

      // right of middle rung
      67, 60, 0,
      67, 90, 30,
      67, 60, 30,
      67, 60, 0,
      67, 90, 0,
      67, 90, 30,

      // bottom of middle rung.
      30, 90, 0,
      30, 90, 30,
      67, 90, 30,
      30, 90, 0,
      67, 90, 30,
      67, 90, 0,

      // right of bottom
      30, 90, 0,
      30, 150, 30,
      30, 90, 30,
      30, 90, 0,
      30, 150, 0,
      30, 150, 30,

      // bottom
      0, 150, 0,
      0, 150, 30,
      30, 150, 30,
      0, 150, 0,
      30, 150, 30,
      30, 150, 0,

      // left side
      0, 0, 0,
      0, 0, 30,
      0, 150, 30,
      0, 0, 0,
      0, 150, 30,
      0, 150, 0]),
    gl.STATIC_DRAW)
}
