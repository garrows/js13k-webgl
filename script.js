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
    var data = {
            x: 200,
            y: 150,
            angle: 0,
            scaleX: 1,
            scaleY: 1,
            fps: 0,
        },
        gui = new dat.GUI();
    canvas = document.getElementById( "glcanvas" );

    gui.remember( data );
    gui.add( data, 'x', 0, 400 ); //.onFinishChange( drawWorld );
    gui.add( data, 'y', 0, 300 );
    gui.add( data, 'angle', 0, 2 * Math.PI );
    gui.add( data, 'scaleX', -5, 5 );
    gui.add( data, 'scaleY', -5, 5 );
    gui.add( data, 'fps' ).listen();

    // Initialize the GL context
    gl = initWebGL( canvas );

    var program = utils.addShaderProg( gl, 'shader.vert', 'shader.frag' );
    gl.useProgram( program );

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation( program, "a_position" );

    // lookup uniforms
    var matrixLocation = gl.getUniformLocation( program, "u_matrix" );

    // Create a buffer.
    var buffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
    gl.enableVertexAttribArray( positionLocation );
    gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );

    // Set Geometry.
    setGeometry( gl );

    // Draw the scene.
    var lastTimestamp = 0;

    function drawScene( timestamp ) {
        var dt = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        data.fps = 1000 / dt;

        // Clear the canvas.
        gl.clear( gl.COLOR_BUFFER_BIT );

        // Compute the matrices
        var projectionMatrix = make2DProjection( canvas.clientWidth, canvas.clientHeight );
        var translationMatrix = makeTranslation( data.x, data.y );
        var rotationMatrix = makeRotation( data.angle );
        var scaleMatrix = makeScale( data.scaleX, data.scaleY );

        // Multiply the matrices.
        var matrix = matrixMultiply( scaleMatrix, rotationMatrix );
        matrix = matrixMultiply( matrix, translationMatrix );
        matrix = matrixMultiply( matrix, projectionMatrix );

        // Set the matrix.
        gl.uniformMatrix3fv( matrixLocation, false, matrix );

        // Draw the geometry.
        gl.drawArrays( gl.TRIANGLES, 0, 3 );

        requestAnimationFrame( drawScene );
    }

    requestAnimationFrame( drawScene );
}

function make2DProjection( width, height ) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    return [
        2 / width, 0, 0,
        0, -2 / height, 0, -1, 1, 1
    ];
}

function makeTranslation( tx, ty ) {
    return [
        1, 0, 0,
        0, 1, 0,
        tx, ty, 1
    ];
}

function makeRotation( angleInRadians ) {
    var c = Math.cos( angleInRadians );
    var s = Math.sin( angleInRadians );
    return [
        c, -s, 0,
        s, c, 0,
        0, 0, 1
    ];
}

/**
 * Takes twoMatrix3s, a and b, and computes the product in the order
 * that pre-composes b with a.  In other words, the matrix returned will
 * @param {module:webgl-2d-math.Matrix3} a A matrix.
 * @param {module:webgl-2d-math.Matrix3} b A matrix.
 * @return {module:webgl-2d-math.Matrix3} the result.
 * @memberOf module:webgl-2d-math
 */
function matrixMultiply( a, b ) {
    var a00 = a[ 0 * 3 + 0 ];
    var a01 = a[ 0 * 3 + 1 ];
    var a02 = a[ 0 * 3 + 2 ];
    var a10 = a[ 1 * 3 + 0 ];
    var a11 = a[ 1 * 3 + 1 ];
    var a12 = a[ 1 * 3 + 2 ];
    var a20 = a[ 2 * 3 + 0 ];
    var a21 = a[ 2 * 3 + 1 ];
    var a22 = a[ 2 * 3 + 2 ];
    var b00 = b[ 0 * 3 + 0 ];
    var b01 = b[ 0 * 3 + 1 ];
    var b02 = b[ 0 * 3 + 2 ];
    var b10 = b[ 1 * 3 + 0 ];
    var b11 = b[ 1 * 3 + 1 ];
    var b12 = b[ 1 * 3 + 2 ];
    var b20 = b[ 2 * 3 + 0 ];
    var b21 = b[ 2 * 3 + 1 ];
    var b22 = b[ 2 * 3 + 2 ];
    return [
        a00 * b00 + a01 * b10 + a02 * b20,
        a00 * b01 + a01 * b11 + a02 * b21,
        a00 * b02 + a01 * b12 + a02 * b22,
        a10 * b00 + a11 * b10 + a12 * b20,
        a10 * b01 + a11 * b11 + a12 * b21,
        a10 * b02 + a11 * b12 + a12 * b22,
        a20 * b00 + a21 * b10 + a22 * b20,
        a20 * b01 + a21 * b11 + a22 * b21,
        a20 * b02 + a21 * b12 + a22 * b22,
    ];
}

function makeScale( sx, sy ) {
    return [
        sx, 0, 0,
        0, sy, 0,
        0, 0, 1
    ];
}

// Fill the buffer with the values that define a triangle.
function setGeometry( gl ) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array( [
            0, -100,
            150, 125, -175, 100
        ] ),
        gl.STATIC_DRAW );
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