
////////////////////////////////////////////////////////////
//
// ARRAYS DE ACORDES Y NOTAS
//
////////////////////////////////////////////////////////////

function loadNotas(mode){

    NOTAS = [];
    ACORDES = [];

    switch (mode) {

        case "up":
            NOTAS = sequenceUp.map(item => item.note);
            ACORDES = [...chordsUp];
            break;

        case "down":
            NOTAS = sequenceDown.map(item => item.note);
            ACORDES = [...chordsDown];
            break;

        case "up-down":
            NOTAS = sequenceUpDown.map(item => item.note);
            ACORDES = [...chordsUpDown];
            break;

        case "down-up":
            NOTAS = sequenceDownUp.map(item => item.note);
            ACORDES = [...chordsDownUp];
            break;

    }

    const result = [];

    let currentChord = null;

    for (const item of ACORDES) {

        if (item.chord !== currentChord) {

            currentChord = item.chord;

            result.push([]);

        }

        result[result.length - 1].push(item.note);

    }

    ACORDES = result;

}

function scoreLoadArray(mode){

    switch (mode) {

        case "up":
            scoreArray = (projectType === "sequence" ? sequenceUp : chordsUp);
            break;

        case "down":
            scoreArray = (projectType === "sequence" ? sequenceDown : chordsDown);
            break;

        case "up-down":
            scoreArray = (projectType === "sequence" ? sequenceUpDown : chordsUpDown);
            break;

        case "down-up":
            scoreArray = (projectType === "sequence" ? sequenceDownUp : chordsDownUp);
            break;

    }

}


////////////////////////////////////////////////////////////
//
// PROYECTO
//
////////////////////////////////////////////////////////////

async function playMusic(){

	if (!isPlaying) {

		isPlaying = true;

		setControlsEnabled(false);

		btnPlayStop.disabled = false;
		btnPlayStop_2.disabled = false;
		scoreFloatingPlay.disabled = false;

		samplerVolume.disabled = false;

		if (metronome_on.checked){

			metronome_volumen.disabled = false;
			metronome_volumen_2.disabled = false;

		}

		setPlayStopButton(btnPlayStop, true);
		setPlayStopButton(btnPlayStop_2, true);

		scoreFloatingPlay.innerHTML =
			"<i class='fa-solid fa-stop'></i>";

		scoreFloatingPlay.classList.add("stop");

		if (chkAutoScroll.checked) {
			scoreFloatingPlay.style.display = "flex";
		}

		// Mostrar timeline e información

		workspaceTimeInfo.style.display = "flex";

		// Abrir y cerrar controles

		topControlsWasOpen =
			topControlsContainer.classList.contains("isOpen");

		if (topControlsWasOpen) {
			closeTopControls();
		}

		await Tone.start();

		Tone.Transport.stop();
		Tone.Transport.position = 0;

		player.startWithCountIn(() => {

			if (projectType == "sequence") {

				player.playSequence(NOTAS);

			} else {

				player.playChord(ACORDES);

			}

		});

	} else {

		// IMPORTANTE:
		// Cambiar el estado ANTES de player.stop()
		// porque player.stop() puede emitir "playerBeat: stop".

		isPlaying = false;

		player.stop();

		if (metronome.playing) {
			metronome.stop();
		}

		scorePaint_stop();

		setControlsEnabled(true);

		setPlayStopButton(btnPlayStop, false);
		setPlayStopButton(btnPlayStop_2, false);

		scoreFloatingPlay.innerHTML =
			"<i class='fa-solid fa-play'></i>";

		scoreFloatingPlay.classList.remove("stop");
		scoreFloatingPlay.style.display = "none";

		// Ocultar timeline e información

		workspaceTimeInfo.style.display = "none";

		// Abrir y cerrar controles

		if (topControlsWasOpen) {
			openTopControls();
		}

		topControlsWasOpen = false;

		resetPlaybackUI();

	}

}

async function metronomePlayStop(){

	await Tone.start();

	if (Tone.context.state !== "running") {
		await Tone.context.resume();
	}

	if (metronome.playing) {

		metronome.stop();

		setControlsEnabled(true);

		setPlayStopButton(metronome_btnPlayStop, false);

		resetMetronomeUI();

		// Ocultar timeline e información

		workspaceTimeInfo.style.display = "none";

	} else {

		setControlsEnabled(false);

		metronome_btnPlayStop.disabled = false;
		metronome_volumen.disabled = false;
		sliderBpm.disabled = false;
		btnLessTempo.disabled = false;
		btnMoreTempo.disabled = false;

		setPlayStopButton(metronome_btnPlayStop, true);

		if (!metronome_on.checked) {

			metronome_on.checked = true;

			setMetronmeOnPlaying(true);

			workspaceTimeInfo.style.display = "none";

			resetMetronomeUI();

		} else {

			workspaceTimeInfo.style.display = "flex";

		}

		metronome.start();

	}

	metronome_btnPlayStop.focus({ focusVisible: true });

}

function resetPlaybackUI(){

	buildHtmlDivsTimeline();

	metronome_Info.innerHTML = "Metrónomo: <b>1 / 1</b>";

	player_repeatInfo.innerHTML = "Repetición: <b>1</b>&nbsp;Compás: <b>1</b>";

	countBars = 1;
	repetitionSequence = 1;
	firstTick = true;

//	window.scrollTo({top: 0,left: 0,behavior: "smooth"});

}

function resetMetronomeUI(){

	buildHtmlDivsTimeline();

	metronome_Info.innerHTML = "Metrónomo: <b>1 / 1</b>";

}

