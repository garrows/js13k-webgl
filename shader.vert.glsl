attribute vec2 a_position;
uniform mat3 u_matrix;
varying vec4 v_color;
attribute vec4 a_color;

void main() {
  // Multiply the position by the matrix.
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

  // Copy the color from the attribute to the varying.
  v_color = a_color;
}