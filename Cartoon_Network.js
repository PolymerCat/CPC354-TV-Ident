/*-----------------------------------------------------------------------------------*/
// Variable Declaration
/*-----------------------------------------------------------------------------------*/

// Common variables
var canvas, gl, program;
var posBuffer, colBuffer, texBuffer, vPosition, vColor, vTexCoord;
var modelViewMatrixLoc, projectionMatrixLoc, texCoordLoc;
var modelViewMatrix, projectionMatrix, texture;

// Variables referencing HTML elements
// theta = [x, y, z]
var subdivSlider, subdivText, iterSlider, iterText, startBtn;
var checkTex1, checkTex2, checkTex3, tex1, tex2, tex3;
var theta = [0, 0, 0], move = [0, 0, 0];
var subdivNum = 3, iterNum = 1, scaleNum = 1;
var iterTemp = 0, animSeq = 0, animFrame = 0, animFlag = false;

// Variables for the 3D Sierpinski gasket
var points = [], colors = [], textures = [];

// Vertices for the 3D Sierpinski gasket (X-axis, Y-axis, Z-axis, W)
// For 3D, you need to set the z-axis to create the perception of depth
var vertices = [
    vec4( 0.0000 * 2,  0.0000 * 2, -1.0000 * 2, 1.0000),
    vec4( 0.0000 * 2,  0.9428 * 2,  0.3333 * 2, 1.0000),
    vec4(-0.8165 * 2, -0.4714 * 2,  0.3333 * 2, 1.0000),
    vec4( 0.8165 * 2, -0.4714 * 2,  0.3333 * 2, 1.0000)
];
var verticesC = [
    vec4(-0.5,  0.5, 0.0, 1.0), // Top-left
    vec4(-0.4,  0.6, 0.0, 1.0), // Curve top-left
    vec4( 0.0,  0.6, 0.0, 1.0), // Curve top-right
    vec4( 0.0, -0.6, 0.0, 1.0), // Curve bottom-right
    vec4(-0.4, -0.6, 0.0, 1.0), // Curve bottom-left
    vec4(-0.5, -0.5, 0.0, 1.0),  // Bottom-left
    vec4(-0.5, 0, 0.0, 1.0), // center out

    vec4(-0.4,  0.4, 0.0, 1.0), // Top-left-in
    vec4(-0.3,  0.4, 0.0, 1.0), // Curve top-left
    vec4( 0.0,  0.5, 0.0, 1.0), // Curve top-right
    vec4( 0.0, -0.5, 0.0, 1.0), // Curve bottom-right
    vec4(-0.4, -0.6, 0.0, 1.0), // Curve bottom-left
    vec4(-0.4, -0.4, 0.0, 1.0),  // Bottom-left
    vec4(-0.4, 0, 0.0, 1.0) // center in
];


var verticesN = [
    vec4(2.6,1,-0.5,1.0), //B1
    vec4(3,1.0,-0.5,1.0), //B2
    vec4(2.6,-0.3,-0.45,1.0), //B3
    vec4(2.6,-1,-0.45,1.0), //B4
    vec4(3,-1,-0.45,1.0), //B5
    
    vec4(1,1,-0.45,1.0), //A1
    vec4(1.4,1,-0.45,1.0), //A2
    vec4(1.4,0.3,-0.45,1.0), //A3
    vec4(1,-1,-0.45,1.0), //A4
    vec4(1.4,-1,-0.45,1.0) //A5
];

var verticesN2 = [
    vec4(2.6  ,1,0.5,1.0), //B1
    vec4(3  ,1.0,0.5,1.0), //B2
    vec4(2.6  ,-0.3,0.45,1.0), //B3
    vec4(2.6  ,-1,0.45,1.0), //B4
    vec4(3  ,-1,0.45,1.0), //B5
    
    vec4(1  ,1,0.45,1.0), //A1
    vec4(1.4  ,1,0.45,1.0), //A2
    vec4(1.4  ,0.3,0.45,1.0), //A3
    vec4(1  ,-1,0.45,1.0), //A4
    vec4(1.4  ,-1,0.45,1.0) //A5

];

