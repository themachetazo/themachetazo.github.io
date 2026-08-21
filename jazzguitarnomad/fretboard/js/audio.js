
let audioBuffer = null;
let audioPlayer = null;

    ////////////////////////////////////////////////////////////
    // RENDER BUFFER
    ////////////////////////////////////////////////////////////

async function renderBuffer() {

    if (!player.lastNotes || player.lastNotes.length === 0) {

        alert("No hay nada para renderizar. Pulse Play primero.");

        return false;

    }

    const stepTime = Tone.Time(
        metronome.subdivisionFigure()
    ).toSeconds();

    if (player.lastMode === "sequence") {

        audioBuffer = await renderSequence(

            instrumentDefs[currentInstrument],

            player.lastNotes,

            stepTime,

            player.gate,

            player.repeticiones,

            player.countInBars

        );

    } else {

        audioBuffer = await renderChord(

            instrumentDefs[currentInstrument],

            player.lastNotes,

            stepTime,

            player.gate,

            player.repeticiones,

            player.countInBars

        );

    }

    console.log("Buffer generado");

    console.log(audioBuffer);

}


function PlayStopBuffer(){

    if (!isPlayingBuffer) {

	if (!playBuffer()) return;

        isPlayingBuffer = true;

        setControlsEnabled(false);

        playBuffer();

    } else {

        isPlayingBuffer = false;

        setControlsEnabled(true);

        stopBuffer();

    }

}

    ////////////////////////////////////////////////////////////
    // RENDER METRONOMO
    ////////////////////////////////////////////////////////////

function renderMetronomeClick(synth,beat,subBeat,time) {

    if (subBeat === 1) {

        if (beat === 1) {

            synth.triggerAttackRelease(
                "C6",
                "32n",
                time
            );

        } else {

            synth.triggerAttackRelease(
                "G5",
                "32n",
                time
            );

        }

    } else if (metronome.subBeatSound) {

        synth.triggerAttackRelease(
            "E5",
            "32n",
            time
        );

    }

}

function renderCountInClick(synth, beat, time) {

    synth.triggerAttackRelease(

        beat === 1 ? "C6" : "G5",

        "32n",

        time

    );

}

    ////////////////////////////////////////////////////////////
    // RENDER SECUENCIA
    ////////////////////////////////////////////////////////////

async function renderSequence(instrument,notas,stepTime,gate,repeticiones,countInBars = 0) {

    console.log("Renderizando secuencia...");

    const beatTime = Tone.Time("4n").toSeconds();
    const stepsPerBar = metronome.beatsPerBar * metronome.subdivision;
    const barsNeeded = Math.max(1,Math.ceil(notas.length / stepsPerBar));
    const totalSteps = barsNeeded * stepsPerBar;

    return await Tone.Offline(async () => {

        const samplerSynth = new Tone.Sampler(instrument).toDestination();
        samplerSynth.volume.value = player.instrument.volume.value;

        const metronomeSynth = new Tone.Synth(Metronome.SYNTH_OPTIONS).toDestination();
        metronomeSynth.volume.value = metronome.synth.volume.value;

        await Tone.loaded();

        let tiempo = 0;

        ////////////////////////////////////////////////////////
        // Cuenta atrás
        ////////////////////////////////////////////////////////

        for (let bar = 0; bar < countInBars; bar++) {

            for (let beat = 1; beat <= metronome.beatsPerBar; beat++) {

                metronomeSynth.triggerAttackRelease(
                    beat === 1 ? "C6" : "G5",
                    "32n",
                    tiempo
                );

                tiempo += beatTime;

            }

        }

        ////////////////////////////////////////////////////////
        // Secuencia + silencios
        ////////////////////////////////////////////////////////

        let beat = 1, subBeat = 1;

        for (let r = 0; r < repeticiones; r++) {

            for (let i = 0; i < totalSteps; i++) {

                const nota = notas[i];

                if (nota !== undefined)
                    samplerSynth.triggerAttackRelease(
                        nota,
                        gate,
                        tiempo,
                        player.getVelocity(beat,subBeat)
                    );

                if (player.metronomeOn)
                    renderMetronomeClick(
                        metronomeSynth,
                        beat,
                        subBeat,
                        tiempo
                    );

                tiempo += (player.swingFeel && metronome.subdivision === 2)
                    ? (subBeat === 1
                        ? stepTime * (player.swingAmount * 2)
                        : stepTime * ((1 - player.swingAmount) * 2))
                    : stepTime;

                if (++subBeat > metronome.subdivision) {

                    subBeat = 1;

                    if (++beat > metronome.beatsPerBar)
                        beat = 1;

                }

            }

        }

    },

    countInBars * beatTime * metronome.beatsPerBar
    + totalSteps * stepTime * repeticiones
    + 2);

}

    ////////////////////////////////////////////////////////////
    // RENDER ACORDE
    ////////////////////////////////////////////////////////////

