"use strict";

/*
============================================================
DRAW FRETBOARD
============================================================

SECCIONES:

- CONFIGURACIÓN Y REDIMENSIONADO
    * resizeCanvas
    * getDynamicNeckLength

- GEOMETRÍA DEL DIAPASÓN
    * getFretPosition
    * getFretFromPosition
    * getFretCenter
    * getCellCenter

- INTERACCIÓN CON RATÓN
    * getCellFromMouse
    * getNutStringFromMouse

- RENDERIZADO PRINCIPAL
    * drawFretboard
    * drawHorizontal
    * drawVertical

- ELEMENTOS VISUALES
    * drawInlays
    * drawNutNotes
    * drawRealisticString
    * drawRealisticNut

- CEJILLAS
    * drawBarre
    * drawBarres

- UTILIDADES DE COLOR
    * getStringColor
    * getInlayColor
    * getNutColor

- DRAW NOTES


============================================================
*/



// ============================================================
// CONFIGURACIÓN Y REDIMENSIONADO
// ============================================================

function resizeCanvas() {

	const topMargin =
		(showTitle.checked && title.trim() !== "")
			? titleMargin
			: 12;

	const isHorizontal =
		(rotation === 90 || rotation === 270);

	let leftMargin;
	let rightMargin;
	let bottomMargin;

	if (!showFretNumbers) {

		leftMargin = marginX;

		rightMargin = marginX;
		bottomMargin = marginBottom;

	} else {

		leftMargin =
			isHorizontal
				? marginX
				: 32;

		rightMargin = marginX;

		bottomMargin =
			isHorizontal
				? 32
				: marginBottom;

	}

	const neckLength = getDynamicNeckLength();

	if (isHorizontal) {

		boardWidth = neckLength;
		boardHeight = HORIZONTAL_HEIGHT;

	} else {

		boardWidth = VERTICAL_WIDTH;
		boardHeight = neckLength;

	}

	canvas.width = Math.round(
		boardWidth +
		leftMargin +
		rightMargin
	);

	canvas.height = Math.round(
		boardHeight +
		topMargin +
		bottomMargin
	);

	boardleft = leftMargin;
	boardtop = topMargin;

	boardright = boardleft + boardWidth;
	boardbottom = boardtop + boardHeight;

	drawFretboard();

	if (typeof drawNotes === "function") {
		drawNotes();
	}

	if (typeof updateLeftPanelVisibility === "function") {
		updateLeftPanelVisibility();
	}

}

// ============================================================
// GEOMETRÍA DEL DIAPASÓN
// ============================================================

function rotateFretboard(){

    rotated = !rotated;

    switch(rotation){

        case 0:
            rotation = 180;
            break;

        case 180:
            rotation = 0;
            break;

        case 90:
            rotation = 270;
            break;

        case 270:
            rotation = 90;
            break;
    }

    updateOrientationButtons();
    resizeCanvas();

}

function getFretPosition(fret) {

	// Longitud útil del mástil
	const neckLength =
		(rotation === 90 || rotation === 270)
			? boardWidth
			: boardHeight;

	let position;

	//------------------------------------------------
	// Modo sin escala (trastes equidistantes)
	//------------------------------------------------

	if (!displayMode) {

		position = (neckLength / fretCount) * fret;

	} else {

		//------------------------------------------------
		// Escala temperada real
		//------------------------------------------------

		const scaleLength = 648;

		const realPosition =
			scaleLength -
			(scaleLength / Math.pow(2, fret / 12));

		const lastFretPosition =
			scaleLength -
			(scaleLength / Math.pow(2, fretCount / 12));

		position =
			(realPosition / lastFretPosition) * neckLength;

	}

	//------------------------------------------------
	// Invertir el sentido del mástil
	//------------------------------------------------

	if (rotation === 180 || rotation === 270) {

		position = neckLength - position;

	}

	return position;

}


// ============================================================
// RENDERIZADO PRINCIPAL
// ============================================================

