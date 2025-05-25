async function runSFinder() {
      const fumen = document.getElementById('fumen').value;
      const clearLines = parseInt(document.getElementById('clearLines').value);
      const queue = document.getElementById('queue').value;
      const game = document.getElementById('game').value;
      const command = document.getElementById('command').value;

      const responseBox = document.getElementById('result');
      responseBox.textContent = "Loading...";

      try {
        const response = await fetch('https://sfinder.sixwi.de/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fumen, clearLines, queue, game, accessToken, tokenType, command })
        });

        if (!response.ok) {
            const errorData = await response.json();
            responseBox.textContent = "Error: " + (errorData.error || response.statusText);
            return;
        }

        // const resultText = await response.text();
        // responseBox.textContent = resultText;
        const resultJson = await response.json();
        const resultResult = resultJson.result;

        responseBox.textContent = resultResult;
        // responseBox.innerHTML = `<a href="${resultUrl}" target="_blank">${resultUrl}</a>`;

        tryRendering(resultResult);

      } catch (err) {
        responseBox.textContent = "Request failed: " + err.message;
      }
}

async function tryRendering(fumen) {
    let container = document.getElementById("solutionContainer");
    try { // single fumen
        let pages = decoder.decode(fumen);
        let fumen_page_list = [];
        let comment_list = [];
        for (let page of pages) {
            page.flags.colorize = true;
            let temp_fumen = encoder.encode([page])
            fumen_page_list.push(temp_fumen);
            comment_list.push(page.comment);
        }
        fumenrender(fumen_page_list, container, comment_list);

    } catch {
        try { // multiple fumens?
            fumenrender(fumen, container);
        }
        catch {
            
        }
    }
}

async function exportFumen() {
    const colorMap = "_ZLOSIJTX";

    const boardString = board.map(row =>
      row.map(cell => colorMap[parseInt(cell, 10)] || 'X').join('')).join(''); 

    fumen = encoder.encode([{field: Field.create(boardString)}]);
    document.getElementById("fumen").value = fumen;
}

const colors = ["#000000", "#FF0100", "#FEAA00", "#FFFE02", "#00EA01", "#00DDFF", "#0000FF", "#AA00FE", "#555555"];

const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");
const height = 600;
const width = 500;

var board = Array.from({ length: 20 }, () => Array(10).fill(0));

var oldBoard = JSON.parse(JSON.stringify(board));

// mouse stuff for drawing

mouseY = 0; // which cell on the board the mouse is over
mouseX = 0;
mouseDown = false;
drawMode = true;
movingCoordinates = false;

const cellSize = 30;

function paintbucketColor() {
    for (i = 0; i < document.paintbucket.length; i++) {
        if (document.paintbucket[i].checked) {
            return document.paintbucket[i].value;
        }
    }
}

canvas.onmousemove = function mousemove(e) {
    rect = canvas.getBoundingClientRect();
    let y = Math.floor((e.clientY - rect.top - 2) / cellSize);
    let x = Math.floor((e.clientX - rect.left - 102) / cellSize);

    if (inRange(x, 0, 9) && inRange(y, 0, 21)) {
        movingCoordinates = y != mouseY || x != mouseX;

        mouseY = y;
        mouseX = x;

        if (mouseDown && movingCoordinates) {
            if (!drawMode) {
                board[mouseY][mouseX] = 0;
            } else {
                board[mouseY][mouseX] = paintbucketColor();
            }
            graficks();
        }
    }
};

canvas.onmousedown = function mousedown(e) {
    rect = canvas.getBoundingClientRect();
    mouseY = Math.floor((e.clientY - rect.top - 2) / cellSize);
    mouseX = Math.floor((e.clientX - rect.left - 102) / cellSize);

    if (inRange(mouseX, 0, 9) && inRange(mouseY, 0, 19)) {
        if (!mouseDown) {
            movingCoordinates = false;
            drawMode = e.button != 0 || board[mouseY][mouseX] != 0;
            if (drawMode) {
                board[mouseY][mouseX] = 0;
            } else {
                oldBoard = JSON.parse(JSON.stringify(board));
                board[mouseY][mouseX] = paintbucketColor();
            }
            graficks();
        }
        mouseDown = true;
        drawMode = board[mouseY][mouseX] != 0;
    }
};

