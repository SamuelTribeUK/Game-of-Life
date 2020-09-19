/* The game board is defined as a 2D array of objects which contain a mesh (called box) and a status (0 or 1 for dead or
 * alive)
 * TODO Implement the side bar to allow user input for game options
 */

let xSize = 20;
let ySize = 20;
let timeout = 200;

let previousBoard;
let gameBoard;

let iterations = 0;
let status = "stopped";

let interval;

document.getElementById("stopStart").innerText = "Start";

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, (window.innerWidth - 250)/(window.innerHeight), 0.1, 1000);
let renderer = new THREE.WebGLRenderer({antialias: true});
let geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
let light = new THREE.PointLight(0xFFFFFF, 1, 500);

let addLights = function() {
	let biggestSize = (xSize > ySize) ? xSize : ySize;
	light.position.set(xSize/2, ySize/2, biggestSize);
	scene.add(light);
}

let cameraMove = function(event) {
	console.log(event.key);
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

let moveCamera = function(direction) {
	switch (direction) {
		case 'up':
			camera.position.y += 1;
			break;
		case 'left':
			camera.position.x -= 1;
			break;
		case 'right':
			camera.position.x += 1;
			break;
		case 'down':
			camera.position.y -= 1;
	}
	requestAnimationFrame(render);
}

let zoomIn = function() {
	camera.position.z -= 1;
	requestAnimationFrame(render);
}

let zoomOut = function() {
	camera.position.z += 1;
	requestAnimationFrame(render);
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

	window.addEventListener("resize", () => {
		renderer.setSize(window.innerWidth - 250, window.innerHeight);
		camera.aspect = (window.innerWidth - 250) / (window.innerHeight);

		camera.updateProjectionMatrix();

		requestAnimationFrame(render);
	});

	window.addEventListener("keydown", cameraMove)
	addLights();
}

setupScene();

let render = function() {
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

	previousBoard = $.extend(true, [], gameBoard);
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
		console.log("stopped");
	}

	updateSidebar();
	redraw();
}

let addMesh = function(state, i, j) {
	let colour;
	if (state === 0) {
		colour = "#FFFFFF";
	} else {
		colour = "#19A74A";
	}
	let material = new THREE.MeshLambertMaterial({color: colour});
	let mesh = new THREE.Mesh(geometry, material);
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

	requestAnimationFrame(render);
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
}

initialiseBoard(xSize, ySize);

camera.position.x = xSize / 2;
camera.position.y = ySize / 2;

updateSidebar();

render();