function drawFretboard() {

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Fondo blanco base del canvas
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Sobresalido discreto de la imagen del diapasón
	neckBleed = Math.max(3, stringSpace * 0.20);

	// Radio de las esquinas redondeadas
	neckRadius = Math.max(5, stringSpace * 0.28);

	// Medidas finales de la imagen
	imageLeft = boardleft - neckBleed;
	imageTop = boardtop - neckBleed;
	imageWidth = boardWidth + neckBleed * 2;
	imageHeight = boardHeight + neckBleed * 2;

	function roundedRectPath(x, y, width, height, radius) {

		const r = Math.min(
			radius,
			width / 2,
			height / 2
		);

		ctx.beginPath();

		ctx.moveTo(x + r, y);

		ctx.lineTo(x + width - r, y);
		ctx.quadraticCurveTo(
			x + width,
			y,
			x + width,
			y + r
		);

		ctx.lineTo(x + width, y + height - r);
		ctx.quadraticCurveTo(
			x + width,
			y + height,
			x + width - r,
			y + height
		);

		ctx.lineTo(x + r, y + height);
		ctx.quadraticCurveTo(
			x,
			y + height,
			x,
			y + height - r
		);

		ctx.lineTo(x, y + r);
		ctx.quadraticCurveTo(
			x,
			y,
			x + r,
			y
		);

		ctx.closePath();

	}

	//------------------------------------------------
	// Imagen del diapasón
	//------------------------------------------------

	if (useNeckImage && neckImageLoaded) {

		ctx.save();

		ctx.shadowColor = "rgba(0,0,0,0.28)";
		ctx.shadowBlur = 5;
		ctx.shadowOffsetX = 2;
		ctx.shadowOffsetY = 2;

		roundedRectPath(
			imageLeft,
			imageTop,
			imageWidth,
			imageHeight,
			neckRadius
		);

		ctx.fillStyle = "rgba(0,0,0,0.01)";
		ctx.fill();

		ctx.restore();

		ctx.save();

		roundedRectPath(
			imageLeft,
			imageTop,
			imageWidth,
			imageHeight,
			neckRadius
		);

		ctx.clip();

		switch (rotation) {

			//------------------------------------------------
			// Vertical (cejuela arriba)
			//------------------------------------------------

			case 0:

				ctx.save();

				ctx.translate(
					imageLeft,
					imageTop + imageHeight
				);

				ctx.rotate(-Math.PI / 2);

				ctx.drawImage(
					neckImage,
					0,
					0,
					imageHeight,
					imageWidth
				);

				ctx.restore();

				break;

			//------------------------------------------------
			// Horizontal (cejuela izquierda)
			//------------------------------------------------

			case 90:

				ctx.drawImage(
					neckImage,
					imageLeft,
					imageTop,
					imageWidth,
					imageHeight
				);

				break;

			//------------------------------------------------
			// Vertical (cejuela abajo)
			//------------------------------------------------

			case 180:

				ctx.save();

				ctx.translate(
					imageLeft + imageWidth,
					imageTop
				);

				ctx.rotate(Math.PI / 2);

				ctx.drawImage(
					neckImage,
					0,
					0,
					imageHeight,
					imageWidth
				);

				ctx.restore();

				break;

			//------------------------------------------------
			// Horizontal (cejuela derecha)
			//------------------------------------------------

			case 270:

				ctx.save();

				ctx.translate(
					imageLeft + imageWidth,
					imageTop + imageHeight
				);

				ctx.rotate(Math.PI);

				ctx.drawImage(
					neckImage,
					0,
					0,
					imageWidth,
					imageHeight
				);

				ctx.restore();

				break;

		}

		ctx.restore();

	} else {

		ctx.fillStyle = "#FFFFFF";

		ctx.fillRect(
			boardleft,
			boardtop,
			boardWidth,
			boardHeight
		);

	}

	//------------------------------------------------
	// Trastes, cuerdas...
	//------------------------------------------------

	if (rotation === 90 || rotation === 270) {

		drawHorizontal();

	} else {

		drawVertical();

	}

	//------------------------------------------------
	// Título
	//------------------------------------------------

	if (showTitle.checked && title.trim() !== "") {

		let fontSize = 24;

		do {

			ctx.font = `bold ${fontSize}px Segoe UI`;

			fontSize--;

		} while (

			ctx.measureText(title).width > boardWidth - 10 &&
			fontSize > 10

		);

		ctx.fillStyle = "#000";
		ctx.textAlign = "left";
		ctx.textBaseline = "middle";

		ctx.fillText(
			title,
			boardleft,
			boardtop / 2
		);

	}

	drawFretNumbers();

}

function drawHorizontal() {

	boardright = boardleft + boardWidth;
	boardbottom = boardtop + boardHeight;

	stringSpace = boardHeight / (stringCount - 1);
	fretSpace = boardWidth / fretCount;

	const reverseStrings = (rotation === 270);

	//------------------------------------------------
	// Trastes
	//------------------------------------------------

	for (let fret = 1; fret <= fretCount; fret++) {

		const x = boardleft + getFretPosition(fret);

		const fretWidth = Math.max(
			2,
			stringSpace * 0.10
		);

		const margin = fretWidth / 2;

		if (fretboardStyle === "blank") {

			drawFret(
				x,
				boardtop,
				x,
				boardbottom,
				fretWidth
			);

		} else {

			drawFret(
				x,
				imageTop + margin,
				x,
				imageTop + imageHeight - margin,
				fretWidth
			);

		}

	}

	if (displayMode) {

		drawInlays(
			boardleft,
			boardtop,
			stringSpace
		);

	}

	//------------------------------------------------
	// Cuerdas
	//------------------------------------------------

	const stringBleed = Math.max(
		3,
		stringSpace * 0.10
	);

	for (let s = 0; s < stringCount; s++) {

		const index =
			reverseStrings
				? stringCount - 1 - s
				: s;

		const y = boardtop + index * stringSpace;

		let stringWidth;

		if (s < 3) {

			stringWidth = 1 + s * 0.2;

		} else {

			stringWidth = 1.8 + (s - 3) * 0.45;

		}

		if (fretboardStyle === "blank") {

			ctx.beginPath();
			ctx.moveTo(boardleft, y);
			ctx.lineTo(boardright, y);
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#000";
			ctx.stroke();

		} else {

			drawRealisticString(
				boardleft - stringBleed,
				y,
				boardright,
				y,
				stringWidth
			);

		}

	}

	//------------------------------------------------
	// Cejuela
	//------------------------------------------------

	if (!displayMode) {

		const fretWidth = Math.max(2, stringSpace * 0.10);

		const nutX =
			rotation === 90
				? boardleft
				: boardright;

		drawFret(
			nutX,
			boardtop,
			nutX,
			boardbottom,
			fretWidth
		);

	} else {

		if (fretboardStyle === "blank") {

			const nutWidth = 3;
			const gap = 5;

			ctx.lineWidth = nutWidth;
			ctx.strokeStyle = getNutColor();

			const x1 =
				rotation === 90
					? boardleft
					: boardright;

			const x2 =
				rotation === 90
					? boardleft + gap
					: boardright - gap;

			ctx.beginPath();
			ctx.moveTo(x1, boardtop);
			ctx.lineTo(x1, boardbottom);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(x2, boardtop);
			ctx.lineTo(x2, boardbottom);
			ctx.stroke();

		} else {

			drawRealisticNut();

		}

	}

}

