"use strict";

// ==================================================
// PROYECTOS
// ==================================================

async function loadProject(project) {

	if (!project) return;

	// --------------------------------
	// DATOS GENERALES
	// --------------------------------

	projectModified = false;

	currentProjectId = project.id ?? "";

	projectTitle = project.title ?? "";

	cmbProjectCategory.value = project.category ?? 1;
	if (cmbProjectCategory.value !== project.category && categories.length > 0) cmbProjectCategory.value = categories[0].id;

	projectType = project.projectType ?? "sequence";

	// --------------------------------
	// SETTINGS
	// --------------------------------

	fretCount = Math.max(5, Math.min(24, project.settings?.fretCount ?? 10));
	displayMode = parseBoolean(project.settings?.displayMode, true);
	inlays = parseBoolean(project.settings?.inlays, false);
	orientation = project.settings?.orientation ?? "vertical";
	rotated = parseBoolean(project.settings?.rotated, false);
	fretboardStyle = project.settings?.fretboardStyle ?? "maple";

	projectBar = project.settings?.bar ?? "4/4";
	cmbBar.value = projectBar;
	getBarGroups();
	setBarGroups();

	scoreScale = project.settings?.scoreScale;
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
	isFretboardVisible = parseBoolean(project.settings?.isFretboardVisible, true);
	isScoreVisible = parseBoolean(project.settings?.isScoreVisible, false);
	metronomeOn = parseBoolean(project.settings?.metronomeOn, true);
	notation = project.settings?.notation ?? "";

	// --------------------------------
	// NOTAS
	// --------------------------------

	notes = (project.notes || []).map(note => ({
		string: note.string,
		fret: note.fret,
		color: note.color,
		text: note.text,
		chord: note.chord,
		order: note.order
	}));

	// --------------------------------
	// BARRAS
	// --------------------------------

	barreNotes = (project.barres || []).map(barre => ({
		fret: barre.fret,
		startString: barre.startString,
		color: barre.color,
		text: barre.text,
		chord: barre.chord,
		order: barre.order
	}));

	// --------------------------------
	// NUT
	// --------------------------------

	nutNotes = Array(stringCount).fill(null);

	(project.nutNotes || []).forEach(note => {

		if (note.string >= 0 && note.string < stringCount) {
			nutNotes[note.string] = {
				color: note.color,
				text: note.text,
				chord: note.chord,
				order: note.order
			};
		}

	});

	// --------------------------------
	// ARRAYS MUSICALES
	// --------------------------------

	noteOrder = getMaxOrder();

	aSequence = buildOrderedSequence();

	aChords = buildOrderedChords();

	loadArrayNotas();

	// --------------------------------
	// CONFIGURACION APP
	// --------------------------------

	resetControlsValues("loadProject");

}

function newProject() {

	if (projectModified && isAdmin) {

		if (!confirm("¿Crear un proyecto nuevo? Se perderán los cambios no guardados.")) {
			return false;
		}

	}

	currentProjectId = generateIDKey();

	projectModified = false;

	resetControlsValues("newProject");

	return true;

}

async function openXMLProjectsFile() {

	try {

		if (!window.showOpenFilePicker) {

			alert("Tu navegador no permite editar directamente el XML. Al guardar se descargará " + xmlProjects);

			return false;
		}


		// --------------------------------
		// SELECCIONAR ARCHIVO
		// --------------------------------

		const [fileHandle] =
			await window.showOpenFilePicker({

				types: [{
					description: "Proyectos de Fretboard",
					accept: {"application/xml": [".xml"]}
				}],

				multiple: false

			});


		// --------------------------------
		// GUARDAR HANDLE
		// --------------------------------

		projectsFileHandle = fileHandle;

		xmlProjects = fileHandle.name;


		// --------------------------------
		// LEER ARCHIVO
		// --------------------------------

		const file = await fileHandle.getFile();

		const xmlText = await file.text();


		// --------------------------------
		// PARSEAR XML
		// --------------------------------

		const xml = parseXML(xmlText);

		const loadedProjects = parseProjectsXml(xml);


		// --------------------------------
		// REEMPLAZAR PROYECTOS
		// --------------------------------

		projects = loadedProjects;

		projectsLoaded = true;


		// --------------------------------
		// ACTUALIZAR INFORMACIÓN
		// --------------------------------

		xmlType = "Local";

		setLibraryInfo(fileHandle.name);


		// --------------------------------
		// ABRIR PANEL
		// --------------------------------

		openProjectsPanel();


		// --------------------------------
		// RENDERIZAR LISTA
		// --------------------------------

		renderProjectsLibrary();

		// --------------------------------
		// ABRIR PRIMER PROYECTO
		// --------------------------------

		if (projects.length > 0) {

			const firstProject = getFirstProject();

			if (firstProject) {

				await selectProject(firstProject);

			} else {

				newProject();

			}

		} else {

			newProject();

		}

		renderProject();

		if (menuOpen !== "projects") setMenu("projects");

		return true;

	} catch (error) {

		// Cancelar selector de archivos

		if (error.name === "AbortError") {

			return false;

		}

		console.error("Error al abrir la biblioteca de proyectos:",error);

		projects = [];
		projectsLoaded = false;

		return false;

	}

}

