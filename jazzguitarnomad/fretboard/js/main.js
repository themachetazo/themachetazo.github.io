
/*============================
MAIN FUNCTIONS
==============================*/

async function loadXML(type,file) {

	try {

		const response = await fetch(file);

		if (!response.ok) {
			throw new Error("No se pudo cargar " + file);
		}

		const xmlText = await response.text();

		const parser = new DOMParser();
		const xml = parser.parseFromString(xmlText,"application/xml");

		const parserError = xml.querySelector("parsererror");

		if (parserError) {
			throw new Error("El archivo XML no tiene un formato válido.");
		}

		switch (type) {

			case "user":

				isAdmin = false;
				user = "";
				users = parseUsersXml(xml);

				break;

			case "project":

				projectsLoaded = false;
				projects = parseProjectsXml(xml);
				projectsLoaded = true;

				break;

			default:

				throw new Error("Tipo de XML no válido: " + type);

		}

		return true;

	} catch (error) {

		console.warn("Error cargando " + file,error);

		if (type === "user") {

			users = [];

		} else if (type === "project") {

			projects = [];
			projectsLoaded = false;

		}

		return false;

	}

}

function parseUsersXml(xml) {

	return [...xml.querySelectorAll("user")].map(node => ({

		id: node.getAttribute("id"),
		username: node.getAttribute("username"),
		role: node.getAttribute("role"),
		name: node.getAttribute("name"),
		surname: node.getAttribute("surname"),
		pass: node.getAttribute("pass"),
		email: node.getAttribute("email"),
		tel: node.getAttribute("tel"),
		active: node.getAttribute("active"),
		alta: node.getAttribute("alta"),
		baja: node.getAttribute("baja")

	}));

}

function setUserControlsStates(){

	if (!isAdmin && user !== null && user !== ""){

		const currentUser = users.find(item => item.username === user);

		if (currentUser) {
			xmlProjects = xmlProjects.substring(0,xmlProjects.indexOf("/") + 1) + user + ".xml";
		}else{
			alert("El usuario '" + user + "' no existe.");
		}
	}

	if (!isAdmin) {

		btnAudio.style.display = "none";
		btnAudioPopup.style.display = "none";

		btnShowProjectPanel.style.display = "none";

		if (user === null && projectParam !== null) {

			subtituleText.textContent = "Fretboard Viewer";

			titleText.style.display = "none";
			topTitle.style.display = "none";

			btnProyectos.style.display = "none";
			btnProyectosPopup.style.display = "none";
			btnEdicion.style.display = "none";
			btnEdicionPopup.style.display = "none";

			setMenu("fretboard");

		}else{

			btnSaveProject.style.display = "none";
			btnDelProject.style.display = "none";
			btnCopyId.style.display = "none";

			topTitleViewMode.style.display = "none";
			topLibrary.style.display = "none";
			topCategory.style.display = "none";
			topFretboardDownload.style.display = "none";
			topScoreDownload.style.display = "none";
			topAudio.style.display = "none";
			topBuffer.style.display = "none";

			setMenu("edit");

		}

		btnToggleLibrary.style.display = "none";

	} else {

		topTitleViewMode.style.display = "none";

		setMenu("edit");

	}

	cursor.innerHTML = "";

	workspaceTimeInfo.style.display = "none";

	updateTopBarMenu();

	setProjectControlsType();

}

