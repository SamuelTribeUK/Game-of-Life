/* The game board is defined as a 2D array of objects which contain a mesh (called box) and a status (0 or 1 for dead or
 * alive)
 * TODO Implement the side bar to allow user input for game options
 * Currently using Webpack so I can use npm packages, to bundle files for testing use npx webpack --mode=development
 */

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

let xSize = 20;
let ySize = 20;
let timeout = 200;
let orbitToggle = false;

let gameBoard;

let controls;
let iterations = 0;
let status = "stopped";

let interval;

document.getElementById("stopStart").innerText = "Start";

let scene = new Scene();
let camera = new PerspectiveCamera(75, (window.innerWidth - 250)/(window.innerHeight), 0.1, 1000);
let renderer = new WebGLRenderer({antialias: true});
let geometry = new BoxGeometry(0.9, 0.9, 0.9);
let light = new PointLight(0xFFFFFF, 1, 500);

let addLights = function() {
	let biggestSize = (xSize > ySize) ? xSize : ySize;
	light.position.set(xSize/2, ySize/2, biggestSize);
	scene.add(light);
	light[0] = new PointLight(0xFFFFFF, 1, 500);
	light[0].position.set(xSize/2, ySize/2, -biggestSize);
	scene.add(light[0]);
}

let cameraMove = function(event) {
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
	if (!(orbitToggle)) requestAnimationFrame(render);
}

let moveCamera = function(event) {
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

let zoomIn = function() {
	camera.position.z -= 1;
	if (!(orbitToggle)) requestAnimationFrame(render);
}

let zoomOut = function() {
	camera.position.z += 1;
	if (!(orbitToggle)) requestAnimationFrame(render);
}

let setupScene = function() {
	if (xSize >= ySize) {
		camera.position.z = xSize + 5;
	} else {
		camera.position.z = ySize + 5;
	}

	renderer.setClearColor("#ffffff");
	renderer.setSize(window.innerWidth - 250, window.innerHeight);

	document.body.appendChild(renderer.domElement);

	addLights();
}

setupScene();

let render = function() {
	if (orbitToggle) {
		requestAnimationFrame(render);
	}
	renderer.render(scene, camera);
}

let initialiseBoard = function() {
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
		updateSidebar();
	}

	updateSidebar();
	redraw();

	if (!(orbitToggle)) requestAnimationFrame(render);
}

let addMesh = function(state, i, j) {
	let colour;
	if (state === 0) {
		colour = "#FFFFFF";
	} else {
		colour = "#19A74A";
	}
	let material = new MeshLambertMaterial({color: colour});
	let mesh = new Mesh(geometry, material);
	mesh.position.set(i,j,0);
	gameBoard[i][j] = {box: mesh, state: state};
	scene.add(gameBoard[i][j].box);
}

let updateSidebar = function() {
	document.getElementById("status").innerText = "Status: " + status;
	document.getElementById("iterations").innerText = "Iterations: " + iterations;
}

let checkCell = function(currX, currY) {
	if (currX < 0 || currX >= ySize) {
		return 0;
	} else if (currY < 0 || currY >= xSize) {
		return 0;
	} else if (gameBoard[currX][currY].state === 1) {
		return 1;
	} else {
		return 0;
	}
}

let redraw = function() {
	let state;
	let colour;
	for (let i = 0; i < xSize; i++) {
		for (let j = 0; j < ySize; j++) {
			state = gameBoard[i][j].state;
			if (state === 0) {
				colour = "#FFFFFF";
			} else {
				colour = "#19A74A";
			}
			gameBoard[i][j].box.material.color.set(colour);
		}
	}
}

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

initialiseBoard(xSize, ySize);

camera.position.x = (xSize - 1) / 2;
camera.position.y = (ySize - 1) / 2;

let attachClickEvents = function() {
	let button = document.querySelector("#stopStart");
	button.addEventListener("click", stopStart);

	button = document.querySelector("#zoomIn");
	button.addEventListener("click", zoomIn);

	button = document.querySelector("#zoomOut");
	button.addEventListener("click", zoomOut);

	button = document.querySelector("#cameraLeft");
	button.addEventListener("click", moveCamera);

	button = document.querySelector("#cameraRight");
	button.addEventListener("click", moveCamera);

	button = document.querySelector("#cameraUp");
	button.addEventListener("click", moveCamera);

	button = document.querySelector("#cameraDown");
	button.addEventListener("click", moveCamera);

	orbitCheckbox.addEventListener("change", toggleOrbitControls);
}

let orbitCheckbox = document.getElementById("orbitControls");

let toggleOrbitControls = function() {
	if (orbitCheckbox.checked) {
		// Enable orbit controls
		document.removeEventListener("keydown", cameraMove);
		controls = new OrbitControls(camera, renderer.domElement);
		controls.target = (new Vector3((xSize - 1) / 2, (ySize - 1) / 2, 0));
		controls.update();
		orbitToggle = true;
		render();
	} else {
		// Disable orbit controls
		controls.dispose();
		orbitToggle = false;
		document.addEventListener("keydown", cameraMove);
	}
}

window.onload = attachClickEvents;

window.addEventListener("resize", () => {
	renderer.setSize(window.innerWidth - 250, window.innerHeight);
	camera.aspect = (window.innerWidth - 250) / (window.innerHeight);

	camera.updateProjectionMatrix();
	requestAnimationFrame(render);
});

document.addEventListener("keydown", cameraMove);

updateSidebar();

render();