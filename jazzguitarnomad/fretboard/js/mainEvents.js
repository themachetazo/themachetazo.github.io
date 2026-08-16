"use strict";

//==================================================
// INICIALIZACION
//==================================================

window.addEventListener("load", async () => {

	try {

		// Menu ----------------------

		setLoadingProgress(0, "Configurando usuario...");

		setUserControls();



		// Project ----------------------

		setLoadingProgress(10, "Cargando proyectos...");

		setupProjectCategories();

		loadDefaultProjects();

		if (currentProjectId == null) {

			currentProjectId = generateProjectId();

			projectModified = true;

		}

		projectType = cmbProjectType.value;



		// ScorePlayer ----------------------

		setLoadingProgress(20, "Cargando metrónomo...");

		metronome = new Metronome();

		metronome.setBpm(parseFloat(bpm));
		metronome.setVolume(-12);
		metronome.subBeatSound = metronome_subBeatSound.checked;
		metronome.setMeter(projectBar);
		metronome.setSubdivision(projectFigure);

		setLoadingProgress(30, "Cargando instrumentos...");

		instruments = {

			piano: createSampler("piano"),
			cguitar: createSampler("cguitar")

		};

		instrument = instruments[currentInstrument];

		setLoadingProgress(40, "Cargando reproductor...");

		player = new MusicPlayer(instrument, metronome);

		player.setMetronomeOn(metronomeOn);
		player.setInstrumentVolume(0);
		player.setGate(samplerGate.value);

		buildHtmlDivsTimeline();

		workspaceTimeInfo.style.display = "none";



		// Notas ----------------------

		setLoadingProgress(50, "Cargando array de notas...");

		loadNotas("up");

		scoreLoadArray("up");



		// Layout ----------------------

		setLoadingProgress(60, "Configurando página...");

		setLayout();

		await waitForLayout();


		// Draw ----------------------

		setLoadingProgress(70, "Cargando imágenes...");

		await loadFretboardImage();

		await waitForLayout();

		setLoadingProgress(80, "Dibujando...");

		resizeCanvas();

		await waitForLayout();

		resizeCanvas();


		// Fin ----------------------

		setLoadingProgress(100, "Carga completada");

		hideLoadingScreen();

	} catch (error) {

		console.error("Error durante la carga:", error);

		setErrorLoadingProgress(error);

	}

});


//==================================================
// DOCUMENT
//==================================================

document.addEventListener("keydown",(e)=>{

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

window.addEventListener("resize", () => {

    menuPopup.classList.remove("isOpen");
    btnMenuSelector.classList.remove("active");

    updateMobileLeftPanel();

    updateTopBarMenu();

    resizeCanvas();

    if (!isPlaying && isScoreVisible) scoreRender();

});



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

			resetMetronomeUI();

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

			scorePaint_scoreTick();

			break;

		case "repeat":

			repetitionSequence = repetition;
			countBars = 1;
			firstTick = true;

			scorePaint_stop();

			break;

		case "stop":

			scorePaint_stop();

			resetPlaybackUI();

			// Solo ocultar si realmente hemos parado.
			// Durante el arranque/count-in isPlaying sigue siendo true.

			if (!isPlaying) {

				workspaceTimeInfo.style.display = "none";

			}

			break;

		case "end":

			scorePaint_stop();

			resetPlaybackUI();

			setControlsEnabled(true);

			isPlaying = false;

			setPlayStopButton(btnPlayStop, false);
			setPlayStopButton(btnPlayStop_2, false);

			scoreFloatingPlay.innerHTML =
				"<i class='fa-solid fa-play'></i>";

			scoreFloatingPlay.classList.remove("stop");
			scoreFloatingPlay.style.display = "none";

			// La reproducción ha terminado realmente

			workspaceTimeInfo.style.display = "none";

			// Abrir y cerrar controles

			if (topControlsWasOpen) {
				openTopControls();
			}

			topControlsWasOpen = false;

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

	if (mode === "view") return;

	if (window.innerWidth <= maxMediaScreenWidth) {
		cursor.style.display = "none";
	}else{
		cursor.style.display = "block";
	}
});