function setDefaultControlsValues(state){

	if (state === "init"){

		orientation = window.innerWidth <= maxMediaScreenWidth ? "vertical" : "horizontal";

	}

	if (state !== "loadProject"){

		projectTitle = "";
		displayMode = true;
		fretCount = 10;
		projectBar = 4;
		projectFigure = 1;
		scoreScale = "auto";
		projectType = "fretboard";
		countBars = 0;
		repetitionSequence = 2;
		isFretboardVisible = true;
		isScoreVisible = false;
		tipoSecuencia = "up";
		swing = false;
		metronomeOn = true;
		inlays = true;
/*
		rotation = 0;
		rotated = false;
		currentInstrument = "piano";
		fretNumbers = 1;
		showFretNumbers = false;
		bpm = 90;
		key = "C";
		scoreStaves = "all";
		scoreLayout = "vertical";
*/

	}

	titleText.value = projectTitle;
	workspaceTitleText.textContent = projectTitle === "" ? "Sin Título" : projectTitle;

	showTitle.checked = false;
	chkScoreTitle.checked = false;
	showTitleViewMode.checked = false;
	chkScoreTitleViewMode.checked = false;

	numFrets.value = fretCount;
	sliderFrets.value = fretCount;
	sliderFrets.title = fretCount;

	btnDisplay.classList.toggle("active", displayMode);
	chkInlays.disabled = displayMode === false;
	chkInlays.checked = displayMode ? inlays : false;

	cmbDiapason.value = fretboardStyle;

	noteText.value = "";

	setBarGroups();

	if (scoreScale !== "auto") {
		cmbScoreScale.value = "zoom";
		sliderScoreZoom.value = scoreScale;
		scoreScale = parseFloat(scoreScale / 100);
	}else{
		cmbScoreScale.value = scoreScale; //auto
		sliderScoreZoom.value = 50;
	}
	sliderScoreZoom.title = sliderScoreZoom.value + "%";

	cmbProjectType.value = projectType;

	cmbTipoSecuencia.value = tipoSecuencia;

	cmbChords.value = 1;

	cmbCountIn.value = countBars;

	cmbPlayerRepeats.value = repetitionSequence;

	cmbSamplerInstrument.value = currentInstrument;

	numberFrets.value = fretNumbers;
	showNumber.checked = showFretNumbers;

	numBpm.value = bpm;
	sliderBpm.value = bpm;
	sliderBpm.title = bpm;

	cmbTonalidad.value = key;

	cmbScoreStaves.value = scoreStaves;
	cmbScoreLayout.value = scoreLayout;

	chkPlayerSwing.checked = swing;
	if (chkPlayerSwing.checked) chkMetronomeBeatSound.checked = false;

	chkMetronomeOn.checked = metronomeOn;

	btnFretboardVisible.classList.toggle("active",isFretboardVisible);
	btnScoreVisible.classList.toggle("active",isScoreVisible);

	sliderMetronomeVolumen.value = -12;
	sliderMetronomeVolumen_2.value = sliderMetronomeVolumen.value;
	sliderMetronomeVolumen.title = sliderMetronomeVolumen.value + " dB";
	sliderMetronomeVolumen_2.title = sliderMetronomeVolumen.title;

	samplerVolume.value = 0;
	samplerVolume.title = samplerVolume.value + " dB";

	samplerGate.value = 100;
	samplerVolume.title = "100";

	if (state !== "loadProject"){

		notesOrder = 0;

		notes = [];
		barreNotes = [];
		nutNotes = Array(stringCount).fill(null);

		NOTAS = [];
		ACORDES = [];

		sequenceXMLNotes.length = 0;
		chordsXMLNotes.length = 0;

		sequenceToPlay.length = 0;
		chordsToPlay.length = 0;

	}

	history = [];

}
function setProjectControlsStates() {

	btnToggleLibrary.title = "Server: " + xmlProjects;

	if (!projectsLoaded){

		cmbProjectCategory.disabled = true;
		btnNewCategory.disabled = true;
		btnDelCategory.disabled = true;

	}

	if (projectsLoaded && projectParam !== null) {

		const project = projects.find(project => project.id === projectId);

		if (project) {

			renderHTMLProjectsList();

			selectProject(project);

			return;

		}else{

			alert("No se encontró el proyecto '" + projectId + "' en la biblioteca.");

		}

	}

	currentProjectId = generateProjectId();

	setDefaultControlsValues("init");

	renderHTMLProjectsList();

}

function setProjectControlsType(){

	btnScore.style.display = projectType === "fretboard" ? "none" : "";
	btnPlayer.style.display = projectType === "fretboard" ? "none" : "";

	cmbTipoSecuencia.disabled = projectType === "fretboard";
	chkMetronomeOn.checked = projectType !== "fretboard";
	chkMetronomeOn.disabled = projectType === "fretboard";

	cmbChords.disabled = cmbProjectType.value === "chord" ? false : true;

	btnPlayStop.style.display = projectType === "fretboard" ? "none" : "";
	btnFretboardVisible.style.display = projectType === "fretboard" ? "none" : "";
	btnScoreVisible.style.display = projectType === "fretboard" ? "none" : "";

}