// Different colors for a tetrahedron (RGBA)
var baseColors = [
    vec4(1.0, 0.2, 0.4, 1.0),
    vec4(0.0, 0.9, 1.0, 1.0),
    vec4(0.2, 0.2, 0.5, 1.0),
    vec4(0.0, 0.0, 0.0, 1.0)
];

function translateVertices(vertices, offset,axis) {
    return vertices.map(function(vertex) {
        if(axis == 'x')
            return vec4(vertex[0] + offset, vertex[1], vertex[2], vertex[3]);
        if(axis == 'y')
            return vec4(vertex[0] , vertex[1], vertex[2] + offset, vertex[3]);
        if(axis == 'z')
            return vec4(vertex[0] , vertex[1], vertex[2], vertex[3] + offset);
    });
}
// Define texture coordinates for texture mapping onto a shape or surface
var texCoord = 
[
    vec2(0, 0), // Bottom-left corner of the texture
    vec2(0, 1), // Top-left corner of the texture
    vec2(1, 1), // Top-right corner of the texture
    vec2(1, 0)  // Bottom-right corner of the texture
];

/*-----------------------------------------------------------------------------------*/
// WebGL Utilities
/*-----------------------------------------------------------------------------------*/

// Execute the init() function when the web page has fully loaded
window.onload = function init()
{
    // Primitive (geometric shape) initialization
    
    create_Triangle_N(verticesN[0],verticesN[1],verticesN[2],verticesN[3],verticesN[4],verticesN[5],verticesN[6],verticesN[7],verticesN[8],verticesN[9]);
    create_Triangle_N(verticesN2[0],verticesN2[1],verticesN2[2],verticesN2[3],verticesN2[4],verticesN2[5],verticesN2[6],verticesN2[7],verticesN2[8],verticesN2[9]);
    create_Triangle_N_3D();

    // WebGL setups
    getUIElement();
    configWebGL();
    configureTexture(tex1);
    render();
}

// Retrieve all elements from HTML and store in the corresponding variables
function getUIElement()
{
    canvas = document.getElementById("gl-canvas");
    subdivSlider = document.getElementById("subdiv-slider");
    subdivText = document.getElementById("subdiv-text");
    iterSlider = document.getElementById("iter-slider");
    iterText = document.getElementById("iter-text");
    checkTex1 = document.getElementById("check-texture-1");
    checkTex2 = document.getElementById("check-texture-2");
    checkTex3 = document.getElementById("check-texture-3");
    tex1 = document.getElementById("texture-1");
	tex2 = document.getElementById("texture-2");
    tex3 = document.getElementById("texture-3");
    startBtn = document.getElementById("start-btn");

    subdivSlider.onchange = function(event) 
	{
		subdivNum = event.target.value;
		subdivText.innerHTML = subdivNum;
        recompute();
    };

    iterSlider.onchange = function(event) 
	{
		iterNum = event.target.value;
		iterText.innerHTML = iterNum;
        recompute();
    };

    checkTex1.onchange = function() 
	{
		if(checkTex1.checked)
        {
            configureTexture(tex1);
            recompute();
        }
    };

    checkTex2.onchange = function() 
	{
		if(checkTex2.checked)
        {
            configureTexture(tex2);
            recompute();
        }
    };

    checkTex3.onchange = function() 
	{
		if(checkTex3.checked)
        {
            configureTexture(tex3);
            recompute();
        }
    };

    startBtn.onclick = function()
	{
		animFlag = true;
        disableUI();
        resetValue();
        animUpdate();
	};
}

// Configure WebGL Settings
function configWebGL()
{
    // Initialize the WebGL context
    gl = WebGLUtils.setupWebGL(canvas);
    
    if(!gl)
    {
        alert("WebGL isn't available");
    }

    // Set the viewport and clear the color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

    // Compile the vertex and fragment shaders and link to WebGL
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create buffers and link them to the corresponding attribute variables in vertex and fragment shaders
    // Buffer for positions
    posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Buffer for colors
    colBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    
    vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Buffer for textures
    texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textures), gl.STATIC_DRAW);
    
    vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    // Get the location of the uniform variables within a compiled shader program
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    texCoordLoc = gl.getUniformLocation(program, "texture");
}

