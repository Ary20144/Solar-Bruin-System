import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enabled = true;
controls.minDistance = 10;
controls.maxDistance = 50;

function translationMatrix(tx, ty, tz) {
	return new THREE.Matrix4().set(
		1, 0, 0, tx,
		0, 1, 0, ty,
		0, 0, 1, tz,
		0, 0, 0, 1
	);
}

function rotationMatrixX(theta) {
    return new THREE.Matrix4().set(
        1, 0, 0, 0,
        0, Math.cos(theta), -Math.sin(theta), 0,
        0, Math.sin(theta), Math.cos(theta), 0,
        0, 0, 0, 1
    );
}

function rotationMatrixY(theta) {
    return new THREE.Matrix4().set(
        Math.cos(theta), 0, Math.sin(theta), 0,
        0, 1, 0, 0,
        -Math.sin(theta), 0, Math.cos(theta), 0,
        0, 0, 0, 1
    );
}

function rotationMatrixZ(theta) {
	return new THREE.Matrix4().set(
		Math.cos(theta), -Math.sin(theta), 0, 0,
		Math.sin(theta),  Math.cos(theta), 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	);
}

let planets = [];
let clock = new THREE.Clock();
let attachedObject = null;
let blendingFactor = 0.1;
// Create additional variables as needed here

// Starter code sphere, feel free to delete it afterwards
// let geometry = new THREE.SphereGeometry(1, 32, 32);
// let material = new THREE.MeshBasicMaterial({ color: 0xffffff });
// let sphere = new THREE.Mesh(geometry, material);
// scene.add(sphere);

// TODO: Create the sun
let geometry = new THREE.SphereGeometry(1, 32, 32);
let material = new THREE.MeshBasicMaterial({ color: 0xffffff });
let sun = new THREE.Mesh(geometry, material);
sun.position.set(0,0,0);
scene.add(sun);
// TODO: Create sun light
let sunLight = new THREE.PointLight({ color: 0xffffff },1,0,1);
sunLight.position.set(0,0,0);
scene.add(sunLight)

// Create orbiting planets
// TODO: Create Planet 1: Flat-shaded Gray Planet
geometry = new THREE.SphereGeometry(1, 8, 6);
material = new THREE.MeshPhongMaterial({ color: 0x808080,flatShading: true });
let planet1 = new THREE.Mesh(geometry,material);
planet1.position.set(0,0,-5)
scene.add(planet1);


// TODO: Create Planet 2: Swampy Green-Blue with Dynamic Shading
geometry = new THREE.SphereGeometry(1, 8, 8);
material = new THREE.MeshPhongMaterial({ color: 0x80FFFF,ambient: 0.0, diffusivity: 0.5,specularity: 1.0, smoothness: 40.0   });
let planet2 = new THREE.Mesh(geometry,material);
scene.add(planet2);

// TODO: Create Planet 3: Muddy Brown-Orange Planet with Ring
geometry = new THREE.SphereGeometry(1, 16, 16);
material = new THREE.createPhongMaterial({color : 0xB08040, ambient: 0.0, diffusivity: 1.0, specularity: 1.0, smoothness: 100.0});
let planet3 = new THREE.Mesh(geometry,material);
scene.add(planet3);
// Planet 3 Ring
geometry = THREE.RingGeometry(1.5,2.5,64);
let ring = null;
//needs complition

// TODO: Create Planet 4: Soft Light Blue Planet
geometry = new THREE.SphereGeometry(1,16,16);
// material = new THREE.


let planet4 = null;

// TODO: Create Planet 4's Moon
let moon = null;

// TODO: Store planets and moon in an array for easy access, 
// e.g. { mesh: planet1, distance: 5, speed: 1 },
planets = [
     // TODO: Fill in the planet's data here
    { mesh: planet1, distance: 5, speed: 1 }, // Planet 1: Flat-shaded Gray Planet
    { mesh: planet2, distance: 8, speed: 5/8 }, // Planet 2: Swampy Green-Blue with Dynamic Shading
    { mesh: planet3, distance: 11, speed: 5/11 }, // Planet 3: Muddy Brown-Orange Planet with Ring
    { mesh: planet4, distance: 14, speed: 5/14 }, // Planet 4: Soft Light Blue Planet
    { mesh: moon, distance: 1, speed: 0.1 }      // Moon of Planet 4
];

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

