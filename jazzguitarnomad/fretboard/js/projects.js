"use strict";

// ==================================================
// PROYECTOS
// ==================================================


function escapeXml(value) {

	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

}


function newProject() {

	// Preguntar solo si hay cambios sin guardar
	if (projectModified) {

		if (!confirm("¿Crear un proyecto nuevo? Se perderán los cambios no guardados.")) {
			return;
		}

	}

	// Nuevo identificador
	currentProjectId = generateProjectId();

	// Ya no hay cambios pendientes
	projectModified = false;

	// Actualizar selección en la biblioteca
	updateSelectedProject();

	titleText.value = "Sin Título";
	workspaceTitleText.textContent = titleText.value;

	showTitle.checked = false;

	setMode("note");

	// Actualizar cursor personalizado
	if (typeof updateCanvasCursorColor === "function") {
		updateCanvasCursorColor();
	}

	// Limpiar contenido
	notes = [];
	barreNotes = [];
	nutNotes = Array(stringCount).fill(null);

	// Limpiar historial
	history = [];

	// Preparar entrada de notas
	title = ""
	noteText.value = "";
	noteText.focus();

/*
	fretCount = 10;
	numFrets.value = fretCount;

	displayMode = true;
	btnDisplay.classList.add("active");

	setOrientation("vertical");

	fretboardStyle = "maple";
	useNeckImage = true;

	cmbDiapason.value = fretboardStyle;

	neckImage.src = fretboardImages.maple;
*/

	resizeCanvas();

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

		fretCount,

		view: displayMode ? "scale" : "no-scale",

		settings: {
			orientation,
			fretboardStyle:fretboardStyle
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
		`category="${escapeXml(project.category)}" ` +
		`fretCount="${project.fretCount}" ` +
		`view="${project.view}">`
	);

	lines.push(`${indent}\t<settings>`);
	lines.push(
		`${indent}\t\t<orientation>${escapeXml(project.settings.orientation)}</orientation>`
	);
	lines.push(
		`${indent}\t\t<fretboardStyle>${escapeXml(project.settings.fretboardStyle)}</fretboardStyle>`
	);
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
	lines.push('<fretboardProjects version="1.0">');
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

			return node
				? node.textContent.trim()
				: fallback;

		};

		const project = {

			id: projectNode.getAttribute("id") || generateProjectId(),

			title: projectNode.getAttribute("title") || "Sin título",

			category: projectNode.getAttribute("category"),

			fretCount: parseInt(projectNode.getAttribute("fretCount")),

			view: projectNode.getAttribute("view") || "scale",

			settings: {
				orientation: getSetting(
					"orientation",
					"horizontal"
				),

				fretboardStyle: getSetting(
					"fretboardStyle",
					"maple"
				)
			},

			notes: [],
			barres: [],
			nutNotes: []
		};

		projectNode.querySelectorAll("notes > note").forEach(
			noteNode => {

				project.notes.push({
					string: Number(
						noteNode.getAttribute("string")
					),

					fret: Number(
						noteNode.getAttribute("fret")
					),

					color:
						noteNode.getAttribute("color") ||
						"#000000",

					text:
						noteNode.getAttribute("text") ||
						""
				});

			}
		);

		projectNode.querySelectorAll("barres > barre").forEach(
			barreNode => {

				project.barres.push({
					fret: Number(
						barreNode.getAttribute("fret")
					),

					startString: Number(
						barreNode.getAttribute("startString")
					),

					color:
						barreNode.getAttribute("color") ||
						"#000000",

					text:
						barreNode.getAttribute("text") ||
						""
				});

			}
		);

		projectNode.querySelectorAll(
			"nutNotes > nutNote"
		).forEach(nutNode => {

			project.nutNotes.push({
				string: Number(
					nutNode.getAttribute("string")
				),

				color:
					nutNode.getAttribute("color") ||
					"#000000",

				text:
					nutNode.getAttribute("text") ||
					""
			});

		});

		return project;

	});

}