document.onmouseup = function mouseup(e) {
    mouseDown = false;
    if (drawMode) {
        // compare board oldboard and attempt to autocolor
        drawn = [];
        board.map((r, i) => {
            r.map((c, ii) => {
                if (c != 0 && c != oldBoard[i][ii]) drawn.push({ y: i, x: ii });
            });
        });
        if (drawn.length == 4) {
            // bleh do autocolor later
        }
    }
};

canvas.addEventListener("touchmove", (e) => {
    rect = canvas.getBoundingClientRect();
    let y = Math.floor((e.touches[0].clientY - rect.top - 2) / cellSize);
    let x = Math.floor((e.touches[0].clientX - rect.left - 102) / cellSize);

    if (inRange(x, 0, 9) && inRange(y, 0, 19)) {
        movingCoordinates = y != mouseY || x != mouseX;

        mouseY = y;
        mouseX = x;

        if (mouseDown && movingCoordinates) {
            if (!drawMode) {
                board[mouseY][mouseX] = 0;
            } else {
                board[mouseY][mouseX] = paintbucketColor();
            }
            graficks();
        }
    }
})

canvas.addEventListener("touchstart", (e) => { 
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    document.onmouseup = null;

    rect = canvas.getBoundingClientRect();
    mouseY = Math.floor((e.touches[0].clientY - rect.top - 2) / cellSize);
    mouseX = Math.floor((e.touches[0].clientX - rect.left - 102) / cellSize);

    if (inRange(mouseX, 0, 9) && inRange(mouseY, 0, 21)) {
        if (!mouseDown) {
            movingCoordinates = false;
            drawMode = board[mouseY][mouseX] != 0;
            if (drawMode) {
                board[mouseY][mouseX] = 0;
            } else {
                oldBoard = JSON.parse(JSON.stringify(board));
                board[mouseY][mouseX] = paintbucketColor();
            }
            graficks();
        }
        mouseDown = true;
        drawMode = board[mouseY][mouseX] != 0;
    }
})

document.addEventListener("touchend", (e) => {
    mouseDown = false;
    if (drawMode) {
        // compare board oldboard and attempt to autocolor
        drawn = [];
        board.map((r, i) => {
            r.map((c, ii) => {
                if (c != 0 && c != oldBoard[i][ii]) drawn.push({ y: i, x: ii });
            });
        });
        if (drawn.length == 4) {
            // bleh do autocolor later
        }
    }
})

function inRange(x, min, max) {
    return x >= min && x <= max;
}

graficks();

function graficks() {
    //#909090
    ctx.fillStyle = "#000000";
    ctx.fillRect(102, 2, width, height);
    for (var graphX = 0; graphX < 10; graphX++) {
        ctx.fillStyle = "#202020";
        ctx.fillRect(30 * graphX + 102, 2, 1, 600);
    }
    for (var graphY = 0; graphY < 20; graphY++) {
        ctx.fillStyle = "#202020";
        ctx.fillRect(102, 30 * graphY + 2, 300, 1);
    }
    for (var pixelY = 0; pixelY < board.length; pixelY++) {
        for (var pixelX = 0; pixelX < board.length; pixelX++) {
            if (board[pixelY][pixelX] != 0) {
                // ctx.drawImage(blocks, 30 * (board[pixelY][pixelX] + 1) + 1, 0, 30, 30, pixelX * 30, pixelY * 30, 30, 30);
                ctx.fillStyle = colors[board[pixelY][pixelX]];
                ctx.fillRect(pixelX * 30 + 102, pixelY * 30 + 2, 30, 30);
            }
        }
    }
    ctx.fillStyle = "#000000";
    ctx.fillRect(402, 2, width, height);
    // ctx.fillRect(2, 2, 100, 100);
    ctx.fillStyle = "#d3d3d3";
    ctx.fillRect(402, 2, 2, height);
    ctx.fillRect(101, 2, 2, 100);
    ctx.fillStyle = "#909090";
    ctx.fillRect(101, 104, 2, height);
    ctx.fillRect(0, 102, 103, 2);
    ctx.fillRect(0, 0, 2, 104);
    ctx.fillRect(0, 0, 604, 2);
    ctx.fillRect(502, 0, 2, 604);
    ctx.fillRect(102, 602, 404, 2);
}