async function renderChord(instrument,notas,stepTime,gate,repeticiones,countInBars = 0) {

    console.log("Renderizando acorde...");

    return await Tone.Offline(async () => {

        const samplerSynth = new Tone.Sampler(instrument).toDestination();
        samplerSynth.volume.value = player.instrument.volume.value;

        const metronomeSynth = new Tone.Synth(Metronome.SYNTH_OPTIONS).toDestination();
        metronomeSynth.volume.value = metronome.synth.volume.value;

        await Tone.loaded();

        ////////////////////////////////////////////////////////
        // Cuenta atrás
        ////////////////////////////////////////////////////////

        let tiempo = 0;
        const beatTime = Tone.Time("4n").toSeconds();

        for (let bar = 0; bar < countInBars; bar++) {

            for (let beat = 1; beat <= metronome.beatsPerBar; beat++) {

                metronomeSynth.triggerAttackRelease(
                    beat === 1 ? "C6" : "G5",
                    "32n",
                    tiempo
                );

                tiempo += beatTime;

            }

        }

        ////////////////////////////////////////////////////////
        // Acorde
        ////////////////////////////////////////////////////////

        let beat = 1;
        const totalBeats =
            metronome.beatsPerBar * repeticiones;

        const chordGate = beatTime * 0.9;

        for (let i = 0; i < totalBeats; i++) {

            samplerSynth.triggerAttackRelease(
                notas,
                chordGate,
                tiempo
            );

            if (player.metronomeOn) {

                renderMetronomeClick(
                    metronomeSynth,
                    beat,
                    1,
                    tiempo
                );

            }

            if (++beat > metronome.beatsPerBar) {

                beat = 1;

            }

            tiempo += beatTime;

        }

    },

    countInBars * metronome.beatsPerBar * Tone.Time("4n").toSeconds()
    + metronome.beatsPerBar * repeticiones * Tone.Time("4n").toSeconds()
    + 2);

}


////////////////////////////////////////////////////////////
//
// REPRODUCIR BUFFER
//
////////////////////////////////////////////////////////////

function playBuffer() {

    if (!audioBuffer) {

        alert("Primero debes renderizar el buffer.");

        return false;

    }

    ////////////////////////////////////////////////////////////
    // Detener reproducción actual
    ////////////////////////////////////////////////////////////

    player.stop();

    if (audioPlayer) {

        audioPlayer.stop();

        audioPlayer.dispose();

        audioPlayer = null;

    }

    ////////////////////////////////////////////////////////////
    // Crear reproductor
    ////////////////////////////////////////////////////////////

    audioPlayer = new Tone.Player().toDestination();

    audioPlayer.buffer = new Tone.ToneAudioBuffer(
        audioBuffer
    );

    ////////////////////////////////////////////////////////////
    // Reproducir
    ////////////////////////////////////////////////////////////

    audioPlayer.start();

    player.playing = true;

    ////////////////////////////////////////////////////////////
    // Detectar final
    ////////////////////////////////////////////////////////////

    audioPlayer.onstop = () => {

        player.playing = false;

    };

}

function stopBuffer() {

    if (!audioPlayer) {

        return;

    }

    audioPlayer.stop();

    audioPlayer.dispose();

    audioPlayer = null;

    if (player.autoMetronome) {

        metronome.stop();

        player.autoMetronome = false;

    }

    player.playing = false;

}

////////////////////////////////////////////////////////////
//
// GUARDAR ARCHIVO DE AUDIO
//
////////////////////////////////////////////////////////////

async function saveAudio(formato = "mp3"){

    if (!audioBuffer) {

        alert("Primero debes generar el buffer.");

        return;

    }

    let datos;
    let mime;

    switch (formato.toLowerCase()) {

        case "mp3":

            datos = audioBufferToMp3(audioBuffer);

            mime = "audio/mpeg";

            break;

        case "wav":

            datos = audioBufferToWav(audioBuffer);

            mime = "audio/wav";

            break;

    }

    const blob = Array.isArray(datos)

        ? new Blob(datos, { type: mime })

        : new Blob([datos], { type: mime });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "audio." + formato.toLowerCase();

    a.click();

    URL.revokeObjectURL(url);

}