function changeProjectType(oldType) {

	setProjectControlsType();

	switch (projectType) {

		case "fretboard":

			break;

		case "sequence":

			cmbChords.disabled = true;
			btnNutMode.disabled = true;

			break;

		case "chord":

			cmbChords.disabled = false;
			btnNutMode.disabled = false;

			break;

	}

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

function setControlsEnabled(enabled) {

    const controls = document.querySelectorAll(
        "input, select, button"
    );

    controls.forEach(control => {
        control.disabled = !enabled;
    });

    btnResetScorePalyer.disabled = false;

    if (!enabled) closeProjectsPanel();

}

function updateFigureOptions() {
    const previousValue = cmbFigure.value;
    const denominator = cmbBar.value.split("/")[1];
    cmbFigure.innerHTML = "";
    if (denominator === "4") {
        cmbFigure.innerHTML = `
            <option value="1">Negra</option>
            <option value="2">Corchea</option>
            <option value="4">Semicorchea</option>
        `;
	cmbFigure.disabled = false;
    } else if (denominator === "8") {
        cmbFigure.innerHTML = `<option value="2">Corchea</option>`;
	cmbFigure.disabled = true;
    }
    const option = cmbFigure.querySelector(`option[value="${previousValue}"]`);
    if (option) option.selected = true;
}

function getBarGroups() {
    const time = cmbBar.value;
    const [numerator, denominator] = time.split("/").map(Number);
    if (denominator === 4) {
        projectBar = numerator;
        projectFigure = parseInt(cmbFigure.value, 10);
    } else if (time === "6/8") {
        projectBar = 2;
        projectFigure = 3;
    } else if (time === "9/8") {
        projectBar = 3;
        projectFigure = 3;
    } else if (time === "12/8") {
        projectBar = 4;
        projectFigure = 3;
    } else if (time === "5/8") {
        projectBar = 1;
        projectFigure = 5;
    } else if (time === "7/8") {
        projectBar = 1;
        projectFigure = 7;
    }
}

function setBarGroups() {

	if (projectFigure === 3) {

		if (projectBar === 2) {

			cmbBar.value = "6/8";

		} else if (projectBar === 3) {

			cmbBar.value = "9/8";

		} else if (projectBar === 4) {

			cmbBar.value = "12/8";

		}

	} else if (projectFigure === 5) {

		cmbBar.value = "5/8";

	} else if (projectFigure === 7) {

		cmbBar.value = "7/8";

	} else {

		cmbBar.value = projectBar + "/4";

		cmbFigure.value = projectFigure;

	}

	updateFigureOptions();

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

	if (workspaceProjectsPanel.classList.contains("panelHidden")) {

		openProjectsPanel();

	}else{

		closeProjectsPanel();
	}
}

function openProjectsPanel(){

	workspaceProjectsPanel.classList.remove("panelHidden");

	btnShowProjectPanel.classList.add("active");

}

function closeProjectsPanel(){

	workspaceProjectsPanel.classList.add("panelHidden");

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

			if (window.innerWidth <= maxMediaScreenWidth) {
				noteText.value = "";
				noteText.focus();
			}

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
		topReset
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
				topTitleViewMode
			);

			menuSelectorText.textContent = "PROYECTOS";
			menuSelectorIcon.className = "fa-solid fa-folder";

			break;

		case "edit":

			btnEdicion.classList.add("active");

			showMenuControls(
				topTitle,
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
				topFretboardScale,
				topDiapason,
				topFrets,
				topNumbers,
				topOrientation
			);

			menuSelectorText.textContent = "MÁSTIL";
			menuSelectorIcon.className = "fa-solid fa-guitar";

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

function updateOrientationButtons(){

	btnVertical.classList.toggle("active",orientation === "vertical");
	btnHorizontal.classList.toggle("active",orientation === "horizontal");

	btnRotate.classList.toggle("active",rotated);

}

function scrollToFretboardNut(){

	requestAnimationFrame(() => {

		if (!workspaceFretboard) return;

		switch (rotation){

			case 0:
				workspaceFretboard.scrollTop = 0;

				break;

			case 180:
				workspaceFretboard.scrollTop = workspaceFretboard.scrollHeight;

				break;

			case 270:
				workspaceFretboard.scrollLeft = 0;

				break;

			case 90:
				workspaceFretboard.scrollLeft = workspaceFretboard.scrollWidth;

				break;
		}

	});

}

function setLayout() {

	cursor.style.color = colorPicker.value;

	const isMobile = window.innerWidth <= maxMediaScreenWidth;

	if (isMobile) {

		cursor.style.display = "none";

		closeProjectsPanel();

		closeTopControls();

	} else {

		cursor.style.display = "";

		openTopControls();

	}

	setWorkspaceLayout();

	if (isFretboardVisible) resizeCanvas();

	if (isScoreVisible) scoreRender();

}

function updateProjectUI(){

	setWorkspaceLayout();

	setPlayerValues();

}

function setWorkspaceLayout(){

	//------------------------------------------------
	// Nunca permitir que ambos estén ocultos
	//------------------------------------------------

	if (!isScoreVisible && !isFretboardVisible) {

		isFretboardVisible = true;

	}

	//------------------------------------------------
	// Mostrar / ocultar
	//------------------------------------------------

	workspaceFretboard.style.display = isFretboardVisible ? "" : "none";

	workspaceScore.style.display = isScoreVisible ? "" : "none";

	//------------------------------------------------
	// Configurar layout
	//------------------------------------------------

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

	//------------------------------------------------
	// Estado de los botones
	//------------------------------------------------

	btnFretboardVisible.classList.toggle("active",isFretboardVisible);

	btnScoreVisible.classList.toggle("active",isScoreVisible);

}

function setPlayStopButton(button, isPlaying, showText = true){

	if (isPlaying) {

		button.innerHTML = showText
			? "<i class='fa-solid fa-stop'></i><span>Stop</span>"
			: "<i class='fa-solid fa-stop'></i>";

		if (chkAutoScroll.checked) scoreFloatingStopButton.style.display = "flex";

	} else {

		button.innerHTML = showText
			? "<i class='fa-solid fa-play'></i><span>Play</span>"
			: "<i class='fa-solid fa-play'></i>";


		scoreFloatingStopButton.style.display = "none";
	}

	button.classList.toggle("buttonPlay", !isPlaying);
	button.classList.toggle("buttonStop", isPlaying);

}

function parseBoolean(value, defaultValue = false) {

	if (value === undefined || value === null) {
		return defaultValue;
	}

	if (typeof value === "boolean") {
		return value;
	}

	if (typeof value === "string") {
		return value.toLowerCase() === "true";
	}

	return Boolean(value);
}


// METRONOMO TIMELINE

function buildHtmlDivsTimeline() {

    metronome_timeline.innerHTML = "";

    let indice = 0;

    for (let beat = 1; beat <= metronome.beatsPerBar; beat++) {

        for (let sub = 1; sub <= metronome.subdivision; sub++) {

            const div = document.createElement("div");

            div.className = "metronome_pulse";
            div.dataset.index = indice++;

            div.classList.add(sub === 1 ? "metronome_beat" : "metronome_sub");

            if (sub === metronome.subdivision && beat < metronome.beatsPerBar) div.classList.add("metronome_bar");

            metronome_timeline.appendChild(div);

        }

    }

}

function updateTimeline(beat,subBeat) {

    const pulses = document.querySelectorAll(".metronome_pulse");

    pulses.forEach(pulse =>
        pulse.classList.remove("metronome_current")
    );

    const index = (beat - 1) * metronome.subdivision + (subBeat - 1);

    if (pulses[index]) pulses[index].classList.add("metronome_current");

}

function resetPlaybackTimeline(){

	buildHtmlDivsTimeline();

	metronome_Info.innerHTML = "Metrónomo: <b>1 / 1</b>";

	player_repeatInfo.innerHTML = "Repetición: <b>1</b>&nbsp;Compás: <b>1</b>";

	countBars = 1;
	repetitionSequence = 1;
	firstTick = true;

//	window.scrollTo({top: 0,left: 0,behavior: "smooth"});

}

function resetMetronomeTimeline(){

	buildHtmlDivsTimeline();

	metronome_Info.innerHTML = "Metrónomo: <b>1 / 1</b>";

}

function setMetronmeOnPlaying(value){

    player.setMetronomeOn(value);

    if (value){
	metronome_timeline.style.display = "flex";
    }else{
	metronome_timeline.style.display = "none";

	metronome_Info.innerHTML = "";
    }

}


//==================================================
// CLIPBOARD
//==================================================

async function copyCanvasToClipboard() {

    try {

        const blob = await new Promise(resolve =>
            canvas.toBlob(resolve, "image/png")
        );

        await navigator.clipboard.write([
            new ClipboardItem({
                "image/png": blob
            })
        ]);

        alert("Imagen copiada al portapapeles.");

    }
    catch (err) {

        console.error(err);

        alert("No ha sido posible copiar la imagen.");

    }

}

function downloadCanvas() {

    const link = document.createElement("a");

    link.download = "fretboard.png";

    link.href = canvas.toDataURL("image/png");

    link.click();

}

function clipboardWriteText(txt){

	navigator.clipboard.writeText(txt);

	alert(txt + " copiado en el portapapeles.");

}

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