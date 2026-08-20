"use strict";

// ==================================================
// PROYECTOS
// ==================================================


function newProject() {

	if (projectModified) {

		if (!confirm(
			"¿Crear un proyecto nuevo? Se perderán los cambios no guardados."
		)) {
			return;
		}

	}

	// NUEVO ID

	currentProjectId = generateProjectId();

	// ESTADO

	projectModified = false;

	// VALORES POR DEFECTO

	setDefaultControlsValues("newProject");

	setMode("note");

	// ACTUALIZAR INTERFAZ

	updateProjectUI();
}

async function loadProject(project) {

	if (!project) return;

	// --------------------------------
	// DATOS GENERALES
	// --------------------------------

	projectTitle = project.title;

	// --------------------------------
	// CATEGORÍA
	// --------------------------------

	projectCategory.value = project.category;

	if (projectCategory.value !== project.category && categories.length > 0) projectCategory.value = categories[0].id;

	// --------------------------------
	// SETTINGS
	// --------------------------------

	fretCount = Math.max(5, Math.min(24, project.settings?.fretCount ?? 10));
	displayMode = parseBoolean(project.settings?.displayMode, true);
	inlays = parseBoolean(project.settings?.inlays, false);
	orientation = project.settings?.orientation ?? "vertical";
	rotated = parseBoolean(project.settings?.rotated, false);
	fretboardStyle = project.settings?.fretboardStyle ?? "maple";
	projectBar = project.settings?.projectBar ?? 4;
	projectFigure = project.settings?.projectFigure ?? 1;

	setBarGroups();

	scoreScale = project.settings?.scoreScale;
	projectType = project.settings?.projectType ?? "sequence";
	tipoSecuencia = project.settings?.tipoSecuencia ?? "up";
	countBars = project.settings?.countBars ?? 0;
	repetitionSequence = project.settings?.repetitionSequence ?? 2;
	currentInstrument = project.settings?.currentInstrument ?? "piano";
	fretNumbers = project.settings?.fretNumbers ?? 1;
	showFretNumbers = parseBoolean(project.settings?.showFretNumbers, false);
	bpm = project.settings?.bpm ?? 90;
	key = project.settings?.key ?? "C";
	scoreStaves = project.settings?.scoreStaves ?? "all";
	scoreLayout = project.settings?.scoreLayout ?? "vertical";
	swing = parseBoolean(project.settings?.swing, false);
	metronomeOn = parseBoolean(project.settings?.metronomeOn, true);
	isFretboardVisible = parseBoolean(project.settings?.isFretboardVisible, true);
	isScoreVisible = parseBoolean(project.settings?.isScoreVisible, false);

	// --------------------------------
	// NOTAS
	// --------------------------------

	notes = (project.notes || []).map(note => ({
		string: note.string,
		fret: note.fret,
		color: note.color,
		text: note.text
	}));

	// --------------------------------
	// BARRAS
	// --------------------------------

	barreNotes = (project.barres || []).map(barre => ({
		fret: barre.fret,
		startString: barre.startString,
		color: barre.color,
		text: barre.text
	}));

	// --------------------------------
	// NUT
	// --------------------------------

	nutNotes = Array(stringCount).fill(null);

	(project.nutNotes || []).forEach(note => {

		if (note.string >= 0 && note.string < stringCount) {
			nutNotes[note.string] = {
				color: note.color,
				text: note.text
			};
		}

	});

	// --------------------------------
	// ESTADO
	// --------------------------------

	projectModified = false;

	// --------------------------------
	// CONTROLES
	// --------------------------------

	setDefaultControlsValues("loadProject");
	setOrientation(orientation);

	// --------------------------------
	// DATOS MUSICALES
	// --------------------------------

	loadNotas(tipoSecuencia);
	scoreLoadArray(tipoSecuencia);

	parseXMLToNotesArray(project);

	organizeSequence(tipoSecuencia, true);
	organizeChords(tipoSecuencia, true);

	const hasNotes = projectType === "sequence" ? sequenceToPlay.length > 0 : chordsToPlay.length > 0;
	btnPlayStop.disabled = !hasNotes;

	// --------------------------------
	// LAYOUT
	// --------------------------------

	setWorkspaceLayout();
	setPlayerValues();

	// --------------------------------
	// IMAGEN DEL MÁSTIL
	// --------------------------------

	neckImageLoaded = false;

	if (fretboardStyle !== "blank") {

		await loadFretboardImage();

	}

	await waitForLayout();

	// --------------------------------
	// DIBUJADO
	// --------------------------------

	if (isFretboardVisible) {

		resizeCanvas();

		scrollToFretboardNut();
	
	}

	if (isScoreVisible) scoreRender();

}