function drawVertical() {

	boardright = boardleft + boardWidth;
	boardbottom = boardtop + boardHeight;

	stringSpace = boardWidth / (stringCount - 1);
	fretSpace = boardHeight / fretCount;

	const reverseStrings = (rotation === 180);

	//------------------------------------------------
	// Trastes
	//------------------------------------------------

	for (let fret = 1; fret <= fretCount; fret++) {

		const y = boardtop + getFretPosition(fret);

		const fretWidth = Math.max(
			2,
			stringSpace * 0.10
		);

		const margin = fretWidth / 2;

		if (fretboardStyle === "blank") {

			drawFret(
				boardleft,
				y,
				boardright,
				y,
				fretWidth
			);

		} else {

			drawFret(
				imageLeft + margin,
				y,
				imageLeft + imageWidth - margin,
				y,
				fretWidth
			);

		}

	}

	if (displayMode) {

		drawInlays(
			boardleft,
			boardtop,
			stringSpace
		);

	}
	//------------------------------------------------
	// Cuerdas
	//------------------------------------------------

	const stringBleed = Math.max(
		3,
		stringSpace * 0.10
	);

	for (let s = 0; s < stringCount; s++) {

		const index =
			reverseStrings
				? s
				: stringCount - 1 - s;

		const x = boardleft + index * stringSpace;

		let stringWidth;

		if (s < 3) {

			stringWidth = 1 + s * 0.2;

		} else {

			stringWidth = 1.8 + (s - 3) * 0.45;

		}

		if (fretboardStyle === "blank") {

			ctx.beginPath();
			ctx.moveTo(x, boardtop);
			ctx.lineTo(x, boardbottom);
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#000";
			ctx.stroke();

		} else {

			drawRealisticString(
				x,
				boardtop - stringBleed,
				x,
				boardbottom,
				stringWidth
			);

		}

	}

	//------------------------------------------------
	// Cejuela
	//------------------------------------------------

	if (!displayMode) {

		const fretWidth = Math.max(2, stringSpace * 0.10);

		const nutY =
			rotation === 0
				? boardtop
				: boardbottom;

		drawFret(
			boardleft,
			nutY,
			boardright,
			nutY,
			fretWidth
		);

	} else {

		if (fretboardStyle === "blank") {

			const nutWidth = 3;
			const gap = 5;

			ctx.lineWidth = nutWidth;
			ctx.strokeStyle = getNutColor();

			const y1 =
				rotation === 0
					? boardtop
					: boardbottom;

			const y2 =
				rotation === 0
					? boardtop + gap
					: boardbottom - gap;

			ctx.beginPath();
			ctx.moveTo(boardleft, y1);
			ctx.lineTo(boardright, y1);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(boardleft, y2);
			ctx.lineTo(boardright, y2);
			ctx.stroke();

		} else {

			drawRealisticNut();

		}

	}

}

function drawFret(x1, y1, x2, y2, fretWidth) {

	// Cuerpo metálico
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);

	ctx.strokeStyle = "#666";
	ctx.lineWidth = fretWidth;
	ctx.stroke();

	// Reflejo metálico
	ctx.beginPath();

	if (x1 === x2) {

		// Traste vertical
		ctx.moveTo(
			x1 - fretWidth * 0.18,
			y1
		);

		ctx.lineTo(
			x2 - fretWidth * 0.18,
			y2
		);

	} else {

		// Traste horizontal
		ctx.moveTo(
			x1,
			y1 - fretWidth * 0.18
		);

		ctx.lineTo(
			x2,
			y2 - fretWidth * 0.18
		);

	}

	ctx.strokeStyle = "rgba(255,255,255,0.75)";
	ctx.lineWidth = Math.max(
		0.7,
		fretWidth * 0.22
	);

	ctx.stroke();

}


// ============================================================
// ELEMENTOS VISUALES
// ============================================================

