"use strict";

/*============================
MAIN FUNCTIONS
==============================*/

async function initializeApp() {

	try {

		// USUARIO Y CONTROLES ----------------------

		setLoadingProgress(0, "Configurando interface de usuario...");

		getURLParams();

		await loadXML("user",xmlUsers);

		setUserState();

		configureUserControls();

		setEditMode("view");


		// PROJECTS ----------------------

		setLoadingProgress(10, "Cargando proyectos...");

		await loadXML("project",xmlProjects);

		await initializeProjects();


		// LAYOUT ----------------------

		setLoadingProgress(20, "Configurando página...");

		setOrientation(orientation);

		setLayout();


		// IMÁGENES ----------------------

		if (!(appMode === "Guest" && projectType === "score")){

			setLoadingProgress(30, "Cargando imágenes...");

			await loadFretboardImage();

			console.log("Imágenes cargadas");

			resizeCanvas();

		}


		// PLAYER ----------------------

		if (!(appMode === "Guest" && projectType === "fretboard")){

			setLoadingProgress(40, "Cargando instrumentos...");

			instruments = {
				piano: createSampler("piano"),
				cguitar: createSampler("cguitar")
			};

			setLoadingProgress(50, "Configurando metrónomo...");

			metronome = new Metronome();

			setLoadingProgress(60, "Configurando reproductor...");

			instrument = instruments[currentInstrument];

			player = new MusicPlayer(instrument,metronome);

			setPlayerValues();

			console.log("Player cargado");

		}


		// NOTAS ----------------------

		if (!(appMode === "Guest" && projectType === "fretboard")){

			setLoadingProgress(70, "Cargando notas...");

			aSequence = buildOrderedSequence();

			aChords = buildOrderedChords();

			loadArrayNotas();

			console.log("Notas cargadas");

		}


		// MÁSTIL ----------------------

		if (!(appMode === "Guest" && projectType === "score")){

			setLoadingProgress(80, "Renderizando mástil...");

			resizeCanvas();

			scrollToFretboardNut();

			console.log("Mástil renderizado");
		
		}


		// SCORE ----------------------

		if (!(appMode === "Guest" && projectType === "fretboard")){

			setLoadingProgress(90, "Renderizando partitura...");

			if (isScoreVisible) {

				scoreRender();

				console.log("Partitura renderizada");

			}

		}


		// FIN ----------------------

		setLoadingProgress(100, "Carga completada");

		hideLoadingScreen();


	} catch (error) {

		console.error("Error durante la carga:",error);

		setErrorLoadingProgress(error);

	}

}

function getURLParams(){

	const params = new URLSearchParams(window.location.search);

	user = params.get("user");

	isAdmin = params.has("admin") || user === "admin";

	lib = params.get("lib");

	currentProjectId = params.get("project");

}

function setUserState(){

	isMobile = window.innerWidth <= maxMediaScreenWidth;

	isUserActive = true;

	appMode = "Designer";

	if (!isAdmin) {

		if (user !== null){

			const currentUser = users.find(item => item.username === user);
	
			if (currentUser) {

				userName = currentUser.name;

				if (!currentUser.active){
					showAlert("El usuario '" + userName +"' no está activo.", "error");
					isUserActive = false;
				}else{
					isUserActive = true;
				}

			}else{
				showAlert("El usuario '" + user + "' no existe.", "error");
				isUserActive = true;
				user = null;
			}
		}

		if (user === null && currentProjectId !== null) {

			appMode = "Guest";
		}

	}else{
		user = "admin";
		subtituleText.textContent = "Fretboard Designer";
	}

	if (!isAdmin && user !== null) xmlProjects = xmlProjects.substring(0,xmlProjects.indexOf("/") + 1) + user + ".xml";

	if (lib !== null && isUserActive) xmlProjects = xmlProjects.substring(0,xmlProjects.indexOf("/") + 1) + lib + ".xml";

}