async function loadXMLProjectsFile() {

	projectsLoaded = false;

	try {

		const response = await fetch(xmlProjects);

		if (!response.ok) {
			throw new Error("No se pudo leer " + xmlProjects);
		}

		const xmlText = await response.text();

		projects = parseProjectsXml(xmlText);

		projectsLoaded = true;

	} catch (error) {

		console.warn("Error cargando " + xmlProjects,error);

	}

}

async function openXMLProjectsFile() {

	try {

		if (!window.showOpenFilePicker) {

			alert(
				"Tu navegador no permite editar directamente el XML. " +
				"Al guardar se descargará " + xmlProjects
			);

			return false;
		}


		// --------------------------------
		// SELECCIONAR ARCHIVO
		// --------------------------------

		const [fileHandle] =
			await window.showOpenFilePicker({

				types: [{
					description: "Proyectos de Fretboard",

					accept: {
						"application/xml": [".xml"]
					}

				}],

				multiple: false

			});


		// --------------------------------
		// GUARDAR HANDLE
		// --------------------------------

		projectsFileHandle = fileHandle;

		xmlProjects = fileHandle.name;

		btnToggleLibrary.title = "Local: " + fileHandle.name;


		// --------------------------------
		// LEER ARCHIVO
		// --------------------------------

		const file = await fileHandle.getFile();

		const xmlText = await file.text();


		// --------------------------------
		// PARSEAR XML
		// --------------------------------

		const loadedProjects = parseProjectsXml(xmlText);


		// --------------------------------
		// REEMPLAZAR PROYECTOS
		// --------------------------------

		projects = loadedProjects;


		// --------------------------------
		// ESTADO INICIAL
		// --------------------------------

		projectModified = false;

		currentProjectId = null;


		// --------------------------------
		// RENDERIZAR LISTA
		// --------------------------------

		renderHTMLProjectsList();


		// --------------------------------
		// ABRIR PANEL
		// --------------------------------

		openProjectsPanel();


		// --------------------------------
		// ABRIR PRIMER PROYECTO
		// --------------------------------

		if (projects.length > 0) {

			selectProject(projects[0]);

		} else {

			// Si el XML está vacío,
			// crear un proyecto nuevo.

			newProject();

		}


		return true;


	} catch (error) {

		// Cancelar selector de archivos
		if (error.name === "AbortError") {

			return false;

		}


		console.error(
			"Error al abrir la biblioteca de proyectos:",
			error
		);


		return false;

	}

}

function getCurrentProject() {

	const projectTitle = titleText.value.trim();

	if (!projectTitle) {
		alert("Escribe un título antes de guardar el proyecto.");
		titleText.focus();
		return null;
	}

	return {

		id: currentProjectId,

		title: projectTitle,

		category: projectCategory.value,

		settings: {
			fretCount,
			displayMode,
			orientation,
			fretboardStyle,
			inlays,
			rotated,
			projectBar,
			scoreScale,
			projectType,
			tipoSecuencia,
			countBars,
			projectFigure,
			repetitionSequence,
			isFretboardVisible,
			isScoreVisible,
			currentInstrument,
			fretNumbers,
			showFretNumbers,
			bpm,
			key,
			scoreStaves,
			scoreLayout,
			swing,
			metronomeOn
		},

		notes: notes.map(note => ({
			string: note.string,
			fret: note.fret,
			color: note.color,
			text: note.text
		})),

		barres: barreNotes.map(barre => ({
			fret: barre.fret,
			startString: barre.startString,
			color: barre.color,
			text: barre.text
		})),

		nutNotes: nutNotes
			.map((note, string) => {

				if (!note) {
					return null;
				}

				return {
					string,
					color: note.color,
					text: note.text
				};

			})
			.filter(note => note !== null)
	};

}