function drawInlays(left, top, stringSpace) {

	const marks = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

	const radius = 6;

	ctx.fillStyle = getInlayColor();

	const horizontal =
		rotation === 90 || rotation === 270;

	const reverseStrings =
		rotation === 180 || rotation === 270;

	marks.forEach(fret => {

		if (fret > fretCount) {
			return;
		}

		const fretCenter = getFretCenter(fret);

		let x;
		let y;

		if (horizontal) {

			x = left + fretCenter;

			y = top + (
				reverseStrings
					? (stringCount - 1 - 2.5) * stringSpace
					: 2.5 * stringSpace
			);

		} else {

			x = left + (
				reverseStrings
					? 2.5 * stringSpace
					: (stringCount - 1 - 2.5) * stringSpace
			);

			y = top + fretCenter;

		}

		//------------------------------------------------
		// Trastes 12 y 24
		//------------------------------------------------

		if (fret === 12 || fret === 24) {

			if (horizontal) {

				const y1 = top + (
					reverseStrings
						? (stringCount - 1 - 1.5) * stringSpace
						: 1.5 * stringSpace
				);

				const y2 = top + (
					reverseStrings
						? (stringCount - 1 - 3.5) * stringSpace
						: 3.5 * stringSpace
				);

				ctx.beginPath();
				ctx.arc(
					x,
					y1,
					radius,
					0,
					Math.PI * 2
				);
				ctx.fill();

				ctx.beginPath();
				ctx.arc(
					x,
					y2,
					radius,
					0,
					Math.PI * 2
				);
				ctx.fill();

			} else {

				const x1 = left + (
					reverseStrings
						? 1.5 * stringSpace
						: (stringCount - 1 - 1.5) * stringSpace
				);

				const x2 = left + (
					reverseStrings
						? 3.5 * stringSpace
						: (stringCount - 1 - 3.5) * stringSpace
				);

				ctx.beginPath();
				ctx.arc(
					x1,
					y,
					radius,
					0,
					Math.PI * 2
				);
				ctx.fill();

				ctx.beginPath();
				ctx.arc(
					x2,
					y,
					radius,
					0,
					Math.PI * 2
				);
				ctx.fill();

			}

		} else {

			ctx.beginPath();
			ctx.arc(
				x,
				y,
				radius,
				0,
				Math.PI * 2
			);
			ctx.fill();

		}

	});

}

function drawFretNumbers() {

	ctx.save();

	ctx.fillStyle = "#000";
	ctx.font = "12px Segoe UI";
	ctx.textBaseline = "middle";

	let numIni = 1;

	if (!displayMode) {

		numIni =
			numberFrets.value == null ||
			numberFrets.value === ""
				? 1
				: parseInt(numberFrets.value);

	}

	const horizontal =
		rotation === 90 || rotation === 270;

	if (horizontal) {

		ctx.textAlign = "center";

		const y =
			rotation === 90
				? boardbottom + 18
				: boardtop - 18;

		for (let fret = 1; fret <= fretCount; fret++) {

			const p = getCellCenter(0, fret);

			ctx.fillText(
				numIni,
				p.x,
				y
			);

			numIni++;

		}

	} else {

		ctx.textAlign =
			rotation === 0
				? "right"
				: "left";

		const x =
			rotation === 0
				? boardleft - 12
				: boardright + 12;

		for (let fret = 1; fret <= fretCount; fret++) {

			const p = getCellCenter(0, fret);

			ctx.fillText(
				numIni,
				x,
				p.y
			);

			numIni++;

		}

	}

	ctx.restore();

}

function getFretFromPosition(position) {

	for (let fret = 1; fret <= fretCount; fret++) {

		const start = getFretPosition(fret - 1);
		const end = getFretPosition(fret);

		if (
			position >= Math.min(start, end) &&
			position <= Math.max(start, end)
		) {
			return fret;
		}

	}

	return null;

}

function getFretCenter(fret) {

	const start = getFretPosition(fret - 1);
	const end = getFretPosition(fret);

	return (start + end) / 2;

}

function getCellCenter(string, fret) {

	const fretCenter = getFretCenter(fret);

	switch (rotation) {

		//------------------------------------------------
		// Vertical (cejuela arriba)
		//------------------------------------------------

		case 0:

			return {

				x: boardleft + (stringCount - 1 - string) * stringSpace,

				y: boardtop + fretCenter

			};

		//------------------------------------------------
		// Horizontal (cejuela izquierda)
		//------------------------------------------------

		case 90:

			return {

				x: boardleft + fretCenter,

				y: boardtop + string * stringSpace

			};

		//------------------------------------------------
		// Vertical (cejuela abajo)
		//------------------------------------------------

		case 180:

			return {

				x: boardleft + string * stringSpace,

				y: boardtop + fretCenter

			};

		//------------------------------------------------
		// Horizontal (cejuela derecha)
		//------------------------------------------------

		case 270:

			return {

				x: boardleft + fretCenter,

				y: boardtop + (stringCount - 1 - string) * stringSpace

			};

	}

}

// ============================================================
// INTERACCIÓN CON RATÓN
// ============================================================

function getCellFromMouse(x, y) {

	const minX = boardleft;
	const maxX = boardright;

	const minY = boardtop - stringSpace / 2;
	const maxY = boardbottom + stringSpace / 2;

	if (
		x < minX ||
		x > maxX ||
		y < minY ||
		y > maxY
	) {
		return null;
	}

	let string;
	let fret;

	switch (rotation) {

		//------------------------------------------------
		// Vertical (cejuela arriba)
		//------------------------------------------------

		case 0:

			string = Math.round(
				(x - boardleft) / stringSpace
			);

			string = stringCount - 1 - string;

			fret = getFretFromPosition(
				y - boardtop
			);

			break;

		//------------------------------------------------
		// Horizontal (cejuela izquierda)
		//------------------------------------------------

		case 90:

			string = Math.round(
				(y - boardtop) / stringSpace
			);

			fret = getFretFromPosition(
				x - boardleft
			);

			break;

		//------------------------------------------------
		// Vertical (cejuela abajo)
		//------------------------------------------------

		case 180:

			string = Math.round(
				(x - boardleft) / stringSpace
			);

			fret = getFretFromPosition(
				y - boardtop
			);

			break;

		//------------------------------------------------
		// Horizontal (cejuela derecha)
		//------------------------------------------------

		case 270:

			string = Math.round(
				(y - boardtop) / stringSpace
			);

			string = stringCount - 1 - string;

			fret = getFretFromPosition(
				x - boardleft
			);

			break;

	}

	if (fret === null) {
		return null;
	}

	string = Math.max(
		0,
		Math.min(stringCount - 1, string)
	);

	return {
		string,
		fret
	};

}

