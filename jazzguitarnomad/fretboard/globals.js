"use strict";


/*==================================================
	REFERENCIAS DOM: CANVAS
==================================================*/

const workspace = document.getElementById("workspace");
const canvas = document.getElementById("workspaceCanvas");
const ctx = canvas.getContext("2d");

const cursor = document.getElementById("cursorTool");

/*==================================================
	REFERENCIAS DOM: PANELES Y DISEÑO RESPONSIVE
==================================================*/

const appLayout = document.getElementById("appLayout");
const leftPanel = document.getElementById("leftPanel");

const btnToggleTopControls = document.getElementById("btnToggleTopControls");
const topControlsContainer = document.getElementById("topControlsContainer");

/*==================================================
	REFERENCIAS DOM: MENU
==================================================*/

const btnProyectos = document.getElementById("btnProyectos");
const btnEdicion = document.getElementById("btnEdicion");
const btnVista = document.getElementById("btnVista");
const btnPlayer = document.getElementById("btnPlayer");

const btnMenuSelector = document.getElementById("btnMenuSelector");
const menuPopup = document.getElementById("menuPopup");

/*==================================================
	REFERENCIAS DOM: CONTROLES DEL DIAPASÓN
==================================================*/

const fretboardPicker = document.getElementById("fretboardPicker");
const colorPicker = document.getElementById("colorPicker");
const colorPreview = document.getElementById("colorPreview");
const figurePicker = document.getElementById("figurePicker");
const midiPicker = document.getElementById("midiPicker");

const noteText = document.getElementById("noteText");
const titleText = document.getElementById("titleText");
const showTitle = document.getElementById("showTitle");
const projectTitleText = document.getElementById("projectTitleText");

const numFrets = document.getElementById("numFrets");
const btnLessFrets = document.getElementById("btnLessFrets");
const btnMoreFrets = document.getElementById("btnMoreFrets");

const numberFrets = document.getElementById("numberFrets");
const btnLessNumberFrets = document.getElementById("btnLessNumberFrets");
const btnMoreNumberFrets = document.getElementById("btnMoreNumberFrets");

const btnNutMode = document.getElementById("btnNutMode");

const btnMaple = document.getElementById("btnMaple");
const btnRosewood = document.getElementById("btnRosewood");
const btnBlank = document.getElementById("btnBlank");


/*==================================================
	REFERENCIAS DOM: GRUPOS DE HERRAMIENTAS
==================================================*/

const topProject = document.getElementById("topProject");
const topCategory = document.getElementById("topCategory");
const topLibrary = document.getElementById("topLibrary");
const topTitle = document.getElementById("topTitle");
const topShare = document.getElementById("topShare");
const topEdit = document.getElementById("topEdit");
const topUndo = document.getElementById("topUndo");
const topColor = document.getElementById("topColor");
const topFrets = document.getElementById("topFrets");
const topNumbers = document.getElementById("topNumbers");
const topFretboard = document.getElementById("topFretboard");
const topView = document.getElementById("topView");
const topOrientation = document.getElementById("topOrientation");
const topMidi = document.getElementById("topMidi");
const topPlayStop = document.getElementById("topPlayStop");
const topMetronome = document.getElementById("topMetronome");
const topTempo = document.getElementById("topTempo");
const topForm = document.getElementById("topForm");
const topTimeSignature = document.getElementById("topTimeSignature");

/*==================================================
	REFERENCIAS DOM: PLAYER
==================================================*/

const btnPlayStop = document.getElementById("btnPlayStop");
const btnStop = document.getElementById("btnStop");
const btnLoop = document.getElementById("btnLoop");
const btnMetronome = document.getElementById("btnMetronome");
const btnLessTempo = document.getElementById("btnLessTempo");
const btnMoreTempo = document.getElementById("btnMoreTempo");
const numTempo = document.getElementById("numTempo");
const btnBothDesc = document.getElementById("btnBothDesc");
const btnBothAsc = document.getElementById("btnBothAsc");
const btnDesc = document.getElementById("btnDesc");
const btnAsc = document.getElementById("btnAsc");
const btnTime4 = document.getElementById("btnTime4");
const btnTime3 = document.getElementById("btnTime3");

/*==================================================
	REFERENCIAS DOM: BARRA DE HERRAMIENTAS
==================================================*/

const btnEdit = document.getElementById("btnEdit");
const btnErase = document.getElementById("btnErase");
const btnUndo = document.getElementById("btnUndo");
const btnDisplay = document.getElementById("btnDisplay");
const btnVertical = document.getElementById("btnVertical");
const btnHorizontal = document.getElementById("btnHorizontal");
const btnRotate = document.getElementById("btnRotate");

