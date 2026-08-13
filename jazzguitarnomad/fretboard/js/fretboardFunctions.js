
/*============================
FREATBOARD FUNCTIONS
==============================*/

function setLoadingProgress(percent,text){

	loadingProgressBar.style.width = percent + "%";
	loadingText.textContent = text;
}

function hideLoadingScreen() {

	loadingSpinner.style.display = "none";

	setTimeout(() => {

		loadingScreen.classList.add("isHidden");

		setTimeout(() => {loadingScreen.remove();}, 350);

	}, 500);

}

function setErrorLoadingProgress(err){

	loadingText.innerHTML = "<i class='fa-solid fa-circle-exclamation'></i> Error " + loadingText.textContent + "<br><br><span>" + err + "</span>";
	loadingText.classList.add("error");
	loadingSpinner.style.display = "none";

}

function updateTopBarMenu() {

    const menuFits = (brand.offsetWidth + mainMenu.scrollWidth + btnToggleTopControls.offsetWidth) <= window.innerWidth;

    if (menuFits) {

        mainMenu.style.display = "flex";

        btnMenuSelector.style.display = "none";
        menuPopup.classList.remove("isOpen");

    } else {

        mainMenu.style.display = "none";

        btnMenuSelector.style.display = "flex";

    }

}

function updateFretNumberControls() {

	numFrets.value = fretCount;
	sliderFrets.value = fretCount;
	sliderFrets.title = fretCount;

	const maxFirstFret = 25 - fretCount;

	if (parseInt(numberFrets.value) > maxFirstFret) {

		numberFrets.value = maxFirstFret;

	}

}

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

function showProjectPanel(){

	if (appLayout.classList.contains("leftPanelHidden")) {

		if (window.innerWidth <= maxMediaScreenWidth) {

			closeTopControls();

		}

		openLeftPanel();

		return;

	}

	closeLeftPanel();

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

function showMenuControls(...controls){

	controls.forEach(control => control.classList.remove("isHidden"));

}

function setMenu(m){

	// Si se pulsa el mismo menú, alternar abrir/cerrar
	if (menuOpen === m) {

		if (topControlsContainer.classList.contains("isOpen")) {

			closeTopControls();

		} else {

			openTopControls();

		}

		menuPopup.classList.remove("isOpen");

		return;

	}

	menuOpen = m;

	btnProyectos.classList.remove("active");
	btnEdicion.classList.remove("active");
	btnFretboard.classList.remove("active");
	btnPlayer.classList.remove("active");
	btnScore.classList.remove("active");
	btnMetronome.classList.remove("active");

	[
		topProject,
		topCategory,
		topLibrary,
		topTitle,
		topShare,
		topEdit,
		topUndo,
		topChords,
		topColor,
		topNoteNames,
		topFrets,
		topNumbers,
		topOrientation,
		topFretboardScale,
		topDiapason,
		topInstrument,
		topTempo,
		topTonality,
		topTimeSignature,
		topForm,
		topScoreStaves,
		topScoreVisible,
		topScoreScale,
		topScoreMargin,
		topScoreDownload,
		topFretboardDownload,
		topVolumen,
		topRepeats,
		topArticulation,
		topMetronomePlay,
		topMetronomeControls,
		topBuffer,
		topAudio,
		topReset,
		topPlayStop
	].forEach(control => control.classList.add("isHidden"));

	switch (menuOpen){

		case "projects":

			btnProyectos.classList.add("active");

			showMenuControls(
				topProject,
				topCategory,
				topLibrary,
				topShare,
				topFretboardDownload,
				topTitle
			);

			menuSelectorText.textContent = "PROYECTOS";
			menuSelectorIcon.className = "fa-solid fa-folder";

			break;

		case "edit":

			btnEdicion.classList.add("active");

			showMenuControls(
				topEdit,
				topUndo,
				topColor,
				topForm,
				topChords,
				topNoteNames
			);

			menuSelectorText.textContent = "ESCRITURA";
			menuSelectorIcon.className = "fa-solid fa-pen";

			break;

		case "fretboard":

			btnFretboard.classList.add("active");

			showMenuControls(
				topFretboardScale,
				topDiapason,
				topFrets,
				topNumbers,
				topOrientation
			);

			menuSelectorText.textContent = "MÁSTIL";
			menuSelectorIcon.className = "fa-solid fa-pencil-ruler";

			break;

		case "player":

			btnPlayer.classList.add("active");

			showMenuControls(
				topPlayStop,
				topRepeats,
				topInstrument,
				topArticulation,
				topVolumen,
				topBuffer,
				topAudio,
				topReset
			);

			menuSelectorText.textContent = "PLAYER";
			menuSelectorIcon.className = "fa-solid fa-music";

			break;

		case "score":

			btnScore.classList.add("active");

			showMenuControls(
				topTonality,
				topTimeSignature,
				topScoreStaves,
				topScoreVisible,
				topScoreScale,
				topScoreMargin,
				topScoreDownload
			);

			menuSelectorText.textContent = "PARTITURA";
			menuSelectorIcon.className = "fa-solid fa-file-lines";

			break;

		case "metronome":

			btnMetronome.classList.add("active");

			showMenuControls(
				topMetronomePlay,
				topTempo,
				topMetronomeControls,
				topTimeSignature
			);

			menuSelectorText.textContent = "METRÓNOMO";
			menuSelectorIcon.className = "fa-solid fa-stopwatch";

			break;
	}

	// En móvil, cerrar el menú desplegable al seleccionar una opción
	menuPopup.classList.remove("isOpen");

	// Mostrar automáticamente los controles
	openTopControls();

}

function setFretboardStyle(style) {

	fretboardStyle = style;

	neckImageLoaded = false;

	if (fretboardStyle !== "blank") {

		loadFretboardImage()
			.then(() => {

				drawFretboard();
				drawNotes();

			})
			.catch(error => {

				console.error(error);

				fretboardStyle = "blank";
				cmbDiapason.value = fretboardStyle;

				drawFretboard();
				drawNotes();

			});

	} else {

		drawFretboard();
		drawNotes();

	}

}

function setOrientation(o){

    orientation = o;

    if (o === "vertical") {

        rotation = rotated ? 180 : 0;

	workspace.classList.remove("horizontal");
	workspace.classList.add("vertical");

    } else {

        rotation = rotated ? 270 : 90;

	workspace.classList.remove("vertical");
	workspace.classList.add("horizontal");

    }

    updateOrientationButtons();

    if (isScoreVisible) scoreRender();

}

function updateOrientationButtons(){

	btnVertical.classList.toggle("active",orientation === "vertical");
	btnHorizontal.classList.toggle("active",orientation === "horizontal");

	btnRotate.classList.toggle("active",rotated);

	btnVertical_2.classList.toggle("active",orientation === "vertical");
	btnHorizontal_2.classList.toggle("active",orientation === "horizontal");

	resizeCanvas();

}

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

}

