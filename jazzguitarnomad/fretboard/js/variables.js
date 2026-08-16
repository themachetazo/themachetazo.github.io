"use strict";


/*==================================================
	PARAMETROS
==================================================*/

const params = new URLSearchParams(window.location.search);

const user = params.get("user");

const isAdmin = user === "admin";

if (params.has("project")) {
	currentProjectId = params.get("project");
	projectModified = true;
}

/*==================================================
	REFERENCIAS DOM: CANVAS
==================================================*/

const workspace = document.getElementById("workspace");
const canvas = document.getElementById("workspaceCanvas");
const ctx = canvas.getContext("2d");
const workspaceScore = document.getElementById("workspaceScore");

const cursor = document.getElementById("cursorTool");

/*==================================================
	REFERENCIAS DOM: PANELES Y DISEÑO RESPONSIVE
==================================================*/

const appLayout = document.getElementById("appLayout");
const leftPanel = document.getElementById("leftPanel");

const btnToggleTopControls = document.getElementById("btnToggleTopControls");
const topControlsContainer = document.getElementById("topControlsContainer");

const loadingScreen = document.getElementById("loadingScreen");
const loadingText = document.getElementById("loadingText");
const loadingProgressBar = document.getElementById("loadingProgressBar");
const loadingSpinner = document.getElementById("loadingSpinner");

const subtituleText = document.getElementById("subtituleText");

/*==================================================
	REFERENCIAS DOM: MENU
==================================================*/

const mainMenu = document.getElementById("mainMenu");

const btnProyectos = document.getElementById("btnProyectos");
const btnEdicion = document.getElementById("btnEdicion");
const btnFretboard = document.getElementById("btnFretboard");
const btnPlayer = document.getElementById("btnPlayer");
const btnScore = document.getElementById("btnScore");
const btnMetronome = document.getElementById("btnMetronome");
const btnAudio = document.getElementById("btnAudio");

const btnProyectosPopup = document.getElementById("btnProyectosPopup");
const btnEdicionPopup = document.getElementById("btnEdicionPopup");
const btnFretboardPopup = document.getElementById("btnFretboardPopup");
const btnPlayerPopup = document.getElementById("btnPlayerPopup");
const btnScorePopup = document.getElementById("btnScorePopup");
const btnMetronomePopup = document.getElementById("btnMetronomePopup");
const btnAudioPopup = document.getElementById("btnAudioPopup");

const btnMenuSelector = document.getElementById("btnMenuSelector");
const menuPopup = document.getElementById("menuPopup");

/*==================================================
	REFERENCIAS DOM: CONTROLES DEL DIAPASÓN
==================================================*/

const fretboardPicker = document.getElementById("fretboardPicker");
const colorPicker = document.getElementById("colorPicker");
const colorPreview = document.getElementById("colorPreview");

const noteText = document.getElementById("noteText");
const titleText = document.getElementById("titleText");
const showTitle = document.getElementById("showTitle");
const workspaceTitleText = document.getElementById("workspaceTitleText");

const numFrets = document.getElementById("numFrets");
const btnLessFrets = document.getElementById("btnLessFrets");
const btnMoreFrets = document.getElementById("btnMoreFrets");
const sliderFrets = document.getElementById("sliderFrets");
const numberFrets = document.getElementById("numberFrets");
const btnLessNumberFrets = document.getElementById("btnLessNumberFrets");
const btnMoreNumberFrets = document.getElementById("btnMoreNumberFrets");

const btnNutMode = document.getElementById("btnNutMode");

const cmbDiapason = document.getElementById("cmbDiapason");
const chkInlays = document.getElementById("chkInlays");

const btnFretboardVisible = document.getElementById("btnFretboardVisible");

let topControlsWasOpen = true;

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
const topBuffer = document.getElementById("topBuffer");
const topAudio = document.getElementById("topAudio");
const topScoreDownload = document.getElementById("topScoreDownload");
const topChords = document.getElementById("topChords");
const topTitleViewMode = document.getElementById("topTitleViewMode");
const topTitleViewModeFretboard = document.getElementById("topTitleViewModeFretboard");
const topTitleViewModeScore = document.getElementById("topTitleViewModeScore");

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