document.addEventListener("paste", (event) => {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (index in items) {
        var item = items[index];
        if (item.kind === "file") {
            var blob = item.getAsFile();
            importImage(blob);
        }
    }
});

async function importImage(blob) {
    // Create an abstract canvas and get context
    var mycanvas = document.createElement("canvas");
    var ctx = mycanvas.getContext("2d");

    // Create an image
    var img = new Image();

    // Once the image loads, render the img on the canvas
    img.onload = function () {
        console.log(this.width, this.height);
        scale = this.width / 10.0;
        let x = 10;
        let y = Math.min(Math.round(this.height / scale), 22);
        console.log(x, y);
        mycanvas.width = this.width;
        mycanvas.height = this.height;

        // Draw the image
        ctx.drawImage(img, 0, 0, this.width, this.height);
        var data = Object.values(ctx.getImageData(0, 0, this.width, this.height).data);
        var nDat = [];
        for (row = 0; row < y; row++) {
            for (col = 0; col < 10; col++) {
                // get median value of pixels that should correspond to [row col] mino

                minoPixelsR = [];
                minoPixelsG = [];
                minoPixelsB = [];

                for (pixelRow = Math.floor(row * scale); pixelRow < row * scale + scale; pixelRow++) {
                    for (pixelCol = Math.floor(col * scale); pixelCol < col * scale + scale; pixelCol++) {
                        index = (pixelRow * this.width + pixelCol) * 4;
                        minoPixelsR.push(data[index]);
                        minoPixelsG.push(data[index + 1]);
                        minoPixelsB.push(data[index + 2]);
                    }
                }

                medianR = median(minoPixelsR);
                medianG = median(minoPixelsG);
                medianB = median(minoPixelsB);
                var hsv = rgb2hsv(medianR, medianG, medianB);
                // console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
                nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
            }
        }
        /* // old alg from just scaling it down to x by y pixels
        for (let i = 0; i < data.length / 4; i++) {
            //nDat.push(data[i*4] + data[(i*4)+1] + data[(i*4)+2] < 382?1:0)
            var hsv = rgb2hsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
            console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
            nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
        }*/

        let pieces = [".", "Z", "L", "O", "S", "I", "J", "T", "X"];

        tempBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
        for (rowIndex = 0; rowIndex < y; rowIndex++) {
            let row = [];
            for (colIndex = 0; colIndex < 10; colIndex++) {
                index = rowIndex * 10 + colIndex;
                temp = nDat[index];
                row.push(pieces.indexOf(temp));
            }
            tempBoard[rowIndex + (20 - y)] = row;
        }

        board = JSON.parse(JSON.stringify(tempBoard));

        graficks();

        // xPOS = spawn[0];
        // yPOS = spawn[1];
        // rot = 0;
        // clearActive();
        // updateGhost();
        // setShape();
        // updateHistory();
    };

    var URLObj = window.URL || window.webkitURL;
    img.src = URLObj.createObjectURL(blob);
}

async function importImageButton() {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                const blob = await clipboardItem.getType(type);
                //console.log(URL.createObjectURL(blob));

                importImage(blob);
            }
        }
    } catch (err) {
        console.log(err.message, "\nTry Ctrl V instead.");
    }
}

