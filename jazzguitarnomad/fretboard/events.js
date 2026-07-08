"use strict";

//==================================================
// EVENTOS
//==================================================


window.addEventListener("resize", () => {

	const isMobile = window.innerWidth <= minScreenWidth;

	if (isMobile) {

		cursor.style.display = "none";

	} else {

		cursor.style.display = "";

		if (wasMobile) {

			openLeftPanel();
			openTopControls();

		}

	}

	wasMobile = isMobile;

	updateLayout();

	resizeCanvas();

});

document.addEventListener("keydown",(e)=>{

	if (playMode == "play"){
		if (!btnPlayStop.matches(':focus') && e.keyCode == 32) PlayStopSound("stop");
		return;
	}

	const isUndoShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";

	if (!isUndoShortcut) return;

	e.preventDefault();
	undo();
});

btnUndo.addEventListener("click", () => {

	if (playMode == "play") return;

	undo();
});

document.addEventListener("click",(e)=>{

	if(
		!menuPopup.contains(e.target) &&
		!btnMenuSelector.contains(e.target)
	){

		menuPopup.classList.remove("isOpen");

	}

});

colorPicker.addEventListener("change", updateColorPreview);


titleText.addEventListener("input", () => {

    projectTitleText.textContent = titleText.value.trim() || "Sin título";

    resizeCanvas();


});


btnNewCategory.addEventListener("click", () => {
	addCategory();
});

btnDelCategory.addEventListener("click", () => {
	deleteCategory();
});

btnTime4.addEventListener("click", () => {
	setTimeSignature("binary");
});

btnTime3.addEventListener("click", () => {
	setTimeSignature("ternary");
});

btnAsc.addEventListener("click", () => {
	setPlayerForm("up");
});

btnDesc.addEventListener("click", () => {
	setPlayerForm("down");
});

btnBothAsc.addEventListener("click", () => {
	setPlayerForm("up-down");
});

btnBothDesc.addEventListener("click", () => {
	setPlayerForm("down-up");
});

btnMetronome.addEventListener("click", () => {

	metronome = !metronome;

	if (metronome){
		btnMetronome.classList.add("active");
	}else{
		btnMetronome.classList.remove("active");
	}
});

btnLoop.addEventListener("click", () => {

	if (playMode == "play") return;

	playerLoop = !playerLoop;

	if (playerLoop){
		btnLoop.classList.add("active");
	}else{
		btnLoop.classList.remove("active");
	}
});

btnPlayStop.addEventListener("click", () => {

	let mode = (playMode === "play") ? "stop" : "play";

	PlayStopSound(mode);

});

btnProyectos.addEventListener("click", () => {
	setMenu("projects");
});

btnEdicion.addEventListener("click", () => {
	setMenu("edit");
});

btnVista.addEventListener("click", () => {
	setMenu("view");
});

btnPlayer.addEventListener("click", () => {
	setMenu("player");
});

btnMenuSelector.addEventListener("click",()=>{

	menuPopup.classList.toggle("isOpen");

});

menuPopup.querySelectorAll("button").forEach(button=>{

	button.addEventListener("click",()=>{

		setMenu(button.dataset.menu);

		menuPopup.classList.remove("isOpen");

	});

});

btnMaple.addEventListener("click", () => {
	setFretboardStyle("maple");
});

btnRosewood.addEventListener("click", () => {
	setFretboardStyle("rosewood");
});

btnBlank.addEventListener("click", () => {
	setFretboardStyle("blank");
});

btnOpenLibrary.addEventListener("click", () => {

	setPlayButtonMode("stop");

	chooseProjectsFile();
});

btnShowProjectPanel.addEventListener("click", () => {

	if (appLayout.classList.contains("leftPanelHidden")) {

		if (window.innerWidth <= minScreenWidth) {

			closeTopControls();

		}

		openLeftPanel();

		return;

	}

	closeLeftPanel();

});