function parseProjectsXml(xml) {

	xmlVersion = xml.querySelector("projects")?.getAttribute("version") || "1.0";

	libraryName = xml.querySelector("projects")?.getAttribute("name") || "Sin Nombre";
	libraryNameText.value = libraryName;

	libraryDesc = xml.querySelector("projects")?.getAttribute("desc") || "";
	libraryDescText.value = libraryDesc;

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

		const getSetting = (name,fallback = "") => {

			const node = settingsNode?.querySelector(name);

			return node ? node.textContent.trim() : fallback;

		};

		const project = {

			id: projectNode.getAttribute("id") || "",

			title: projectNode.getAttribute("title") || "",

			category: projectNode.getAttribute("category"),

			projectType: projectNode.getAttribute("projectType"),

			settings: {

				orientation: getSetting("orientation","horizontal"),
				fretboardStyle: getSetting("fretboardStyle","maple"),
				fretCount: parseInt(getSetting("fretCount","10")),
				displayMode: getSetting("displayMode","scale"),
				inlays: getSetting("inlays",true),
				rotated: getSetting("rotated",false),
				bar: getSetting("bar","4/4"),
				scoreScale: getSetting("scoreScale","auto"),
				tipoSecuencia: getSetting("tipoSecuencia","up"),
				countBars: getSetting("countBars",1),
				repetitionSequence: getSetting("repetitionSequence",1),
				isFretboardVisible: getSetting("isFretboardVisible",true),
				isScoreVisible: getSetting("isScoreVisible",true),
				currentInstrument: getSetting("currentInstrument","piano"),
				fretNumbers: getSetting("fretNumbers",1),
				showFretNumbers: getSetting("showFretNumbers",false),
				bpm: getSetting("bpm",90),
				key: getSetting("key","C"),
				scoreStaves: getSetting("scoreStaves","all"),
				scoreLayout: getSetting("scoreLayout","vertical"),
				swing: getSetting("swing",false),
				metronomeOn: getSetting("metronomeOn",true),
				notation: getSetting("notation","")

			},

			notes: [],
			barres: [],
			nutNotes: []

		};

		projectNode.querySelectorAll("notes > note").forEach(noteNode => {

			project.notes.push({

				string: Number(noteNode.getAttribute("string")),
				fret: Number(noteNode.getAttribute("fret")),
				color: noteNode.getAttribute("color") || "#000000",
				text: noteNode.getAttribute("text") || "",
				chord: noteNode.getAttribute("chord") || "",
				order: noteNode.getAttribute("order") || 0

			});

		});

		projectNode.querySelectorAll("barres > barre").forEach(barreNode => {

			project.barres.push({

				fret: Number(barreNode.getAttribute("fret")),
				startString: Number(barreNode.getAttribute("startString")),
				color: barreNode.getAttribute("color") || "#000000",
				text: barreNode.getAttribute("text") || "",
				chord: barreNode.getAttribute("chord") || "",
				order: barreNode.getAttribute("order") || 0

			});

		});

		projectNode.querySelectorAll("nutNotes > nutNote").forEach(nutNode => {

			project.nutNotes.push({

				string: Number(nutNode.getAttribute("string")),
				color: nutNode.getAttribute("color") || "#000000",
				text: nutNode.getAttribute("text") || "",
				chord: nutNode.getAttribute("chord") || "",
				order: nutNode.getAttribute("order") || 0

			});

		});

		return project;

	});

}