const btnNewProject = document.getElementById("btnNewProject");
const btnSaveProject = document.getElementById("btnSaveProject");
const btnDelProject = document.getElementById("btnDelProject");
const btnOpenLibrary = document.getElementById("btnOpenLibrary");
const btnShare = document.getElementById("btnShare");
const btnCopyCanvas = document.getElementById("btnCopyCanvas");
const btnDownloadCanvas = document.getElementById("btnDownloadCanvas");
const topFretboardDownload = document.getElementById("topFretboardDownload");
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

let xmlProjects = "projects/fretboard-projects.xml";

btnToggleLibrary.title = "Server: " + xmlProjects;

const stringCount = 6;

const maxMediaScreenWidth = 768;

let mode = "view";
let menuOpen = "";

let displayMode = true;
let fretCount = 10;
let orientation = "vertical";
let rotation = 0; /* vertical: 0 / 180, horizontal: 90 / 270 */
let rotated = false;
let projectBar = 4;
let projectFigure = 1;
let scoreScale = "auto";
let projectType = "sequence";
let countBars = 0;
let repetitionSequence = 2;
let isFretboardVisible = true;
let isScoreVisible = false;
let currentInstrument = "piano";
let tipoSecuencia = "up";
let fretNumbers = 1;
let showFretNumbers = false;
let bpm = 90;
let key = "C";
let scoreStaves = "all";
let scoreLayout = "vertical";
let swing = false;
let metronomeOn = true;

/*==================================================
	GEOMETRÍA Y MEDIDAS DEL DIAPASÓN
==================================================*/

const HORIZONTAL_WIDTH = 850;
const HORIZONTAL_HEIGHT = 105;
const VERTICAL_WIDTH = HORIZONTAL_HEIGHT;
const VERTICAL_HEIGHT = HORIZONTAL_WIDTH;

const MIN_NECK_LENGTH = 420;
const MAX_NECK_LENGTH = 1320;

const PIXELS_PER_FRET = 55;

const marginX = 12;
const marginBottom = 12;

let stringSpace;
let fretSpace;

let boardleft = 12;
let boardtop = 12;
let boardright;
let boardbottom;
let boardWidth;
let boardHeight;

let imageLeft;
let imageTop;
let imageWidth;
let imageHeight;

let neckBleed;
let neckRadius;


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
	maple: "img/fretboard-maple.png",
	rosewood: "img/fretboard-rosewood.png"
};

let neckImageLoaded = false;
const neckImage = new Image();


/*==================================================
	REFERENCIAS DOM: PLAYER y PARTITURA
==================================================*/

const scoreFloatingPlay = document.getElementById("scoreFloatingPlay");

const btnLessTempo = document.getElementById("btnLessTempo");
const btnMoreTempo = document.getElementById("btnMoreTempo");
const numBpm = document.getElementById("numBpm");
const btnTime4 = document.getElementById("btnTime4");
const btnTime3 = document.getElementById("btnTime3");

const btnScoreDownloadImage = document.getElementById("btnScoreDownloadImage");
const btnNewChord = document.getElementById("btnNewChord");
const btnDelChord = document.getElementById("btnDelChord");

const cmbNoteNames = document.getElementById("cmbNoteNames");
const chkNoteNames = document.getElementById("chkNoteNames");

const cmbProjectType = document.getElementById("cmbProjectType");

const cmbBar = document.getElementById("cmbBar");
const cmbFigure = document.getElementById("cmbFigure");
const cmbTonalidad = document.getElementById("cmbTonalidad");
const cmbTipoSecuencia = document.getElementById("cmbTipoSecuencia");

const sliderBpm = document.getElementById("sliderBpm");

const samplerGate = document.getElementById("samplerGate");

const workspaceTimeInfo = document.getElementById("workspaceTimeInfo");
const player_repeatInfo = document.getElementById("player_repeatInfo");
const metronome_Info = document.getElementById("metronome_Info");

const btnPlayStop = document.getElementById("btnPlayStop");
const btnPlayStop_2 = document.getElementById("btnPlayStop_2");
const btnResetScorePalyer = document.getElementById("btnResetScorePalyer");