function projectToXml(project, indent = "\t") {

	const lines = [];

	lines.push(
		`${indent}<project ` +
		`id="${project.id}" ` +
		`title="${escapeXml(project.title)}" ` +
		`category="${escapeXml(project.category)}">`
	);

	lines.push(`${indent}\t<settings>`);
	lines.push(`${indent}\t\t<orientation>${escapeXml(project.settings.orientation)}</orientation>`);
	lines.push(`${indent}\t\t<fretboardStyle>${escapeXml(project.settings.fretboardStyle)}</fretboardStyle>`);
	lines.push(`${indent}\t\t<fretCount>${project.settings.fretCount}</fretCount>`);
	lines.push(`${indent}\t\t<displayMode>${project.settings.displayMode}</displayMode>`);
	lines.push(`${indent}\t\t<inlays>${project.settings.inlays}</inlays>`);
	lines.push(`${indent}\t\t<rotated>${project.settings.rotated}</rotated>`);
	lines.push(`${indent}\t\t<projectBar>${project.settings.projectBar}</projectBar>`);
	lines.push(`${indent}\t\t<scoreScale>${project.settings.scoreScale}</scoreScale>`);
	lines.push(`${indent}\t\t<projectType>${project.settings.projectType}</projectType>`);
	lines.push(`${indent}\t\t<tipoSecuencia>${project.settings.tipoSecuencia}</tipoSecuencia>`);
	lines.push(`${indent}\t\t<countBars>${project.settings.countBars}</countBars>`);
	lines.push(`${indent}\t\t<projectFigure>${project.settings.projectFigure}</projectFigure>`);
	lines.push(`${indent}\t\t<repetitionSequence>${project.settings.repetitionSequence}</repetitionSequence>`);
	lines.push(`${indent}\t\t<isFretboardVisible>${project.settings.isFretboardVisible}</isFretboardVisible>`);
	lines.push(`${indent}\t\t<isScoreVisible>${project.settings.isScoreVisible}</isScoreVisible>`);
	lines.push(`${indent}\t\t<currentInstrument>${project.settings.currentInstrument}</currentInstrument>`);
	lines.push(`${indent}\t\t<fretNumbers>${project.settings.fretNumbers}</fretNumbers>`);
	lines.push(`${indent}\t\t<showFretNumbers>${project.settings.showFretNumbers}</showFretNumbers>`);
	lines.push(`${indent}\t\t<bpm>${project.settings.bpm}</bpm>`);
	lines.push(`${indent}\t\t<key>${project.settings.key}</key>`);
	lines.push(`${indent}\t\t<scoreStaves>${project.settings.scoreStaves}</scoreStaves>`);
	lines.push(`${indent}\t\t<scoreLayout>${project.settings.scoreLayout}</scoreLayout>`);
	lines.push(`${indent}\t\t<swing>${project.settings.swing}</swing>`);
	lines.push(`${indent}\t\t<metronomeOn>${project.settings.metronomeOn}</metronomeOn>`);
	lines.push(`${indent}\t</settings>`);

	lines.push(`${indent}\t<notes>`);

	project.notes.forEach(note => {

		lines.push(
			`${indent}\t\t<note ` +
			`string="${note.string}" ` +
			`fret="${note.fret}" ` +
			`color="${escapeXml(note.color)}" ` +
			`text="${escapeXml(note.text)}"/>`
		);

	});

	lines.push(`${indent}\t</notes>`);

	lines.push(`${indent}\t<barres>`);

	project.barres.forEach(barre => {

		lines.push(
			`${indent}\t\t<barre ` +
			`fret="${barre.fret}" ` +
			`startString="${barre.startString}" ` +
			`color="${escapeXml(barre.color)}" ` +
			`text="${escapeXml(barre.text)}"/>`
		);

	});

	lines.push(`${indent}\t</barres>`);

	lines.push(`${indent}\t<nutNotes>`);

	project.nutNotes.forEach(note => {

		lines.push(
			`${indent}\t\t<nutNote ` +
			`string="${note.string}" ` +
			`color="${escapeXml(note.color)}" ` +
			`text="${escapeXml(note.text)}"/>`
		);

	});

	lines.push(`${indent}\t</nutNotes>`);

	lines.push(`${indent}</project>`);

	return lines.join("\n");

}

