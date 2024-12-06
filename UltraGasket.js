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
var subdivNum = 1, iterNum = 1, scaleNum = 1;
var iterTemp = 0, animSeq = 0, animFrame = 0, animFlag = false;
var speedFactor =1;

// Variables for the 3D Sierpinski gasket
var points = [], colors = [], textures = [];

// Variables used for animations
let depth = 0; // Current recursion depth
const maxDepth = subdivNum; // Maximum recursion depth for the gasket
let spinAnim = false;
let colorAnim = false;
let bothAnim = false;
let reset_anim = false;
let directionX = 1; // 1 means increasing, -1 means decreasing
let directionY = 1; // 1 means increasing, -1 means decreasing

// Vertices for the 3D Sierpinski gasket (X-axis, Y-axis, Z-axis, W)
// For 3D, you need to set the z-axis to create the perception of depth
var vertices = [
    vec4( 0.0000 * 2,  0.0000 * 2, -1.0000 * 2, 1.0000),
    vec4( 0.0000 * 2,  0.9428 * 2,  0.3333 * 2, 1.0000),
    vec4(-0.8165 * 2, -0.4714 * 2,  0.3333 * 2, 1.0000),
    vec4( 0.8165 * 2, -0.4714 * 2,  0.3333 * 2, 1.0000)
];

// Different colors for a tetrahedron (RGBA)
var baseColors = [
    vec4(1.0, 0.4, 0.07, 1.0),
    vec4(1.0, 0.9, 0.8, 1.0),
    vec4(0.5, 0.0, 0.0, 1.0),
    vec4(0.0, 0.0, 0.4, 1.0),
];


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
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], subdivNum);


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
    let speedSlider = document.getElementById("speed-slider");
    let speedtext = document.getElementById("speed-text");
    checkTex1 = document.getElementById("check-texture-1");
    checkTex2 = document.getElementById("check-texture-2");
    checkTex3 = document.getElementById("check-texture-3");
    tex1 = document.getElementById("texture-1");
	tex2 = document.getElementById("texture-2");
    tex3 = document.getElementById("texture-3");
    startBtn = document.getElementById("start-btn");

    animSpin = document.getElementById("check-enable-spin")
    animColor = document.getElementById("check-enable-color")
    animBoth = document.getElementById("check-spin-color")

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

    speedSlider.onchange= function(event)
    {
        let sliderValue = parseInt(event.target.value);
        //speedFactor = Math.pow(1.25, sliderValue - 5);
        //speedtext.innerHTML = sliderValue;
        console.log("Speed Factor: " + speedFactor);
        speedFactor = event.target.value;
        speedtext.innerHTML= speedFactor;
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
        if(!animFlag){
            animFlag = true;
            disableUI();
            resetValue();
            animUpdate();
            startBtn.value = "Stop Animation"; // Change button text to "Stop Animation"
        }
        else{
            animFlag = false;
            iterTemp = iterNum;
            window.cancelAnimationFrame(animFrame);
            recompute();
            enableUI();
            resetValue();
            startBtn.value = "Start Animation"; // Change button text back to "Start Animation"
        }
		
	};

    animSpin.onchange = function(){
        if(animSpin.checked){
            spinAnim=true;
            recompute();
        }
        else{
            spinAnim=false;
            recompute();
        }
            
    }

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
    projectionMatrix = ortho(-4, 4, -2.25, 2.25, 20, -100);
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Pass a 4x4 model view matrix from JavaScript to the GPU for use in shader
    // Use translation to readjust the position of the primitive (if needed)
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(0, -0.2357, 0));
    modelViewMatrix = mult(modelViewMatrix, scale(0.2, 0.2, 1));
    //modelViewMatrix = mult(modelViewMatrix, rotateX(-20));
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
    
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], subdivNum);
    
    configWebGL();
    render();
}