const btnRenderBuffer = document.getElementById("btnRenderBuffer");
const player_bufferState = document.getElementById("player_bufferState");
const cmbAudioFormat = document.getElementById("cmbAudioFormat");
const btnSaveAudio = document.getElementById("btnSaveAudio");

const cmbCountIn = document.getElementById("player_countIn");

const player_repeats = document.getElementById("player_repeats");

const player_swing = document.getElementById("player_swing");

const cmbSamplerInstrument = document.getElementById("cmbSamplerInstrument");
const sliderSamplerVolume = document.getElementById("samplerVolume");

const metronome_btnPlayStop = document.getElementById("metronome_btnPlayStop");
const metronome_timeline = document.getElementById("metronome_timeline");
const metronome_volumen = document.getElementById("metronome_volumen");
const metronome_volumen_2 = document.getElementById("metronome_volumen_2");
const metronome_on = document.getElementById("metronome_on");
const metronome_subBeatSound = document.getElementById("metronome_subBeatSound");

const chkAutoScroll = document.getElementById("chkAutoScroll");

const vexTab_container = document.querySelector(".vextab-auto");

const EVENT_X_TOLERANCE = 12;
const SCORE_SYSTEM_Y_TOLERANCE = 150;
const SCORE_PROGRESS_BAR_WIDTH = 2;
const SCORE_PROGRESS_BAR_MARGIN = 8;
let scoreSystems = [];
let scoreEvents = [];
let scoreEventIndex = 0;
let scoreSvg = null;
let scoreIsReady = false;
let scoreProgressBar = null;
let scoreCurrentSystem = -1;
const scoreNoteColor = "blue";
const scoreScrollColor = "green";

const cmbScoreScale = document.getElementById("cmbScoreScale");
const sliderScoreZoom = document.getElementById("sliderScoreZoom");
const cmbScoreStaves = document.getElementById("cmbScoreStaves");
const cmbScoreLayout = document.getElementById("cmbScoreLayout");
const sliderScoreStaveDistance = document.getElementById("sliderScoreStaveDistance");
const sliderScoreStaveMargin = document.getElementById("sliderScoreStaveMargin");
const chkScoreTitle = document.getElementById("chkScoreTitle");
const btnScoreVisible = document.getElementById("btnScoreVisible");

let scoreArray = [];
let scoreFooter = "www.jazzguitarnomad.com";

let firstTick = true;

let metronome = null;
let player = null;

let instruments = null;
let instrument = null;

let isPlaying = false;
let isPlayingBuffer = false;

let NOTAS = [];
let ACORDES = [];

const sequenceUp = [
  { string: 5, fret: 0, note: "E2" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 24, note: "E6" }
];

const sequenceDown = [
  { string: 3, fret: 4, note: "F#3" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 5, fret: 1, note: "F2" },
  { string: 0, fret: 0, note: "E4" }
];

const sequenceUpDown = [
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 4, note: "F#3" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 5, fret: 1, note: "F2" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 4, note: "F#3" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 4, note: "F#3" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 4, note: "F#3" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 4, note: "F#3" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 4, note: "F#3" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 4, note: "F#3" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 4, note: "F#3" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 4, note: "F#3" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 4, note: "F#3" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 0, fret: 0, note: "E4" }
];

const sequenceDownUp = [
  { string: 3, fret: 4, note: "F#3" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 5, fret: 1, note: "F2" },
  { string: 0, fret: 0, note: "E4" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 0, note: "E4" },
  { string: 5, fret: 1, note: "F2" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 2, note: "E3" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 0, fret: 5, note: "A4" },
  { string: 1, fret: 6, note: "F4" },
  { string: 3, fret: 4, note: "F#3" }
];

const chordsUp = [
  { chord: 0, string: 2, fret: 2, note: "A3" },
  { chord: 0, string: 1, fret: 2, note: "C#4" },
  { chord: 0, string: 0, fret: 2, note: "F#4" },
  { chord: 1, string: 5, fret: 5, note: "D3" },
  { chord: 1, string: 4, fret: 5, note: "D3" },
  { chord: 1, string: 3, fret: 5, note: "G3" }
];