function getNutStringFromMouse(x, y) {

	switch (rotation) {

		//------------------------------------------------
		// Vertical (cejuela arriba)
		//------------------------------------------------

		case 0: {

			if (y > boardtop + 8)
				return null;

			let string = Math.round(
				(x - boardleft) / stringSpace
			);

			string = stringCount - 1 - string;

			if (string < 0 || string >= stringCount)
				return null;

			return string;

		}

		//------------------------------------------------
		// Horizontal (cejuela izquierda)
		//------------------------------------------------

		case 90: {

			if (x > boardleft + 8)
				return null;

			let string = Math.round(
				(y - boardtop) / stringSpace
			);

			if (string < 0 || string >= stringCount)
				return null;

			return string;

		}

		//------------------------------------------------
		// Vertical (cejuela abajo)
		//------------------------------------------------

		case 180: {

			if (y < boardbottom - 8)
				return null;

			let string = Math.round(
				(x - boardleft) / stringSpace
			);

			if (string < 0 || string >= stringCount)
				return null;

			return string;

		}

		//------------------------------------------------
		// Horizontal (cejuela derecha)
		//------------------------------------------------

		case 270: {

			if (x < boardright - 8)
				return null;

			let string = Math.round(
				(y - boardtop) / stringSpace
			);

			string = stringCount - 1 - string;

			if (string < 0 || string >= stringCount)
				return null;

			return string;

		}

	}

	return null;

}

function drawNutNotes() {

	const gap = 5;

	for (let s = 0; s < stringCount; s++) {

		const note = nutNotes[s];

		if (!note)
			continue;

		let x;
		let y;

		switch (rotation) {

			//------------------------------------------------
			// Vertical (cejuela arriba)
			//------------------------------------------------

			case 0:

				x = boardleft + (stringCount - 1 - s) * stringSpace;
				y = boardtop + gap / 2;

				break;

			//------------------------------------------------
			// Horizontal (cejuela izquierda)
			//------------------------------------------------

			case 90:

				x = boardleft + gap / 2;
				y = boardtop + s * stringSpace;

				break;

			//------------------------------------------------
			// Vertical (cejuela abajo)
			//------------------------------------------------

			case 180:

				x = boardleft + s * stringSpace;
				y = boardbottom - gap / 2;

				break;

			//------------------------------------------------
			// Horizontal (cejuela derecha)
			//------------------------------------------------

			case 270:

				x = boardright - gap / 2;
				y = boardtop + (stringCount - 1 - s) * stringSpace;

				break;

		}

		drawMarker(
			x,
			y,
			note
		);

	}

}

function getDynamicNeckLength() {

	const calculatedLength = fretCount * PIXELS_PER_FRET;

	return Math.max(
		MIN_NECK_LENGTH,
		Math.min(MAX_NECK_LENGTH, calculatedLength)
	);

}


// ============================================================
// UTILIDADES DE COLOR
// ============================================================

function getStringColor() {

	if (fretboardStyle === "blank") {
		return "rgba(70, 70, 70, 0.85)";
	}

	return "rgba(205, 127, 50, 0.95)";	
}

function getInlayColor() {

	if (fretboardStyle === "rosewood") {
		return "rgba(245, 245, 245, 0.75)";
	}

	return "rgba(0, 0, 0, 0.40)";
}

function getNutColor() {

	if (fretboardStyle === "rosewood") {
		return "rgba(218, 160, 95, 0.98)";
	}

	return "rgba(0, 0, 0, 0.85)";
}

function drawRealisticString(x1, y1, x2, y2, lineWidth) {

	const isBlank = fretboardStyle === "blank";

	const shadowColor = !isBlank
		? "rgba(20,10,5,0.45)"
		: "rgba(0,0,0,0.35)";

	const bodyColor = !isBlank
		? "rgba(190,105,42,1)"
		: "rgba(70,70,70,0.85)";

	const highlightColor = !isBlank
		? "rgba(255,205,135,0.80)"
		: "rgba(255,255,255,0.45)";

	const vertical = (x1 === x2);

	//------------------------------------------------
	// Sombra paralela
	//------------------------------------------------

	ctx.save();

	ctx.shadowColor = shadowColor;
	ctx.shadowBlur = Math.max(2, lineWidth * 0.9);

	if (vertical) {

		ctx.shadowOffsetX = 1.4;
		ctx.shadowOffsetY = 0.8;

	} else {

		ctx.shadowOffsetX = 0.8;
		ctx.shadowOffsetY = 1.4;

	}

	ctx.beginPath();
	ctx.strokeStyle = bodyColor;
	ctx.lineWidth = lineWidth;
	ctx.lineCap = "round";

	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);

	ctx.stroke();

	ctx.restore();

	//------------------------------------------------
	// Cuerpo de la cuerda
	//------------------------------------------------

	ctx.beginPath();
	ctx.strokeStyle = bodyColor;
	ctx.lineWidth = lineWidth;
	ctx.lineCap = "round";

	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);

	ctx.stroke();

	//------------------------------------------------
	// Reflejo superior
	//------------------------------------------------

	ctx.beginPath();
	ctx.strokeStyle = highlightColor;
	ctx.lineWidth = Math.max(0.45, lineWidth * 0.22);
	ctx.lineCap = "round";

	if (vertical) {

		ctx.moveTo(
			x1 - lineWidth * 0.18,
			y1
		);

		ctx.lineTo(
			x2 - lineWidth * 0.18,
			y2
		);

	} else {

		ctx.moveTo(
			x1,
			y1 - lineWidth * 0.18
		);

		ctx.lineTo(
			x2,
			y2 - lineWidth * 0.18
		);

	}

	ctx.stroke();

}


