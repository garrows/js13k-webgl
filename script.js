/* global dat, requestAnimationFrame, alert */

var data = {
  x: 0,
  y: 0,
  z: 0,
  cameraX: 0,
  cameraY: 0,
  cameraZ: 0,
  angleX: 0,
  angleY: 0,
  angleZ: 0,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  animateSpeed: 0.001,
  fov: 1.0471975511965976,
  zNear: 1,
  zFar: 1000,
  fps: 0
}
var gui = new dat.GUI()
var canvas = document.getElementById('glcanvas')
var gl = canvas.getContext('webgl')

gui.remember(data)
gui.add(data, 'x', -300, 300)
gui.add(data, 'y', -300, 300)
gui.add(data, 'z', -300, 300)
gui.add(data, 'cameraX', 0, 2 * Math.PI)
gui.add(data, 'cameraY', 0, 2 * Math.PI).listen()
gui.add(data, 'cameraZ', 0, 2 * Math.PI)
gui.add(data, 'angleX', 0, 2 * Math.PI)
gui.add(data, 'angleY', 0, 2 * Math.PI)
gui.add(data, 'angleZ', 0, 2 * Math.PI)
gui.add(data, 'scaleX', -5, 5)
gui.add(data, 'scaleY', -5, 5)
gui.add(data, 'scaleZ', -5, 5)
gui.add(data, 'fov', 0, Math.PI)
gui.add(data, 'zNear', 1, 1000)
gui.add(data, 'zFar', 0, 1000)
gui.add(data, 'animateSpeed', 0, 0.005)
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

  var numFs = 5
  var radius = 200

  // Clear the canvas AND the depth buffer.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Move around the screen
  data.cameraY = data.cameraY > Math.PI * 2 ? 0 : data.cameraY + data.animateSpeed * dt

  // Compute the matrices
  var aspect = canvas.width / canvas.height
  var projectionMatrix = makePerspective(data.fov, aspect, data.zNear, data.zFar)
  var rotationXMatrix = makeXRotation(data.angleX)
  var rotationYMatrix = makeYRotation(data.angleY)
  var rotationZMatrix = makeZRotation(data.angleZ)
  var scaleMatrix = makeScale(data.scaleX, data.scaleY, data.scaleZ)

  // Compute the position of the first F
  var fPosition = [radius, 0, 0]

  // Use matrix math to compute a position on the circle.
  var cameraMatrix = makeTranslation(0, 50, radius * 1.5)
  cameraMatrix = matrixMultiply(cameraMatrix, makeXRotation(data.cameraX))
  cameraMatrix = matrixMultiply(cameraMatrix, makeYRotation(data.cameraY))
  cameraMatrix = matrixMultiply(cameraMatrix, makeZRotation(data.cameraZ))

  // Get the camera's postion from the matrix we computed
  var cameraPosition = [
    cameraMatrix[12],
    cameraMatrix[13],
    cameraMatrix[14]]

  var up = [0, 1, 0]

  // Compute the camera's matrix using look at.
  cameraMatrix = makeLookAt(cameraPosition, fPosition, up)

  // Make a view matrix from the camera matrix.
  var viewMatrix = makeInverse(cameraMatrix)

  // Draw 'F's in a circle
  for (var ii = 0; ii < numFs; ++ii) {
    var angle = ii * Math.PI * 2 / numFs

    var x = Math.cos(angle) * radius
    var z = Math.sin(angle) * radius
    var translationMatrix = makeTranslation(x + data.x, data.y, z + data.z)

    // Multiply the matrices.
    var matrix = translationMatrix
    matrix = matrixMultiply(matrix, scaleMatrix)
    matrix = matrixMultiply(matrix, rotationXMatrix)
    matrix = matrixMultiply(matrix, rotationYMatrix)
    matrix = matrixMultiply(matrix, rotationZMatrix)
    matrix = matrixMultiply(matrix, viewMatrix)
    matrix = matrixMultiply(matrix, projectionMatrix)

    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix)

    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6)
  }

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

function makeLookAt (cameraPosition, target, up) {
  var zAxis = normalize(
    subtractVectors(cameraPosition, target))
  var xAxis = cross(up, zAxis)
  var yAxis = cross(zAxis, xAxis)

  return [
    xAxis[0], xAxis[1], xAxis[2], 0,
    yAxis[0], yAxis[1], yAxis[2], 0,
    zAxis[0], zAxis[1], zAxis[2], 0,
    cameraPosition[0],
    cameraPosition[1],
    cameraPosition[2],
    1]
}

function normalize (v) {
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
  // make sure we don't divide by 0.
  if (length > 0.00001) {
    return [v[0] / length, v[1] / length, v[2] / length]
  } else {
    return [0, 0, 0]
  }
}

function cross (a, b) {
  return [a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]]
}