// Render the graphics for viewing
function render()
{
    // Cancel the animation frame before performing any graphic rendering
    if(animFlag)
    {
        animFlag = false;
        window.cancelAnimationFrame(animFrame);
    }
    
    // Clear the color buffer and the depth buffer before rendering a new frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Pass a 4x4 projection matrix from JavaScript to the GPU for use in shader
    // ortho(left, right, bottom, top, near, far)
    projectionMatrix = ortho(-4, 4, -2.25, 2.25, 2, -2);
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    

    // Pass a 4x4 model view matrix from JavaScript to the GPU for use in shader
    // Use translation to readjust the position of the primitive (if needed)
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(0, -0.2357, 0));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Draw the primitive / geometric shape
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

// Recompute points and colors, followed by reconfiguring WebGL for rendering
function recompute()
{
    // Reset points and colors for render update
    points = [];
	colors = [];
    textures = [];
    
    //divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], subdivNum);
    //divideCube(verticesbox[0], verticesbox[1], verticesbox[2], verticesbox[3], verticesbox[4], verticesbox[5], verticesbox[6], verticesbox[7], subdivNum);
   
    configWebGL();
    render();
}

// Update the animation frame
function animUpdate()
{
    // Stop the animation frame and return upon completing all sequences
    if(iterTemp == iterNum)
    {
        window.cancelAnimationFrame(animFrame);
        enableUI();
        animFlag = false;
        return; // break the self-repeating loop
    }

    // Clear the color buffer and the depth buffer before rendering a new frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the model view matrix for vertex transformation
    // Use translation to readjust the position of the primitive (if needed)
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(0, -0.2357, 0));

    // Switch case to handle the ongoing animation sequence
    // The animation is executed sequentially from case 0 to case n
    switch(animSeq)
    {
        case 0: // Animation 1
            theta[2] += 1;
            theta[1] +=1;
            if(theta[2] >= 360)
            {
                theta[2] = 360;
                animSeq++;
            }

            break;

        case 1: // Animation 2
            theta[2] -= 1;

            if(theta[2] <= 0)
            {
                theta[2] = 0;
                animSeq++;
            }

            break;

        case 2: // Animation 3
            scaleNum += 0.02;
            
            if(scaleNum >= 4)
            {
                scaleNum = 4;
                animSeq++;
            }

            break;

        case 3: // Animation 4
            scaleNum -= 0.02;

            if(scaleNum <= 1)
            {
                scaleNum = 1;
                animSeq++;
            }

            break;

        case 4: // Animation 5
            move[0] += 0.0125;
            move[1] += 0.005;

            if(move[0] >= 3.0 && move[1] >= 1.2)
            {
                move[0] = 3.0;
                move[1] = 1.2;
                animSeq++;
            }
            break;

        case 5: // Animation 6
            move[0] -= 0.0125;
            move[1] -= 0.005;

            if(move[0] <= -3.0 && move[1] <= -1.2)
            {
                move[0] = -3.0;
                move[1] = -1.2;
                animSeq++;
            }
            break;

        case 6: // Animation 7
            move[0] += 0.0125;
            move[1] += 0.005;

            if(move[0] >= 0 && move[1] >= 0)
            {
                move[0] = 0;
                move[1] = 0;
                animSeq++;
            }
            break;

        default: // Reset animation sequence
            animSeq = 0;
            iterTemp++;
            break;
    }

    // Perform vertex transformation
    modelViewMatrix = mult(modelViewMatrix, rotateZ(theta[2]));
    modelViewMatrix = mult(modelViewMatrix, scale(scaleNum, scaleNum, 1));
    modelViewMatrix = mult(modelViewMatrix, translate(move[0], move[1], move[2]));

    // Pass the matrix to the GPU for use in shader
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Draw the primitive / geometric shape
    gl.drawArrays(gl.TRIANGLES, 0, points.length);

    // Schedule the next frame for a looped animation (60fps)
    animFrame = window.requestAnimationFrame(animUpdate);
}

// Disable the UI elements when the animation is ongoing
function disableUI()
{
    subdivSlider.disabled = true;
    iterSlider.disabled = true;
    checkTex1.disabled = true;
    checkTex2.disabled = true;
    checkTex3.disabled = true;
    startBtn.disabled = true;
}