// ============================================================
// CEJILLAS
// ============================================================

function drawBarre(barre) {

	const fretStart = getFretPosition(barre.fret - 1);
	const fretEnd = getFretPosition(barre.fret);
	const fretCenter = (fretStart + fretEnd) / 2;

	const firstString = 0;
	const lastString = barre.startString;

	const markerRadius = Math.min(stringSpace * 0.34, 14);

	const barThickness = markerRadius * 2;

	const border = Math.max(
		0.6,
		markerRadius * 0.05
	);

	const fillColor = String(barre.color).toLowerCase();

	const textColor =
		fillColor === "#ffffff" ||
		fillColor === "white"
			? "#000"
			: "#fff";

	ctx.save();

	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	ctx.shadowColor = "rgba(0,0,0,0.28)";
	ctx.shadowBlur = 2;
	ctx.shadowOffsetX = 1;
	ctx.shadowOffsetY = 1;

	let x1;
	let y1;
	let x2;
	let y2;

	switch (rotation) {

		//------------------------------------------------
		// Vertical (cejuela arriba)
		//------------------------------------------------

		case 0:

			y1 = boardtop + fretCenter;
			y2 = y1;

			x1 = boardright;
			x2 = boardright - lastString * stringSpace;

			break;

		//------------------------------------------------
		// Horizontal (cejuela izquierda)
		//------------------------------------------------

		case 90:

			x1 = boardleft + fretCenter;
			x2 = x1;

			y1 = boardtop;
			y2 = boardtop + lastString * stringSpace;

			break;

		//------------------------------------------------
		// Vertical (cejuela abajo)
		//------------------------------------------------

		case 180:

			y1 = boardbottom - fretCenter;
			y2 = y1;

			x1 = boardleft;
			x2 = boardleft + lastString * stringSpace;

			break;

		//------------------------------------------------
		// Horizontal (cejuela derecha)
		//------------------------------------------------

		case 270:

			x1 = boardright - fretCenter;
			x2 = x1;

			y1 = boardbottom;
			y2 = boardbottom - lastString * stringSpace;

			break;

	}

	//------------------------------------------------
	// Barra
	//------------------------------------------------

	ctx.beginPath();
	ctx.strokeStyle = "#000";
	ctx.lineWidth = barThickness + border * 2;
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();

	ctx.beginPath();
	ctx.strokeStyle = barre.color;
	ctx.lineWidth = barThickness;
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();

	//------------------------------------------------
	// Texto
	//------------------------------------------------

	if (barre.text && barre.text.trim() !== "") {

		const textX = (x1 + x2) / 2;
		const textY = (y1 + y2) / 2;

		ctx.shadowColor = "transparent";
		ctx.fillStyle = textColor;
		ctx.font = `bold ${markerRadius * 1.45}px Segoe UI`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		ctx.fillText(
			barre.text,
			textX,
			textY + markerRadius * 0.03
		);

	}

	ctx.restore();

}

function drawBarres() {

	for (const barre of barreNotes) {

		drawBarre(barre);

	}

}

