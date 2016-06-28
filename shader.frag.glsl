precision mediump float;

varying vec4 v_color;

void main() {
  gl_FragColor = v_color;
  // gl_FragColor = vec4(v_color.x, v_color.y, 1.0, 1.0);
}