// Update the animation frame
function animUpdate()
{
    // Stop the animation frame and return upon completing all sequences
    // if(iterTemp == iterNum)
    // {
    //     window.cancelAnimationFrame(animFrame);
    //     enableUI();
    //     animFlag = false;
    //     return; // break the self-repeating loop
    // }
    

    // Clear the color buffer and the depth buffer before rendering a new frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

     // Speed factor adjustment for animations
     let speedAdjustment = speedFactor * 1; // Multiply speedFactor by 0.1 for smooth scaling

    // Set the model view matrix for vertex transformation
    // Use translation to readjust the position of the primitive (if needed)
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(0, -0.2357, 0));
    //modelViewMatrix = mult(modelViewMatrix, rotateX(-20));
    modelViewMatrix = mult(modelViewMatrix, scale(0.2, 0.2, 1));

    // Switch case to handle the ongoing animation sequence
    // The animation is executed sequentially from case 0 to case n
    if(iterTemp<iterNum){
        switch(animSeq)
        {
            case 0: // Rotate 180deg Right
                
                theta[2] -= 1*speedAdjustment;

                if(theta[2] <= -180)
                {
                    theta[2] = -180;
                    animSeq++;
                }

                break;

            case 1: // Rotate 180deg Left
                theta[2] += 1*speedAdjustment;

                if(theta[2] >= 0)
                {
                    theta[2] = 0;
                    animSeq++;
                }

                break;
            
            case 2: // Rotate 180deg Left
                theta[2] += 1*speedAdjustment;

                if(theta[2] >= 180)
                {
                    theta[2] = 180;
                    animSeq++;
                }

                break;
            
            case 3: // Rotate 180deg Right
                theta[2] -=1*speedAdjustment;

                if(theta[2] <= 0)
                    {
                        theta[2] = 0;
                        animSeq++;
                    }
        
                    break;

            case 4: // Scale Up
                scaleNum += 0.02*speedAdjustment;
                
                if(scaleNum >= 2.5)
                {
                    scaleNum = 2.5;
                    animSeq+=2;
                }

                break;

            case 5: // Scale Down
                scaleNum -= 0.01*speedAdjustment;
                

                if(scaleNum <= 0.5 )
                {
                    
                    scaleNum = 0.5;
                    animSeq++;
                }

                break;

            case 6: // Animation 5
                move[0] += 0.0125*speedAdjustment;
                move[1] += 0.005*speedAdjustment;

                if(move[0] >= 3.0 && move[1] >= 1.2)
                {
                    move[0] = 3.0;
                    move[1] = 1.2;
                    animSeq++;
                }
                break;

            case 7: // Animation 6
                move[0] -= 0.0125*speedAdjustment;
                move[1] -= 0.005*speedAdjustment;

                if(move[0] <= -3.0 && move[1] <= -1.2)
                {
                    move[0] = -3.0;
                    move[1] = -1.2;
                    animSeq++;
                }
                break;

            case 8: // Animation 7
                if(spinAnim){
                    move[0] += 0.0125*speedAdjustment;
                    move[1] += 0.005*speedAdjustment;
                    theta[1] += 0.3*speedAdjustment;
                    // theta[0] += 1;
                    if(move[0] >= 0 && move[1] >= 0 && theta[1] >= 360 )
                        {
                            move[0] = 0;
                            move[1] = 0;
                            theta[1] = 360;
                            
                            animSeq++;
                        }
                }
                else{
                    move[0] += 0.0125*speedAdjustment;
                    move[1] += 0.005*speedAdjustment;
                    if(move[0] >= 0 && move[1] >= 0)
                    {
                        move[0] = 0;
                        move[1] = 0;
                        animSeq++;
                    }
                }
                
                break;
            
            case 9: // Optional Spin Animation
                if(spinAnim){
                    theta[1] += 0.3*speedAdjustment;
                    theta[0] += 0.3*speedAdjustment;

                    if(theta[1] >= 360 && theta[0] >=360)
                    {
                        theta[1] = 360;
                        theta[0] = 360;
                        
                        animSeq++;
                    }
                }
                else
                    animSeq++

                break;
            

            default: // Reset animation sequence
                animSeq = 0;
                iterTemp++;
                break;
        }
    }

    if (iterTemp == iterNum) {
        move[0] += 0.0125 * directionX * speedAdjustment; // Adjust movement based on direction
        move[1] += 0.005 * directionY * speedAdjustment;
    
        // Reverse direction when hitting bounds
        // if (move[0] >= 3.0 && move[1] >= 1.2) {
        //     directionX = -1; // Start decreasing move[0]
        //     directionY = -1;
        // }
        // if (move[0] <= -3.0 && move[1] <= -1.2) {
        //     directionX = 1; // Start increasing move[0]
        //     directionY = 1;
        // }
        if (move[0] >= 3.0) {
            directionX = -1; // Start decreasing move[0]
            
        }
        if (move[0] <= -3.0) {
            directionX = 1; // Start increasing move[0]
           
        }
        if (move[1] >= 1.2) {
            directionY = -1; // Start decreasing move[1]
        }
        if (move[1] <= -1.2) {
            directionY = 1; // Start increasing move[1]
        }
    }

    // Perform vertex transformation
    modelViewMatrix = mult(modelViewMatrix, rotateX(theta[0]));
    modelViewMatrix = mult(modelViewMatrix, rotateY(theta[1]));
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
    document.getElementById("speed-slider").disabled = true; 
    checkTex1.disabled = true;
    checkTex2.disabled = true;
    checkTex3.disabled = true;
    //startBtn.disabled = true;
}

// Enable the UI elements after the animation is completed
function enableUI()
{
    subdivSlider.disabled = false;
    iterSlider.disabled = false;
    document.getElementById("speed-slider").disabled = false; // Enable speed slider
    checkTex1.disabled = false;
    checkTex2.disabled = false;
    checkTex3.disabled = false;
    //startBtn.disabled = false;
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

function animateGasket() {
    // // Clear the screen
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update depth for animation
    if (increasing) {
        depth += 0.02; // Slowly increase depth
        if (depth >= subdivNum) increasing = false; // Start disintegration
    } else {
        depth -= 0.02; // Slowly decrease depth
        if (depth <= 0) increasing = true; // Start reveal again
    }

    // Render the Sierpiński Gasket with current depth
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3],
               Math.floor(depth)); // Pass integer depth

    // // Request the next frame
    // requestAnimationFrame(animateGasket);
}