function drawRealisticNut() {

	const nutThickness = Math.max(6, stringSpace * 0.34);
	const nutRadius = Math.min(3, nutThickness / 2);

	ctx.save();

	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	const nutFill = "#e8dfc9";
	const nutShadow = "rgba(40,28,18,0.45)";
	const nutHighlight = "rgba(255,255,255,0.72)";
	const slotColor = "rgba(78,58,38,0.62)";

	ctx.shadowColor = nutShadow;
	ctx.shadowBlur = 3;

	switch (rotation) {

		case 0:
		case 90:
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 1;
			break;

		case 180:
		case 270:
			ctx.shadowOffsetX = -1;
			ctx.shadowOffsetY = -1;
			break;

	}

	switch (rotation) {

		//------------------------------------------------
		// Vertical (cejuela arriba)
		//------------------------------------------------

		case 0: {

			const x = boardleft - nutRadius;
			const y = boardtop - nutThickness / 2;
			const width = boardWidth + nutRadius * 2;
			const height = nutThickness;

			ctx.beginPath();
			ctx.roundRect(x, y, width, height, nutRadius);
			ctx.fillStyle = nutFill;
			ctx.fill();

			ctx.shadowColor = "transparent";

			// Brillo superior
			ctx.beginPath();
			ctx.moveTo(x + nutRadius, y + nutThickness * 0.28);
			ctx.lineTo(x + width - nutRadius, y + nutThickness * 0.28);
			ctx.strokeStyle = nutHighlight;
			ctx.lineWidth = Math.max(0.7, nutThickness * 0.13);
			ctx.stroke();

			// Ranuras
			for (let s = 0; s < stringCount; s++) {

				const stringX = boardright - s * stringSpace;

				ctx.beginPath();
				ctx.moveTo(stringX, y + nutThickness * 0.18);
				ctx.lineTo(stringX, y + nutThickness * 0.82);

				ctx.strokeStyle = slotColor;
				ctx.lineWidth = Math.max(0.7, 1 + s * 0.14);
				ctx.stroke();

			}

			break;
		}

		//------------------------------------------------
		// Horizontal (cejuela izquierda)
		//------------------------------------------------

		case 90: {

			const x = boardleft - nutThickness / 2;
			const y = boardtop - nutRadius;
			const width = nutThickness;
			const height = boardHeight + nutRadius * 2;

			ctx.beginPath();
			ctx.roundRect(x, y, width, height, nutRadius);
			ctx.fillStyle = nutFill;
			ctx.fill();

			ctx.shadowColor = "transparent";

			ctx.beginPath();
			ctx.moveTo(x + nutThickness * 0.28, y + nutRadius);
			ctx.lineTo(x + nutThickness * 0.28, y + height - nutRadius);
			ctx.strokeStyle = nutHighlight;
			ctx.lineWidth = Math.max(0.7, nutThickness * 0.13);
			ctx.stroke();

			for (let s = 0; s < stringCount; s++) {

				const stringY = boardtop + s * stringSpace;

				ctx.beginPath();
				ctx.moveTo(x + nutThickness * 0.18, stringY);
				ctx.lineTo(x + nutThickness * 0.82, stringY);

				ctx.strokeStyle = slotColor;
				ctx.lineWidth = Math.max(0.7, 1 + s * 0.14);
				ctx.stroke();

			}

			break;
		}

		//------------------------------------------------
		// Vertical (cejuela abajo)
		//------------------------------------------------

		case 180: {

			const x = boardleft - nutRadius;
			const y = boardbottom - nutThickness / 2;
			const width = boardWidth + nutRadius * 2;
			const height = nutThickness;

			ctx.beginPath();
			ctx.roundRect(x, y, width, height, nutRadius);
			ctx.fillStyle = nutFill;
			ctx.fill();

			ctx.shadowColor = "transparent";

			// Brillo inferior
			ctx.beginPath();
			ctx.moveTo(x + nutRadius, y + nutThickness * 0.72);
			ctx.lineTo(x + width - nutRadius, y + nutThickness * 0.72);
			ctx.strokeStyle = nutHighlight;
			ctx.lineWidth = Math.max(0.7, nutThickness * 0.13);
			ctx.stroke();

			for (let s = 0; s < stringCount; s++) {

				const stringX = boardleft + s * stringSpace;

				ctx.beginPath();
				ctx.moveTo(stringX, y + nutThickness * 0.18);
				ctx.lineTo(stringX, y + nutThickness * 0.82);

				ctx.strokeStyle = slotColor;
				ctx.lineWidth = Math.max(0.7, 1 + s * 0.14);
				ctx.stroke();

			}

			break;
		}

		//------------------------------------------------
		// Horizontal (cejuela derecha)
		//------------------------------------------------

		case 270: {

			const x = boardright - nutThickness / 2;
			const y = boardtop - nutRadius;
			const width = nutThickness;
			const height = boardHeight + nutRadius * 2;

			ctx.beginPath();
			ctx.roundRect(x, y, width, height, nutRadius);
			ctx.fillStyle = nutFill;
			ctx.fill();

			ctx.shadowColor = "transparent";

			// Brillo derecho
			ctx.beginPath();
			ctx.moveTo(x + nutThickness * 0.72, y + nutRadius);
			ctx.lineTo(x + nutThickness * 0.72, y + height - nutRadius);
			ctx.strokeStyle = nutHighlight;
			ctx.lineWidth = Math.max(0.7, nutThickness * 0.13);
			ctx.stroke();

			for (let s = 0; s < stringCount; s++) {

				const stringY = boardbottom - s * stringSpace;

				ctx.beginPath();
				ctx.moveTo(x + nutThickness * 0.18, stringY);
				ctx.lineTo(x + nutThickness * 0.82, stringY);

				ctx.strokeStyle = slotColor;
				ctx.lineWidth = Math.max(0.7, 1 + s * 0.14);
				ctx.stroke();

			}

			break;
		}

	}

	ctx.restore();

}

//==================================================
// DRAW NOTES
//==================================================

function drawMarker(x, y, note) {

	if (!note || !note.color) return;

	const radius = stringSpace * 0.39;
	const border = Math.max(0.6, radius * 0.05);
	const fontSize = radius * 1.15;

	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);

	ctx.fillStyle = note.color;
	ctx.fill();

	ctx.strokeStyle = "#000";
	ctx.lineWidth = border;
	ctx.stroke();

	const fillColor = String(note.color).toLowerCase();
	const textColor = fillColor === "#ffffff" || fillColor === "white" ? "#000" : "#fff";

	ctx.fillStyle = textColor;
	ctx.font = `bold ${fontSize}px Segoe UI`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(note.text, x, y + fontSize * 0.03);
}