function setPlayStopButton(button, isPlaying, showText = true){

	if (isPlaying) {

		button.innerHTML = showText
			? "<i class='fa-solid fa-stop'></i><span>Stop</span>"
			: "<i class='fa-solid fa-stop'></i>";

	} else {

		button.innerHTML = showText
			? "<i class='fa-solid fa-play'></i><span>Play</span>"
			: "<i class='fa-solid fa-play'></i>";

	}

	button.classList.toggle("buttonPlay", !isPlaying);
	button.classList.toggle("buttonStop", isPlaying);

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

function setControlsEnabled(enabled) {
    const controls = document.querySelectorAll(
        "input, select, button"
    );

    controls.forEach(control => {
        control.disabled = !enabled;
    });

    btnResetScorePalyer.disabled = false;
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
    } else if (denominator === "8") {
        cmbFigure.innerHTML = `<option value="2">Corchea</option>`;
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

function resetScorePlayer() {

    player.stop();

    metronome.stop();

    Tone.Transport.stop();
    Tone.Transport.cancel();

    Object.values(instruments).forEach(instrument => {

        if (instrument.releaseAll)
            instrument.releaseAll();

    });

    scorePaint_stop();

    scorePaint_clearAllHighlights(scoreSvg);

    scorePaint_removeProgressBar();

    vexTab_container.scrollLeft = 0;
    vexTab_container.scrollTop = 0;

    buildHtmlDivsTimeline();

    player.playing = false;

}


////////////////////////////////////////////////////////////
//
// INSTRUMENTS
//
////////////////////////////////////////////////////////////

function createSampler(name) {

    return new Tone.Sampler(instrumentDefs[name]).toDestination();

}

function setInstrument(name) {

    if (!instruments[name]) {return;}

    currentInstrument = name;

    instrument = instruments[name];

    player.instrument = instrument;

}

////////////////////////////////////////////////////////////
//
// METRONOMO TIMELINE
//
////////////////////////////////////////////////////////////

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


////////////////////////////////////////////////////////////
//
// PARTITURA VEXTAB
//
////////////////////////////////////////////////////////////

function vexTab_completeLastBar(items, notesPerBar) {

    while (items.length % notesPerBar !== 0) {

        items.push({
            rest: true
        });

    }

}

function vexTab_splitIntoBars(items, notesPerBar) {

    const bars = [];

    for (let i = 0; i < items.length; i += notesPerBar) {
        bars.push(items.slice(i, i + notesPerBar));
    }

    return bars;

}

function vexTab_buildItem(item) {

    // Silencio
    if (item && item.rest === true) {
        return "##";
    }

    // Acorde
    if (Array.isArray(item)) {

        return "(" + item.map(note => `${note.fret}/${note.string + 1}`).join(".") + ")";

    }

    // Nota
    return `${item.fret}/${item.string + 1}`;

}

function vexTab_groupChords(chords) {

    const groups = [];
    const map = new Map();

    for (const note of chords) {

        // Crear el grupo del acorde si no existe
        if (!map.has(note.chord)) {
            map.set(note.chord, []);
        }

        map.get(note.chord).push(note);

    }

    // Mantener el orden de los acordes
    for (const chord of [...map.keys()].sort((a, b) => a - b)) {
        groups.push(map.get(chord));
    }

    return groups;

}

function vexTab_renderBar(bar, figure, time) {
    const tokens = [];
    let i = 0;
    while (i < bar.length) {
        if (!bar[i].rest) {
            tokens.push(vexTab_buildItem(bar[i]));
            i++;
            continue;
        }
        const rests = [];
        const startPosition = i;
        while (i < bar.length && bar[i].rest) {
            rests.push("##");
            i++;
        }
        tokens.push(...vexTab_compressRestGroup(rests, figure, time, startPosition));
    }
    return tokens.join(" ");
}

function vexTab_compressRestGroup(items, figure, time, startPosition) {
    if (!items.every(item => item === "##")) return items;
    let count = items.length;
    const result = [];
    const [numerator, denominator] = time.split("/").map(Number);
    if (denominator === 8 && [6, 9, 12].includes(numerator)) {
        const positionInGroup = startPosition % 3;
        const remainingInGroup = positionInGroup === 0 ? 3 : 3 - positionInGroup;
        const firstGroupSize = Math.min(remainingInGroup, count);
        if (firstGroupSize === 1) result.push(":8", "##");
        else if (firstGroupSize === 2) result.push(":q", "##");
        else if (firstGroupSize === 3) result.push(":qd", "##");
        count -= firstGroupSize;
        while (count >= 3) {
            result.push(":qd", "##");
            count -= 3;
        }
        if (count === 2) result.push(":q", "##");
        else if (count === 1) result.push(":8", "##");
        return result;
    }
    if (denominator === 8 && [5, 7].includes(numerator)) {
        while (count > 0) {
            result.push(":8", "##");
            count--;
        }
        return result;
    }
    if (denominator === 4 && figure === 4) {
        const positionInGroup = startPosition % 4;
        const remainingInGroup = positionInGroup === 0 ? 4 : 4 - positionInGroup;
        const firstGroupSize = Math.min(remainingInGroup, count);
        if (firstGroupSize === 1) result.push(":16", "##");
        else if (firstGroupSize === 2) result.push(":8", "##");
        else if (firstGroupSize === 3) result.push(":8d", "##");
        else if (firstGroupSize === 4) result.push(":q", "##");
        count -= firstGroupSize;
        while (count >= 4) {
            result.push(":q", "##");
            count -= 4;
        }
        if (count === 3) result.push(":8d", "##");
        else if (count === 2) result.push(":8", "##");
        else if (count === 1) result.push(":16", "##");
        return result;
    }
    if (denominator === 4 && figure === 2) {
        const positionInGroup = startPosition % 2;
        const remainingInGroup = positionInGroup === 0 ? 2 : 1;
        const firstGroupSize = Math.min(remainingInGroup, count);
        if (firstGroupSize === 1) result.push(":8", "##");
        else if (firstGroupSize === 2) result.push(":q", "##");
        count -= firstGroupSize;
        while (count >= 2) {
            result.push(":q", "##");
            count -= 2;
        }
        if (count === 1) result.push(":8", "##");
        return result;
    }
    if (denominator === 4 && figure === 1) {
        while (count > 0) {
            result.push(":q", "##");
            count--;
        }
        return result;
    }
    return items;
}

function vexTab_calcWidth(figure,totalFigures,notesPerBar){

	const headerWidth = 100;

	const figureWidth = {
	    1: 42,   // negras
	    2: 34,   // corcheas
	    3: 32,   // tresillos
	    4: 29,   // semicorcheas
	    5: 28,
	    6: 27,
	    7: 26
	};

	const barWidth = {
	    1: 18,
	    2: 24,
	    3: 26,
	    4: 36,
	    5: 40,
	    6: 44,
	    7: 48
	};

	const numberBars = totalFigures / notesPerBar;

	//----------------------------------------------------------
	// Corrección por grupos de barras (beams)
	//----------------------------------------------------------

	let beamWidth = 0;

	switch (figure) {

	    case 4: beamWidth = 12; break;   // semicorcheas
	    case 5: beamWidth = 16; break;   // quintillos
	    case 6: beamWidth = 18; break;
	    case 7: beamWidth = 20; break;

	}

	const beamGroups = Math.floor(totalFigures / 4);

	//----------------------------------------------------------

	const calcWidth = Math.round(
	    headerWidth +
	    totalFigures * figureWidth[figure] +
	    numberBars * barWidth[figure] +
	    beamGroups * beamWidth
	);

	return calcWidth;

}

function vexTab_calcScale(scoreWidth){

    if (scoreScale === "auto"){
	const scale = Number((Math.min(1, vexTab_container.clientWidth / scoreWidth) * 0.98).toFixed(2));
	return scale;
    }else{
	return scoreScale;
    }

}

function vexTab_generateVexTab(data,key = "C",time = "4/4",figure = 1,mode = "sequence") {

    figure = parseInt(figure, 10);

    const [numerator, denominator] = time.split("/").map(Number);

    const durationMap = {
        1: ":q",
        2: ":8",
        4: ":16"
    };

    const duration = denominator === 8
        ? ":8"
        : durationMap[figure];

    const notesPerBar =
        denominator === 8
            ? numerator
            : numerator * figure;

    //----------------------------------------------------------
    // Preparar notas
    //----------------------------------------------------------

    const items =
        mode === "sequence"
            ? [...data]
            : vexTab_groupChords(data);

    vexTab_completeLastBar(items, notesPerBar);

    const bars = vexTab_splitIntoBars(items, notesPerBar);

    const barStrings = bars.map(bar =>
        vexTab_renderBar(bar, figure, time)
    );

    //----------------------------------------------------------
    // Compases por sistema
    //----------------------------------------------------------

    let barsPerSystem;

    if (denominator === 4) {

        if ([2, 3, 4].includes(numerator)) {

            if (figure === 1)
                barsPerSystem = 8;
            else if (figure === 2)
                barsPerSystem = 4;
            else if (figure === 4)
                barsPerSystem = 2;

        }
        else if ([5, 7].includes(numerator)) {

            if (figure === 2)
                barsPerSystem = 2;
            else if (figure === 4)
                barsPerSystem = 1;

        }

    }
    else if (denominator === 8) {

        if ([6, 9].includes(numerator))
            barsPerSystem = 2;
        else if (numerator === 12)
            barsPerSystem = 1;

    }

    if (!barsPerSystem) barsPerSystem = 4;

    const totalFigures = items.length;

    let scale = scoreScale;

    let result = "";

    //----------------------------------------------------------
    // UNA SOLA LÍNEA
    //----------------------------------------------------------

    let scoreWidth = 1400;

    if (cmbScoreLayout.value === "horizontal") {

        //----------------------------------------------------------
        // Ancho total de la partitura horizontal
        //----------------------------------------------------------

        const calcWidth = vexTab_calcWidth(figure,totalFigures,notesPerBar);

        scoreWidth = (calcWidth > 1440) ? calcWidth : 1400;

        scale = vexTab_calcScale(scoreWidth);

        result += `options width=${parseInt(scoreWidth, 10)} space=40 scale=${scale} stave-distance=${parseInt(sliderScoreStaveDistance.value,10)}\n`;
        result += "tab-stems=true tab-stem-direction=up\n";

        if (cmbScoreStaves.value === "notation") {

            result += `tabstave notation=true tablature=false key=${key} time=${time} clef=treble\n`;

        }
        else if (cmbScoreStaves.value === "tablature") {

            result += `tabstave notation=false tablature=true key=${key} time=${time} clef=treble\n`;

        }
        else {

            result += `tabstave notation=true tablature=true key=${key} time=${time} clef=treble\n`;

        }

        result += `notes ${duration} ${barStrings.join(" | ")}`;

        if (player_repeats.value > 1){
		result += ` =:|\n`;
        }else{
		result += ` =|=\n`;
        }

        result += `options space=${parseInt(sliderScoreStaveMargin.value,10)}\n`;

    }

    //----------------------------------------------------------
    // VARIOS SISTEMAS
    //----------------------------------------------------------

    else {

        scale = vexTab_calcScale(scoreWidth);

        result += `options width=${parseInt(scoreWidth, 10)} space=40 scale=${scale} stave-distance=${parseInt(sliderScoreStaveDistance.value,10)}\n`;
        result += "tab-stems=true tab-stem-direction=up\n";

        for (let i = 0; i < barStrings.length; i += barsPerSystem) {

            const systemBars = barStrings.slice(i, i + barsPerSystem);

            if (cmbScoreStaves.value === "notation") {

                result += `tabstave notation=true tablature=false key=${key} time=${time} clef=treble\n`;

            }
            else if (cmbScoreStaves.value === "tablature") {

                result += `tabstave notation=false tablature=true key=${key} time=${time} clef=treble\n`;

            }
            else {

                result += `tabstave notation=true tablature=true key=${key} time=${time} clef=treble\n`;

            }

            result += `notes ${duration} ${systemBars.join(" | ")}`;

            if (i + barsPerSystem >= barStrings.length){

	        if (player_repeats.value > 1){
			result += ` =:|\n`;
	        }else{
			result += ` =|=\n`;
	        }

            }else{

                result += " |\n";

	    }

            result += `options space=${parseInt(sliderScoreStaveMargin.value,10)}\n`;

        }

    }

    return result;

}

async function vexTab_render() {

    // Esperar a que VexTab genere el SVG
    while (!document.querySelector(".vextab-auto svg")) {
        await new Promise(r => setTimeout(r, 50));
    }

    const div = document.querySelector(".vextab-auto .vex-canvas");
    const svg = div.querySelector("svg");

    if (!svg) throw new Error("No se ha generado el SVG de VexTab.");

    const year = new Date().getFullYear();

    if (chkScoreTitle.checked){

        vexTab_createHeaderFooter(svg,titleText.value.trim() || "Sin Título",`${year} - ${scoreFooter}`);

    }

    // Dejar únicamente el SVG dentro del contenedor
    div.innerHTML = svg.outerHTML;

    //Pintado de las notas
    // Obtener el SVG REAL que ahora está dentro del DOM
    const renderedSvg = div.querySelector("svg");

    // Inicializar el pintado sobre el SVG visible
    scorePaint_initScorePlayback(renderedSvg);

}

function vexTab_createHeaderFooter(svg, titulo = "", pie = "") {

    const ns = "http://www.w3.org/2000/svg";

    // Márgenes
    const margenSuperiorExterior = 30;
    const espacioTituloPartitura = 100;

    const espacioPartituraPie = 25;
    const margenInferiorExterior = 15;

    const espacioSuperior = titulo ? margenSuperiorExterior + espacioTituloPartitura : 0;
    const espacioInferior = pie ? espacioPartituraPie + margenInferiorExterior : 0;

    // Obtener viewBox
    let vb = svg.getAttribute("viewBox").split(/\s+/).map(Number);

    // Mantener la escala
    const alturaOriginalViewBox = vb[3];
    const alturaOriginalSVG = parseFloat(svg.getAttribute("height"));
    const factor = alturaOriginalSVG / alturaOriginalViewBox;

    // Ampliar el viewBox
    vb[3] += espacioSuperior + espacioInferior;
    svg.setAttribute("viewBox", vb.join(" "));

    // Ajustar altura física
    const nuevaAltura = vb[3] * factor;

    svg.setAttribute("height", nuevaAltura);
    svg.style.height = nuevaAltura + "px";

    //----------------------------------------------------------
    // Desplazar la partitura
    //----------------------------------------------------------

    if (titulo) {

        const grupo = document.createElementNS(ns, "g");
        grupo.setAttribute("transform", `translate(0,${espacioSuperior})`);

        while (svg.firstChild) {
            grupo.appendChild(svg.firstChild);
        }

        svg.appendChild(grupo);

    }

    //----------------------------------------------------------
    // Posición del título y pie
    //----------------------------------------------------------

    const horizontal = cmbScoreLayout.value === "horizontal";

    const margenIzquierdo = 30;

    const posX = horizontal ? margenIzquierdo : vb[2] / 2;
    const anchor = horizontal ? "start" : "middle";

    //----------------------------------------------------------
    // Título
    //----------------------------------------------------------

    if (titulo) {

        const title = document.createElementNS(ns, "text");

        title.setAttribute("x", posX);
        title.setAttribute("y", margenSuperiorExterior + 22);
        title.setAttribute("text-anchor", anchor);
        title.setAttribute("font-family", "Segoe UI");
        title.setAttribute("font-size", 46);

        title.textContent = titulo;

        svg.appendChild(title);

    }

    //----------------------------------------------------------
    // Pie
    //----------------------------------------------------------

    if (pie) {

        const footer = document.createElementNS(ns, "text");

        footer.setAttribute("x", posX);
        footer.setAttribute("y", vb[3] - margenInferiorExterior);
        footer.setAttribute("text-anchor", anchor);
        footer.setAttribute("font-family", "Segoe UI");
        footer.setAttribute("font-size", 18);

        footer.textContent = pie;

        svg.appendChild(footer);

    }

}

async function vexTab_saveSVGFiles() {

    try {

        const div = document.querySelector(".vextab-auto .vex-canvas");
        const vextabSvg = document.querySelector("svg");

        if (!vextabSvg) throw new Error("No se encontró ningún <div> SVG.");

        await svg_scoreToFile(vextabSvg);

        const canvas = await svg_scoreToCanvas(vextabSvg);

        await svg_scoreToClipboard(canvas);

        await svg_scoreToPNG(canvas);

    }
    catch (err) {

        console.error(err);

        alert(err);

    }

}


////////////////////////////////////////////////////////////
//
// SVG
//
////////////////////////////////////////////////////////////

async function svg_scoreToCanvas(svgElement) {

    return new Promise((resolve, reject) => {

        const svg = new XMLSerializer().serializeToString(svgElement);

        const blob = new Blob([svg], {
            type: "image/svg+xml;charset=utf-8"
        });

        const url = URL.createObjectURL(blob);

        const img = new Image();

        img.onload = () => {

            const canvas = document.createElement("canvas");

            canvas.width = svgElement.viewBox.baseVal.width || svgElement.width.baseVal.value;

            canvas.height = svgElement.viewBox.baseVal.height || svgElement.height.baseVal.value;

            const ctx = canvas.getContext("2d");

            // Fondo blanco
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            URL.revokeObjectURL(url);

            resolve(canvas);
        };

        img.onerror = err => {

            URL.revokeObjectURL(url);

            reject(err);

        };

        img.src = url;

    });

}

async function svg_scoreToClipboard(canvas) {

    try {

        const blob = await new Promise(resolve =>
            canvas.toBlob(resolve, "image/png")
        );

        await navigator.clipboard.write([
            new ClipboardItem({
                "image/png": blob
            })
        ]);

        alert("Imagen  de la partitura copiada al portapapeles.");

    }
    catch (err) {

        console.error(err);

        alert("No ha sido posible copiar la imagen de la partitura.");

    }

}

async function svg_scoreToFile(svgElement, fileName = "partitura.svg") {

    try {

        const serializer = new XMLSerializer();

        let svgText = serializer.serializeToString(svgElement);

        // Añadir cabecera XML
        svgText =
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            svgText;

        const blob = new Blob(
            [svgText],
            {
                type: "image/svg+xml;charset=utf-8"
            }
        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        a.download = fileName;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

    }
    catch (err) {

        console.error(err);

        alert("No ha sido posible guardar el archivo SVG de la partitura.");

    }

}

async function svg_scoreToPNG(canvas, fileName = "partitura.png") {

    try {

        const link = document.createElement("a");

        link.download = fileName;

        link.href = canvas.toDataURL("image/png");

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

    }
    catch (err) {

        console.error(err);

        alert("No ha sido posible guardar el archivo de imagen de la partitura.");

    }

}




////////////////////////////////////////////////////////////
//
// SCORE
//
////////////////////////////////////////////////////////////

async function scoreRender() {

	const vexTabText = vexTab_generateVexTab(scoreArray,cmbTonalidad.value,cmbBar.value,cmbFigure.value,projectType);

	vexTab_container.classList.remove("layout-left","layout-center");

	vexTab_container.classList.add(cmbScoreLayout.value === "vertical" ? "layout-center" : "layout-left");

	vexTab_container.innerHTML = vexTabText;

	// Volver a renderizar la partitura

	await window.vextabStart(vexTab_container);

	// Esperar a que termine y limpiar el SVG

	await vexTab_render();

	//------------------------------------------------
	// Ajustar alineación cuando la partitura desborda
	//------------------------------------------------

	if (cmbScoreLayout.value === "vertical" && vexTab_container) {

		const svg = vexTab_container.querySelector("svg");

		if (svg) {

			const containerWidth = vexTab_container.clientWidth;
			const svgWidth = svg.getBoundingClientRect().width;

			if (svgWidth > containerWidth) {

				vexTab_container.classList.remove("layout-center");
				vexTab_container.classList.add("layout-left");

			} else {

				vexTab_container.classList.remove("layout-left");
				vexTab_container.classList.add("layout-center");

			}

		}

	}

}



////////////////////////////////////////////////////////////
//
// SCORE PLAYER PAINT
//
////////////////////////////////////////////////////////////

// INICIALIZAR

function scorePaint_initScorePlayback(svg) {
    if (!svg) {
        console.error("No se ha encontrado el SVG de la partitura");
        return false;
    }

    scoreCurrentSystem = -1;

    scoreSvg = svg;
    scorePaint_clearAllHighlights(scoreSvg);
    scorePaint_removeProgressBar();

    scoreSystems = scorePaint_getSystems(scoreSvg);
    scoreEvents = scorePaint_buildAllScoreEvents(scoreSystems);

    scoreEventIndex = 0;
    scoreIsReady = true;

    scorePaint_createProgressBar();

    return true;
}

// TICK

function scorePaint_scoreTick() {
    if (!scoreIsReady) {
        console.warn("La partitura no está inicializada");
        return;
    }

    if (scoreEventIndex >= scoreEvents.length) {
        return;
    }

    const event = scoreEvents[scoreEventIndex];

    scorePaint_highlightScoreEvent(event);
    scorePaint_updateProgressBar(event);

    scoreEventIndex++;
}

// STOP

function scorePaint_stop() {
    if (!scoreSvg) {
        return;
    }

    scorePaint_clearAllHighlights(scoreSvg);
    scorePaint_hideProgressBar();

    scoreEventIndex = 0;

    if (vexTab_container) {
        vexTab_container.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth"
        });
    }

}

// MODO DE VISUALIZACIÓN

function scorePaint_getScoreDisplayMode() {
    if (!cmbScoreStaves) {
        return "all";
    }

    return cmbScoreStaves.value;
}

// GRUPO PRINCIPAL

function scorePaint_getScoreGroup() {

    if (!scoreSvg) {
        return null;
    }

    const mode =
        scorePaint_getScoreDisplayMode();

    const elements = [];

    //------------------------------------------------
    // Pentagrama
    //------------------------------------------------

    if (mode === "all" || mode === "notation") {

        elements.push(
            ...scoreSvg.querySelectorAll(".vf-stave")
        );

        elements.push(
            ...scoreSvg.querySelectorAll(".vf-stavenote")
        );

    }

    //------------------------------------------------
    // Tablatura
    //------------------------------------------------

    if (mode === "all" || mode === "tablature") {

        elements.push(
            ...scoreSvg.querySelectorAll(".vf-tabnote")
        );

        elements.push(
            ...scorePaint_getTabRestTexts(scoreSvg)
        );

    }

    if (elements.length === 0) {
        return null;
    }

    //------------------------------------------------
    // Buscar ancestro común
    //------------------------------------------------

    let commonParent =
        elements[0].parentElement;

    while (
        commonParent &&
        commonParent !== scoreSvg
    ) {

        const containsAll =
            elements.every(element =>
                commonParent.contains(element)
            );

        if (containsAll) {
            return commonParent;
        }

        commonParent =
            commonParent.parentElement;

    }

    //------------------------------------------------
    // Si no hay un grupo común,
    // usamos el propio SVG
    //------------------------------------------------

    return scoreSvg;

}

// OBTENER SISTEMAS REALES

function scorePaint_getSystems(svg) {

    const mode = scorePaint_getScoreDisplayMode();
    const staves = [...svg.querySelectorAll(".vf-stave")];
    const systems = [];

    if (staves.length === 0)
        return systems;

    const staveData = staves.map(stave => {

        const box = stave.getBBox();

        return {
            element: stave,
            box,
            centerY: box.y + box.height / 2
        };

    });

    staveData.sort((a, b) => a.centerY - b.centerY);

    for (const stave of staveData) {

        let system = systems.find(system => Math.abs(stave.centerY - system.centerY) <= SCORE_SYSTEM_Y_TOLERANCE);

        if (!system) {

            system = {
                index: systems.length,
                centerY: stave.centerY,
                staves: [],
                staff: [],
                tab: []
            };

            systems.push(system);

        }

        system.staves.push(stave);
        system.centerY = system.staves.reduce((sum, item) => sum + item.centerY, 0) / system.staves.length;

    }

    systems.sort((a, b) => a.centerY - b.centerY);
    systems.forEach((system, index) => system.index = index);

    const staffNotes = [];

    if (mode === "all" || mode === "notation") {

        for (const note of svg.querySelectorAll(".vf-stavenote")) {

            const center = scorePaint_getStaffNoteCenter(note);

            staffNotes.push({
                element: note,
                x: center.x,
                y: center.y
            });

        }

    }

    const tabNotes = [];

    if (mode === "all" || mode === "tablature") {

        for (const note of svg.querySelectorAll(".vf-tabnote")) {

            const center = scorePaint_getTabNoteCenter(note);

            tabNotes.push({
                element: note,
                x: center.x,
                y: center.y
            });

        }

        for (const rest of scorePaint_getTabRestTexts(svg)) {

            const center = scorePaint_getElementCenter(rest);

            tabNotes.push({
                element: rest,
                x: center.x,
                y: center.y
            });

        }

    }

    for (const item of staffNotes) {

        const system = scorePaint_getNearestSystem(systems, item.y);

        if (system)
            system.staff.push(item);

    }

    for (const item of tabNotes) {

        const system = scorePaint_getNearestSystem(systems, item.y);

        if (system)
            system.tab.push(item);

    }

    return systems;

}

// BUSCAR SISTEMA MÁS CERCANO

function scorePaint_getNearestSystem(systems, y) {

    if (systems.length === 0)
        return null;

    let nearestSystem = systems[0];
    let nearestDistance = Math.abs(y - nearestSystem.centerY);

    for (let i = 1; i < systems.length; i++) {

        const distance = Math.abs(y - systems[i].centerY);

        if (distance < nearestDistance) {

            nearestDistance = distance;
            nearestSystem = systems[i];

        }

    }

    return nearestSystem;

}

// SILENCIOS DE TABLATURA

function scorePaint_getTabRestTexts(svg) {

    const rests = [];
    const textElements = [...svg.querySelectorAll("text")];

    for (const text of textElements) {

        const value = text.textContent.trim();

        if (!scorePaint_isRestCharacter(value))
            continue;

        const box = text.getBBox();

        if (box.width === 0 || box.height === 0)
            continue;

        const centerY = box.y + box.height / 2;

        if (centerY < 200)
            continue;

        rests.push(text);

    }

    return rests;

}

function scorePaint_isRestCharacter(value) {

    return value === "" ||
           value === "" ||
           value === "" ||
           value === "" ||
           value === "";

}

// CENTROS

function scorePaint_getElementCenter(element) {

    const box = element.getBBox();

    return {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
    };

}

function scorePaint_getStaffNoteCenter(group) {

    const notehead = group.querySelector(".vf-notehead");

    if (notehead)
        return scorePaint_getElementCenter(notehead);

    return scorePaint_getElementCenter(group);

}

function scorePaint_getTabNoteCenter(group) {

    const text = group.querySelector("text");

    if (text)
        return scorePaint_getElementCenter(text);

    return scorePaint_getElementCenter(group);

}

// EVENTOS

function scorePaint_buildAllScoreEvents(systems) {

    const events = [];

    for (const system of systems) {

        const systemEvents = scorePaint_buildSystemEvents(system);

        systemEvents.forEach(event => event.systemIndex = system.index);

        events.push(...systemEvents);

    }

    return events;

}

function scorePaint_buildSystemEvents(system) {

    const events = [];
    const mode = scorePaint_getScoreDisplayMode();
    const allElements = [];

    if (mode === "all" || mode === "notation")
        allElements.push(...system.staff.map(item => ({
            type: "staff",
            element: item.element,
            x: item.x,
            y: item.y
        })));

    if (mode === "all" || mode === "tablature")
        allElements.push(...system.tab.map(item => ({
            type: "tab",
            element: item.element,
            x: item.x,
            y: item.y
        })));

    allElements.sort((a, b) => a.x - b.x);

    for (const item of allElements) {

        let event = null;

        for (const existingEvent of events) {

            if (Math.abs(item.x - existingEvent.x) <= EVENT_X_TOLERANCE) {

                event = existingEvent;
                break;

            }

        }

        if (!event) {

            event = {
                x: item.x,
                y: item.y,
                staff: null,
                tab: null
            };

            events.push(event);

        }

        if (item.type === "staff")
            event.staff = item.element;

        if (item.type === "tab")
            event.tab = item.element;

    }

    events.sort((a, b) => a.x - b.x);

    return events;

}

// RESALTAR EVENTO

function scorePaint_highlightScoreEvent(event) {

    const mode = scorePaint_getScoreDisplayMode();

    if ((mode === "all" || mode === "notation") && event.staff)
        scorePaint_highlightStaffNote(event.staff);

    if ((mode === "all" || mode === "tablature") && event.tab)
        scorePaint_highlightTabElement(event.tab);

}

// PENTAGRAMA

function scorePaint_highlightStaffNote(group) {
    const noteheads =
        group.querySelectorAll(
            ".vf-notehead"
        );

    if (noteheads.length > 0) {
        noteheads.forEach(notehead => {
            scorePaint_highlightElementTree(
                notehead
            );
        });

        return;
    }

    const rest =
        group.querySelector(
            ".vf-rest"
        );

    if (rest) {
        scorePaint_highlightElementTree(
            rest
        );
    }
}

// CREAR BARRA

function scorePaint_createProgressBar() {
    if (!scoreSvg) {
        return;
    }

    scorePaint_removeProgressBar();

    const scoreGroup =
        scorePaint_getScoreGroup();

    if (!scoreGroup) {
        console.warn(
            "No se ha encontrado el grupo de los sistemas"
        );

        return;
    }

    scoreProgressBar =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

    scoreProgressBar.setAttribute(
        "stroke",
        scoreScrollColor
    );

    scoreProgressBar.setAttribute(
        "stroke-width",
        SCORE_PROGRESS_BAR_WIDTH
    );

    scoreProgressBar.setAttribute(
        "stroke-linecap",
        "round"
    );

    scoreProgressBar.setAttribute(
        "opacity",
        "0"
    );

    scoreGroup.appendChild(
        scoreProgressBar
    );
}

// CALCULAR POSICIÓN DE LA BARRA

function scorePaint_getProgressBarBounds(event) {
    if (!scoreSvg || !event) {
        return null;
    }

    const system =
        scoreSystems[
            event.systemIndex
        ];

    if (!system) {
        return null;
    }

    const mode =
        scorePaint_getScoreDisplayMode();

    const systemElements = [];

    if (mode === "all" || mode === "notation") {
        systemElements.push(
            ...system.staff
        );
    }

    if (mode === "all" || mode === "tablature") {
        systemElements.push(
            ...system.tab
        );
    }

    if (
        systemElements.length === 0
    ) {
        return null;
    }

    let y1 = Infinity;
    let y2 = -Infinity;

    for (const item of systemElements) {
        const box =
            item.element.getBBox();

        y1 = Math.min(
            y1,
            box.y
        );

        y2 = Math.max(
            y2,
            box.y + box.height
        );
    }

    const selectedStaves = [];

    for (const stave of system.staves) {
        const box = stave.box;

        if (mode === "notation" && box.height > 45) {
            continue;
        }

        if (mode === "tablature" && box.height <= 45) {
            continue;
        }

        selectedStaves.push(box);
    }

    if (selectedStaves.length > 0) {
        y1 = Math.min(
            ...selectedStaves.map(
                box => box.y
            )
        );

        y2 = Math.max(
            ...selectedStaves.map(
                box =>
                    box.y +
                    box.height
            )
        );
    }

    return {
        y1,
        y2
    };
}

// ACTUALIZAR BARRA

function scorePaint_updateProgressBar(event) {
    if (!scoreProgressBar || !event) {
        return;
    }

    const bounds =
        scorePaint_getProgressBarBounds(
            event
        );

    if (!bounds) {
        return;
    }

    scoreProgressBar.setAttribute(
        "x1",
        event.x
    );

    scoreProgressBar.setAttribute(
        "x2",
        event.x
    );

    scoreProgressBar.setAttribute(
        "y1",
        bounds.y1 -
        SCORE_PROGRESS_BAR_MARGIN
    );

    scoreProgressBar.setAttribute(
        "y2",
        bounds.y2 +
        SCORE_PROGRESS_BAR_MARGIN
    );

    scoreProgressBar.setAttribute(
        "opacity",
        "1"
    );

    scorePaint_autoScroll(event);
}

// OCULTAR BARRA

function scorePaint_hideProgressBar() {
    if (!scoreProgressBar) {
        return;
    }

    scoreProgressBar.setAttribute(
        "opacity",
        "0"
    );
}

// ELIMINAR BARRA

function scorePaint_removeProgressBar() {
    if (!scoreProgressBar) {
        return;
    }

    scoreProgressBar.remove();
    scoreProgressBar = null;
}

// RESALTADO DEL ÁRBOL SVG

function scorePaint_highlightElementTree(element) {
    scorePaint_saveOriginalFill(element);
    scorePaint_saveOriginalStroke(element);

    element.setAttribute(
        "fill",
        scoreNoteColor
    );

    element.setAttribute(
        "stroke",
        scoreNoteColor
    );

    const children =
        element.querySelectorAll("*");

    children.forEach(child => {
        scorePaint_saveOriginalFill(child);
        scorePaint_saveOriginalStroke(child);

        child.setAttribute(
            "fill",
            scoreNoteColor
        );

        child.setAttribute(
            "stroke",
            scoreNoteColor
        );
    });
}

// TABLATURA

function scorePaint_highlightTabElement(element) {
    if (
        element.tagName.toLowerCase() ===
        "text"
    ) {
        scorePaint_highlightTabRest(
            element
        );

        return;
    }

    scorePaint_highlightTabNote(
        element
    );
}

function scorePaint_highlightTabNote(group) {
    const textElements =
        group.querySelectorAll(
            "text"
        );

    textElements.forEach(element => {
        scorePaint_saveOriginalFill(
            element
        );

        scorePaint_saveOriginalStroke(
            element
        );

        element.setAttribute(
            "fill",
            scoreNoteColor
        );

        element.setAttribute(
            "stroke",
            scoreNoteColor
        );
    });
}

function scorePaint_highlightTabRest(text) {
    scorePaint_saveOriginalFill(text);
    scorePaint_saveOriginalStroke(text);

    text.setAttribute(
        "fill",
        scoreNoteColor
    );

    text.setAttribute(
        "stroke",
        scoreNoteColor
    );
}

// GUARDAR ESTILOS

function scorePaint_saveOriginalFill(element) {
    if (
        element.dataset.originalFill ===
        undefined
    ) {
        element.dataset.originalFill =
            element.getAttribute(
                "fill"
            );
    }
}

function scorePaint_saveOriginalStroke(element) {
    if (
        element.dataset.originalStroke ===
        undefined
    ) {
        element.dataset.originalStroke =
            element.getAttribute(
                "stroke"
            );
    }
}

// LIMPIAR RESALTADOS

function scorePaint_clearAllHighlights(svg) {
    svg.querySelectorAll("*").forEach(
        element => {
            const originalFill =
                element.dataset.originalFill;

            const originalStroke =
                element.dataset.originalStroke;

            if (
                originalFill !==
                undefined
            ) {
                if (
                    originalFill ===
                    null
                ) {
                    element.removeAttribute(
                        "fill"
                    );
                }
                else {
                    element.setAttribute(
                        "fill",
                        originalFill
                    );
                }

                delete element.dataset.originalFill;
            }

            if (
                originalStroke !==
                undefined
            ) {
                if (
                    originalStroke ===
                    null
                ) {
                    element.removeAttribute(
                        "stroke"
                    );
                }
                else {
                    element.setAttribute(
                        "stroke",
                        originalStroke
                    );
                }

                delete element.dataset.originalStroke;
            }
        }
    );
}

// AUTO SCROLL

function scorePaint_autoScroll(event) {

	if (!chkAutoScroll.checked) {
		return;
	}

	const container = vexTab_container;

	if (!container || !scoreSvg)
		return;

	const svgRect = scoreSvg.getBoundingClientRect();
	const viewBox = scoreSvg.viewBox.baseVal;

	const scaleX = svgRect.width / viewBox.width;
	const scaleY = svgRect.height / viewBox.height;

	//------------------------------------------------
	// Posición del evento dentro del SVG
	//------------------------------------------------

	const eventX = event.x * scaleX;
	const eventY = event.y * scaleY;

	//------------------------------------------------
	// Posición del SVG dentro del contenedor
	//------------------------------------------------

	const containerRect = container.getBoundingClientRect();

	const svgOffsetX =
		svgRect.left -
		containerRect.left +
		container.scrollLeft;

	const absoluteX =
		svgOffsetX +
		eventX;

	//------------------------------------------------
	// Scroll horizontal
	//------------------------------------------------

	const leftTrigger =
		container.scrollLeft +
		container.clientWidth * 0.15;

	const rightTrigger =
		container.scrollLeft +
		container.clientWidth * 0.70;

	let targetX =
		container.scrollLeft;

	if (absoluteX > rightTrigger) {

		const margin =
			container.clientWidth * 0.35;

		targetX =
			absoluteX -
			margin;

	} else if (absoluteX < leftTrigger) {

		const margin =
			container.clientWidth * 0.15;

		targetX =
			absoluteX -
			margin;

	}

	//------------------------------------------------
	// Modo horizontal
	//------------------------------------------------

	if (cmbScoreLayout.value === "horizontal") {

		const maxScrollX =
			container.scrollWidth -
			container.clientWidth;

		targetX =
			Math.max(
				0,
				Math.min(targetX,maxScrollX)
			);

		if (targetX !== container.scrollLeft) {

			container.scrollTo({
				left:targetX,
				behavior:"smooth"
			});

		}

		return;

	}

	//------------------------------------------------
	// Modo vertical
	//
	// El scroll vertical pertenece al BODY
	//------------------------------------------------

	const eventDocumentY =
		svgRect.top +
		eventY +
		window.scrollY;

	const topTrigger =
		window.scrollY +
		window.innerHeight * 0.15;

	const bottomTrigger =
		window.scrollY +
		window.innerHeight * 0.75;

	let targetY =
		window.scrollY;

	if (eventDocumentY > bottomTrigger) {

		const margin =
			window.innerHeight * 0.15;

		targetY =
			eventDocumentY -
			margin;

	} else if (eventDocumentY < topTrigger) {

		const margin =
			window.innerHeight * 0.15;

		targetY =
			eventDocumentY -
			margin;

	}

	//------------------------------------------------
	// Limitar scroll horizontal
	//------------------------------------------------

	const maxScrollX =
		container.scrollWidth -
		container.clientWidth;

	targetX =
		Math.max(
			0,
			Math.min(targetX,maxScrollX)
		);

	//------------------------------------------------
	// Limitar scroll vertical del BODY
	//------------------------------------------------

	const maxScrollY =
		document.documentElement.scrollHeight -
		window.innerHeight;

	targetY =
		Math.max(
			0,
			Math.min(targetY,maxScrollY)
		);

	//------------------------------------------------
	// Aplicar scroll
	//------------------------------------------------

	if (
		targetX !== container.scrollLeft ||
		targetY !== window.scrollY
	) {

		window.scrollTo({
			left:targetX,
			top:targetY,
			behavior:"smooth"
		});

	}

	//------------------------------------------------
	// El scroll horizontal pertenece al contenedor
	//------------------------------------------------

	if (targetX !== container.scrollLeft) {

		container.scrollTo({
			left:targetX,
			behavior:"smooth"
		});

	}

}