function projectsToXml() {

	const lines = [];

	lines.push('<?xml version="1.0" encoding="UTF-8"?>');
	lines.push('<fretboardProjects version="2.0">');
	lines.push("");

	// Categorías
	lines.push("\t<categories>");

	categories.forEach(category => {

		lines.push(
			`\t\t<category id="${escapeXml(category.id)}">${escapeXml(category.name)}</category>`
		);

	});

	lines.push("\t</categories>");
	lines.push("");

	// Proyectos
	projects.forEach(project => {

		lines.push(projectToXml(project));
		lines.push("");

	});

	lines.push("</fretboardProjects>");

	return lines.join("\n");

}

function parseProjectsXml(xmlText) {

	const xml = new DOMParser().parseFromString(
		xmlText,
		"application/xml"
	);

	const parserError = xml.querySelector("parsererror");

	if (parserError) {
		throw new Error("El archivo XML no tiene un formato válido.");
	}

	categories = [];

	const categoryNodes = xml.querySelectorAll("categories > category");

	categoryNodes.forEach(categoryNode => {

	    categories.push({

	        id: categoryNode.getAttribute("id"),
	        name: categoryNode.textContent.trim()

	    });

	});

	refreshCategoryList();

	return [...xml.querySelectorAll("project")].map(projectNode => {

		const settingsNode = projectNode.querySelector("settings");

		const getSetting = (name, fallback = "") => {

			const node = settingsNode?.querySelector(name);

			return node ? node.textContent.trim() : fallback;

		};

		const project = {

			id: projectNode.getAttribute("id") || generateProjectId(),

			title: projectNode.getAttribute("title") || "Sin Título",

			category: projectNode.getAttribute("category"),

			settings: {
				orientation: getSetting("orientation","horizontal"),
				fretboardStyle: getSetting("fretboardStyle","maple"),
				fretCount: parseInt(getSetting("fretCount","10")),
				displayMode: getSetting("displayMode","scale"),
				inlays: getSetting("inlays","scale"),
				rotated: getSetting("rotated", false),
				projectBar: getSetting("projectBar", 4),
				projectFigure: getSetting("projectFigure", 4),
				scoreScale: getSetting("scoreScale", "auto"),
				projectType: getSetting("projectType", "sequence"),
				tipoSecuencia: getSetting("tipoSecuencia", "up"),
				countBars: getSetting("countBars", 1),
				repetitionSequence: getSetting("repetitionSequence", 1),
				isFretboardVisible: getSetting("isFretboardVisible", true),
				isScoreVisible: getSetting("isScoreVisible", true),
				currentInstrument: getSetting("currentInstrument", "piano"),
				fretNumbers: getSetting("fretNumbers", 1),
				showFretNumbers: getSetting("showFretNumbers", false),
				bpm: getSetting("bpm", 90),
				key: getSetting("key", "C"),
				scoreStaves: getSetting("scoreStaves", "all"),
				scoreLayout: getSetting("scoreLayout", "vertical"),
				swing: getSetting("swing", false),
				metronomeOn: getSetting("metronomeOn", true)
			},

			notes: [],
			barres: [],
			nutNotes: []
		};

		projectNode.querySelectorAll("notes > note").forEach(
			noteNode => {

				project.notes.push({
					string: Number(noteNode.getAttribute("string")),
					fret: Number(noteNode.getAttribute("fret")),
					color:noteNode.getAttribute("color") || "#000000",
					text:noteNode.getAttribute("text") || ""
				});

			}
		);

		projectNode.querySelectorAll("barres > barre").forEach(
			barreNode => {

				project.barres.push({
					fret: Number(barreNode.getAttribute("fret")),
					startString: Number(barreNode.getAttribute("startString")),
					color:barreNode.getAttribute("color") || "#000000",
					text:barreNode.getAttribute("text") || ""
				});

			}
		);

		projectNode.querySelectorAll(
			"nutNotes > nutNote"
		).forEach(nutNode => {

			project.nutNotes.push({
				string: Number(nutNode.getAttribute("string")),
				color:nutNode.getAttribute("color") || "#000000",
				text:nutNode.getAttribute("text") || ""
			});

		});

		return project;

	});

}