// Handle keyboard input
document.addEventListener('keydown', onKeyDown, false);

animate();

// TODO: Implement the Gouraud Shader for Planet 2
function createGouraudMaterial(materialProperties) {    
    // TODO: Implement the Vertex Shader in GLSL
    let vertexShader = ``;

    // TODO: Implement the Fragment Shader in GLSL
    let fragmentShader = ``;

    let shape_color = new THREE.Vector4(
        materialProperties.color.r, 
        materialProperties.color.g, 
        materialProperties.color.b,
        1.0
    );
    
    // Uniforms
    const uniforms = {
        ambient: { value: materialProperties.ambient },
        diffusivity: { value: materialProperties.diffusivity },
        specularity: { value: materialProperties.specularity },
        smoothness: { value: materialProperties.smoothness },
        shape_color: { value: shape_color },
        squared_scale: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
        camera_center: { value: new THREE.Vector3() },
        model_transform: { value: new THREE.Matrix4() },
        projection_camera_model_transform: { value: new THREE.Matrix4() },
        light_positions_or_vectors: { value: [] },
        light_colors: { value: [] },
        light_attenuation_factors: { value: [] }
    };

    // Create the ShaderMaterial using the custom vertex and fragment shaders
    return new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms
    });
}

// Custom Phong Shader has already been implemented, no need to make change.
function createPhongMaterial(materialProperties) {
    const numLights = 1;
    // Vertex Shader
    let vertexShader = `
        precision mediump float;
        const int N_LIGHTS = ${numLights};
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS];
        uniform vec4 light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale;
        uniform vec3 camera_center;
        varying vec3 N, vertex_worldspace;

        // ***** PHONG SHADING HAPPENS HERE: *****
        vec3 phong_model_lights(vec3 N, vec3 vertex_worldspace) {
            vec3 E = normalize(camera_center - vertex_worldspace);
            vec3 result = vec3(0.0);
            for(int i = 0; i < N_LIGHTS; i++) {
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                    light_positions_or_vectors[i].w * vertex_worldspace;
                float distance_to_light = length(surface_to_light_vector);
                vec3 L = normalize(surface_to_light_vector);
                vec3 H = normalize(L + E);
                float diffuse = max(dot(N, L), 0.0);
                float specular = pow(max(dot(N, H), 0.0), smoothness);
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light);
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                        + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        }

        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;

        void main() {
            gl_Position = projection_camera_model_transform * vec4(position, 1.0);
            N = normalize(mat3(model_transform) * normal / squared_scale);
            vertex_worldspace = (model_transform * vec4(position, 1.0)).xyz;
        }
    `;
    // Fragment Shader
    let fragmentShader = `
        precision mediump float;
        const int N_LIGHTS = ${numLights};
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS];
        uniform vec4 light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 camera_center;
        varying vec3 N, vertex_worldspace;

        // ***** PHONG SHADING HAPPENS HERE: *****
        vec3 phong_model_lights(vec3 N, vec3 vertex_worldspace) {
            vec3 E = normalize(camera_center - vertex_worldspace);
            vec3 result = vec3(0.0);
            for(int i = 0; i < N_LIGHTS; i++) {
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                    light_positions_or_vectors[i].w * vertex_worldspace;
                float distance_to_light = length(surface_to_light_vector);
                vec3 L = normalize(surface_to_light_vector);
                vec3 H = normalize(L + E);
                float diffuse = max(dot(N, L), 0.0);
                float specular = pow(max(dot(N, H), 0.0), smoothness);
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light);
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                        + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        }

        void main() {
            // Compute an initial (ambient) color:
            vec4 color = vec4(shape_color.xyz * ambient, shape_color.w);
            // Compute the final color with contributions from lights:
            color.xyz += phong_model_lights(normalize(N), vertex_worldspace);
            gl_FragColor = color;
        }
    `;

    let shape_color = new THREE.Vector4(
        materialProperties.color.r, 
        materialProperties.color.g, 
        materialProperties.color.b, 
        1.0
    );
    // Prepare uniforms
    const uniforms = {
        ambient: { value: materialProperties.ambient },
        diffusivity: { value: materialProperties.diffusivity },
        specularity: { value: materialProperties.specularity },
        smoothness: { value: materialProperties.smoothness },
        shape_color: { value: shape_color },
        squared_scale: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
        camera_center: { value: new THREE.Vector3() },
        model_transform: { value: new THREE.Matrix4() },
        projection_camera_model_transform: { value: new THREE.Matrix4() },
        light_positions_or_vectors: { value: [] },
        light_colors: { value: [] },
        light_attenuation_factors: { value: [] }
    };

    // Create the ShaderMaterial using the custom vertex and fragment shaders
    return new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms
    });
}