btnToggleTopControls.addEventListener("click", () => {

	const isOpen = topControlsContainer.classList.contains("isOpen");

	if (isOpen) {

		closeTopControls();

	} else {

		// En móvil, abrir Controles cierra la Biblioteca
		if (window.innerWidth <= minScreenWidth) {

			closeLeftPanel();

		}

		openTopControls();

	}

});

showTitle.addEventListener("change", () => {

	resizeCanvas();

});

showNumber.addEventListener("change", () => {

	showFretNumbers = !showFretNumbers;
	resizeCanvas();

});

btnCopy.addEventListener("click", () => {

	if (navigator.clipboard && window.ClipboardItem) {
		copyCanvasToClipboard();
	} else {
		downloadCanvas();
	}

});

btnShare.addEventListener("click", () => {
	
	if(currentProjectId !== null) {

		const shareUrl = `${location.origin}${location.pathname}?project=${currentProjectId}`;

		clipboardWriteText(shareUrl);

	}

});

btnCopyId.addEventListener("click", () => {
	
	if(currentProjectId !== null) {

		clipboardWriteText(currentProjectId);

	}

});

btnNew.addEventListener("click", () => {
	newProject();
});

btnSave.addEventListener("click", () => {
	saveCurrentProject();
});

btnDel.addEventListener("click", () => {
	deleteProject(currentProjectId);
});


btnEdit.addEventListener("click", () => {

	setMode("note");

});

btnErase.addEventListener("click", () => {

	setMode("erase");

});

btnNutMode.addEventListener("click", () => {

	if (mode === "barre") {

		setMode("note");

	} else {

		setMode("barre");

	}

});

btnVertical.addEventListener("click", () => {
    setOrientation("vertical");
});

btnHorizontal.addEventListener("click", () => {
    setOrientation("horizontal");
});

btnRotate.addEventListener("click", () => {
    rotateFretboard();
    updateOrientationButtons();
});

btnDisplay.addEventListener("click", () => {

    displayMode = !displayMode;

    btnDisplay.classList.toggle("active", displayMode);

    drawFretboard();
    drawNotes();

});

numFrets.addEventListener("change", () => {

	fretCount = parseInt(numFrets.value);

	// Limitar también si el usuario escribe un valor manualmente
	fretCount = Math.max(5, Math.min(24, fretCount));

	numFrets.value = fretCount;

	resizeCanvas();

});

btnMoreFrets.addEventListener("click", () => {

	if (fretCount >= 24) {
		return;
	}

	fretCount++;

	numFrets.value = fretCount;

	resizeCanvas();

});

btnLessFrets.addEventListener("click", () => {

	if (fretCount <= 5) {
		return;
	}

	fretCount--;

	numFrets.value = fretCount;

	resizeCanvas();

});

btnLessNumberFrets.addEventListener("click", () => {

	let nFrets = numberFrets.value == null || numberFrets.value === "" ? 1 : parseInt(numberFrets.value);

	if (nFrets <= 1) {return;}

	numberFrets.value = nFrets - 1;

	resizeCanvas();

});

btnMoreNumberFrets.addEventListener("click", () => {

	let nFrets = numberFrets.value == null || numberFrets.value === "" ? 1 : parseInt(numberFrets.value);

	if (nFrets >= 19) {return;}

	numberFrets.value = nFrets + 1;

	resizeCanvas();

});

numTempo.addEventListener("change", () => {

	let tempoCount = parseInt(numTempo.value);

	// Limitar también si el usuario escribe un valor manualmente
	tempoCount = Math.max(30, Math.min(300, tempoCount));

	numTempo.value = tempoCount;

});

btnLessTempo.addEventListener("click", () => {

	let nTempo = numTempo.value == null || numTempo.value === "" ? 1 : parseInt(numTempo.value);

	if (nTempo <= 1) {return;}

	numTempo.value = nTempo - 1;

});

btnMoreTempo.addEventListener("click", () => {

	let nTempo = numTempo.value == null || numTempo.value === "" ? 1 : parseInt(numTempo.value);

	if (nTempo <= 1) {return;}

	numTempo.value = nTempo + 1;

});


