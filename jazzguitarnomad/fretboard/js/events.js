"use strict";

//==================================================
// INICIALIZACION
//==================================================

neckImage.onload = () => {

	neckImageLoaded = true;

	resizeCanvas();

};

neckImage.onerror = () => {

	neckImageLoaded = false;

	console.error(`No se pudo cargar la imagen del diapasón: ${neckImage.src}`);

	fretboardStyle = "blank";
	cmbDiapason.value = fretboardStyle;

};

window.addEventListener("load", async () => {

    //Project----------------------

    setupProjectCategories();

    loadDefaultProjects();

    if (currentProjectId == null) {
	    currentProjectId = generateProjectId();
	    projectModified = true;
    }

    projectType = cmbProjectType.value;


    //Menu----------------------

    mainMenuWidth = mainMenu.scrollWidth;

    if (!isAdmin) {
	    btnSave.style.display = "none";
	    btnDel.style.display = "none";
	    btnCopyId.style.display = "none";
	    topLibrary.style.display = "none";
	    topFretboardDownload.style.display = "none";
	    topScoreDownload.style.display = "none";
	    topChords.style.display = "none";
	    topAudio.style.display = "none";
	    topBuffer.style.display = "none";

	    setMenu("edit");
    }else{
	    setMenu("projects");
    }

    updateTopBarMenu();


    //ScorePlayer----------------------

    metronome = new Metronome();

    metronome.setBpm(parseFloat(sliderBpm.value));
    metronome.setVolume(0);

    instruments = {
        piano: createSampler("piano"),
	cguitar: createSampler("cguitar")
    };

    instrument = instruments[currentInstrument];

    player = new MusicPlayer(instrument,metronome);

    player.setInstrumentVolume(0);
    player.setGate(samplerGate.value);

    buildHtmlDivsTimeline();

    updateTimeline(1, 1);

    loadNotas("up");

    scoreLoadArray("up");


    //Layout----------------------

    updateLayout();

});



//==================================================
// DOCUMENT
//==================================================

window.addEventListener("resize", () => {

    menuPopup.classList.remove("isOpen");
    btnMenuSelector.classList.remove("active");

    updateTopBarMenu();

    resizeCanvas();

    if (!isPlaying && isScoreVisible) scoreRender();

});

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

document.addEventListener("metronomeBeat",(e) => {

    let { beat,subBeat,mode } = e.detail;

    switch (mode) {

        case "restart":
        case "stop":

            beat=1;
            subBeat=1;

            buildHtmlDivsTimeline();

            break;

        case "start":
        case "tick":

            break;

    }

    updateTimeline(beat,subBeat);

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

                if (firstTick)
                    firstTick = false;
                else
                    countBars++;

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

            countBars = 1;
            repetitionSequence = 1;
            firstTick = true;

            scorePaint_stop();

            break;

        case "end":

            setControlsEnabled(true);

            isPlaying = false;

            btnPlayStop.innerHTML = "<i class='fa-solid fa-play'></i><span>Play</span>";
            btnPlayStop_2.innerHTML = btnPlayStop.innerHTML;

            btnPlayStop.classList.toggle("buttonPlay", true);
            btnPlayStop.classList.toggle("buttonStop", false);

            btnPlayStop_2.classList.toggle("buttonPlay", true);
            btnPlayStop_2.classList.toggle("buttonStop", false);

            break;
    }

    player_repeatInfo.innerHTML = "Compás: <b>" + countBars + "</b><br>Repetición: <b>" + repetitionSequence + "</b>";
    player_repeatInfo_2.innerHTML = "Compás: <b>" + countBars + "&nbsp;</b>Repetición: <b>" + repetitionSequence + "</b>&nbsp;";


});






//==================================================
// EVENTOS DIBUJO CANVAS
//==================================================

canvas.addEventListener("mouseenter", () => {

	if (window.innerWidth <= maxMediaScreenWidth) {
		cursor.style.display = "none";
		return;
	}

	cursor.style.display = "block";

});