function renderHTMLProjectsList() {

	// Eliminar todas las categorías actuales excepto la cabecera
	projectPanel
		.querySelectorAll(".projectCategory")
		.forEach(category => category.remove());


	getSortedCategories().forEach(category => {

		// --------------------------------
		// CONTENEDOR DE LA CATEGORÍA
		// --------------------------------

		const categoryContainer = document.createElement("div");

		categoryContainer.className = "projectCategory";


		// --------------------------------
		// BOTÓN DE LA CATEGORÍA
		// --------------------------------

		const categoryButton = document.createElement("button");

		categoryButton.type = "button";
		categoryButton.className = "projectCategoryButton";
		categoryButton.dataset.projectCategory = category.id;
		categoryButton.setAttribute("aria-expanded", "false");


		const title = document.createElement("span");

		title.textContent = category.name;


		const icon = document.createElement("i");

		icon.className = "fa-solid fa-chevron-down";


		categoryButton.appendChild(title);
		categoryButton.appendChild(icon);


		// --------------------------------
		// LISTA DE PROYECTOS
		// --------------------------------

		const list = document.createElement("ul");

		list.className = "projectCategoryList";
		list.id = `projectList_${category.id}`;


		categoryContainer.appendChild(categoryButton);
		categoryContainer.appendChild(list);

		projectPanel.appendChild(categoryContainer);


		// --------------------------------
		// PROYECTOS DE LA CATEGORÍA
		// --------------------------------

		const categoryProjects = projects
			.filter(project => project.category === category.id)
			.sort((a, b) =>
				a.title.localeCompare(
					b.title,
					"es",
					{
						sensitivity: "base"
					}
				)
			);


		categoryProjects.forEach(project => {

			const item = document.createElement("li");

			item.className = "projectItem";


			// --------------------------------
			// BOTÓN ABRIR PROYECTO
			// --------------------------------

			const openButton = document.createElement("button");

			openButton.type = "button";
			openButton.className = "projectOpenButton";
			openButton.dataset.projectId = project.id;

			openButton.title = `Abrir: ${project.title}`;


			const titleSpan = document.createElement("span");

			titleSpan.className = "projectTitle";
			titleSpan.textContent = project.title;


			openButton.appendChild(titleSpan);


			// Al pulsar, seleccionamos explícitamente
			openButton.addEventListener("click", () => {

				selectProject(project);

			});


			item.appendChild(openButton);


			// --------------------------------
			// BOTÓN ELIMINAR
			// --------------------------------

			if (isAdmin) {

				const deleteButton = document.createElement("button");

				deleteButton.type = "button";
				deleteButton.className = "projectDeleteButton";
				deleteButton.title = "Eliminar proyecto";

				deleteButton.innerHTML =
					'<i class="fa-solid fa-trash"></i>';


				deleteButton.addEventListener("click", e => {

					e.stopPropagation();

					deleteProject(project.id);

				});


				item.appendChild(deleteButton);

			}


			list.appendChild(item);

		});

	});


	// --------------------------------
	// EVENTOS DE CATEGORÍAS
	// --------------------------------

	setupProjectCategories();


	// --------------------------------
	// ACTUALIZAR PROYECTO SELECCIONADO
	// --------------------------------

	updateSelectedProject();

}

async function selectProject(project) {

	if (!project) {
		return;
	}

	currentProjectId = project.id;

	openProjectCategory(project.category);

	updateSelectedProject();

	await loadProject(project);

}

function setupProjectCategories() {

	const categoryButtons = document.querySelectorAll(
		".projectCategoryButton"
	);

	categoryButtons.forEach(button => {

		button.addEventListener("click", () => {

			const list = button.nextElementSibling;

			if (!list || !list.classList.contains("projectCategoryList")) {
				return;
			}

			const isOpen =
				button.getAttribute("aria-expanded") === "true";

			button.setAttribute(
				"aria-expanded",
				String(!isOpen)
			);

			list.classList.toggle("isOpen", !isOpen);

		});

	});

}

function openProjectCategory(category) {

	const button = document.querySelector(
		`.projectCategoryButton[data-project-category="${category}"]`
	);

	if (!button) {
		return;
	}

	const isOpen = button.getAttribute("aria-expanded") === "true";

	if (!isOpen) {

		button.click();

	}

}

function saveCurrentProject() {

	const project = getCurrentProject();

	if (!project) {
		return;
	}

	// Si ya existe un título igual, se reemplaza.
	const existingIndex = projects.findIndex(existing => existing.id === project.id);

	if (existingIndex >= 0) {

		projects[existingIndex] = project;

	} else {

		projects.push(project);

	}

	projectModified = false;

	renderHTMLProjectsList();
	saveProjectsFile();

}