canvas.addEventListener("mouseenter", () => {

	if (playMode == "play") return;

	if (window.innerWidth <= minScreenWidth) {
		cursor.style.display = "none";
		return;
	}

	cursor.style.display = "block";

});

canvas.addEventListener("mouseleave", () => {

	if (playMode == "play") return;

	cursor.style.display = "none";

	if (hoverCell === null && hoverNut === null) {
		return;
	}

	hoverCell = null;
	hoverNut = null;

	drawFretboard();
	drawNotes();

});

canvas.addEventListener("mousemove", (e) => {

	if (playMode == "play") return;

	if (window.innerWidth <= minScreenWidth) {

		cursor.style.display = "none";

		if (hoverCell !== null || hoverNut !== null) {

			hoverCell = null;
			hoverNut = null;

			drawFretboard();
			drawNotes();

		}

		return;

	}

	cursor.style.left = e.pageX + "px";
	cursor.style.top = e.pageY + "px";

	updateHoverNut(e);
	updateHoverCell(e);

});

canvas.addEventListener("click", (e) => {

	if (playMode == "play") return;

	projectModified = true;

	const isMobile = window.innerWidth <= minScreenWidth;

	const nutString = getNutStringFromMouse(
		e.offsetX,
		e.offsetY
	);

	// Zona de la cejuela física
	if (nutString !== null) {

		if (mode === "note") {

			saveHistory();

			nutNotes[nutString] = {
				color: colorPicker.value,
				text: noteText.value.trim()
			};

		} else if (mode === "erase") {

			if (nutNotes[nutString]) {

				saveHistory();

				nutNotes[nutString] = null;

			}

		}

		drawFretboard();
		drawNotes();

		noteText.value = "";

		return;

	}

	// Zona de los trastes
	const cell = getCellFromMouse(
		e.offsetX,
		e.offsetY
	);

	if (!cell) {
		return;
	}

	// Modo Cejilla
	if (mode === "barre") {

		saveHistory();

		addOrReplaceBarre(
			cell.string,
			cell.fret,
			colorPicker.value,
			noteText.value.trim().substring(0, 3)
		);

		drawFretboard();
		drawNotes();

		if (!isMobile) noteText.focus();
		noteText.value = "";

		return;

	}

	if (mode === "note") {

		saveHistory();

		addNote(cell);

	} else if (mode === "erase") {

		const noteExists = notes.some(note =>
			note.string === cell.string &&
			note.fret === cell.fret
		);

		const barreExists = barreNotes.some(barre =>
			barre.fret === cell.fret &&
			cell.string <= barre.startString
		);

		if (noteExists || barreExists) {

			saveHistory();

			if (noteExists) {
				eraseNote(cell);
			}

			if (barreExists) {
				removeBarreAtCell(
					cell.string,
					cell.fret
				);
			}

		}

	}

	// Redibujar una vez, después de editar o borrar
	drawFretboard();
	drawNotes();

	if (!isMobile) noteText.focus();
	noteText.value = "";

});

titleText.addEventListener("input", () => {

	title = titleText.value;

	resizeCanvas();
	drawNotes();

});





/*============================
FUNCIONES
==============================*/


function saveHistory() {

	const snapshot = {
		notes: structuredClone(notes),
		nutNotes: structuredClone(nutNotes),
		barreNotes: structuredClone(barreNotes)
	};

	history.push(snapshot);

	if (history.length > maxHistory) {
		history.shift();
	}

}

function undo() {

	if (history.length === 0) {
		return;
	}

	const lastState = history.pop();

	notes = lastState.notes;
	nutNotes = lastState.nutNotes;
	barreNotes = lastState.barreNotes ?? [];

	drawFretboard();
	drawNotes();

}

