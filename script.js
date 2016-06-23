var gl; // A global variable for the WebGL context

function initWebGL( canvas ) {
    gl = null;

    try {
        // Try to grab the standard context. If it fails, fallback to experimental.
        gl = canvas.getContext( "webgl" ) || canvas.getContext( "experimental-webgl" );
    } catch ( e ) {}

    // If we don't have a GL context, give up now
    if ( !gl ) {
        alert( "Unable to initialize WebGL. Your browser may not support it." );
        gl = null;
    }

    return gl;
}

function start() {
    var canvas = document.getElementById( "glcanvas" );

    // Initialize the GL context
    gl = initWebGL( canvas );

    var program = utils.addShaderProg( gl, 'shader.vert', 'shader.frag' );
    gl.useProgram( program );

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation( program, "a_position" );
    var resolutionLocation = gl.getUniformLocation( program, "u_resolution" );
    var colorLocation = gl.getUniformLocation( program, "u_color" );
    // set the resolution
    gl.uniform2f( resolutionLocation, canvas.width, canvas.height );

    // Create a buffer
    var buffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
    gl.enableVertexAttribArray( positionLocation );
    gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );

    gl.drawArrays( gl.TRIANGLES, 0, 6 );

    // draw 50 random rectangles in random colors
    for ( var ii = 0; ii < 5; ++ii ) {
        // Setup a random rectangle
        setRectangle(
            gl, randomInt( 300 ), randomInt( 300 ), randomInt( 300 ), randomInt( 300 ) );

        // Set a random color.
        gl.uniform4f( colorLocation, Math.random(), Math.random(), Math.random(), 1 );

        // Draw the rectangle.
        gl.drawArrays( gl.TRIANGLES, 0, 6 );
    }

}

// Returns a random integer from 0 to range - 1.
function randomInt( range ) {
    return Math.floor( Math.random() * range );
}

// Fills the buffer with the values that define a rectangle.
function setRectangle( gl, x, y, width, height ) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( [
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2
    ] ), gl.STATIC_DRAW );
}