function rgb2hsv(r, g, b) {
    let v = Math.max(r, g, b),
        c = v - Math.min(r, g, b);
    let h = c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
    return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

function nearestColor(h, s, v) {
    if (inRange(s, 0, 1) && (inRange(v, 133, 135) || inRange(v, 63, 88))) return "X"; // attempted manual override specifically for four.lol idk
    if (inRange(h, 220, 225) && inRange(s, 0, 0.2) && v == 65) return ".";

    if (s <= 0.2 && v / 2.55 >= 55) return "X";
    if (v / 2.55 <= 55) return ".";

    if (inRange(h, 0, 16) || inRange(h, 325, 360)) return "Z";
    else if (inRange(h, 16, 39)) return "L";
    else if (inRange(h, 39, 70)) return "O";
    else if (inRange(h, 70, 149)) return "S";
    else if (inRange(h, 149, 200)) return "I";
    else if (inRange(h, 200, 266)) return "J";
    else if (inRange(h, 266, 325)) return "T";
    return ".";
}

function inRange(x, min, max) {
    return x >= min && x <= max;
}

function median(values) {
    // if this is too computationally expensive maybe switch to mean
    if (values.length === 0) throw new Error("No inputs");

    values.sort(function (a, b) {
        return a - b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2) return values[half];

    return (values[half - 1] + values[half]) / 2.0;
}

let accessToken;
let tokenType;
var userData;


if (localStorage.getItem('userData') === null || localStorage.getItem('userData') == '') {
	let userData = {
		history: {},
	};
	localStorage.setItem('userData', JSON.stringify(userData));
} else {
	userData = JSON.parse(localStorage.getItem('userData'));
}



window.onload = () => {
	var fragment = new URLSearchParams(window.location.hash.slice(1));
	if (localStorage.getItem('discord_info') != null) {
		var fragment = localStorage.getItem('discord_info');
		fragment = new URLSearchParams(fragment);
	} else {
		if (userData['username'] != undefined) {
			alert('Token has expired, please login again.');

			let userData = {
				history: {},
			};
			localStorage.setItem('userData', JSON.stringify(userData));
		}
	}
	if (fragment.has('access_token')) {
		localStorage.setItem('discord_info', fragment);
		accessToken = fragment.get('access_token');
		tokenType = fragment.get('token_type');
		fetch('https://discordapp.com/api/users/@me', {
			headers: {
				authorization: `${tokenType} ${accessToken}`,
			},
		})
			.then((res) => res.json())
			.then((response) => {
				const { username, avatar, id } = response;
				if (username == undefined) {
					document.getElementById('login').style.display = 'block';
					localStorage.removeItem('discord_info');
					return;
				}
				document.getElementById('info').innerHTML = 'Profile';
				//document.getElementById('icon').src = ` https://cdn.discordapp.com/avatars/${id}/${avatar}.webp`;
				checkImage(`https://cdn.discordapp.com/avatars/${id}/${avatar}.webp`);
				document.getElementById('login').href = 'files/' + id;

			})
			.catch(console.error);
	} else {
		document.getElementById('login').style.display = 'block';
	}
};

function checkImage(url) {
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.send();
	request.onload = function () {
		status = request.status;
		if (request.status == 200) {
			//if(statusText == OK)
			console.log('image exists');
			document.getElementById('icon').src = url;
		} else {
			console.log("image doesn't exist");
			document.getElementById('icon').src = 'https://discordapp.com/assets/322c936a8c8be1b803cd94861bdfa868.png';
		}
	};
}

document.getElementById("fumen").addEventListener("input", trySettingBoard);

function trySettingBoard() {
    try {
        let pages = decoder.decode(document.getElementById('fumen').value);
        let pieces = pages[0]._field.field.pieces;
        const map = [0,5,2,3,1,7,6,4,8]; // fumen format to sixwide format
        for (let i = 0; i < 200; i++) {
            const row = 19 - Math.floor(i / 10);
            const col = i % 10;

            board[row][col] = map[pieces[i]];
        }
        graficks();

    } catch {
        return;
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);

    const fumen = params.get("fumen");
    const command = params.get("command");
    const game = params.get("game");
    const clearLines = params.get("clearLines");
    const queue = params.get("queue");

    if (fumen !== null) {document.getElementById("fumen").value = fumen; trySettingBoard();}
    if (command !== null) document.getElementById("command").value = command;
    if (game !== null) document.getElementById("game").value = game;
    if (clearLines !== null) document.getElementById("clearLines").value = clearLines;
    if (queue !== null) document.getElementById("queue").value = queue;
  });