const chordsDown = [
  { chord: 0, string: 5, fret: 5, note: "D3" },
  { chord: 0, string: 4, fret: 5, note: "D3" },
  { chord: 0, string: 3, fret: 5, note: "G3" },
  { chord: 1, string: 2, fret: 2, note: "A3" },
  { chord: 1, string: 1, fret: 2, note: "C#4" },
  { chord: 1, string: 0, fret: 2, note: "F#4" }
];

const chordsUpDown = [
  { chord: 0, string: 2, fret: 2, note: "A3" },
  { chord: 0, string: 1, fret: 2, note: "C#4" },
  { chord: 0, string: 0, fret: 2, note: "F#4" },
  { chord: 1, string: 5, fret: 5, note: "D3" },
  { chord: 1, string: 4, fret: 5, note: "D3" },
  { chord: 1, string: 3, fret: 5, note: "G3" },
  { chord: 2, string: 2, fret: 2, note: "A3" },
  { chord: 2, string: 1, fret: 2, note: "C#4" },
  { chord: 2, string: 0, fret: 2, note: "F#4" }
];

const chordsDownUp = [
  { chord: 0, string: 5, fret: 5, note: "D3" },
  { chord: 0, string: 4, fret: 5, note: "D3" },
  { chord: 0, string: 3, fret: 5, note: "G3" },
  { chord: 1, string: 2, fret: 2, note: "A3" },
  { chord: 1, string: 1, fret: 2, note: "C#4" },
  { chord: 1, string: 0, fret: 2, note: "F#4" },
  { chord: 2, string: 2, fret: 2, note: "A3" },
  { chord: 2, string: 1, fret: 2, note: "C#4" },
  { chord: 2, string: 0, fret: 2, note: "F#4" },
  { chord: 3, string: 5, fret: 5, note: "D3" },
  { chord: 3, string: 4, fret: 5, note: "D3" },
  { chord: 3, string: 3, fret: 5, note: "G3" }
];

const instrumentDefs = {

    ////////////////////////////////////////////////////////////
    // PIANO SALAMANDER
    ////////////////////////////////////////////////////////////

    piano: {

        urls: {

            A0: "A0.mp3",

            C1: "C1.mp3",
            "D#1": "Ds1.mp3",
            "F#1": "Fs1.mp3",
            A1: "A1.mp3",

            C2: "C2.mp3",
            "D#2": "Ds2.mp3",
            "F#2": "Fs2.mp3",
            A2: "A2.mp3",

            C3: "C3.mp3",
            "D#3": "Ds3.mp3",
            "F#3": "Fs3.mp3",
            A3: "A3.mp3",

            C4: "C4.mp3",
            "D#4": "Ds4.mp3",
            "F#4": "Fs4.mp3",
            A4: "A4.mp3",

            C5: "C5.mp3",
            "D#5": "Ds5.mp3",
            "F#5": "Fs5.mp3",
            A5: "A5.mp3",

            C6: "C6.mp3",
            "D#6": "Ds6.mp3",
            "F#6": "Fs6.mp3",
            A6: "A6.mp3",

            C7: "C7.mp3",
            "D#7": "Ds7.mp3",
            "F#7": "Fs7.mp3",
            A7: "A7.mp3",

            C8: "C8.mp3"

        },

        release: 0.05,

        baseUrl: "https://themachetazo.github.io/jazzguitarnomad/samples/piano/"

    },

    ////////////////////////////////////////////////////////////
    // GUITARRA CLÁSICA
    ////////////////////////////////////////////////////////////

    cguitar: {

        urls: {

            E2: "E2.mp3",
            G2: "G2.mp3",
            A2: "A2.mp3",
            C3: "C3.mp3",
            D3: "D3.mp3",

            E3: "E3.mp3",
            G3: "G3.mp3",
            A3: "A3.mp3",
            C4: "C4.mp3",
            D4: "D4.mp3",

            E4: "E4.mp3",
            G4: "G4.mp3",
            A4: "A4.mp3",
            C5: "C5.mp3",
            D5: "D5.mp3",

            E5: "E5.mp3",
            G5: "G5.mp3",
            A5: "A5.mp3",
            C6: "C6.mp3",

            E6: "E6.mp3"

        },

        release: 0.10,

        baseUrl: "https://themachetazo.github.io/jazzguitarnomad/samples/cguitar/"

    }

};