function renderProjectList() {

	// Eliminar todas las categorías actuales excepto la cabecera
	projectPanel.querySelectorAll(".projectCategory").forEach(category => category.remove());

	getSortedCategories().forEach(category => {

		// ---------- Contenedor de la categoría ----------
		const categoryContainer = document.createElement("div");
		categoryContainer.className = "projectCategory";

		// ---------- Botón de la categoría ----------
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

		// ---------- Lista de proyectos ----------
		const list = document.createElement("ul");

		list.className = "projectCategoryList";
		list.id = `projectList_${category.id}`;

		categoryContainer.appendChild(categoryButton);
		categoryContainer.appendChild(list);

		projectPanel.appendChild(categoryContainer);

		// ---------- Proyectos ----------
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

			const openButton = document.createElement("button");

			openButton.type = "button";
			openButton.className = "projectOpenButton";
			openButton.dataset.projectId = project.id;

			const titleSpan = document.createElement("span");

			titleSpan.className = "projectTitle";
			titleSpan.textContent = project.title;

			openButton.appendChild(titleSpan);

			openButton.title = `Abrir: ${project.title}`;

			openButton.addEventListener("click", () => {
				loadProject(project);
			});

			if (project.id === currentProjectId) {

				requestAnimationFrame(() => {

					openProjectCategory(project.category);

					openButton.click();

				});

			}

			item.appendChild(openButton);

			if (isAdmin) {

				const deleteButton = document.createElement("button");

				deleteButton.type = "button";
				deleteButton.className = "projectDeleteButton";
				deleteButton.title = "Eliminar proyecto";

				deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';

				deleteButton.addEventListener("click", e => {

					e.stopPropagation();

					deleteProject(project.id);

				});

				item.appendChild(deleteButton);

			}

			list.appendChild(item);

		});

	});

	setupProjectCategories();

	updateSelectedProject();

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

function loadProject(project) {

	currentProjectId = project.id;

	updateSelectedProject();

	workspaceTitleText.textContent = project.title;
	title = project.title;
	titleText.value = project.title;

	// Seleccionar la categoría del proyecto
	projectCategory.value = project.category;

	// Si la categoría no existe, seleccionar la primera disponible
	if (projectCategory.value !== project.category && categories.length > 0) {
		projectCategory.value = categories[0].id;
	}

	fretCount = Math.max(5, Math.min(24, project.fretCount));
	numFrets.value = fretCount;

	displayMode = project.view === "scale";

	btnDisplay.classList.toggle("active", displayMode);

	orientation = project.settings?.orientation === "vertical"
		? "vertical"
		: "horizontal";

	setOrientation(orientation);

	fretboardStyle = project.settings?.fretboardStyle || "maple";

	setFretboardStyle(fretboardStyle);

	notes = project.notes.map(note => ({
		string: note.string,
		fret: note.fret,
		color: note.color,
		text: note.text
	}));

	barreNotes = (project.barres || []).map(barre => ({
		fret: barre.fret,
		startString: barre.startString,
		color: barre.color,
		text: barre.text
	}));

	nutNotes = Array(stringCount).fill(null);

	(project.nutNotes || []).forEach(note => {

		if (
			note.string >= 0 &&
			note.string < stringCount
		) {
			nutNotes[note.string] = {
				color: note.color,
				text: note.text
			};
		}

	});

	history = [];
	projectModified = false;

	resizeCanvas();

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

	renderProjectList();
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


async function chooseProjectsFile() {

	if (!window.showOpenFilePicker) {
		alert(
			"Tu navegador no permite editar directamente el XML. " +
			"Al guardar se descargará " + xmlProjects
		);
		return;
	}

	const [fileHandle] = await window.showOpenFilePicker({
		types: [{
			description: "Proyectos de Fretboard",
			accept: {
				"application/xml": [".xml"]
			}
		}],
		multiple: false
	});

	projectsFileHandle = fileHandle;

	const file = await projectsFileHandle.getFile();
	const xmlText = await file.text();

	projectPanelHeaderTitle.innerHTML = "BIBLIOTECA LOCAL";

	btnToggleLibrary.title = "Local: " + fileHandle.name;

	projects = parseProjectsXml(xmlText);

	renderProjectList();

}


async function loadDefaultProjects() {

	try {

		const response = await fetch(xmlProjects);

		if (!response.ok) {
			throw new Error("No se pudo leer " + xmlProjects);
		}

		const xmlText = await response.text();

		projects = parseProjectsXml(xmlText);

		renderProjectList();

	} catch (error) {

		console.warn(
			"No se pudieron cargar los proyectos iniciales.",
			error
		);

	}

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
	renderProjectList();

	// Guardar el XML
	saveProjectsFile();

	// Crear un proyecto nuevo
	newProject();

}

function generateProjectId() {

	return crypto.randomUUID().replaceAll("-", "");

}

/*
function generateCategoryId() {
    return crypto.getRandomValues(new Uint32Array(1))[0].toString();
}
*/

function generateCategoryId() {
    return crypto.getRandomValues(new BigUint64Array(1))[0].toString();
}

function updateSelectedProject() {

	document.querySelectorAll(".projectOpenButton")
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
	renderProjectList();

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

	renderProjectList();

	if (categories.length > 0) {
		projectCategory.value = categories[0].id;
	}

	saveProjectsFile();

}