function configureUserControls(){

	if (!isAdmin) {

		topLibrary.style.display = "none";
		topLibraryInfo.style.display = "none";
		btnSaveProject.style.display = "none";
		btnDelProject.style.display = "none";
		topTitle.style.display = "none";
		topCategory.style.display = "none";
		topShare.style.display = "none";

		btnProyectos.style.display = "none";
		btnProyectosPopup.style.display = "none";
		btnAudio.style.display = "none";
		btnAudioPopup.style.display = "none";

		btnUser.classList.remove("admin");
		btnUser.classList.add("user");

		if (appMode === "Guest"){

			setMenu("fretboard");

			topFretboardDownload.style.display = "none";
			topScoreDownload.style.display = "none";

			btnShowProjectPanel.style.display = "none";

			btnUser.querySelector("i").className = "fa-solid fa-user-lock";
			txtUserTitle.textContent = "Invitado";

		}else{

			if (user === null) {

				setMenu("edit");

				btnShowProjectPanel.style.display = "none";

				btnUser.querySelector("i").className = "fa-solid fa-user-tie";
				txtUserTitle.textContent = "Invitado";

			}else{

				setMenu("fretboard");

				if (!isUserActive){
					btnUser.querySelector("i").className = "fa-solid fa-user-lock";
				}else{
					btnUser.querySelector("i").className = "fa-solid fa-user-tie";
				}
				txtUserTitle.textContent = userName;

			}

		}

		if (!isUserActive){

			setControlsEnabled(false);

			btnProyectos.style.display = "none";
			btnProyectosPopup.style.display = "none";
			btnEdicion.style.display = "none";
			btnEdicionPopup.style.display = "none";

			btnFretboard.disabled = false;
			btnScore.disabled = false;
			btnPlayer.disabled = false;
			btnFretboardPopup.disabled = false;
			btnScorePopup.disabled = false;
			btnPlayerPopup.disabled = false;

			btnShowProjectPanel.disabled = false;
			btnToggleLibrary.disabled = false;

			topFretboardDownload.style.display = "none";
			topScoreDownload.style.display = "none";

			btnUser.querySelector("i").className = "fa-solid fa-user-lock";

			btnPlayStop.disabled = true;

			btnMetronome.style.display = "none";
			btnMetronomePopup.style.display = "none";

		}

	} else {

		setMenu("projects");

		topProjectGuest.style.display = "none";
		topTitleViewMode.style.display = "none";

		btnUser.classList.remove("user");
		btnUser.classList.add("admin");
		btnUser.querySelector("i").className = "fa-solid fa-user-shield";
		txtUserTitle.textContent = "Admin";

	}

	cursor.innerHTML = "";

	workspaceTimeInfo.style.display = "none";

	updateTopBarMenu();

	if (isMobile){
		menuSelectorText.textContent = "MENÚ";
		menuSelectorIcon.className = "fa-solid fa-gear fa-fw";
	}

}

