"use strict";

//==================================================
// DOCUMENT EVENTS
//==================================================

window.addEventListener("load",initializeApp);

window.addEventListener("resize", () => {

	isMobile = window.innerWidth <= maxMediaScreenWidth;

	if (!isMobile) updateTopBarMenu();

	if (!isPlaying && isFretboardVisible) resizeCanvas();

	if (!isPlaying && isScoreVisible) scoreRender();

});

window.addEventListener("orientationchange", () => {

	const newRotated = screen.orientation.angle;

	if (newRotated !== screenRotated) {

		screenRotated = newRotated;

		requestAnimationFrame(() => {

			updateTopBarMenu();

		});

	}

});

document.addEventListener("keydown",(e)=>{

	if (editMode === "view") return;

	const isUndoShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";

	if (!isUndoShortcut) return;

	e.preventDefault();
	undo();

});

document.addEventListener("click",(e)=>{

	if(!menuPopup.contains(e.target) && !btnMenuSelector.contains(e.target)){

		menuPopup.classList.remove("isOpen");

	}

});

document.addEventListener("contextmenu", (e) => {

	if (!isAdmin) e.preventDefault();

});

/*
document.addEventListener("selectstart",(e) => {

	if (!isAdmin) return;

	if (e.target.matches("input, textarea")) return;

	e.preventDefault();

});

document.addEventListener("mousedown",(e) => {

	if (!isAdmin) return;

	if (e.target.matches("input, textarea")) return;

	if (e.detail > 1) {
		e.preventDefault();
	}

});
*/


////////////////////////////////////////////////////////////
//
// PLAYER DISPATCH EVENTS
//
////////////////////////////////////////////////////////////


function emitMetronomeBeat(beat,subBeat,mode="tick") {

    document.dispatchEvent(new CustomEvent("metronomeBeat",{
        detail:{beat,subBeat,mode}
    }));

}

document.addEventListener("metronomeBeat", (e) => {

	let { beat, subBeat, mode } = e.detail;

	switch (mode) {

		case "restart":
		case "stop":

			resetMetronomeTimeline();

			break;

		case "start":
		case "tick":

			updateTimeline(beat, subBeat);

			metronome_Info.innerHTML = "Metrónomo: <b>" + beat + " / " + subBeat + "</b>";

			break;

	}

});

function emitPlayerBeat(beat, subBeat, mode = "tick", repetition = 1) {

    document.dispatchEvent(new CustomEvent("playerBeat", {
        detail: {
            beat,
            subBeat,
            repetition,
            mode
        }
    }));

}

document.addEventListener("playerBeat", (e) => {

	let { beat, subBeat, mode, repetition } = e.detail;

	switch (mode) {

		case "sequence":
		case "chord":

			countBars = 1;
			repetitionSequence = 1;
			firstTick = true;

			break;

		case "tick":

			if (beat === 1 && subBeat === 1) {

				if (firstTick) {

					firstTick = false;

				} else {

					countBars++;

				}

			}

			if (isScoreVisible) scorePaint_scoreTick();

			break;

		case "repeat":

			repetitionSequence = repetition;
			countBars = 1;
			firstTick = true;

			if (isScoreVisible) scorePaint_stop();

			break;

		case "stop":

			if (isScoreVisible) scorePaint_stop();

			resetPlaybackTimeline();

			// Solo ocultar si realmente hemos parado. Durante el arranque/count-in isPlaying sigue siendo true.

			if (!isPlaying) workspaceTimeInfo.style.display = "none";

			break;

		case "end":

			if (isScoreVisible) scorePaint_stop();

			resetPlaybackTimeline();

			setControlsEnabled(true);

			isPlaying = false;

			setPlayStopButton(btnPlayStop, false);

			// La reproducción ha terminado realmente

			workspaceTimeInfo.style.display = "none";

			// Abrir y cerrar controles

			if (topControlsWasOpen) {
				openTopControls();
			}

			topControlsWasOpen = false;
		
			if (appMode !== "Guest" && !libraryWasOpen) openProjectsPanel();

			libraryWasOpen = false;

			break;

	}

	if (mode === "sequence" || mode === "chord" || mode === "tick" || mode === "repeat") {

		player_repeatInfo.innerHTML = "Repetición: <b>" + repetitionSequence + "&nbsp;</b>Compás: <b>" + countBars + "</b>";

	}

});




//==================================================
// EVENTOS DIBUJO CANVAS
//==================================================