async function saveProjectsFile() {

	const xmlText = projectsToXml();

	// Chrome / Edge: guarda en el archivo que el usuario eligió.
	if (projectsFileHandle) {

		try {

			const writable = await projectsFileHandle.createWritable();

			await writable.write(xmlText);
			await writable.close();

			return;

		} catch (error) {

			console.warn(
				"No se pudo escribir el XML elegido. Se descargará una copia.",
				error
			);

		}

	}

	// Alternativa compatible: descarga el archivo de la variable: xmlProjects
	const blob = new Blob([xmlText], {
		type: "application/xml;charset=utf-8"
	});

	downloadBlob(blob, xmlProjects);

}

function downloadBlob(blob, filename) {

	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.href = url;
	link.download = filename;

	document.body.appendChild(link);
	link.click();
	link.remove();

	URL.revokeObjectURL(url);

}

async function deleteProject(id) {

	const project = projects.find(p => p.id === id);

	if (!project) {
		return;
	}

	if (!confirm(`¿Eliminar el proyecto "${project.title}"?`)) {
		return;
	}

	// Eliminar del array
	projects = projects.filter(p => p.id !== id);

	// Actualizar la lista
	renderHTMLProjectsList();

	// Guardar el XML
	saveProjectsFile();

	// Crear un proyecto nuevo
	newProject();

}

function generateProjectId() {

	return crypto.randomUUID().replaceAll("-", "");

}

function generateCategoryId() {
    return crypto.getRandomValues(new BigUint64Array(1))[0].toString();
//    return crypto.getRandomValues(new Uint32Array(1))[0].toString();
}

function updateSelectedProject() {

	document
		.querySelectorAll(".projectOpenButton")
		.forEach(button => {

			button.classList.toggle(
				"active",
				button.dataset.projectId === currentProjectId
			);

		});

}

function refreshCategoryList() {

	projectCategory.innerHTML = "";

	getSortedCategories().forEach(category => {

		const option = document.createElement("option");

		option.value = category.id;
		option.textContent = category.name;

		projectCategory.appendChild(option);

	});

}

function getSortedCategories() {
	return [...categories].sort((a, b) =>
		a.name.localeCompare(b.name, "es", { sensitivity: "base" })
	);
}

function addCategory() {

	const name = prompt("Nombre de la nueva categoría:");

	if (!name) {
		return;
	}

	const trimmedName = name.trim();

	if (trimmedName === "") {
		return;
	}

	const exists = categories.some(category =>
		category.name.toLowerCase() === trimmedName.toLowerCase()
	);

	if (exists) {

		alert("Ya existe una categoría con ese nombre.");

		return;

	}

	const category = {

		id: generateCategoryId(),
		name: trimmedName

	};

	categories.push(category);

	refreshCategoryList();
	renderHTMLProjectsList();

	projectCategory.value = category.id;

	saveProjectsFile();

}

function deleteCategory() {

	if (categories.length <= 1) {

		alert("Debe existir al menos una categoría.");

		return;

	}

	const categoryId = projectCategory.value;

	const category = categories.find(c => c.id === categoryId);

	if (!category) {
		return;
	}

	const categoryProjects = projects.filter(
		project => project.category === categoryId
	);

	if (categoryProjects.length > 0) {

		const message =
			`La categoría "${category.name}" contiene ${categoryProjects.length} proyecto(s).\n\n` +
			`Si continúas, se eliminarán también todos esos proyectos.\n\n` +
			`¿Deseas continuar?`;

		if (!confirm(message)) {
			return;
		}

		// Si el proyecto abierto pertenece a esta categoría, crear uno nuevo
		const openedProject = projects.find(
			project => project.id === currentProjectId
		);

		if (openedProject && openedProject.category === categoryId) {
			newProject();
		}

		// Eliminar los proyectos de la categoría
		projects = projects.filter(
			project => project.category !== categoryId
		);

	} else {

		if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) {
			return;
		}

	}

	// Eliminar la categoría
	categories = categories.filter(
		category => category.id !== categoryId
	);

	refreshCategoryList();

	renderHTMLProjectsList();

	if (categories.length > 0) {
		projectCategory.value = categories[0].id;
	}

	saveProjectsFile();

}

function escapeXml(value) {

	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

}