canvas.addEventListener("mouseleave", () => {

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

titleText.addEventListener("input", () => {

    workspaceTitleText.textContent = titleText.value.trim() || "Sin Título";

    resizeCanvas();

    if (isScoreVisible) scoreRender();

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

btnDiseno.addEventListener("click", () => {
	setMenu("design");
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

btnMenuSelector.addEventListener("click",()=>{

	menuPopup.classList.toggle("isOpen");

});

menuPopup.querySelectorAll("button").forEach(button=>{

	button.addEventListener("click",()=>{

		setMenu(button.dataset.menu);

		menuPopup.classList.remove("isOpen");

	});

});

cmbDiapason.addEventListener("click", () => {
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

	showProjectPanel();

	if (isScoreVisible) scoreRender();

});

btnToggleTopControls.addEventListener("click", () => {

	const isOpen = topControlsContainer.classList.contains("isOpen");

	if (isOpen) {

		closeTopControls();

	} else {

		// En móvil, abrir Controles cierra la Biblioteca
		if (window.innerWidth <= maxMediaScreenWidth) {

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

    drawFretboard();
    drawNotes();

});

chkInlays.addEventListener("change", function () {

    drawFretboard();

});

sliderFrets.addEventListener("input", () => {

	fretCount = parseInt(sliderFrets.value);

	updateFretNumberControls();

	resizeCanvas();

});

numFrets.addEventListener("change", () => {

	fretCount = parseInt(numFrets.value);

	// Limitar también si el usuario escribe un valor manualmente
	fretCount = Math.max(4, Math.min(24, fretCount));

	updateFretNumberControls();

	resizeCanvas();

});

btnMoreFrets.addEventListener("click", () => {

	if (fretCount >= 24) {
		return;
	}

	fretCount++;

	updateFretNumberControls();

	resizeCanvas();

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

	let nFrets =
		numberFrets.value == null || numberFrets.value === ""
			? 1
			: parseInt(numberFrets.value);

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

titleText.addEventListener("input", () => {

	title = titleText.value;

	resizeCanvas();
	drawNotes();

});



/*============================
SCORE PLAYER
==============================*/


sliderBpm.addEventListener("input", function () {

	sliderBpm.title = this.value;

	numTempo.value = parseInt(this.value);

	metronome.setBpm(parseFloat(numTempo.value));

	player.setGate(samplerGate.value);

});

numTempo.addEventListener("change", () => {

	let tempoCount = parseInt(numTempo.value);

	// Limitar también si el usuario escribe un valor manualmente
	tempoCount = Math.max(30, Math.min(300, tempoCount));

	numTempo.value = tempoCount;

	sliderBpm.value = parseInt(numTempo.value);
	sliderBpm.title = numTempo.value;

	metronome.setBpm(parseFloat(numTempo.value));

	player.setGate(samplerGate.value);

});

btnLessTempo.addEventListener("click", () => {

	let nTempo = numTempo.value == null || numTempo.value === "" ? 1 : parseInt(numTempo.value);

	if (nTempo <= 30) {return;}

	numTempo.value = nTempo - 1;

	sliderBpm.value = parseInt(numTempo.value);
	sliderBpm.title = numTempo.value;

	metronome.setBpm(parseFloat(numTempo.value));

	player.setGate(samplerGate.value);

});

btnMoreTempo.addEventListener("click", () => {

	let nTempo = numTempo.value == null || numTempo.value === "" ? 1 : parseInt(numTempo.value);

	if (nTempo >= 300) {return;}

	numTempo.value = nTempo + 1;

	sliderBpm.value = parseInt(numTempo.value);
	sliderBpm.title = numTempo.value;

	metronome.setBpm(parseFloat(numTempo.value));

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

    await Tone.start();

    if (Tone.context.state !== "running") {

        await Tone.context.resume();

    }

    if (metronome.playing) {

	setControlsEnabled(true);

	metronome_btnPlayStop.innerHTML = "<i class='fa-solid fa-play'></i><span>Play</span>";

	metronome_btnPlayStop.classList.toggle("buttonPlay", true);
        metronome_btnPlayStop.classList.toggle("buttonStop", false);

        metronome.stop();

    }else {

	setControlsEnabled(false);

	metronome_btnPlayStop.disabled = false;
	metronome_volumen.disabled = false;
	sliderBpm.disabled = false;
	btnLessTempo.disabled = false;
	btnMoreTempo.disabled = false;

	metronome_btnPlayStop.innerHTML = "<i class='fa-solid fa-stop'></i><span>Stop</span>";

	metronome_btnPlayStop.classList.toggle("buttonPlay", false);
        metronome_btnPlayStop.classList.toggle("buttonStop", true);

        metronome.start();

    }

    metronome_btnPlayStop.focus({ focusVisible: true });

});

metronome_on.addEventListener("change", function () {

    player.setMetronomeOn(this.checked);

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

chkScoreTitle.addEventListener("change", function () {

    if (isScoreVisible) scoreRender();

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

chkScoreVisible.addEventListener("change", function () {

	setWorkspaceLayout("score");

});

btnScoreVisible.addEventListener("click", () => {

	chkScoreVisible.checked = Boolean(!chkScoreVisible.checked);

	setWorkspaceLayout("score");

});

btnFretboardVisible.addEventListener("click", () => {

	setWorkspaceLayout("fretboard");

});