function setLayout() {

	cursor.style.color = colorPicker.value;

	const isMobile = window.innerWidth <= maxMediaScreenWidth;

	if (isMobile) {

		cursor.style.display = "none";

		closeLeftPanel();
		closeTopControls();


	} else {

		cursor.style.display = "";

		openTopControls();

		setOrientation("horizontal");

		noteText.focus();

	}

	setWorkspaceLayout("score");

}

function setWorkspaceLayout(mode){

	switch(mode){

		case "score":

			if (isScoreVisible && !isFretboardVisible) {
				return;
			}

			isScoreVisible = !isScoreVisible;

			break;

		case "fretboard":

			if (isFretboardVisible && !isScoreVisible) {
				return;
			}

			isFretboardVisible = !isFretboardVisible;

			break;

	}

	workspaceContent.style.display = isFretboardVisible ? "" : "none";
	workspaceScore.style.display = isScoreVisible ? "" : "none";

	workspace.classList.remove(
		"horizontal",
		"vertical",
		"contentOnly",
		"scoreOnly"
	);

	if (isFretboardVisible && isScoreVisible) {

		workspace.classList.add(orientation);

	} else if (isFretboardVisible) {

		workspace.classList.add("contentOnly");

	} else {

		workspace.classList.add("scoreOnly");

	}

	btnFretboardVisible.classList.toggle("active", isFretboardVisible);
	btnScoreVisible.classList.toggle("active", isScoreVisible);

	if (isScoreVisible) scoreRender();

}

function setInitialOrientation() {

	if (window.innerWidth <= maxMediaScreenWidth) {

		setOrientation("vertical");

	}else{

		setOrientation("horizontal");

	}

}

function setMetronmeOnPlaying(value){

    player.setMetronomeOn(value);

    if (value){
	metronome_timeline.style.display = "flex";
	metronome_Info.innerHTML = "Beat: <b>1 / 1</b>";
    }else{
	metronome_timeline.style.display = "none";
	metronome_Info.innerHTML = "";
    }

}