function drawHoverMarker() {

	if (!hoverCell) return;

	const hasNote = notes.some(note => note.string === hoverCell.string && note.fret === hoverCell.fret);

	if (hasNote) return;

	const p = getCellCenter(hoverCell.string, hoverCell.fret);
	const radius = stringSpace * 0.39;
	const border = Math.max(0.6, radius * 0.05);

	ctx.save();
	ctx.globalAlpha = 0.35;

	ctx.beginPath();
	ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

	ctx.fillStyle = colorPicker.value;
	ctx.fill();

	ctx.strokeStyle = "#000";
	ctx.lineWidth = border;
	ctx.stroke();

	ctx.restore();
}

function drawNutHover() {

	// Si no estamos sobre el NUT
	if (hoverNut === null) {
		return;
	}

	// Si estamos sobre un traste,
	// no dibujamos el hover del NUT.
	if (hoverCell !== null) {
		return;
	}

	// Si ya existe una nota en el NUT,
	// tampoco dibujamos el hover.
	if (nutNotes[hoverNut]) {
		return;
	}

	const gap = 5;

	let x;
	let y;

	switch (rotation) {

		//------------------------------------------------
		// Vertical (cejuela arriba)
		//------------------------------------------------

		case 0:

			x = boardright - hoverNut * stringSpace;
			y = boardtop + gap / 2;

			break;

		//------------------------------------------------
		// Horizontal (cejuela izquierda)
		//------------------------------------------------

		case 90:

			x = boardleft + gap / 2;
			y = boardtop + hoverNut * stringSpace;

			break;

		//------------------------------------------------
		// Vertical (cejuela abajo)
		//------------------------------------------------

		case 180:

			x = boardleft + hoverNut * stringSpace;
			y = boardbottom - gap / 2;

			break;

		//------------------------------------------------
		// Horizontal (cejuela derecha)
		//------------------------------------------------

		case 270:

			x = boardright - gap / 2;
			y = boardbottom - hoverNut * stringSpace;

			break;

	}

	const radius = stringSpace * 0.39;
	const border = Math.max(0.6, radius * 0.05);

	ctx.save();

	ctx.globalAlpha = 0.35;

	ctx.beginPath();
	ctx.arc(
		x,
		y,
		radius,
		0,
		Math.PI * 2
	);

	ctx.fillStyle = colorPicker.value;
	ctx.fill();

	ctx.strokeStyle = "#000";
	ctx.lineWidth = border;
	ctx.stroke();

	ctx.restore();

}

function drawNotes() {

	// Notas normales
	notes.forEach(note => {

		const p = getCellCenter(note.string, note.fret);

		drawMarker(p.x, p.y, note);

	});

	// Elementos superpuestos
	drawBarres();
	drawNutNotes();
	drawNutHover();
	drawHoverMarker();

}

function addNote(cell) {

	eraseNote(cell);

	notes.push({
		string: cell.string,
		fret: cell.fret,
		color: colorPicker.value,
		text: noteText.value.trim().substring(0, 3)
	});

	drawFretboard();
	drawNotes();

}

function eraseNote(cell) {

	notes = notes.filter(note => {

		return !(
			note.string === cell.string &&
			note.fret === cell.fret
		);

	});

}

function addOrReplaceBarre(string, fret, color, text = "") {

	// Elimina cualquier cejilla existente en ese traste
	barreNotes = barreNotes.filter(barre => {
		return barre.fret !== fret;
	});

	// Elimina notas normales que quedarían cubiertas por la cejilla
	notes = notes.filter(note => {

		if (note.fret !== fret) {
			return true;
		}

		// La cejilla ocupa desde la cuerda 0 hasta la cuerda pulsada
		return note.string > string;

	});

	barreNotes.push({
		fret: fret,
		startString: string,
		color: color,
		text: text
	});

}

function removeBarreAtCell(string, fret) {

	barreNotes = barreNotes.filter(barre => {

		if (barre.fret !== fret) {
			return true;
		}

		// La cejilla ocupa desde la cuerda 0 hasta startString.
		// Se borra si se pulsa cualquier cuerda ocupada por ella.
		return string > barre.startString;

	});

}

function updateHoverCell(e) {

	if (window.innerWidth <= minScreenWidth || (mode !== "note" && mode !== "barre")) {

		if (hoverCell !== null) {

			hoverCell = null;

			drawFretboard();
			drawNotes();

		}

		return;

	}

	const cell = getCellFromMouse(
		e.offsetX,
		e.offsetY
	);

	const sameCell =
		hoverCell &&
		cell &&
		hoverCell.string === cell.string &&
		hoverCell.fret === cell.fret;

	if (sameCell) {
		return;
	}

	// Si sales del área válida del diapasón, elimina el círculo.
	if (!cell && hoverCell === null) {
		return;
	}

	hoverCell = cell;

	drawFretboard();
	drawNotes();

}

function updateHoverNut(e) {

	if (
		window.innerWidth <= minScreenWidth ||
		(mode !== "note" && mode !== "barre")
	) {

		if (hoverNut !== null) {

			hoverNut = null;

			drawFretboard();
			drawNotes();

		}

		return;

	}

	const nut = getNutStringFromMouse(
		e.offsetX,
		e.offsetY
	);

	if (nut === hoverNut) {
		return;
	}

	hoverNut = nut;

	drawFretboard();
	drawNotes();

}