function subtractVectors (a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
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

function makeInverse (m) {
  var m00 = m[0 * 4 + 0]
  var m01 = m[0 * 4 + 1]
  var m02 = m[0 * 4 + 2]
  var m03 = m[0 * 4 + 3]
  var m10 = m[1 * 4 + 0]
  var m11 = m[1 * 4 + 1]
  var m12 = m[1 * 4 + 2]
  var m13 = m[1 * 4 + 3]
  var m20 = m[2 * 4 + 0]
  var m21 = m[2 * 4 + 1]
  var m22 = m[2 * 4 + 2]
  var m23 = m[2 * 4 + 3]
  var m30 = m[3 * 4 + 0]
  var m31 = m[3 * 4 + 1]
  var m32 = m[3 * 4 + 2]
  var m33 = m[3 * 4 + 3]
  var tmp0 = m22 * m33
  var tmp1 = m32 * m23
  var tmp2 = m12 * m33
  var tmp3 = m32 * m13
  var tmp4 = m12 * m23
  var tmp5 = m22 * m13
  var tmp6 = m02 * m33
  var tmp7 = m32 * m03
  var tmp8 = m02 * m23
  var tmp9 = m22 * m03
  var tmp10 = m02 * m13
  var tmp11 = m12 * m03
  var tmp12 = m20 * m31
  var tmp13 = m30 * m21
  var tmp14 = m10 * m31
  var tmp15 = m30 * m11
  var tmp16 = m10 * m21
  var tmp17 = m20 * m11
  var tmp18 = m00 * m31
  var tmp19 = m30 * m01
  var tmp20 = m00 * m21
  var tmp21 = m20 * m01
  var tmp22 = m00 * m11
  var tmp23 = m10 * m01

  var t0 = (tmp0 * m11 + tmp3 * m21 + tmp4 * m31) -
    (tmp1 * m11 + tmp2 * m21 + tmp5 * m31)
  var t1 = (tmp1 * m01 + tmp6 * m21 + tmp9 * m31) -
    (tmp0 * m01 + tmp7 * m21 + tmp8 * m31)
  var t2 = (tmp2 * m01 + tmp7 * m11 + tmp10 * m31) -
    (tmp3 * m01 + tmp6 * m11 + tmp11 * m31)
  var t3 = (tmp5 * m01 + tmp8 * m11 + tmp11 * m21) -
    (tmp4 * m01 + tmp9 * m11 + tmp10 * m21)

  var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3)

  return [
    d * t0,
    d * t1,
    d * t2,
    d * t3,
    d * ((tmp1 * m10 + tmp2 * m20 + tmp5 * m30) -
    (tmp0 * m10 + tmp3 * m20 + tmp4 * m30)),
    d * ((tmp0 * m00 + tmp7 * m20 + tmp8 * m30) -
    (tmp1 * m00 + tmp6 * m20 + tmp9 * m30)),
    d * ((tmp3 * m00 + tmp6 * m10 + tmp11 * m30) -
    (tmp2 * m00 + tmp7 * m10 + tmp10 * m30)),
    d * ((tmp4 * m00 + tmp9 * m10 + tmp10 * m20) -
    (tmp5 * m00 + tmp8 * m10 + tmp11 * m20)),
    d * ((tmp12 * m13 + tmp15 * m23 + tmp16 * m33) -
    (tmp13 * m13 + tmp14 * m23 + tmp17 * m33)),
    d * ((tmp13 * m03 + tmp18 * m23 + tmp21 * m33) -
    (tmp12 * m03 + tmp19 * m23 + tmp20 * m33)),
    d * ((tmp14 * m03 + tmp19 * m13 + tmp22 * m33) -
    (tmp15 * m03 + tmp18 * m13 + tmp23 * m33)),
    d * ((tmp17 * m03 + tmp20 * m13 + tmp23 * m23) -
    (tmp16 * m03 + tmp21 * m13 + tmp22 * m23)),
    d * ((tmp14 * m22 + tmp17 * m32 + tmp13 * m12) -
    (tmp16 * m32 + tmp12 * m12 + tmp15 * m22)),
    d * ((tmp20 * m32 + tmp12 * m02 + tmp19 * m22) -
    (tmp18 * m22 + tmp21 * m32 + tmp13 * m02)),
    d * ((tmp18 * m12 + tmp23 * m32 + tmp15 * m02) -
    (tmp22 * m32 + tmp14 * m02 + tmp19 * m12)),
    d * ((tmp22 * m22 + tmp16 * m02 + tmp21 * m12) -
    (tmp20 * m12 + tmp23 * m22 + tmp17 * m02))
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
  var positions = new Float32Array([
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
    0, 150, 0])

  // Center the F around the origin and Flip it around. We do this because
    // we're in 3D now with and +Y is up where as before when we started with 2D
    // we had +Y as down.

  // We could do by changing all the values above but I'm lazy.
  // We could also do it with a matrix at draw time but you should
  // never do stuff at draw time if you can do it at init time.
  var matrix = makeTranslation(-50, -75, -15)
  matrix = matrixMultiply(matrix, makeXRotation(Math.PI))

  for (var ii = 0; ii < positions.length; ii += 3) {
    var vector = matrixVectorMultiply([positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix)
    positions[ii + 0] = vector[0]
    positions[ii + 1] = vector[1]
    positions[ii + 2] = vector[2]
  }

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
}

function matrixVectorMultiply (v, m) {
  var dst = []
  for (var i = 0; i < 4; ++i) {
    dst[i] = 0.0
    for (var j = 0; j < 4; ++j) {
      dst[i] += v[j] * m[j * 4 + i]
    }
  }
  return dst
}