function getCurrentProject() {

	const projectTitle = titleText.value.trim();

	let notacion = chkNoteNames.checked ? cmbNoteNames.value : ""

	if (!projectTitle) {
		alert("Escribe un título antes de guardar el proyecto.");
		titleText.focus();
		return null;
	}

	return {

		id: currentProjectId,

		title: projectTitle,

		category: cmbProjectCategory.value,

		projectType: cmbProjectType.value,

		settings: {
			orientation: orientation,
			fretboardStyle: cmbDiapason.value,
			fretCount: numberFrets.value,
			displayMode: displayMode,
			inlays: chkInlays.checked,
			rotated: rotated,
			bar: cmbBar.value,
			scoreScale: scoreScale,
			tipoSecuencia: cmbTipoSecuencia.value,
			countBars: cmbCountIn.value,
			repetitionSequence: cmbPlayerRepeats.value,
			isFretboardVisible: isFretboardVisible,
			isScoreVisible: isScoreVisible,
			currentInstrument: cmbSamplerInstrument.value,
			fretCount: sliderFrets.value,
			fretNumbers: numFrets.value,
			showFretNumbers: showNumber.checked,
			bpm: sliderBpm.value,
			key: cmbKey.value,
			scoreStaves: cmbScoreStaves.value,
			scoreLayout: cmbScoreLayout.value,
			swing: chkPlayerSwing.checked,
			metronomeOn: chkMetronomeOn.checked,
			notation: notacion
		},

		notes: notes.map(note => ({
			string: note.string,
			fret: note.fret,
			color: note.color,
			text: note.text,
			chord: note.chord,
			order: note.order
		})),

		barres: barreNotes.map(barre => ({
			fret: barre.fret,
			startString: barre.startString,
			color: barre.color,
			text: barre.text,
			chord: barre.chord,
			order: barre.order
		})),

		nutNotes: nutNotes
			.map((note, string) => {

				if (!note) {
					return null;
				}

				return {
					string,
					color: note.color,
					text: note.text,
					chord: note.chord,
					order: note.order
				};

			})
			.filter(note => note !== null)
	};

}

function projectsToXml() {

	const lines = [];

	xmlVersion = (parseFloat(xmlVersion) + 0.1).toFixed(1);

	lines.push('<?xml version="1.0" encoding="UTF-8"?>');
	lines.push('<projects version="' + xmlVersion + '" name="' + libraryName + '" desc="' + libraryDesc + '">');
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

	lines.push("</projects>");

	return lines.join("\n");

}

function projectToXml(project, indent = "\t") {

	const lines = [];

	lines.push(
		`${indent}<project ` +
		`id="${project.id}" ` +
		`title="${escapeXml(project.title)}" ` +
		`category="${escapeXml(project.category)}" ` +
		`projectType="${escapeXml(project.projectType)}">`
	);

	lines.push(`${indent}\t<settings>`);
	lines.push(`${indent}\t\t<orientation>${escapeXml(project.settings.orientation)}</orientation>`);
	lines.push(`${indent}\t\t<fretboardStyle>${escapeXml(project.settings.fretboardStyle)}</fretboardStyle>`);
	lines.push(`${indent}\t\t<fretCount>${project.settings.fretCount}</fretCount>`);
	lines.push(`${indent}\t\t<displayMode>${project.settings.displayMode}</displayMode>`);
	lines.push(`${indent}\t\t<inlays>${project.settings.inlays}</inlays>`);
	lines.push(`${indent}\t\t<rotated>${project.settings.rotated}</rotated>`);
	lines.push(`${indent}\t\t<bar>${project.settings.bar}</bar>`);
	lines.push(`${indent}\t\t<scoreScale>${project.settings.scoreScale}</scoreScale>`);
	lines.push(`${indent}\t\t<tipoSecuencia>${project.settings.tipoSecuencia}</tipoSecuencia>`);
	lines.push(`${indent}\t\t<countBars>${project.settings.countBars}</countBars>`);
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
	lines.push(`${indent}\t\t<notation>${project.settings.notation}</notation>`);
	lines.push(`${indent}\t</settings>`);

	lines.push(`${indent}\t<notes>`);

	project.notes.forEach(note => {

		lines.push(
			`${indent}\t\t<note ` +
			`string="${note.string}" ` +
			`fret="${note.fret}" ` +
			`color="${escapeXml(note.color)}" ` +
			`text="${escapeXml(note.text)}" ` + 
			`chord="${escapeXml(note.chord)}" ` + 
			`order="${escapeXml(note.order)}"/>`
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
			`text="${escapeXml(barre.text)}" ` + 
			`chord="${escapeXml(barre.chord)}" ` + 
			`order="${escapeXml(barre.order)}"/>`
		);

	});

	lines.push(`${indent}\t</barres>`);

	lines.push(`${indent}\t<nutNotes>`);

	project.nutNotes.forEach(note => {

		lines.push(
			`${indent}\t\t<nutNote ` +
			`string="${note.string}" ` +
			`color="${escapeXml(note.color)}" ` +
			`text="${escapeXml(note.text)}" ` + 
			`chord="${escapeXml(note.chord)}" ` + 
			`order="${escapeXml(note.order)}"/>`
		);

	});

	lines.push(`${indent}\t</nutNotes>`);

	lines.push(`${indent}</project>`);

	return lines.join("\n");

}