function updateLeftPanelVisibility() {

	// Ancho mínimo que necesita el canvas, incluyendo sus márgenes.
	const canvasNeededWidth = canvas.width;

	// Ancho disponible actualmente para el workspace.
	const workspaceWidth = workspace.clientWidth;

	// Margen de seguridad para que no quede pegado al borde.
	const safetySpace = 30;

	const mustHidePanel =
		canvasNeededWidth + safetySpace > workspaceWidth;

	const isHidden = appLayout.classList.contains(
		"leftPanelHidden"
	);

	if (mustHidePanel && !isHidden) {

		closeLeftPanel();

	}

}

function openLeftPanel(){

	appLayout.classList.remove("leftPanelHidden");

	btnShowProjectPanel.classList.add("active");

}

function closeLeftPanel(){

	appLayout.classList.add("leftPanelHidden");

	btnShowProjectPanel.classList.remove("active");

}

function openTopControls(){

	topControlsContainer.classList.add("isOpen");

	btnToggleTopControls.setAttribute(
		"aria-expanded",
		"true"
	);

	btnToggleTopControls.title = "Ocultar controles";

}

function closeTopControls() {

	topControlsContainer.classList.remove("isOpen");

	btnToggleTopControls.setAttribute(
		"aria-expanded",
		"false"
	);

	btnToggleTopControls.title = "Mostrar controles";

}

function updateColorPreview() {

    colorPreview.style.backgroundColor = colorPicker.value;

    cursor.style.color = colorPicker.value;

}

function setMode(newMode) {

	mode = newMode;

	btnEdit.classList.toggle(
		"active",
		newMode === "note"
	);

	btnErase.classList.toggle(
		"active",
		newMode === "erase"
	);

	btnNutMode.classList.toggle(
		"active",
		newMode === "barre"
	);

	btnNutMode.setAttribute(
		"aria-pressed",
		String(newMode === "barre")
	);

	switch (newMode) {

		case "note":

			cursor.innerHTML =
				'<i class="fa-solid fa-pencil"></i>';

			break;

		case "erase":

			cursor.innerHTML =
				'<i class="fa-solid fa-eraser"></i>';

			break;

		case "barre":

			cursor.innerHTML =
				'<i class="fa-solid fa-grip-lines"></i>';

			break;

	}

	cursor.style.color = colorPicker.value;

	hoverCell = null;

	drawFretboard();
	drawNotes();

}

function showControls(...controls){

	controls.forEach(control => control.classList.remove("isHidden"));

}

function setMenu(m){

	menuOpen = m;

	btnProyectos.classList.remove("active");
	btnEdicion.classList.remove("active");
	btnVista.classList.remove("active");
	btnPlayer.classList.remove("active");

	[
		topProject,
		topCategory,
		topLibrary,
		topShare,
		topTitle,
		topShare,
		topEdit,
		topUndo,
		topColor,
		topFrets,
		topFretboard,
		topNumbers,
		topOrientation,
		topMidi,
		topPlayStop,
		topMetronome,
		topTempo,
		topTimeSignature,
		topForm
	].forEach(control => control.classList.add("isHidden"));

	switch (menuOpen){

		case "projects":

			btnProyectos.classList.add("active");

			showControls(
				topProject,
				topCategory,
				topLibrary,
				topShare,
				topTitle
			);

			if (!isAdmin) {topCategory.classList.add("isHidden");}

			menuSelectorText.textContent = "PROYECTOS";
			menuSelectorIcon.className = "fa-solid fa-folder";

			break;

		case "edit":

			btnEdicion.classList.add("active");

			showControls(
				topEdit,
				topUndo,
				topColor
			);

			menuSelectorText.textContent = "EDITAR";
			menuSelectorIcon.className = "fa-solid fa-pen";

			break;

		case "view":

			btnVista.classList.add("active");

			showControls(
				topFretboard,
				topFrets,
				topNumbers,
				topOrientation
			);

			menuSelectorText.textContent = "VISTA";
			menuSelectorIcon.className = "fa-solid fa-eye";

			break;

		case "player":

			btnPlayer.classList.add("active");

			showControls(
				topMidi,
				topPlayStop,
				topMetronome,
				topTempo,
				topTimeSignature,
				topForm
			);

			menuSelectorText.textContent = "REPRODUCIR";
			menuSelectorIcon.className = "fa-solid fa-music";

			break;
	}

	// En móvil, cerrar el menú desplegable al seleccionar una opción
	menuPopup.classList.remove("isOpen");

	// Mostrar automáticamente los controles
	openTopControls();

}

