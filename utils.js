utils = {};

utils.allShaders = {};
utils.SHADER_TYPE_FRAGMENT = "x-shader/x-fragment";
utils.SHADER_TYPE_VERTEX = "x-shader/x-vertex";

utils.addShaderProg = function(gl, vertex, fragment) {

    utils.loadShader(vertex, utils.SHADER_TYPE_VERTEX);
    utils.loadShader(fragment, utils.SHADER_TYPE_FRAGMENT);

    var vertexShader = utils.getShader(gl, vertex);
    var fragmentShader = utils.getShader(gl, fragment);

    var prog = gl.createProgram();
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        alert("Could not initialise main shaders");
    }

    return prog;
};

utils.loadShader = function(file, type) {
    var cache, shader;

    var request = new XMLHttpRequest();
    request.open('GET', file, false); // `false` makes the request synchronous
    request.send(null);
    console.log(request);
    cache = {
        script: request.responseText,
        type: type
    };

    // $.ajax({
    //     async: false, // need to wait... todo: deferred?
    //     url: "shaders/" + file, //todo: use global config for shaders folder?
    //     success: function(result) {
    //         cache = {
    //             script: result,
    //             type: type
    //         };
    //     }
    // });

    // store in global cache
    utils.allShaders[file] = cache;
};

utils.getShader = function(gl, id) {

    //get the shader object from our main.shaders repository
    var shaderObj = utils.allShaders[id];
    var shaderScript = shaderObj.script;
    var shaderType = shaderObj.type;

    //create the right shader
    var shader;
    if (shaderType == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderType == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    //wire up the shader and compile
    gl.shaderSource(shader, shaderScript);
    gl.compileShader(shader);

    //if things didn't go so well alert
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    //return the shader reference
    return shader;

}; //end:getShader