function renderProjectsLibrary() {

	// Eliminar todas las categorías actuales excepto la cabecera
	projectPanel.querySelectorAll(".projectCategory").forEach(category => category.remove());

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
					{sensitivity: "base"}
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

			if (!isUserActive){

				openButton.disabled = true;

				const iLocker = document.createElement("i");

				iLocker.className = "fa-solid fa-lock";

				openButton.appendChild(iLocker);
			}

			const titleSpan = document.createElement("span");

			titleSpan.className = "projectTitle";
			titleSpan.textContent = project.title;

			openButton.appendChild(titleSpan);

			const currentProject = projects.find(item => item.id === project.id);

			// Al pulsar, seleccionamos explícitamente
			openButton.addEventListener("click", async () => {

				if (!currentProject) return;

				if (projectModified) {

					if (!confirm("Hay cambios sin guardar que se perderán. ¿Deseas abrir el proyecto?")) {
						return false;
					}

				}

				await selectProject(currentProject);

				if (menuOpen !== "edit") setMenu("edit");

				renderProject();

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

				deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';

				deleteButton.addEventListener("click", async (e) => {

					e.stopPropagation();

					if (!currentProject) return;

					deleteProject(currentProject.id);

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

	updateSelectedProjectButton();

}

function getFirstProject() {

	if (!projects || projects.length === 0) {
		return null;
	}

	const firstCategory = getSortedCategories()
		.find(category =>
			projects.some(project => project.category === category.id)
		);

	if (!firstCategory) {
		return null;
	}

	return projects
		.filter(project => project.category === firstCategory.id)
		.sort((a, b) =>
			a.title.localeCompare(b.title, undefined, {
				sensitivity: "base"
			})
		)[0] || null;

}

async function selectProject(project) {

	if (!project) return;

	currentProjectId = project.id;

	openProjectCategory(project.category);

	updateSelectedProjectButton();

	await loadProject(project);

}

async function saveCurrentProject() {

	const project = getCurrentProject();

	if (!project) return false;

	const existingIndex = projects.findIndex(
		existing => existing.id === project.id
	);

	if (existingIndex >= 0) {

		projects[existingIndex] = project;

	} else {

		projects.push(project);

	}

	const saved = await saveProjectsFile();

	if (saved) {

		projectModified = false;

		renderProjectsLibrary();

		openProjectCategory(project.category);

		setLibraryInfo(xmlProjects.substring(xmlProjects.indexOf("/") + 1));

		showAlert("Proyecto guardado correctamente.", "success");

	}

	return saved;

}

async function saveProjectsFile() {

	const xmlText = projectsToXml();

	// Chrome / Edge: guardar en el archivo elegido.
	if (projectsFileHandle) {

		try {

			const writable = await projectsFileHandle.createWritable();

			await writable.write(xmlText);
			await writable.close();

			return true;

		} catch (error) {

			console.warn("No se pudo escribir el XML elegido. Se descargará una copia.",error);

		}

	}

	// Alternativa: descargar el archivo.
	try {

		const blob = new Blob(
			[xmlText],
			{type:"application/xml;charset=utf-8"}
		);

		downloadBlob(blob,xmlProjects.substring(xmlProjects.lastIndexOf("/") + 1));

		return true;

	} catch (error) {

		console.error("No se pudo descargar el archivo XML.",error);

		return false;

	}

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

	// Guardar el XML
	saveProjectsFile();

	// Actualizar la lista
	renderProjectsLibrary();

	// Crear un proyecto nuevo
	newProject();

	renderProject();

}

function escapeXml(value) {

	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

}

function generateIDKey() {

//    return crypto.getRandomValues(new BigUint64Array(1))[0].toString();
//    return crypto.getRandomValues(new Uint32Array(1))[0].toString();
//	return (crypto.getRandomValues(new Uint32Array(1))[0] % 10000).toString().padStart(4, "0");

//	return crypto.randomUUID().replaceAll("-", "");

	return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

function updateSelectedProjectButton() {

	document.querySelectorAll(".projectOpenButton")
		.forEach(button => {

			button.classList.toggle("active",button.dataset.projectId === currentProjectId);

		});

}

function setupProjectCategories() {

	const categoryButtons = document.querySelectorAll(".projectCategoryButton");

	categoryButtons.forEach(button => {

		button.addEventListener("click", () => {

			const list = button.nextElementSibling;

			if (!list || !list.classList.contains("projectCategoryList")) {
				return;
			}

			const isOpen = button.getAttribute("aria-expanded") === "true";

			button.setAttribute("aria-expanded",String(!isOpen));

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

function refreshCategoryList() {

	cmbProjectCategory.innerHTML = "";

	getSortedCategories().forEach(category => {

		const option = document.createElement("option");

		option.value = category.id;
		option.textContent = category.name;

		cmbProjectCategory.appendChild(option);

	});

}

function getSortedCategories() {
	return [...categories].sort((a, b) =>
		a.name.localeCompare(b.name, "es", { sensitivity: "base" })
	);
}

function addCategory() {

	const name = prompt("Nombre de la nueva categoría:");

	if (!name) return;

	const trimmedName = name.trim();

	if (trimmedName === "") return;

	const exists = categories.some(category =>
		category.name.toLowerCase() === trimmedName.toLowerCase()
	);

	if (exists) {

		alert("Ya existe una categoría con ese nombre.");

		return;

	}

	if (!newProject()) return;

	const categoryId = generateIDKey(); //categories.length > 0 ? categories.length + 1 : 1;

	const category = {

		id: categoryId, 
		name: trimmedName

	};

	categories.push(category);

	refreshCategoryList();

	renderProjectsLibrary();

	cmbProjectCategory.value = category.id;

	saveProjectsFile();

}

function deleteCategory() {

	if (categories.length <= 1) {

		alert("Debe existir al menos una categoría.");

		return;

	}

	const categoryId = cmbProjectCategory.value;

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

	renderProjectsLibrary();

	if (categories.length > 0) {
		cmbProjectCategory.value = categories[0].id;
	}

	saveProjectsFile();

}

async function renderProject(){

	setPlayerValues();

	neckImageLoaded = false;

	if (fretboardStyle !== "blank") await loadFretboardImage();

	if (isFretboardVisible) {

		resizeCanvas();

		scrollToFretboardNut();
	}

	if (isScoreVisible) scoreRender();

}

function createLibrary(fileName) {

	const lines = [];

	lines.push('<?xml version="1.0" encoding="UTF-8"?>');

	lines.push(
		`<projects ` +
		`version="1.0" ` +
		`name="${fileName}" ` +
		`desc="">`
	);

	lines.push(`</projects>`);

	const xmlContent = lines.join("\n");

	const blob = new Blob(
		[xmlContent],
		{ type: "application/xml;charset=utf-8" }
	);

	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");

	link.href = url;

	link.download = fileName + ".xml";

	document.body.appendChild(link);

	link.click();

	document.body.removeChild(link);

	URL.revokeObjectURL(url);

	return true;

}
