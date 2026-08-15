
/*============================
FREATBOARD FUNCTIONS
==============================*/

function setLoadingProgress(percent,text){

	loadingProgressBar.style.width = percent + "%";
	loadingText.textContent = text;
}

function hideLoadingScreen() {

	loadingSpinner.classList.add("isCompleted");

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

function setUserControls(){

	cursor.innerHTML = "";

	if (!isAdmin) {

		btnAudio.style.display = "none";

		if (user === null) {

			subtituleText.textContent = "Fretboard Viewer";

			titleText.style.display = "none";
			topTitle.style.display = "none";

			btnEdicion.style.display = "none";
			btnProyectos.style.display = "none";
			btnEdicionPopup.style.display = "none";
			btnProyectosPopup.style.display = "none";

			btnShowProjectPanel.style.display = "none";

			closeLeftPanel();

			setMenu("fretboard");

		}else{

			topTitleViewMode.style.display = "none";

			btnSaveProject.style.display = "none";
			btnDelProject.style.display = "none";
			btnCopyId.style.display = "none";
			topLibrary.style.display = "none";
			topCategory.style.display = "none";
			topFretboardDownload.style.display = "none";
			topScoreDownload.style.display = "none";
			topChords.style.display = "none";
			topAudio.style.display = "none";
			topBuffer.style.display = "none";

			setMenu("projects");

		}


	} else {

		topTitleViewMode.style.display = "none";

		setMenu("projects");

	}

	updateTopBarMenu();

}

function updateTopBarMenu() {

	const topBarWidth = topBar.clientWidth;

	const brandWidth = brand.offsetWidth;

	const toggleWidth = btnToggleTopControls.offsetWidth;


	// Mostrar temporalmente el menú para poder medirlo

	const previousDisplay = mainMenu.style.display;

	mainMenu.style.visibility = "hidden";
	mainMenu.style.display = "flex";


	let menuWidth = 0;

	mainMenu.querySelectorAll(".menuButton").forEach(button => {

		menuWidth += button.offsetWidth;

	});


	const requiredWidth = brandWidth + menuWidth + toggleWidth;


	// Restaurar visibilidad

	mainMenu.style.visibility = "";
	mainMenu.style.display = previousDisplay;


	if (requiredWidth <= topBarWidth) {

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

		if (window.innerWidth <= maxMediaScreenWidth &&
			orientation === "vertical") {

			closeTopControls();

			if (isFretboardVisible && isScoreVisible) {

				setWorkspaceLayout("score");

			}

		}

		openLeftPanel();

		return;

	}

	closeLeftPanel();

}

function updateMobileLeftPanel() {

	if (window.innerWidth <= maxMediaScreenWidth) {

		if (btnShowProjectPanel.classList.contains("active")) {

			btnShowProjectPanel.classList.remove("active");

		}

		if (!appLayout.classList.contains("leftPanelHidden")) {

			closeLeftPanel();

		}

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

function setMode(newMode) {

	if (mode === newMode) {

		newMode = "view";

	}

	mode = newMode;

	btnEdit.classList.toggle("active",newMode === "note");

	btnErase.classList.toggle("active",newMode === "erase");

	btnNutMode.classList.toggle("active",newMode === "barre");

	btnNutMode.setAttribute("aria-pressed",String(newMode === "barre"));

	switch (newMode) {

		case "view":

			cursor.innerHTML = '';

			break;

		case "note":

			cursor.innerHTML = '<i class="fa-solid fa-pencil"></i>';

			break;

		case "erase":

			cursor.innerHTML = '<i class="fa-solid fa-eraser"></i>';

			break;

		case "barre":

			cursor.innerHTML = '<i class="fa-solid fa-grip-lines"></i>';

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
	btnAudio.classList.remove("active");

	[
		topProject,
		topCategory,
		topLibrary,
		topTitle,
		topTitleViewMode,
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
				topScoreDownload,
				topTitle,
				topTitleViewMode
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

			menuSelectorText.textContent = "EDICIÓN";
			menuSelectorIcon.className = "fa-solid fa-pen";

			break;

		case "fretboard":

			btnFretboard.classList.add("active");

			showMenuControls(
				topTitle,
				topTitleViewMode,
				topFretboardScale,
				topDiapason,
				topFrets,
				topNumbers,
				topOrientation
			);

			menuSelectorText.textContent = "MÁSTIL";
			menuSelectorIcon.className = "fa-solid fa-pencil-ruler";

			topTitleViewModeScore.style.display = "none";
			topTitleViewModeFretboard.style.display = "flex";

			break;

		case "player":

			btnPlayer.classList.add("active");

			showMenuControls(
				topRepeats,
				topTempo,
				topInstrument,
				topArticulation,
				topVolumen,
				topReset
			);

			menuSelectorText.textContent = "PLAYER";
			menuSelectorIcon.className = "fa-solid fa-radio";

			break;

		case "score":

			btnScore.classList.add("active");

			showMenuControls(
				topTitle,
				topTitleViewMode,
				topTonality,
				topTempo,
				topTimeSignature,
				topScoreStaves,
				topScoreScale,
				topScoreMargin
			);

			menuSelectorText.textContent = "PARTITURA";
			menuSelectorIcon.className = "fa-solid fa-file-lines";

			topTitleViewModeScore.style.display = "flex";
			topTitleViewModeFretboard.style.display = "none";

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

		case "audio":

			btnAudio.classList.add("active");

			showMenuControls(
				topBuffer,
				topAudio
			);

			menuSelectorText.textContent = "AUDIO";
			menuSelectorIcon.className = "fa-solid fa-file-audio";

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

	if (o === "vertical"){

		rotation = rotated ? 180 : 0;

		workspace.classList.remove("horizontal");
		workspace.classList.add("vertical");

	} else {

		rotation = rotated ? 270 : 90;

		workspace.classList.remove("vertical");
		workspace.classList.add("horizontal");

	}

	updateOrientationButtons();

	scrollToFretboardNut();

	if (isScoreVisible) scoreRender();

}

function updateOrientationButtons(){

	btnVertical.classList.toggle("active",orientation === "vertical");
	btnHorizontal.classList.toggle("active",orientation === "horizontal");

	btnRotate.classList.toggle("active",rotated);

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

    scrollToFretboardNut();

}

function scrollToFretboardNut(){

	requestAnimationFrame(() => {

		if (!workspaceContent) {
			return;
		}

		switch (rotation){

			//------------------------------------------------
			// Vertical - cejuela arriba
			//------------------------------------------------

			case 0:

				workspaceContent.scrollTop = 0;

				break;


			//------------------------------------------------
			// Vertical - cejuela abajo
			//------------------------------------------------

			case 180:

				workspaceContent.scrollTop = workspaceContent.scrollHeight;

				break;


			//------------------------------------------------
			// Horizontal - cejuela izquierda
			//------------------------------------------------

			case 270:

				workspaceContent.scrollLeft = 0;

				break;


			//------------------------------------------------
			// Horizontal - cejuela derecha
			//------------------------------------------------

			case 90:

				workspaceContent.scrollLeft = workspaceContent.scrollWidth;

				break;

		}

	});

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

	//------------------------------------------------
	// Móvil + vertical + panel de proyectos abierto
	//------------------------------------------------

	if (window.innerWidth <= maxMediaScreenWidth &&
		orientation === "vertical" &&
		!appLayout.classList.contains("leftPanelHidden")) {

		if (mode === "score") {

			isScoreVisible = true;
			isFretboardVisible = false;

		} else if (mode === "fretboard") {

			isFretboardVisible = true;
			isScoreVisible = false;

		}

	} else {

		//------------------------------------------------
		// Comportamiento normal
		//------------------------------------------------

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

	btnFretboardVisible.classList.toggle("active",isFretboardVisible);
	btnScoreVisible.classList.toggle("active",isScoreVisible);

	if (isScoreVisible) scoreRender();

}

function setInitialOrientation() {

	if (window.innerWidth <= maxMediaScreenWidth) {

		setOrientation("vertical");

	}else{

		setOrientation("horizontal");

	}

}