// Enable the UI elements after the animation is completed
function enableUI()
{
    subdivSlider.disabled = false;
    iterSlider.disabled = false;
    checkTex1.disabled = false;
    checkTex2.disabled = false;
    checkTex3.disabled = false;
    startBtn.disabled = false;
}

// Reset all necessary variables to their default values
function resetValue()
{
    theta = [0, 0, 0];
    move = [0, 0, 0];
    scaleNum = 1;
    animSeq = 0;
    iterTemp = 0;
}

// Check whether whether a given number value is a power of 2
function isPowerOf2(value) 
{
  return (value & (value - 1)) == 0;
}

// Configure the texture
function configureTexture(tex)
{
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, tex);
	if (isPowerOf2(tex.width) && isPowerOf2(tex.height)) 
	{
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        console.log("Width: " + tex.width + ", Height: " + tex.height + " (yes)");
    } 
	
	else 
	{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        console.log("Width: " + tex.width + ", Height: " + tex.height + " (no)");
    }
}

/*-----------------------------------------------------------------------------------*/
// 3D Sierpinski Gasket
/*-----------------------------------------------------------------------------------*/

// Form a triangle
function triangle(a, b, c, color)
{
    colors.push(baseColors[color]);
    points.push(a);
    textures.push(texCoord[0]);
    colors.push(baseColors[color]);
    points.push(b);
    textures.push(texCoord[1]);
    colors.push(baseColors[color]);
    points.push(c);
    textures.push(texCoord[2]);
}

// Form a tetrahedron with different color for each side
function tetra(a, b, c, d)
{
    triangle(a, c, b, 0);
    triangle(a, c, d, 1);
    triangle(a, b, d, 2);
    triangle(b, c, d, 3);
}

// subdivNum a tetrahedron
function divideTetra(a, b, c, d, count)
{
    // Check for end of recursion
    if(count === 0)
    {
        tetra(a, b, c, d);
    }

    // Find midpoints of sides and divide into four smaller tetrahedra
    else
    {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var ad = mix(a, d, 0.5);
        var bc = mix(b, c, 0.5);
        var bd = mix(b, d, 0.5);
        var cd = mix(c, d, 0.5);
        --count;

        divideTetra(a, ab, ac, ad, count);
        divideTetra(ab, b, bc, bd, count);
        divideTetra(ac, bc, c, cd, count);
        divideTetra(ad, bd, cd, d, count);
    }
}

/*-----------------------------------------------------------------------------------*/


function create_Triangle_N(B1,B2,B3,B4,B5,A1,A2,A3,A4,A5){
    triangle(B1,B2,B3,0);
    triangle(B2,B3,B5,1);
    triangle(B3,B4,B5,2);

    triangle(A2,A3,B3,3);
    triangle(B3,B4,A3,0);

    triangle(A1,A2,A3,1);
    triangle(A1,A3,A4,2);
    triangle(A3,A4,A5,3);
}
function create_N_Depth(a,b,c,d){
    triangle(a,b,c,0);
    triangle(d,b,c,1);
}

function create_Triangle_N_3D(){
    var N1=verticesN
    var N2=verticesN2

    create_N_Depth(N1[0],N1[1],N2[0],N2[1]); // B1,B2
    create_N_Depth(N1[0],N1[2],N2[0],N2[2]); // B1,B3
    create_N_Depth(N1[1],N1[4],N2[1],N2[4]); // B2,B5
    create_N_Depth(N1[3],N1[4],N2[3],N2[4]); // B4,B5

    create_N_Depth(N1[6],N1[2],N2[6],N2[2]); // A2,B3
    create_N_Depth(N1[7],N1[3],N2[7],N2[3]); // A3,B4

    create_N_Depth(N1[5],N1[6],N2[5],N2[6]); // A1,A2
    create_N_Depth(N1[5],N1[8],N2[5],N2[8]); // A1,A4
    create_N_Depth(N1[7],N1[9],N2[7],N2[9]); // A3,A5
    create_N_Depth(N1[8],N1[9],N2[8],N2[9]); // A4,A5
}