function setMenu(m){

	// alternar abrir-cerrar si se pulsa el mismo menú
	if (menuOpen === m) {

		if (topControlsContainer.classList.contains("isOpen")) {

			closeTopControls();

		} else {

			openTopControls();

		}

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
		topScroll,
		topColor,
		topNoteNames,
		topFrets,
		topNumbers,
		topOrientation,
		topFretboardScale,
		topDiapason,
		topInstrument,
		topTempo,
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
		topLibraryInfo,
		topProjectGuest
	].forEach(control => control.classList.add("isHidden"));

	switch (menuOpen){

		case "projects":

			btnProyectos.classList.add("active");

			showMenuControls(
				topProject,
				topLibraryInfo,
				topCategory,
				topLibrary,
				topShare,
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
				topNoteNames,
				topForm,
				topChords,
				topProjectGuest
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
				topOrientation,
				topFretboardDownload
			);

			menuSelectorText.textContent = "MÁSTIL";
			menuSelectorIcon.className = "fa-solid fa-guitar";

			break;

		case "player":

			btnPlayer.classList.add("active");

			showMenuControls(
				topRepeats,
				topTempo,
				topInstrument,
				topArticulation,
				topVolumen
			);

			menuSelectorText.textContent = "PLAYER";
			menuSelectorIcon.className = "fa-solid fa-radio";

			break;

		case "score":

			btnScore.classList.add("active");

			showMenuControls(
				topTitleViewMode,
				topTempo,
				topTimeSignature,
				topScoreStaves,
				topScoreScale,
				topScroll,
				topScoreMargin,
				topScoreDownload
			);

			menuSelectorText.textContent = "PARTITURA";
			menuSelectorIcon.className = "fa-solid fa-music";

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

	openTopControls();

}

async function initializeProjects() {

    // --------------------------------
    // INFORMACION DE LIBRERIA
    // --------------------------------

    setLibraryInfo(xmlProjects.substring(xmlProjects.indexOf("/") + 1));

    // --------------------------------
    // NO HAY BIBLIOTECA
    // --------------------------------

    if (!projectsLoaded) {

        initializeEmptyProject();

        libraryNameText.disabled = true;
        libraryDescText.disabled = true;

        btnSaveProject.disabled = true;
        btnDelProject.disabled = true;

        cmbProjectCategory.disabled = true;
        btnNewCategory.disabled = true;
        btnDelCategory.disabled = true;

        return;

    }

    // --------------------------------
    // RENDERIZAR BIBLIOTECA
    // --------------------------------

    renderProjectsLibrary();

    // --------------------------------
    // ABRIR PROYECTO DE LA URL
    // --------------------------------

    if (currentProjectId !== null && isUserActive) {

        const project = projects.find(project => project.id === currentProjectId);

        if (project) {

            await selectProject(project);

        } else {

            showAlert("No se encontró el proyecto '" + currentProjectId + "'","error");

            initializeEmptyProject();

        }

    }else if (user !== null && isUserActive) {

        // --------------------------------
        // ABRIR PRIMER PROYECTO
        // --------------------------------

        const firstProject = getFirstProject();

        if (firstProject) {

            await selectProject(firstProject);

        } else {

            initializeEmptyProject();

        }

    } else {

        // --------------------------------
        // DISEÑADOR SIN USUARIO
        // --------------------------------

        initializeEmptyProject();

    }

    // --------------------------------
    // PANEL
    // --------------------------------

    if (!isMobile && appMode !== "Guest" && user !== null) openProjectsPanel();

}


function initializeEmptyProject() {

    currentProjectId = generateProjectId();

    resetControlsValues("init");

}

function setProjectControlsDisabled(){

	cmbTipoSecuencia.disabled = projectType === "fretboard";
	chkMetronomeOn.disabled = projectType === "fretboard";

	cmbChords.disabled = projectType !== "chord" ? "none" : "flex";
	btnNewChord.disabled = projectType !== "chord" ? "none" : "flex";
	btnDelChord.disabled = projectType !== "chord" ? "none" : "flex";

	btnScore.disabled = projectType === "fretboard";
	btnScorePopup.disabled = projectType === "fretboard";
	btnPlayer.disabled = projectType === "fretboard";
	btnPlayerPopup.disabled = projectType === "fretboard";
	btnAudio.disabled = projectType === "fretboard";
	btnAudioPopup.disabled = projectType === "fretboard";

	btnFretboardVisible.disabled = projectType === "fretboard";
	btnScoreVisible.disabled = projectType === "fretboard";

	if (isUserActive) btnPlayStop.disabled = projectType === "fretboard";

	if (appMode === "Guest" && projectType === "fretboard"){

		btnScore.disabled = true;
		btnScorePopup.disabled = true;
		btnPlayer.disabled = true;
		btnPlayerPopup.disabled = true;
		btnAudio.disabled = true;
		btnAudioPopup.disabled = true;

		btnPlayStop.disabled = true;
		btnFretboardVisible.disabled = true;
		btnScoreVisible.disabled = true;
	}

}

function setLibraryInfo(fileName){

	const appUrl = window.location.href.substring(0,window.location.href.lastIndexOf("/") + 1);

	projectPanelHeaderTitle.textContent = libraryName === "" ? "Sin Nombre" : libraryName;

	let txtInfo = "";

	if (isAdmin){
		txtInfo = txtInfo + "<i><a href='" + appUrl;
		if (xmlType !== "Server") txtInfo = txtInfo + "projects/";
		txtInfo = txtInfo + xmlProjects + "' target='_blank'>" + fileName + "</a></i><br>";
	}

	if (libraryDesc !== "") txtInfo = txtInfo + libraryDesc;

	projectPanelInfo.innerHTML = txtInfo;

	if (txtInfo === "") projectPanelInfo.style.display = "none";

}

async function loadXML(type,file) {

	try {

		const response = await fetch(file);

		if (!response.ok) {
			throw new Error("No se pudo cargar " + file);
		}

		const xmlText = await response.text();

		const xml = parseXML(xmlText);

		if (!xml) return false;

		switch (type) {

			case "user":

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

function parseXML(xmlText) {

	const parser = new DOMParser();

	const xml = parser.parseFromString(xmlText,"application/xml");

	const parserError = xml.querySelector("parsererror");

	if (parserError) {
		throw new Error("El archivo XML no tiene un formato válido.");
	}

	return xml;

}

function parseUsersXml(xml) {

	const u = [...xml.querySelectorAll("user")].map(node => ({

		id: node.getAttribute("id"),
		username: node.getAttribute("username"),
		name: node.getAttribute("name"),
		email: node.getAttribute("email"),
		pass: node.getAttribute("pass"),
		permits: node.getAttribute("permits"),
		active: node.getAttribute("active") === "true",
		alta: node.getAttribute("alta"),
		avatar: node.getAttribute("avatar")
	}));

	return u;

}

function resetControlsValues(state){

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
		projectType = "sequence";
		countBars = 0;
		repetitionSequence = 2;
		isFretboardVisible = true;
		isScoreVisible = false;
		tipoSecuencia = "up";
		swing = false;
		metronomeOn = true;
		inlays = true;
		fretNumbers = 1;
		bpm = 90;
		key = "C";
		scoreStaves = "all";

/*
		rotation = 0;
		rotated = false;
		fretboardStyle = "maple";
		showFretNumbers = false;
		scoreLayout = "vertical";
		currentInstrument = "piano";
*/

	}

	titleText.value = projectTitle;
	workspaceTitleText.textContent = projectTitle === "" ? "Proyecto nuevo sin título" : projectTitle;

	chkShowTitle.checked = false;
	chkScoreTitle.checked = false;
	chkScoreTitleViewMode.checked = false;

	numFrets.value = fretCount;
	sliderFrets.value = fretCount;
	sliderFrets.title = fretCount;

	btnDisplay.classList.toggle("active", displayMode);
	chkInlays.disabled = displayMode === false;
	chkInlays.disabled = !isUserActive;
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

	cmbChords.value = 0;

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

	cmbProjectCategory.disabled = false;
	btnNewCategory.disabled = false;
	btnDelCategory.disabled = false;

	if (state !== "loadProject"){

		resetComboChords();

		notes = [];
		barreNotes = [];
		nutNotes = Array(stringCount).fill(null);

		aSequence = buildOrderedSequence();
		aChords = buildOrderedChords();

		loadArrayNotas();

		noteOrder = 0;

		btnPlayStop.disabled = true;

	}else{

		loadComboChords();

	}

	changeProjectType(projectType);

	setEditMode("view");

	setOrientation(orientation);

	setWorkspaceLayout();

	history = [];

}

function changeProjectType(oldType) {

	setProjectControlsDisabled();

	switch (projectType) {

		case "fretboard":

			cmbChords.disabled = true;
			btnNewChord.disabled = true;
			btnDelChord.disabled = true;

			setWorkspaceLayout();

			break;

		case "sequence":

			cmbChords.disabled = true;
			btnNewChord.disabled = true;
			btnDelChord.disabled = true;

			break;

		case "chord":

			cmbChords.disabled = false;
			btnNewChord.disabled = false;
			btnDelChord.disabled = false;

			break;

	}

}

function updateTopBarMenu() {

	const topBarWidth = topBar.clientWidth;

	const brandWidth = brand.offsetWidth;

	const toggleWidth = btnUser.offsetWidth;


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

    document.querySelectorAll("#topControlsContainer span").forEach(span => {
	span.style.opacity = enabled ? 1 : "0.55";
    });

    if (cmbProjectType !== "chord") {

	cmbChords.disabled = true;
	btnNewChord.disabled = true;
	btnDelChord.disabled = true;

    }

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
//	cmbFigure.disabled = false;
    } else if (denominator === "8") {
        cmbFigure.innerHTML = `<option value="2">Corchea</option>`;
//	cmbFigure.disabled = true;
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

	btnShowProjectPanel.title = "Ocultar librería";
}

function closeProjectsPanel(){

	workspaceProjectsPanel.classList.add("panelHidden");

	btnShowProjectPanel.classList.remove("active");

	btnShowProjectPanel.title = "Ver librería";

}

function openTopControls(){

	topControlsContainer.classList.add("isOpen");

}

function closeTopControls() {

	topControlsContainer.classList.remove("isOpen");

}

function setEditMode(newMode) {

	if (editMode === newMode) newMode = "view";

	editMode = newMode;

	btnEdit.classList.toggle("active",newMode === "note");
	btnErase.classList.toggle("active",newMode === "erase");
	btnBarre.classList.toggle("active",newMode === "barre");

	btnBarre.setAttribute("aria-pressed",String(newMode === "barre"));

	switch (newMode) {

		case "view":

			cursor.innerHTML = '';

			break;

		case "note":

			cursor.innerHTML = '<i class="fa-solid fa-pencil"></i>';

			if (!isMobile) {
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

}

function showMenuControls(...controls){

	controls.forEach(control => control.classList.remove("isHidden"));

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

	if (isMobile) {

		cursor.style.display = "none";

		closeProjectsPanel();

		closeTopControls();

	} else {

		cursor.style.display = "";

		openTopControls();

	}

	setWorkspaceLayout();

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

	player_repeatInfo.innerHTML = "Loop: <b>1</b>&nbsp;Compás: <b>1</b>";

	// Solo ocultar si realmente hemos parado. Durante el arranque/count-in isPlaying sigue siendo true.
	if (!isPlaying && !chkMetronomeOn.checked) workspaceTimeInfo.style.display = "none";

	countBars = 1;
	repetitionSequence = 1;
	firstTick = true;

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

        showAlert("Imagen copiada al portapapeles.", "success");

    }
    catch (err) {

        console.error(err);

        showAlert("No ha sido posible copiar la imagen.", "error");

    }

}

function downloadCanvas() {

    const link = document.createElement("a");

    const titulo = workspaceTitleText.value;

    link.download = titulo + ".png";

    link.href = canvas.toDataURL("image/png");

    link.click();

}

function setLoadingProgress(percent,text){

	loadingProgressBar.style.width = percent + "%";
	loadingText.textContent = text;
}

function hideLoadingScreen() {

	loadingSpinner.classList.add("isCompleted");

	setTimeout(() => {

		loadingScreen.classList.add("isHidden");

		setTimeout(() => {loadingScreen.remove();}, 550);

	}, 500);

}

function setErrorLoadingProgress(err){

	loadingText.innerHTML = "<i class='fa-solid fa-circle-exclamation'></i> Error " + loadingText.textContent + "<br><br><span>" + err + "</span>";
	loadingText.classList.add("error");
	loadingSpinner.style.display = "none";

}

function showAlert(message, type = "success", duration = 2500) {

	// Cancelar desaparición anterior

	clearTimeout(alertTimeout);

	// Mensaje

	alertMessage.textContent = message;

	// Tipo

	appAlert.classList.remove("success", "error");

	if (type === "success") {

		appAlert.classList.add("success");

		alertIcon.className = "fa-solid fa-circle-check";

	}  else if (type === "error") {

		appAlert.classList.add("error");

		alertIcon.className = "fa-solid fa-circle-xmark";

	} else {

		appAlert.classList.add("info");

		alertIcon.className = "fa-solid fa-circle-info";

	}

	// Mostrar

	appAlert.classList.add("show");

	// Ocultar después del tiempo indicado

	alertTimeout = setTimeout(() => {

		appAlert.classList.remove("show");

	}, duration);

}

function loadArrayNotas() {

	NOTAS = [];
	ACORDES = [];
	scoreArray = [];

	const sequenceUp = [...aSequence];
	const sequenceDown = [...aSequence].reverse();

	// --------------------------------
	// AGRUPAR ACORDES
	// --------------------------------

	const chordGroups = [];

	let currentChord = null;

	for (const item of aChords) {

		if (item.chord !== currentChord) {

			currentChord = item.chord;

			chordGroups.push([]);

		}

		chordGroups[chordGroups.length - 1].push(item);

	}

	// --------------------------------
	// COPIAS DE LOS GRUPOS
	// --------------------------------

	const chordsUp = [...chordGroups];

	const chordsDown = [...chordGroups].reverse();

	// --------------------------------
	// CONSTRUIR RECORRIDO DE ACORDES
	// --------------------------------

	let chordSequence = [];

	switch (tipoSecuencia) {

		// --------------------------------
		// GRAVE → AGUDO
		// --------------------------------

		case "up":

			chordSequence = [
				...chordsUp
			];

			break;


		// --------------------------------
		// AGUDO → GRAVE
		// --------------------------------

		case "down":

			chordSequence = [
				...chordsDown
			];

			break;


		// --------------------------------
		// GRAVE → AGUDO → GRAVE
		// --------------------------------

		case "up-down":

			chordSequence = [
				...chordsUp,
				...chordsDown
			];

			break;


		// --------------------------------
		// AGUDO → GRAVE → AGUDO
		// --------------------------------

		case "down-up":

			chordSequence = [
				...chordsDown,
				...chordsUp
			];

			break;

	}

	// --------------------------------
	// SCORE ARRAY
	// --------------------------------

	if (projectType === "sequence") {

		switch (tipoSecuencia) {

			case "up":

				scoreArray = [
					...sequenceUp
				];

				break;

			case "down":

				scoreArray = [
					...sequenceDown
				];

				break;

			case "up-down":

				scoreArray = [
					...sequenceUp,
					...sequenceDown
				];

				break;

			case "down-up":

				scoreArray = [
					...sequenceDown,
					...sequenceUp
				];

				break;

		}

	}

	else {

		// --------------------------------
		// SCORE DE ACORDES
		// --------------------------------

		scoreArray = [];

		chordSequence.forEach((group, index) => {

			group.forEach(item => {

				scoreArray.push({

					chord: index,
					string: item.string,
					fret: item.fret,
					note: item.note

				});

			});

		});

	}

	// --------------------------------
	// NOTAS
	// --------------------------------

	NOTAS = scoreArray.map(item => item.note);

	// --------------------------------
	// ACORDES
	// --------------------------------

	ACORDES = chordSequence.map(group => {

		return group.map(item => item.note);

	});

}

function loadComboChords() {

	cmbChords.innerHTML = "";

	let maxChord = -1;

	// --------------------------------
	// NOTES
	// --------------------------------

	notes.forEach(note => {

		const chord = Number(note.chord);

		if (Number.isInteger(chord)) {

			maxChord = Math.max(maxChord, chord);

		}

	});

	// --------------------------------
	// BARRE NOTES
	// --------------------------------

	barreNotes.forEach(barre => {

		const chord = Number(barre.chord);

		if (Number.isInteger(chord)) {

			maxChord = Math.max(maxChord, chord);

		}

	});

	// --------------------------------
	// NUT NOTES
	// --------------------------------

	nutNotes.forEach(note => {

		if (!note) return;

		const chord = Number(note.chord);

		if (Number.isInteger(chord)) {

			maxChord = Math.max(maxChord, chord);

		}

	});

	// --------------------------------
	// SI NO HAY ACORDES
	// --------------------------------

	if (maxChord < 0) {

		resetComboChords();

		return;

	}

	// --------------------------------
	// CREAR OPTIONS
	// --------------------------------

	for (let chord = 0; chord <= maxChord; chord++) {

		const option = document.createElement("option");

		option.value = chord;
		option.textContent = "Acorde " + (chord + 1);

		cmbChords.appendChild(option);

	}

	// --------------------------------
	// SELECCIONAR EL PRIMERO
	// --------------------------------

	cmbChords.value = 0;

}

function resetComboChords() {

	cmbChords.innerHTML = "";

	const option = document.createElement("option");

	option.value = 0;
	option.textContent = "Acorde 1";

	cmbChords.appendChild(option);

	cmbChords.value = 0;

}

function addChord() {

	const nextChord = cmbChords.options.length;

	const option = document.createElement("option");

	option.value = nextChord;
	option.textContent = "Acorde " + (nextChord + 1);

	cmbChords.appendChild(option);

	cmbChords.selectedIndex = cmbChords.options.length - 1;

}

function delChord() {

	const selectedIndex = cmbChords.selectedIndex;

	// --------------------------------
	// NO PERMITIR BORRAR ACORDE 1
	// --------------------------------

	if (selectedIndex <= 0) {
		return;
	}

	const selectedChord = Number(cmbChords.value);

	// --------------------------------
	// ELIMINAR Y RENUMERAR NOTES
	// --------------------------------

	notes = notes
		.filter(note => {

			return Number(note.chord) !== selectedChord;

		})
		.map(note => {

			const chord = Number(note.chord);

			return {
				...note,
				chord: chord > selectedChord
					? chord - 1
					: chord
			};

		});

	// --------------------------------
	// ELIMINAR Y RENUMERAR BARRE NOTES
	// --------------------------------

	barreNotes = barreNotes
		.filter(barre => {

			return Number(barre.chord) !== selectedChord;

		})
		.map(barre => {

			const chord = Number(barre.chord);

			return {
				...barre,
				chord: chord > selectedChord
					? chord - 1
					: chord
			};

		});

	// --------------------------------
	// ELIMINAR Y RENUMERAR NUT NOTES
	// --------------------------------

	nutNotes.forEach((note, string) => {

		if (!note) {
			return;
		}

		const chord = Number(note.chord);

		// Eliminar notas del acorde borrado
		if (chord === selectedChord) {

			nutNotes[string] = null;

			return;

		}

		// Renumerar acordes posteriores
		if (chord > selectedChord) {

			nutNotes[string].chord = chord - 1;

		}

	});

	// --------------------------------
	// ELIMINAR OPTION
	// --------------------------------

	cmbChords.remove(selectedIndex);

	// --------------------------------
	// RENOMBRAR OPTIONS
	// --------------------------------

	for (let i = 0; i < cmbChords.options.length; i++) {

		cmbChords.options[i].value = String(i);
		cmbChords.options[i].textContent = "Acorde " + (i + 1);

	}

	// --------------------------------
	// SELECCIONAR ACORDE
	// --------------------------------

	if (cmbChords.options.length > 0) {

		const newIndex = Math.min(
			selectedIndex,
			cmbChords.options.length - 1
		);

		cmbChords.selectedIndex = newIndex;

	}

	// --------------------------------
	// CARGAR NOTAS MUSICALES
	// --------------------------------

	aSequence = buildOrderedSequence();

	aChords = buildOrderedChords();

	loadArrayNotas();

}
