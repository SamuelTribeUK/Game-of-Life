/* The game board is defined as a 2D array of objects which contain a mesh (called box) and a status (0 or 1 for dead or
 * alive)
 * Currently using Webpack so I can use npm packages, to bundle files for testing use npx webpack --mode=development */

// Experimenting with colour scheme so living cells will no longer be green

import {
	Scene,
	PerspectiveCamera,
	WebGLRenderer,
	BoxGeometry,
	PointLight,
	MeshLambertMaterial,
	Mesh,
	Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import $ from "jquery";
import Toastify from "toastify-js";

let xSize = 25;
let ySize = 25;
let timeout = 100;
let orbitToggle = false;
let warning = false;

let gameBoard;

let iterations = 0;
let status = "stopped";

let interval;

const canvas = document.querySelector('canvas');

let scene = new Scene();
let camera = new PerspectiveCamera(75, (window.innerWidth - 250)/(window.innerHeight), 0.1, 1000);
let renderer = new WebGLRenderer({antialias: true, canvas: canvas});
let controls = new OrbitControls(camera, canvas);
controls.enabled = false;
let geometry = new BoxGeometry(0.9, 0.9, 0.9);
let light = new PointLight(0xFFFFFF, 1, 500);

// Initialise the 2D array game board with the specified x and y sizes and populate it with random cells
let initialiseBoard = function() {
	document.getElementById("stopStart").innerText = "Start";
	gameBoard = new Array(xSize);
	for (let i = 0; i < xSize; i++) {
		gameBoard[i] = new Array(ySize);
	}

	for (let i = 0; i < xSize; i++) {
		for (let j = 0; j < ySize; j++) {
			let state = Math.floor(Math.random() * 2);
			addMesh(state, i, j);
		}
	}
}

// Add mesh cubes for each element in the 2D array game board, with green cubes being live cells and white being dead
let addMesh = function(state, i, j) {
	let colour;
	if (state === 0) {
		colour = "#43dde6";
	} else {
		colour = "#fc5185";
	}
	let material = new MeshLambertMaterial({color: colour});
	let mesh = new Mesh(geometry, material);
	mesh.position.set(i,j,0);
	gameBoard[i][j] = {box: mesh, state: state};
	scene.add(gameBoard[i][j].box);
}

/* The camera z location is the largest of the x and y sizes with the x and y values being the centre of the grid. The
 * background colour is set to white. The canvas size is set to the window inner sizes with the width - 250 to account
 * for the side panel. The addLights function is called to add 2 PointLights */
let setupScene = function() {
	if (xSize >= ySize) {
		camera.position.z = xSize;
	} else {
		camera.position.z = ySize;
	}

	camera.position.x = (xSize - 1) / 2;
	camera.position.y = (ySize - 1) / 2;

	renderer.setClearColor("#ffffff");
	renderer.setSize(window.innerWidth - 250, window.innerHeight);

	addLights();
}

// 2 Point lights are added to the centre of the grid with z values of +- the biggest of xSize or ySize
let addLights = function() {
	let biggestSize = (xSize > ySize) ? xSize : ySize;
	light.position.set(xSize/2, ySize/2, biggestSize);
	scene.add(light);
	light[0] = new PointLight(0xFFFFFF, 1, 500);
	light[0].position.set(xSize/2, ySize/2, -biggestSize);
	scene.add(light[0]);
}

/* simulateStep creates a deep copy of the game board to iterate over each cell and check for living neighbours to check
 * against the rules of the Game of Life. The new game board is required so there aren't conflicts with changes. After
 * the board has been checked, if no cells have changed then the game is stopped. The side bar and cube colours are then
 * updated with their respective functions */
let simulateStep = function() {
	let newGameBoard = $.extend(true, [], gameBoard);

	let changed = false;

	for (let i = 0; i < xSize; i++) {
		for (let j = 0; j < ySize; j++) {
			let liveNum = 0;
			for (let k = -1; k < 2; k++) {
				for (let l = -1; l < 2; l++) {
					if (!(k === 0 && l === 0)) {
						liveNum += checkCell(i + k, j + l);
					}
				}
			}
			if (liveNum < 2) {
				newGameBoard[i][j].state = 0;
			} else if (liveNum < 4 && gameBoard[i][j].state === 1) {
				newGameBoard[i][j].state = 1;
			} else if (liveNum > 3 && gameBoard[i][j].state === 1) {
				changed = true;
				newGameBoard[i][j].state = 0;
			} else if (liveNum === 3 && gameBoard[i][j].state === 0) {
				changed = true;
				newGameBoard[i][j].state = 1;
			}
		}
	}
	gameBoard = $.extend(true, [], newGameBoard);

	iterations += 1;

	if (!changed) {
		clearInterval(interval);
		document.getElementById("stopStart").innerText = "Start";
		status = "stopped";
		notify("Game has ended","success", 10000);
		updateSidebar();
	}

	updateSidebar();
	updateColours();

	if (!(orbitToggle)) requestAnimationFrame(render);
}

/* checkCell takes an x and y value and checks the game board if the cell at that location is alive or dead and returns
 * 1 if it is alive and 0 if dead. Out of bound cells are handled by returning 0 */
let checkCell = function(currX, currY) {
	if (currX < 0 || currX >= xSize) {
		return 0;
	} else if (currY < 0 || currY >= ySize) {
		return 0;
	} else if (gameBoard[currX][currY].state === 1) {
		return 1;
	} else {
		return 0;
	}
}

/* updateColours iterates over the game board and updates the colours of the cubes on the canvas to represent the living
 * and dead cells with green and white respectively */
let updateColours = function() {
	let state;
	let colour;
	for (let i = 0; i < xSize; i++) {
		for (let j = 0; j < ySize; j++) {
			state = gameBoard[i][j].state;
			if (state === 0) {
				colour = "#43dde6";
			} else {
				colour = "#fc5185";
			}
			gameBoard[i][j].box.material.color.set(colour);
		}
	}
}

/* The functions that handle all buttons and inputs on the side panel are attached in this function, as well as the
 * resize event function and the arrow key camera controls. The input fields are populated with the start values */
let attachClickEvents = function() {
	let element = document.querySelector("#stopStart");
	element.addEventListener("click", stopStart);

	element = document.querySelector("#zoomIn");
	element.addEventListener("click", zoomIn);

	element = document.querySelector("#zoomOut");
	element.addEventListener("click", zoomOut);

	element = document.querySelector("#cameraLeft");
	element.addEventListener("click", sidePanelCameraControls);

	element = document.querySelector("#cameraRight");
	element.addEventListener("click", sidePanelCameraControls);

	element = document.querySelector("#cameraUp");
	element.addEventListener("click", sidePanelCameraControls);

	element = document.querySelector("#cameraDown");
	element.addEventListener("click", sidePanelCameraControls);

	element = document.querySelector("#submit");
	element.addEventListener("click", newGameBoard);

	orbitCheckbox.addEventListener("change", toggleOrbitControls);

	element = document.getElementById("xSizeInput");
	element.value = xSize;

	element = document.getElementById("ySizeInput");
	element.value = ySize;

	element = document.getElementById("timeoutInput");
	let rate = 1000 / timeout;
	element.value = rate.toFixed(1);

	window.addEventListener("resize", () => {
		renderer.setSize(window.innerWidth - 250, window.innerHeight);
		camera.aspect = (window.innerWidth - 250) / (window.innerHeight);

		camera.updateProjectionMatrix();
		requestAnimationFrame(render);
	});

	document.addEventListener("keydown", arrowKeyCameraControls);
}

// The game status and number of iterations on the side bar are updated using the updateSidebar function
let updateSidebar = function() {
	document.getElementById("status").innerText = "Status: " + status;
	document.getElementById("iterations").innerText = "Iterations: " + iterations;
}

/* render renders the objects in the scene in accordance to the camera location. If orbit controls are enabled then an
 * animation frame is requested too */
let render = function() {
	if (orbitToggle) {
		requestAnimationFrame(render);
	}
	renderer.render(scene, camera);
}

// The following code is called to setup the Game of Life using the above functions
setupScene();

initialiseBoard(xSize, ySize);

let orbitCheckbox = document.getElementById("orbitControls");

window.onload = attachClickEvents;

updateSidebar();

render();

/* When the user clicks the stop/start button, this function handles the stopping and starting of the game using
 * setInterval nad clearInterval, updating the sidebar and button text in the process */
let stopStart = function() {
	if (status === "stopped") {
		interval = setInterval(simulateStep, timeout);
		document.getElementById("stopStart").innerText = "Stop";
		status = "playing";
		updateSidebar();
	} else {
		clearInterval(interval);
		document.getElementById("stopStart").innerText = "Start";
		status = "stopped";
		updateSidebar();
	}
	if (!(orbitToggle)) requestAnimationFrame(render);
}

/* doDispose is a thorough deep dispose of the scene and it's children. This is called when a new game board is made to
 * avoid memory leaks. The code was taken from: https://github.com/mrdoob/three.js/issues/5175 */
let doDispose = function(obj) {
	if (obj !== null)
	{
		for (let i = 0; i < obj.children.length; i++)
		{
			doDispose(obj.children[i]);
		}
		if (obj.geometry)
		{
			obj.geometry.dispose();
			obj.geometry = undefined;
		}
		if (obj.material)
		{
			if (obj.material.map)
			{
				obj.material.map.dispose();
				obj.material.map = undefined;
			}
			obj.material.dispose();
			obj.material = undefined;
		}
	}
	obj = undefined;
}

/* newGameBoard is called when the user clicks the update button on the side bar. First the inputs are validated, with
 * error notifications being returned if they are invalid. If all values are valid then the scene is disposed using
 * doDispose and the new values are used to create a new scene. If the orbit camera was enabled then it is disabled to
 * prevent any problems with significant FPS drops */
let newGameBoard = function(event) {
	event.preventDefault(); // This stops the form from submitting and refreshing the page
	let inputX = document.getElementById("xSizeInput").value;
	let inputY = document.getElementById("ySizeInput").value;
	let timeInput = document.getElementById("timeoutInput").value;

	if (inputX === "" || inputY === "" || timeInput === "") {
		notify("Dimensions or rate cannot be empty", "error", 5000);
		return false;
	}

	if (inputX < 1 || inputY < 1) {
		notify("Dimensions must be 1 or more", "error", 5000);
		return false;
	}

	if (timeInput < 0.1) {
		notify("rate must be 0.1 or more", "error", 5000);
		return false;
	}

	if (timeInput > 10) {
		notify("WARNING: Rates higher than 10 can cause issues!", "error", 5000);
	}

	if (inputX > 100 || inputY > 100) {
		if (!warning) {
			notify("WARNING: Large dimensions can use a lot of resources! Click update again if you are sure", "error", 5000);
			warning = true;
			return false;
		}
	}

	xSize = inputX;
	ySize = inputY;
	timeout = 1000 / timeInput;

	doDispose(scene);


	if (status === "playing") {
		stopStart();
	}

	gameBoard = null;
	iterations = 0;

	scene = new Scene();

	setupScene();

	initialiseBoard(xSize, ySize);

	camera.position.x = (xSize - 1) / 2;
	camera.position.y = (ySize - 1) / 2;
	camera.lookAt(new Vector3((xSize - 1) / 2, (ySize - 1) / 2, 0))

	camera.updateProjectionMatrix();

	updateSidebar();

	if (orbitToggle) {
		orbitCheckbox.checked = false;
		disableOrbit();
	} else {
		render();
	}
}

/* notify handles all notification displays using Toastify. it takes the text for the message, the type ("success" or
 * "error") and the duration in milliseconds */
let notify = function(text, type, duration) {
	let backgroundColor;
	if (type === "success") {
		backgroundColor = "linear-gradient(to right, #00b09b, #96c93d)";
	} else if (type === "error") {
		backgroundColor = "linear-gradient(to right, #FF5F6D, #FFC371)";
	}
	Toastify({
		text: text,
		duration: duration,
		close: true,
		gravity: "top", // `top` or `bottom`
		position: 'right', // `left`, `center` or `right`
		backgroundColor: backgroundColor,
		stopOnFocus: true, // Prevents dismissing of toast on hover
	}).showToast();
}

/* The orbit controls can be disabled using this function. It sets controls.enabled and orbitToggle to false and adds
 * arrow key event listeners for the standard camera controls */
let disableOrbit = function() {
	controls.enabled = false;
	orbitToggle = false;
	toggleControls(true);
	document.addEventListener("keydown", arrowKeyCameraControls);
}

// toggleControls enables/disables the camera control buttons on the side bar depending on their current state
let toggleControls = function(enable) {
	let cameraControls = document.getElementById("cameraControls");
	let buttons = cameraControls.getElementsByTagName("button");
	for (let i = 0; i < buttons.length; i++) {
		buttons[i].disabled = !enable;
	}
}

/* toggleOrbitControls handles the orbit camera controls being enabled/disabled and configures the target of the camera.
 * The arrow key event listeners for the standard camera controls are disabled when enabling orbit controls to avoid
 * conflicts with the existing event listeners included with orbit controls */
let toggleOrbitControls = function() {
	if (orbitCheckbox.checked) {
		// Enable orbit controls
		document.removeEventListener("keydown", arrowKeyCameraControls);
		controls.enabled = true;
		controls.target = (new Vector3((xSize - 1) / 2, (ySize - 1) / 2, 0));
		orbitToggle = true;
		notify("Orbit controls enabled", "success", 5000);
		toggleControls(false);
		render();
	} else {
		// Disable orbit controls
		disableOrbit();
	}
}

/* arrowKeyCameraControls manages the camera location movement, requesting an animation frame after camera movement to
 * render the changes on the canvas */
let arrowKeyCameraControls = function(event) {
	switch (event.key) {
		case 'ArrowUp' || 'Up':
			camera.position.y += 1;
			break;
		case 'ArrowLeft' || 'Left':
			camera.position.x -= 1;
			break;
		case 'ArrowRight' || 'Right':
			camera.position.x += 1;
			break;
		case 'ArrowDown' || 'Down':
			camera.position.y -= 1;
	}
	requestAnimationFrame(render);
}

/* sidePanelCameraControls handles the side panel button camera movement, requesting an animation frame after camera
 * movement to render the changes on the canvas */
let sidePanelCameraControls = function(event) {
	switch (event.target.id) {
		case 'cameraUp':
			camera.position.y += 1;
			break;
		case 'cameraLeft':
			camera.position.x -= 1;
			break;
		case 'cameraRight':
			camera.position.x += 1;
			break;
		case 'cameraDown':
			camera.position.y -= 1;
	}
	if (!(orbitToggle)) requestAnimationFrame(render);
}

/* zoomIn handles the side panel button zoom in control, requesting an animation frame after camera movement to render
 * the changes on the canvas */
let zoomIn = function() {
	camera.position.z -= 1;
	if (!(orbitToggle)) requestAnimationFrame(render);
}

/* zoomOut handles the side panel button zoom out control, requesting an animation frame after camera movement to render
 * the changes on the canvas */
let zoomOut = function() {
	camera.position.z += 1;
	if (!(orbitToggle)) requestAnimationFrame(render);
}