canvas.addEventListener("mouseenter", () => {

	if (isMobile) {
		cursor.style.display = "none";
	}else{
		cursor.style.display = "block";
	}

});

canvas.addEventListener("mouseleave", () => {

	cursor.style.display = "none";

	if (editMode === "view" || (isMobile) || (hoverCell === null && hoverNut === null)) {
		return;
	}

	hoverCell = null;
	hoverNut = null;

	drawFretboard();
	drawNotes();

});

canvas.addEventListener("mousemove", (e) => {

	if (isMobile) {

		cursor.style.display = "none";

		if (hoverCell !== null || hoverNut !== null) {

			hoverCell = null;
			hoverNut = null;

			drawFretboard();
			drawNotes();

		}

		return;

	}

	if (editMode === "view") return;

	cursor.style.left = e.pageX + "px";
	cursor.style.top = e.pageY + "px";

	updateHoverNut(e);
	updateHoverCell(e);

});

canvas.addEventListener("click", (e) => {

	if (editMode === "view") return;

	projectModified = true;

	btnPlayStop.disabled = false;

	const nutString = getNutStringFromMouse(
		e.offsetX,
		e.offsetY
	);

	// Zona de la cejuela física
	if (nutString !== null) {

		if (editMode === "note") {

			saveHistory();

			nutNotes[nutString] = {
				color: colorPicker.value,
				text: noteText.value.trim()
			};

			if (!isMobile) noteText.focus();
			noteText.value = "";

		} else if (editMode === "erase") {

			if (nutNotes[nutString]) {

				saveHistory();

				nutNotes[nutString] = null;

			}

		}

		drawFretboard();
		drawNotes();

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
	switch (editMode) {

		case "barre":

			saveHistory();

			addOrReplaceBarre(
				cell.string,
				cell.fret,
				colorPicker.value,
				noteText.value.trim().substring(0, 3)
			);

			break;

		case "note":

			saveHistory();

			addNote(cell);

			break;

		case "erase":

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

			break;

	}

	// Redibujar una vez, después de editar o borrar
	drawFretboard();
	drawNotes();

	if (!isMobile && editMode !== "erase") noteText.focus();
	noteText.value = "";

});


//==================================================
// EVENTOS APP
//==================================================


cmbProjectCategory.addEventListener("change",(e)=>{
	projectModified = true;
});

btnNewCategory.addEventListener("click", () => {
alert(1);
});

btnDelCategory.addEventListener("click", () => {
alert(1);
});

cmbNoteNames.addEventListener("change",(e)=>{
alert(1);
});

chkNoteNames.addEventListener("change",(e)=>{
alert(1);
});

btnScoreDownloadImage.addEventListener("click", () => {

	vexTab_saveSVGFiles();

});

colorPicker.addEventListener("change", () => {

    colorPreview.style.backgroundColor = colorPicker.value;
    cursor.style.color = colorPicker.value;

});

btnNewCategory.addEventListener("click", () => {
	addCategory();
});

btnDelCategory.addEventListener("click", () => {
	deleteCategory();
});

btnProyectos.addEventListener("click", () => {
	setMenu("projects");
});

btnEdicion.addEventListener("click", () => {
	setMenu("edit");
});

btnFretboard.addEventListener("click", () => {
	setMenu("fretboard");
});

btnPlayer.addEventListener("click", () => {
	setMenu("player");
});

btnScore.addEventListener("click", () => {
	setMenu("score");
});

btnMetronome.addEventListener("click", () => {
	setMenu("metronome");
});

btnAudio.addEventListener("click", () => {
	setMenu("audio");
});

btnMenuSelector.addEventListener("click", () => {

	if (topControlsContainer.classList.contains("isOpen")) {

		closeTopControls();

	}

	menuPopup.classList.toggle("isOpen");

	menuSelectorText.textContent = "MENÚ";
	menuSelectorIcon.className = "fa-solid fa-gear fa-fw";

});

menuPopup.querySelectorAll("button").forEach(button=>{

	button.addEventListener("click",()=>{

		setMenu(button.dataset.menu);

		menuPopup.classList.remove("isOpen");
	});

});

cmbDiapason.addEventListener("change", () => {
	setFretboardStyle(cmbDiapason.value);
});

btnShowProjectPanel.addEventListener("click", () => {
	showProjectPanel();
});

btnToggleLibrary.addEventListener("click", () => {
	showProjectPanel();
});

projectsNameText.addEventListener("input", () => {
	projectModified = true;
	projectsName = projectsNameText.value.trim() || "Sin Nombre";
});

projectsDescText.addEventListener("input", () => {
	projectModified = true;
	projectsDesc = projectsDescText.value.trim() || "Descripción";
});

titleText.addEventListener("input", () => {

    projectTitle = titleText.value.trim() || "Proyecto nuevo sin título";

    workspaceTitleText.textContent = projectTitle;

    if (isFretboardVisible) resizeCanvas();

    if (isScoreVisible) scoreRender();

});

chkShowTitle.addEventListener("change", () => {

    if (isFretboardVisible) resizeCanvas();

});

chkScoreTitle.addEventListener("change", function () {

    chkScoreTitleViewMode.checked = chkScoreTitle.checked;

    if (isScoreVisible) scoreRender();

});

chkScoreTitleViewMode.addEventListener("change", function () {

    chkScoreTitle.checked = chkScoreTitleViewMode.checked;

    if (isScoreVisible) scoreRender();

});

showNumber.addEventListener("change", () => {

	showFretNumbers = !showFretNumbers;
	if (isFretboardVisible) resizeCanvas();

});

btnCopyCanvas.addEventListener("click", () => {

	if (navigator.clipboard && window.ClipboardItem) {
		copyCanvasToClipboard();
	}

});

btnDownloadCanvas.addEventListener("click", () => {

	downloadCanvas();

});

btnShare.addEventListener("click", () => {
	
	if(currentProjectId !== null) {

		const lib = xmlProjects.substring(xmlProjects.lastIndexOf("/") + 1);

		const shareUrl = `${location.origin}${location.pathname}?lib=${lib}&project=${currentProjectId}`;

		clipboardWriteText(shareUrl);

	}

});

btnOpenProjects.addEventListener("click", async () => {

	openProjectsPanel();

	// Preguntar solo si hay cambios sin guardar
	if (projectModified) {

		if (!confirm("Hay cambios sin guardar que se perderán. ¿Deseas abrir una nueva biblioteca de proyectos?")) {
			return;
		}
	}

	if (await openXMLProjectsFile()){

		projectsNameText.disabled = false;
		projectsDescText.disabled = false;
		btnSaveProject.disabled = false;
		btnDelProject.disabled = false;

	}

});

btnNewProject.addEventListener("click", () => {
	newProject();
});

btnSaveProject.addEventListener("click", async () => {
	await saveCurrentProject();
});

btnDelProject.addEventListener("click", () => {
	deleteProject(currentProjectId);
});

btnEdit.addEventListener("click", () => {
	setEditMode("note");
});

btnErase.addEventListener("click", () => {
	setEditMode("erase");
});

btnUndo.addEventListener("click", () => {
	undo();
});

btnNutMode.addEventListener("click", () => {

	if (editMode === "barre") {

		setEditMode("note");

	} else {

		setEditMode("barre");

	}

});

btnRotate.addEventListener("click", () => {

	rotateFretboard();

	updateOrientationButtons();

	if (isFretboardVisible) resizeCanvas();

	if (isScoreVisible) scoreRender();

});

btnDisplay.addEventListener("click", () => {

    displayMode = !displayMode;

    btnDisplay.classList.toggle("active", displayMode);

    chkInlays.checked = Boolean(displayMode);
    chkInlays.disabled = Boolean(!displayMode);

    btnLessNumberFrets.disabled = Boolean(displayMode);
    numberFrets.disabled = Boolean(displayMode);
    btnMoreNumberFrets.disabled = Boolean(displayMode);

    chkNoteNames.checked = false;

    drawFretboard();
    drawNotes();

});

chkInlays.addEventListener("change", function () {

    drawFretboard();
    drawNotes();

});

sliderFrets.addEventListener("input", () => {

	const previousFretCount = fretCount;

	fretCount = parseInt(sliderFrets.value);

	updateFretNumberControls();

	if (isFretboardVisible) resizeCanvas();

	if (fretCount > previousFretCount) {
		scrollToFretboardNut();
	}

});

numFrets.addEventListener("change", () => {

	const previousFretCount = fretCount;

	fretCount = parseInt(numFrets.value);

	// Limitar también si el usuario escribe un valor manualmente

	fretCount = Math.max(
		4,
		Math.min(24, fretCount)
	);

	updateFretNumberControls();

	if (isFretboardVisible) resizeCanvas();

	if (fretCount > previousFretCount) {
		scrollToFretboardNut();
	}

});

btnMoreFrets.addEventListener("click", () => {

	if (fretCount >= 24) {
		return;
	}

	fretCount++;

	updateFretNumberControls();

	if (isFretboardVisible) resizeCanvas();

	scrollToFretboardNut();

});

btnLessFrets.addEventListener("click", () => {

	if (fretCount <= 4) {
		return;
	}

	fretCount--;

	updateFretNumberControls();

	if (isFretboardVisible) resizeCanvas();

});

btnMoreNumberFrets.addEventListener("click", () => {

	let nFrets = numberFrets.value == null || numberFrets.value === "" ? 1 : parseInt(numberFrets.value);

	const maxFirstFret = 25 - fretCount;

	if (nFrets >= maxFirstFret) {
		return;
	}

	numberFrets.value = nFrets + 1;

	if (isFretboardVisible) resizeCanvas();

});

btnLessNumberFrets.addEventListener("click", () => {

	let nFrets = numberFrets.value == null || numberFrets.value === "" ? 1 : parseInt(numberFrets.value);

	if (nFrets <= 1) {
		return;
	}

	numberFrets.value = nFrets - 1;

	if (isFretboardVisible) resizeCanvas();

});



/*============================
SCORE PLAYER
==============================*/


sliderBpm.addEventListener("input", function () {

	sliderBpm.title = this.value;

	numBpm.value = parseInt(this.value);

	metronome.setBpm(numBpm.value);

	player.setGate(samplerGate.value);

});

numBpm.addEventListener("change", () => {

	let tempoCount = parseInt(numBpm.value);

	// Limitar también si el usuario escribe un valor manualmente
	tempoCount = Math.max(30, Math.min(300, tempoCount));

	numBpm.value = tempoCount;

	sliderBpm.value = parseInt(numBpm.value);
	sliderBpm.title = numBpm.value;

	metronome.setBpm(numBpm.value);

	player.setGate(samplerGate.value);

});

btnLessTempo.addEventListener("click", () => {

	let nTempo = numBpm.value == null || numBpm.value === "" ? 1 : parseInt(numBpm.value);

	if (nTempo <= 30) {return;}

	numBpm.value = nTempo - 1;

	sliderBpm.value = parseInt(numBpm.value);
	sliderBpm.title = numBpm.value;

	metronome.setBpm(numBpm.value);

	player.setGate(samplerGate.value);

});

btnMoreTempo.addEventListener("click", () => {

	let nTempo = numBpm.value == null || numBpm.value === "" ? 1 : parseInt(numBpm.value);

	if (nTempo >= 300) {return;}

	numBpm.value = nTempo + 1;

	sliderBpm.value = parseInt(numBpm.value);
	sliderBpm.title = numBpm.value;

	metronome.setBpm(numBpm.value);

	player.setGate(samplerGate.value);

});

cmbBar.addEventListener("change", function () {

    updateFigureOptions();

    getBarGroups();

    metronome.setMeter(projectBar);
    metronome.setSubdivision(projectFigure);

    player.setGate(samplerGate.value);

    if (isScoreVisible) scoreRender();

});

cmbFigure.addEventListener("change", function () {

    getBarGroups();

    metronome.setSubdivision(projectFigure);

    player.setGate(samplerGate.value);

    if (isScoreVisible) scoreRender();

});

cmbTonalidad.addEventListener("change", function () {

    if (isScoreVisible) scoreRender();

});

cmbProjectType.addEventListener("change", function () {

	const oldType = projectType;
	const newType = this.value;

	if (!newProject()) {

		this.value = oldType;

		return;

	}

	projectType = newType;
	this.value = newType;

	changeProjectType();

});

cmbTipoSecuencia.addEventListener("change", function () {

    tipoSecuencia = cmbTipoSecuencia.value;

    loadNotas(this.value);
    scoreLoadArray(this.value);
//    loadArrays(tipoSecuencia);

    if (isScoreVisible) scoreRender();

});

sliderMetronomeVolumen.addEventListener("input", function () {

    sliderMetronomeVolumen.title = this.value + " dB";

    sliderMetronomeVolumen_2.title = this.value + " dB";
    sliderMetronomeVolumen_2.value = this.value;

    metronome.setVolume(parseFloat(this.value));

});

sliderMetronomeVolumen_2.addEventListener("input", function () {

    sliderMetronomeVolumen_2.title = this.value + " dB";

    sliderMetronomeVolumen.title = this.value + " dB";
    sliderMetronomeVolumen.value = this.value;

    metronome.setVolume(parseFloat(this.value));

});

btnPlayStopMetronome.addEventListener("click", async function () {

	await metronomePlayStop();

});

chkMetronomeOn.addEventListener("change", function () {

	setMetronmeOnPlaying(this.checked);

});

chkMetronomeBeatSound.addEventListener("change", function () {

    metronome.subBeatSound = !metronome.subBeatSound;

});

sliderSamplerVolume.addEventListener("input", function () {

    sliderSamplerVolume.title = this.value + " dB";

    player.setInstrumentVolume(parseFloat(this.value));

});

cmbSamplerInstrument.onchange = function () {

    setInstrument(this.value);

};

samplerGate.addEventListener("input", function () {

    samplerGate.title = this.value;

    player.setGate(this.value);

});

chkPlayerSwing.addEventListener("change", function () {

    player.setSwingFeel(this.checked);

    if (this.checked) chkMetronomeBeatSound.checked = false;

});

cmbPlayerRepeats.addEventListener("change", function () {

    player.setRepeticiones(this.value);

    if (isScoreVisible) scoreRender();

});

cmbCountIn.addEventListener("change", function () {

    player.setCountInBars(this.value);

});

btnPlayStop.addEventListener("click", async function () {

	playMusic();

	btnPlayStop.focus({ focusVisible: true });

});

scoreFloatingStopButton.addEventListener("click", async function () {

	playMusic();

	scoreFloatingStopButton.focus({ focusVisible: true });

});

btnResetScorePalyer.addEventListener("click", async function () {

    resetScorePlayer();

});

btnRenderBuffer.addEventListener("click", async function () {

    setControlsEnabled(false);

    await Tone.start();

    player_bufferState.innerHTML = "Rendering...";

    try {

        if (!await renderBuffer()){
	        player_bufferState.innerHTML = "Waiting...";
	}else{

	        player_bufferState.innerHTML = "Generated";
	}
    }
    catch (e) {

        console.error(e);

        player_bufferState.innerHTML = "Error";

    }

    setControlsEnabled(true);

});

btnSaveAudio.addEventListener("click", function () {

    saveAudio(cmbAudioFormat.value);

});

cmbScoreLayout.addEventListener("change", function () {

    if (isScoreVisible) scoreRender();

});

sliderScoreStaveDistance.addEventListener("change", function () {

    sliderScoreStaveDistance.title = sliderScoreStaveDistance.value;

    if (isScoreVisible) scoreRender();

});

sliderScoreStaveMargin.addEventListener("change", function () {

    sliderScoreStaveMargin.title = sliderScoreStaveMargin.value;

    if (isScoreVisible) scoreRender();

});

cmbScoreStaves.addEventListener("change", function () {

    if (isScoreVisible) scoreRender();

    if (!scoreSvg) return;

    scorePaint_stop();

    scorePaint_initScorePlayback(scoreSvg);

});

cmbScoreScale.addEventListener("change", function () {

	if (cmbScoreScale.value == "auto"){
		scoreScale = "auto";
	}else{
		scoreScale = parseFloat(sliderScoreZoom.value / 100);
	}

	if (isScoreVisible) scoreRender();

});

sliderScoreZoom.addEventListener("change", function () {

    sliderScoreZoom.title = sliderScoreZoom.value + "%";

    scoreScale = parseFloat(sliderScoreZoom.value / 100);

    cmbScoreScale.value = "zoom";

    if (isScoreVisible) scoreRender();

});

btnFretboardVisible.addEventListener("click", () => {

	if (isFretboardVisible && !isScoreVisible) return;

	isFretboardVisible = !isFretboardVisible;

	setWorkspaceLayout();

	if (isFretboardVisible) {

		resizeCanvas();

		scrollToFretboardNut();
	
	}

	if (isScoreVisible) scoreRender();
});

btnScoreVisible.addEventListener("click", () => {

	if (isScoreVisible && !isFretboardVisible) return;

	isScoreVisible = !isScoreVisible;

	setWorkspaceLayout();

	if (isScoreVisible) scoreRender();

});

btnVertical.addEventListener("click", () => {

	setOrientation("vertical");

	if (isFretboardVisible) resizeCanvas();

	if (isScoreVisible) scoreRender();

});

btnHorizontal.addEventListener("click", () => {

	setOrientation("horizontal");

	if (isFretboardVisible) resizeCanvas();

	if (isScoreVisible) scoreRender();

});