/*==================================================
	REFERENCIAS DOM: PROYECTOS
==================================================*/

const btnNew = document.getElementById("btnNew");
const btnSave = document.getElementById("btnSave");
const btnDel = document.getElementById("btnDel");
const btnOpenLibrary = document.getElementById("btnOpenLibrary");
const btnUploadLibrary = document.getElementById("btnUploadLibrary");
const btnShare = document.getElementById("btnShare");
const btnCopy = document.getElementById("btnCopy");
const btnCopyId = document.getElementById("btnCopyId");
const chordProjectList = document.getElementById("chordProjectList");
const scaleProjectList = document.getElementById("scaleProjectList");
const otherProjectList = document.getElementById("otherProjectList");
const projectCategory = document.getElementById("projectCategory");
const projectPanelHeaderTitle = document.getElementById("projectPanelHeaderTitle");
const btnShowProjectPanel = document.getElementById("btnShowProjectPanel");
const btnToggleLibrary = document.getElementById("btnToggleLibrary");

/*==================================================
	CONFIGURACIÓN GENERAL DE LA APLICACIÓN
==================================================*/

let xmlProjects = "fretboard-projects.xml";

btnToggleLibrary.title = "Server: " + xmlProjects;

const minScreenWidth = 768;

let mode = "note";
let title = "";

let displayMode = true;

const stringCount = 6;

let fretCount = parseInt(numFrets.value);

let orientation = "horizontal";
let rotation = 90; // 0, 90, 180, 270
let rotated = false;

let showFretNumbers = false;

let menuOpen = "projects";

let wasMobile = window.innerWidth <= minScreenWidth;


/*==================================================
	GEOMETRÍA Y MEDIDAS DEL DIAPASÓN
==================================================*/

const HORIZONTAL_WIDTH = 850;
const HORIZONTAL_HEIGHT = 105;
const VERTICAL_WIDTH = HORIZONTAL_HEIGHT;
const VERTICAL_HEIGHT = HORIZONTAL_WIDTH;

const MIN_NECK_LENGTH = 420;
const MAX_NECK_LENGTH = 1200;//850;

const PIXELS_PER_FRET = 55;

const marginX = 12;
const marginBottom = 12;

let imageLeft;
let imageTop;
let imageWidth;
let imageHeight;

let boardleft = 12;
let boardtop = 12;
let boardright;
let boardbottom;
let boardWidth;
let boardHeight;

let neckBleed;
let neckRadius;

const titleMargin = 60;

let stringSpace;
let fretSpace;


/*==================================================
	NOTAS
==================================================*/

let hoverCell = null;
let hoverNut = null;

let notes = [];
let nutNotes = Array(stringCount).fill(null);
let barreNotes = [];


/*==================================================
	HISTORIAL PARA DESHACER CON CTRL+Z
==================================================*/

let history = [];
const maxHistory = 50;

/*==================================================
	PLAYER
==================================================*/

let playMode = "stop";
let playButtonMode = "ready";
let playerLoop = false;
let metronome = false;
let timeSignature = "binary";
let playerForm = "up-down";


/*==================================================
	PROYECTOS
==================================================*/

let projects = [];
let projectsFileHandle = null;

let currentProjectId = null;

let projectModified = false;

let categories = [];

/*==================================================
	IMÁGENES
==================================================*/

let fretboardStyle = "maple";

const fretboardImages = {
	maple: "fretboard-maple.png",
	rosewood: "fretboard-rosewood.png"
};

const neckImage = new Image();

let neckImageLoaded = false;
let useNeckImage = fretboardStyle !== "blank";

neckImage.onload = () => {

	neckImageLoaded = true;

	resizeCanvas();

};

neckImage.onerror = () => {

	neckImageLoaded = false;

	console.error(
		`No se pudo cargar la imagen del diapasón: ${neckImage.src}`
	);

	resizeCanvas();

};

// Cargar la imagen inicial solo si no se ha elegido "Blanco".
if (useNeckImage) {
	neckImage.src = fretboardImages[fretboardStyle];
}


/*==================================================
	RESTRICCIONES PARA USUARIOS NO ADMINISTRADORES
==================================================*/

const params = new URLSearchParams(window.location.search);
const isAdmin = params.has("admin");

if (!isAdmin) {
	btnSave.style.display = "none";
	btnDel.style.display = "none";
	btnCopy.style.display = "none";
	btnCopyId.style.display = "none";
	btnOpenLibrary.style.display = "none";
	btnUploadLibrary.style.display = "none";
	btnToggleLibrary.style.display = "none";

	menuOpen = "edit";
}

if (params.has("project")) {
	currentProjectId = params.get("project");
	projectModified = true;
}