canvas.addEventListener("mouseleave", () => {

	if (mode === "view") return;

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

	if (mode === "view") return;

	if (window.innerWidth <= maxMediaScreenWidth) {

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

	if (mode === "view") return;

	projectModified = true;

	const isMobile = window.innerWidth <= maxMediaScreenWidth;

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

		if (!isMobile) noteText.focus();
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

	} else if (mode === "note") {

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


//==================================================
// EVENTOS FRETBOARD
//==================================================

cmbNoteNames.addEventListener("change",(e)=>{
alert(1);
});

chkNoteNames.addEventListener("change",(e)=>{
alert(1);
});

btnNewChord.addEventListener("click", () => {
alert(1);
});

btnDelChord.addEventListener("click", () => {
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

btnMenuSelector.addEventListener("click",()=>{

	menuPopup.classList.toggle("isOpen");

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

btnOpenLibrary.addEventListener("click", () => {

	chooseProjectsFile();
});

btnShowProjectPanel.addEventListener("click", () => {

	showProjectPanel();

	if (isScoreVisible) scoreRender();

});

btnToggleLibrary.addEventListener("click", () => {

	const prefix = "Server: ";

	if (btnToggleLibrary.title.startsWith(prefix)) {

		const path = btnToggleLibrary.title.substring(prefix.length);

		window.open(path, "_blank");

	}

});

btnToggleTopControls.addEventListener("click", () => {

	const isOpen = topControlsContainer.classList.contains("isOpen");

	if (isOpen) {

		closeTopControls();

	} else {

		openTopControls();

	}

});

titleText.addEventListener("input", () => {

    workspaceTitleText.textContent = titleText.value.trim() || "Sin Título";

    resizeCanvas();

    if (isScoreVisible) scoreRender();

});

showTitle.addEventListener("change", () => {

	showTitleViewMode.checked = showTitle.checked;

	resizeCanvas();

});

showTitleViewMode.addEventListener("change", () => {

	showTitle.checked = showTitleViewMode.checked;

	resizeCanvas();

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
	resizeCanvas();

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

		const shareUrl = `${location.origin}${location.pathname}?project=${currentProjectId}`;

		clipboardWriteText(shareUrl);

	}

});

btnCopyId.addEventListener("click", () => {
	
	if(currentProjectId !== null) {

		clipboardWriteText(currentProjectId);

	}

});

btnNewProject.addEventListener("click", () => {
	newProject();
});

btnSaveProject.addEventListener("click", () => {
	saveCurrentProject();
});

btnDelProject.addEventListener("click", () => {
	deleteProject(currentProjectId);
});

btnEdit.addEventListener("click", () => {
	setMode("note");
});

btnErase.addEventListener("click", () => {
	setMode("erase");
});

btnUndo.addEventListener("click", () => {
	undo();
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

    chkInlays.checked = Boolean(displayMode);
    chkInlays.disabled = Boolean(!displayMode);

    btnLessNumberFrets.disabled = Boolean(displayMode);
    numberFrets.disabled = Boolean(displayMode);
    btnMoreNumberFrets.disabled = Boolean(displayMode);

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

	resizeCanvas();

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

	resizeCanvas();

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

	resizeCanvas();

	scrollToFretboardNut();

});

btnLessFrets.addEventListener("click", () => {

	if (fretCount <= 4) {
		return;
	}

	fretCount--;

	updateFretNumberControls();

	resizeCanvas();

});

btnMoreNumberFrets.addEventListener("click", () => {

	let nFrets = numberFrets.value == null || numberFrets.value === "" ? 1 : parseInt(numberFrets.value);

	const maxFirstFret = 25 - fretCount;

	if (nFrets >= maxFirstFret) {
		return;
	}

	numberFrets.value = nFrets + 1;

	resizeCanvas();

});

btnLessNumberFrets.addEventListener("click", () => {

	let nFrets =
		numberFrets.value == null || numberFrets.value === ""
			? 1
			: parseInt(numberFrets.value);

	if (nFrets <= 1) {
		return;
	}

	numberFrets.value = nFrets - 1;

	resizeCanvas();

});



/*============================
SCORE PLAYER
==============================*/


sliderBpm.addEventListener("input", function () {

	sliderBpm.title = this.value;

	numBpm.value = parseInt(this.value);

	metronome.setBpm(parseFloat(numBpm.value));

	player.setGate(samplerGate.value);

});

numBpm.addEventListener("change", () => {

	let tempoCount = parseInt(numBpm.value);

	// Limitar también si el usuario escribe un valor manualmente
	tempoCount = Math.max(30, Math.min(300, tempoCount));

	numBpm.value = tempoCount;

	sliderBpm.value = parseInt(numBpm.value);
	sliderBpm.title = numBpm.value;

	metronome.setBpm(parseFloat(numBpm.value));

	player.setGate(samplerGate.value);

});

btnLessTempo.addEventListener("click", () => {

	let nTempo = numBpm.value == null || numBpm.value === "" ? 1 : parseInt(numBpm.value);

	if (nTempo <= 30) {return;}

	numBpm.value = nTempo - 1;

	sliderBpm.value = parseInt(numBpm.value);
	sliderBpm.title = numBpm.value;

	metronome.setBpm(parseFloat(numBpm.value));

	player.setGate(samplerGate.value);

});

btnMoreTempo.addEventListener("click", () => {

	let nTempo = numBpm.value == null || numBpm.value === "" ? 1 : parseInt(numBpm.value);

	if (nTempo >= 300) {return;}

	numBpm.value = nTempo + 1;

	sliderBpm.value = parseInt(numBpm.value);
	sliderBpm.title = numBpm.value;

	metronome.setBpm(parseFloat(numBpm.value));

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

    projectType = cmbProjectType.value;

    scoreLoadArray(cmbTipoSecuencia.value);

    if (isScoreVisible) scoreRender();

});

cmbTipoSecuencia.addEventListener("change", function () {

    loadNotas(this.value);

    scoreLoadArray(this.value);

    if (isScoreVisible) scoreRender();

});

metronome_volumen.addEventListener("input", function () {

    metronome_volumen.title = this.value + " dB";

    metronome_volumen_2.title = this.value + " dB";
    metronome_volumen_2.value = this.value;

    metronome.setVolume(parseFloat(this.value));

});

metronome_volumen_2.addEventListener("input", function () {

    metronome_volumen_2.title = this.value + " dB";

    metronome_volumen.title = this.value + " dB";
    metronome_volumen.value = this.value;

    metronome.setVolume(parseFloat(this.value));

});

metronome_btnPlayStop.addEventListener("click", async function () {

	await metronomePlayStop();

});

metronome_on.addEventListener("change", function () {

	setMetronmeOnPlaying(this.checked);

});

metronome_subBeatSound.addEventListener("change", function () {

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

player_swing.addEventListener("change", function () {

    player.swingFeel = this.checked;

    if (this.checked) metronome_subBeatSound.checked = false;

});

player_repeats.addEventListener("change", function () {

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

btnPlayStop_2.addEventListener("click", async function () {

	playMusic();

	btnPlayStop_2.focus({ focusVisible: true });

});

scoreFloatingPlay.addEventListener("click", async function () {

	playMusic();

	scoreFloatingPlay.focus({ focusVisible: true });

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

    initScorePlayback(scoreSvg);

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

    if (isScoreVisible) scoreRender();

});

btnScoreVisible.addEventListener("click", () => {

	if (isScoreVisible && !isFretboardVisible) {

		return;

	}

	isScoreVisible = !isScoreVisible;

	setWorkspaceLayout();

});

btnFretboardVisible.addEventListener("click", () => {

	if (isFretboardVisible && !isScoreVisible) {

		return;

	}

	isFretboardVisible = !isFretboardVisible;

	setWorkspaceLayout();

});