////////////////////////////////////////////////////////////
//
// AUDIOBUFFER -> WAV
//
////////////////////////////////////////////////////////////

function audioBufferToWav(buffer) {

    const numChannels = buffer.numberOfChannels;

    const sampleRate = buffer.sampleRate;

    const numSamples = buffer.length;

    const bytesPerSample = 2;

    const blockAlign = numChannels * bytesPerSample;

    const byteRate = sampleRate * blockAlign;

    const dataSize = numSamples * blockAlign;

    const arrayBuffer = new ArrayBuffer(44 + dataSize);

    const view = new DataView(arrayBuffer);

    writeString(view, 0, "RIFF");

    view.setUint32(4, 36 + dataSize, true);

    writeString(view, 8, "WAVE");

    writeString(view, 12, "fmt ");

    view.setUint32(16, 16, true);

    view.setUint16(20, 1, true);

    view.setUint16(22, numChannels, true);

    view.setUint32(24, sampleRate, true);

    view.setUint32(28, byteRate, true);

    view.setUint16(32, blockAlign, true);

    view.setUint16(34, 16, true);

    writeString(view, 36, "data");

    view.setUint32(40, dataSize, true);

    let offset = 44;

    for (let i = 0; i < numSamples; i++) {

        for (let ch = 0; ch < numChannels; ch++) {

            let sample = buffer.getChannelData(ch)[i];

            sample = Math.max(-1, Math.min(1, sample));

            sample = sample < 0

                ? sample * 32768

                : sample * 32767;

            view.setInt16(

                offset,

                sample,

                true

            );

            offset += 2;

        }

    }

    return arrayBuffer;

}

////////////////////////////////////////////////////////////
//
// ESCRIBIR TEXTO EN CABECERA WAV
//
////////////////////////////////////////////////////////////

function writeString(view, offset, text) {

    for (let i = 0; i < text.length; i++) {

        view.setUint8(offset + i,text.charCodeAt(i));

    }

}

////////////////////////////////////////////////////////////
//
// AUDIOBUFFER -> MP3
//
////////////////////////////////////////////////////////////

function audioBufferToMp3(buffer) {

    const numChannels = buffer.numberOfChannels;

    const sampleRate = buffer.sampleRate;

    const kbps = 192;

    const mp3encoder = new lamejs.Mp3Encoder(

        numChannels,

        sampleRate,

        kbps

    );

    const blockSize = 1152;

    const mp3Data = [];

    ////////////////////////////////////////////////////////////
    // MONO
    ////////////////////////////////////////////////////////////

    if (numChannels === 1) {

        const samples = buffer.getChannelData(0);

        const pcm = new Int16Array(samples.length);

        for (let i = 0; i < samples.length; i++) {

            let s = Math.max(-1, Math.min(1, samples[i]));

            pcm[i] = s < 0

                ? s * 32768

                : s * 32767;

        }

        for (let i = 0; i < pcm.length; i += blockSize) {

            const chunk = pcm.subarray(

                i,

                i + blockSize

            );

            const mp3buf = mp3encoder.encodeBuffer(chunk);

            if (mp3buf.length > 0) {

                mp3Data.push(

                    new Int8Array(mp3buf)

                );

            }

        }

    }

    ////////////////////////////////////////////////////////////
    // ESTÉREO
    ////////////////////////////////////////////////////////////

    else {

        const left = buffer.getChannelData(0);

        const right = buffer.getChannelData(1);

        const leftPCM = new Int16Array(left.length);

        const rightPCM = new Int16Array(right.length);

        for (let i = 0; i < left.length; i++) {

            let l = Math.max(-1, Math.min(1, left[i]));

            let r = Math.max(-1, Math.min(1, right[i]));

            leftPCM[i] = l < 0

                ? l * 32768

                : l * 32767;

            rightPCM[i] = r < 0

                ? r * 32768

                : r * 32767;

        }

        for (let i = 0; i < leftPCM.length; i += blockSize) {

            const leftChunk = leftPCM.subarray(

                i,

                i + blockSize

            );

            const rightChunk = rightPCM.subarray(

                i,

                i + blockSize

            );

            const mp3buf = mp3encoder.encodeBuffer(

                leftChunk,

                rightChunk

            );

            if (mp3buf.length > 0) {

                mp3Data.push(

                    new Int8Array(mp3buf)

                );

            }

        }

    }

    ////////////////////////////////////////////////////////////
    // FINALIZAR
    ////////////////////////////////////////////////////////////

    const end = mp3encoder.flush();

    if (end.length > 0) {

        mp3Data.push(

            new Int8Array(end)

        );

    }

    return mp3Data;

}