function setFretboardStyle(style) {

	fretboardStyle = style;

	btnMaple.classList.remove("active");
	btnRosewood.classList.remove("active");
	btnBlank.classList.remove("active");

	switch (style) {

		case "maple":
			btnMaple.classList.add("active");
			break;

		case "rosewood":
			btnRosewood.classList.add("active");
			break;

		case "blank":
			btnBlank.classList.add("active");
			break;

	}

	useNeckImage = fretboardStyle !== "blank";

	if (!useNeckImage) {

		neckImageLoaded = false;

		drawFretboard();

		if (typeof drawNotes === "function") {
			drawNotes();
		}

		return;

	}

	neckImageLoaded = false;

	neckImage.src = fretboardImages[fretboardStyle];

}

function setOrientation(o){

    orientation = o;

    if (o === "vertical") {

        rotation = rotated ? 180 : 0;

    } else {

        rotation = rotated ? 270 : 90;

    }

    updateOrientationButtons();
    resizeCanvas();

}

function updateOrientationButtons(){

	btnVertical.classList.toggle(
	    "active",
	    rotation === 0 || rotation === 180
	);

	btnHorizontal.classList.toggle(
	    "active",
	    rotation === 90 || rotation === 270
	);

	btnRotate.classList.toggle(
	    "active",
	    rotation === 180 || rotation === 270
	);

}

function updateLayout() {

	const isMobile = window.innerWidth <= minScreenWidth;

	if (isMobile) {

		cursor.style.display = "none";

		closeLeftPanel();
		closeTopControls();

	} else {

		cursor.style.display = "";

		closeLeftPanel();
		openTopControls();

	}

	resizeCanvas();

}

function updateProjectTitle(){

    const title = titleText.value.trim();

    projectTitleLabel.textContent =
        title || "Sin título";

}


function setTimeSignature(mode){

	if (playMode == "play") return;

	timeSignature = mode;

	if (timeSignature == "binary"){
		btnTime4.classList.add("active");
		btnTime3.classList.remove("active");
	}else{
		btnTime4.classList.remove("active");
		btnTime3.classList.add("active");
	}

}

function PlayStopSound(mode){

	playMode = mode;
	setPlayButtonMode();

}

function setPlayButtonMode(){

	switch (playMode){

		case "play":
			btnPlayStop.title = "Parar";
			btnPlayStop.innerHTML = "<i class='fa-solid fa-stop'></i><span>Stop</span>";
			btnPlayStop.classList.add("active");
			break;

		default:
			btnPlayStop.title = "Reproducir";
			btnPlayStop.innerHTML = "<i class='fa-solid fa-play'></i><span>Play</span>";
			btnPlayStop.classList.remove("active");
			break;		
	}

}


function setPlayerForm(form){

	if (playMode == "play") return;

	playerForm = form;

	btnAsc.classList.remove("active");
	btnDesc.classList.remove("active");
	btnBothAsc.classList.remove("active");
	btnBothDesc.classList.remove("active");

	switch (playerForm){

		case "up":
			btnAsc.classList.add("active");
			break;

		case "down":
			btnDesc.classList.add("active");
			break;

		case "up-down":
			btnBothAsc.classList.add("active");
			break;

		case "down-up":
			btnBothDesc.classList.add("active");
			break;

	}

}

function setInitialOrientation() {

	if (window.innerWidth <= 768) {

		setOrientation("vertical");

	}else{

		setOrientation("horizontal");

	}

}





// ==================================================
// CONFIGURACION INICIAL
// ==================================================


updateColorPreview();
setMenu(menuOpen);
setInitialOrientation();
updateLayout();
loadDefaultProjects();

//Nuevo Id de proyecto
if (currentProjectId == null) {
	currentProjectId = generateProjectId();
	projectModified = true;
}