// TODO: Finish the custom shader for planet 3's ring with sinusoidal brightness variation
function createRingMaterial(materialProperties) {
    let vertexShader = `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
    `;

    // TODO: Finish the fragment shader to create the brightness variation with sinine finction
    let fragmentShader = `
        uniform vec3 color;
        varying vec3 vPosition;

        void main() {

        }
    `;

    // TODO: Fill in the values to be passed in to create the custom shader
    return new THREE.ShaderMaterial({
        uniforms: {color: null},

    });
}

// This function is used to update the uniform of the planet's materials in the animation step. No need to make any change
function updatePlanetMaterialUniforms(planet) {
    const material = planet.material;
    if (!material.uniforms) return;

    const uniforms = material.uniforms;

    const numLights = 1;
    const lights = scene.children.filter(child => child.isLight).slice(0, numLights);
    // Ensure we have the correct number of lights
    if (lights.length < numLights) {
        console.warn(`Expected ${numLights} lights, but found ${lights.length}. Padding with default lights.`);
    }
    
    // Update model_transform and projection_camera_model_transform
    planet.updateMatrixWorld();
    camera.updateMatrixWorld();

    uniforms.model_transform.value.copy(planet.matrixWorld);
    uniforms.projection_camera_model_transform.value.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
    ).multiply(planet.matrixWorld);

    // Update camera_center
    uniforms.camera_center.value.setFromMatrixPosition(camera.matrixWorld);

    // Update squared_scale (in case the scale changes)
    const scale = planet.scale;
    uniforms.squared_scale.value.set(
        scale.x * scale.x,
        scale.y * scale.y,
        scale.z * scale.z
    );

    // Update light uniforms
    uniforms.light_positions_or_vectors.value = [];
    uniforms.light_colors.value = [];
    uniforms.light_attenuation_factors.value = [];

    for (let i = 0; i < numLights; i++) {
        const light = lights[i];
        if (light) {
            let position = new THREE.Vector4();
            if (light.isDirectionalLight) {
                // For directional lights
                const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(light.quaternion);
                position.set(direction.x, direction.y, direction.z, 0.0);
            } else if (light.position) {
                // For point lights
                position.set(light.position.x, light.position.y, light.position.z, 1.0);
            } else {
                // Default position
                position.set(0.0, 0.0, 0.0, 1.0);
            }
            uniforms.light_positions_or_vectors.value.push(position);

            // Update light color
            const color = new THREE.Vector4(light.color.r, light.color.g, light.color.b, 1.0);
            uniforms.light_colors.value.push(color);

            // Update attenuation factor
            let attenuation = 0.0;
            if (light.isPointLight || light.isSpotLight) {
                const distance = light.distance || 1000.0; // Default large distance
                attenuation = 1.0 / (distance * distance);
            } else if (light.isDirectionalLight) {
                attenuation = 0.0; // No attenuation for directional lights
            }
            // Include light intensity
            const intensity = light.intensity !== undefined ? light.intensity : 1.0;
            attenuation *= intensity;

            uniforms.light_attenuation_factors.value.push(attenuation);
        } else {
            // Default light values
            uniforms.light_positions_or_vectors.value.push(new THREE.Vector4(0.0, 0.0, 0.0, 0.0));
            uniforms.light_colors.value.push(new THREE.Vector4(0.0, 0.0, 0.0, 1.0));
            uniforms.light_attenuation_factors.value.push(0.0);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


// TODO: Implement the camera attachment given the key being pressed
// Hint: This step you only need to determine the object that are attached to and assign it to a variable you have to store the attached object.
function onKeyDown(event) {
    switch (event.keyCode) {
        case 48: // '0' key - Detach camera
            break;
        
        //...
    }
}

function animate() {
    requestAnimationFrame(animate);

    let time = clock.getElapsedTime();

    // TODO: Animate sun radius and color
    let period10 = time % 10.0;
    let newRadius = 1 + 2 * (1 - Math.abs((period10) - 5) / 5);
    sun.scale.set(newRadius, newRadius, newRadius);
    
    // Calculate color based on radius 
    let red = 255.0;
    let green = 0; 
    let blue = 0;
    
    let colorFactor = (time%10) / 5; // Calculate the color factor from 0 to 1
     red = 1.0; // Red channel stays full
    if(colorFactor <1){
        green = 1.0 * colorFactor; 
        blue = 1.0 * colorFactor; 
    }else if (colorFactor > 1){
        green = 1.0 * (2 - colorFactor); 
        blue = 1.0 * (2 - colorFactor);
    }
    
  sun.material.color.setRGB(red, green, blue);
    // TODO: Update sun light
    sunLight.color.setRGB(red, green, blue);
    sunLight.power = Math.pow(10, newRadius);
    // TODO: Loop through all the orbiting planets and apply transformation to create animation effect
    planets.forEach(function (obj, index) {
        let planet = obj.mesh;
        let distance = obj.distance;
        let speed = obj.speed;
        
        let model_transform = new THREE.Matrix4(); 
        
        // TODO: Implement the model transformations for the planets
        // Hint: Some of the planets have the same set of transformation matrices, but for some you have to apply some additional transformation to make it work (e.g. planet4's moon, planet3's wobbling effect).
        
        // Apply rotation based on the planet's speed
        let rot = rotationMatrixY(speed);
        model_transform.multiplyMatrices(rot, model_transform);
        
        // Apply translation based on the planet's distance from the sun
        let translation = translationMatrix(distance, 0, 0);
        model_transform.multiplyMatrices(translation, model_transform);
        


        planet.matrix.copy(model_transform);
        planet.matrixAutoUpdate = false;
        
        // Camera attachment logic here, when certain planet is being attached, we want the camera to be following the planet by having the same transformation as the planet itself. No need to make changes.
        if (attachedObject === index){
            let cameraTransform = new THREE.Matrix4();

            // Copy the transformation of the planet (Hint: for the wobbling planet 3, you might have to rewrite to the model_tranform so that the camera won't wobble together)
            cameraTransform.copy(model_transform);
            
            // Add a translation offset of (0, 0, 10) in front of the planet
            let offset = translationMatrix(0, 0, 10);
            cameraTransform.multiply(offset);

            // Apply the new transformation to the camera position
            let cameraPosition = new THREE.Vector3();
            cameraPosition.setFromMatrixPosition(cameraTransform);
            camera.position.lerp(cameraPosition, blendingFactor);

            // Make the camera look at the planet
            let planetPosition = new THREE.Vector3();
            planetPosition.setFromMatrixPosition(planet.matrix);
            camera.lookAt(planetPosition);

            // Disable controls
            controls.enabled = false;
        } 

        // TODO: If camera is detached, slowly lerp the camera back to the original position and look at the origin
        else if (attachedObject === null) {


            // Enable controls
            controls.enabled = true;
        }
    });
    
    // TODO: Apply Gouraud/Phong shading alternatively to Planet 2
    

    // TODO: Update customized planet material uniforms
    // e.g. updatePlanetMaterialUniforms(planets[1].mesh);
    

    // Update controls only when the camera is not attached
    if (controls.enabled) {
        controls.update();
    }

    renderer.render(scene, camera);
}