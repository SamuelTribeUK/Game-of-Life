// TODO Implement object for Game of Life implementation
// All implementation should be just numerical (no graphical implementation) using 2D Array

import $ from "jquery";

export class gameOfLife {

	xSize = {
		get xSize() {
			return this.xSize;
		},
		set xSize(x) {
			if (!Number.isInteger(x)) {
				throw new TypeError("provided xSize value was not an integer");
			}
			this.xSize = x;
		}
	};
	ySize = {
		get ySize() {
			return this.ySize;
		},
		set ySize(ySize) {
			if (!Number.isInteger(ySize)) {
				throw new TypeError("provided ySize value was not an integer");
			}
			this.ySize = ySize;
		}
	};
	timeout = {
		get timeout() {
			return this.timeout;
		},
		set timeout(timeout) {
			if (!Number.isInteger(timeout)) {
				throw new TypeError("provided timeout value was not an integer");
			}
			this.timeout = timeout;
		}
	};
	gameBoard = {
		get gameBoard(){ return this.gameBoard; },
		set gameBoard(gameBoard) { this.gameBoard = gameBoard; }
	}

	constructor(xSize: number = 25, ySize: number = 25, timeout: number = 100) {
		this.xSize(xSize);
		this.ySize(ySize);
		this.timeout(timeout);

		this.iterations = 0;

		// Game board array initialization
		this.gameBoard = new Array(this.xSize);
		for (let i = 0; i < this.xSize; i++) {
			this.gameBoard[i] = new Array(this.ySize);
		}
	}

	simulateStep() {
		let newGameBoard = $.extend(true, [], this.gameBoard);

		let changed = false;

		for (let i = 0; i < this.xSize; i++) {
			for (let j = 0; j < this.ySize; j++) {
				let liveNum = 0;
				for (let k = -1; k < 2; k++) {
					for (let l = -1; l < 2; l++) {
						if (!(k === 0 && l === 0)) {
							liveNum += this.checkCell(i + k, j + l);
						}
					}
				}
				if (liveNum < 2) {
					newGameBoard[i][j] = 0;
				} else if (liveNum < 4 && this.gameBoard[i][j] === 1) {
					newGameBoard[i][j] = 1;
				} else if (liveNum > 3 && this.gameBoard[i][j] === 1) {
					changed = true;
					newGameBoard[i][j] = 0;
				} else if (liveNum === 3 && this.gameBoard[i][j] === 0) {
					changed = true;
					newGameBoard[i][j] = 1;
				}
			}
		}
		this.gameBoard = $.extend(true, [], newGameBoard);

		this.iterations += 1;

		// if (!changed) {
		// 	clearInterval(interval);
		// 	document.getElementById("stopStart").innerText = "Start";
		// 	status = "stopped";
		// 	notify("Game has ended","success", 10000);
		// }
	}


	checkCell(currX, currY) {
		if (currX < 0 || currX >= this.xSize) {
			return 0;
		} else if (currY < 0 || currY >= this.ySize) {
			return 0;
		} else if (this.gameBoard[currX][currY] === 1) {
			return 1;
		} else {
			return 0;
		}
	}


}