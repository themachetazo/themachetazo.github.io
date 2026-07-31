class MusicPlayer {

    constructor(instrument, metronome) {

	this.instrument = instrument;

	this.metronome = metronome;

        this.part = null;

        this.playing = false;

	this.gate = null;

	this.repeticiones = 2;

	this.metronomeOn = false;

	this.autoMetronome = false;

	this.stopEvent = null;

	this.countInBars = 0;

	this.swingFeel = false;
	this.swingAmount = 0.66;

        ////////////////////////////////////////////////////////////
        // BUFFER (para render offline)
        ////////////////////////////////////////////////////////////

        this.lastNotes = null;

        this.lastMode = null;

    }

    ////////////////////////////////////////////////////////////
    // CONFIGURACIÓN
    ////////////////////////////////////////////////////////////

    setCountInBars(bars) {

        this.countInBars = parseInt(bars);

    }

    setRepeticiones(repeats){

	this.repeticiones = parseInt(repeats);

	this.restart();

    }

    setGate(gate) {

        const step = Tone.Time(this.metronome.subdivisionFigure()).toSeconds();

        this.gate = step * (parseInt(gate, 10) / 100);

    }

    setInstrumentVolume(db) {

        this.instrument.volume.value = db;

    }

    setMetronomeOn(enabled) {

        this.metronomeOn = enabled;

        this.restart();

    }

////////////////////////////////////////////////////////////
//
// ACENTOS
//
////////////////////////////////////////////////////////////

getVelocity(beat, subBeat) {

    ////////////////////////////////////////////////////////
    // Swing en corcheas
    ////////////////////////////////////////////////////////

    if (this.swingFeel && this.metronome.subdivision === 2) {

        if (beat === 1 && subBeat === 1) return 0.90;

        if (subBeat === 2) return 1.00;

        return 0.85;

    }

    ////////////////////////////////////////////////////////
    // Comportamiento normal
    ////////////////////////////////////////////////////////

    if (beat === 1 && subBeat === 1) return 1.00;

    if (subBeat === 1) return 0.90;

    return 0.65;

}


    ////////////////////////////////////////////////////////////
    // CUENTA ATRAS
    ////////////////////////////////////////////////////////////

startWithCountIn(callback) {

    ////////////////////////////////////////////////////////////
    // Sin cuenta atrás
    ////////////////////////////////////////////////////////////

    if (this.countInBars <= 0) {

        callback();

        return;

    }

    ////////////////////////////////////////////////////////////
    // Limpiar estado previo
    ////////////////////////////////////////////////////////////

    if (this.countInEvent !== null) {

        Tone.Transport.clear(this.countInEvent);

        this.countInEvent = null;

    }

    Tone.Transport.stop();

    Tone.Transport.position = 0;

    ////////////////////////////////////////////////////////////
    // Variables
    ////////////////////////////////////////////////////////////

    let beat = 1;

    const totalBeats =
        this.metronome.beatsPerBar * this.countInBars;

    ////////////////////////////////////////////////////////////
    // Cuenta atrás (siempre negras)
    ////////////////////////////////////////////////////////////

    this.countInEvent = Tone.Transport.scheduleRepeat(

        (time) => {

            ////////////////////////////////////////////////////
            // Click
            ////////////////////////////////////////////////////

            if (beat === 1) {

                this.metronome.synth.triggerAttackRelease(
                    "C6",
                    "32n",
                    time
                );

            } else {

                this.metronome.synth.triggerAttackRelease(
                    "G5",
                    "32n",
                    time
                );

            }

            ////////////////////////////////////////////////////
            // Siguiente beat
            ////////////////////////////////////////////////////

            beat++;

            ////////////////////////////////////////////////////
            // Cambio de compás
            ////////////////////////////////////////////////////

            if (beat > this.metronome.beatsPerBar) {

                beat = 1;

            }

        },

        "4n"

    );

    ////////////////////////////////////////////////////////////
    // Lanzar reproducción al terminar
    ////////////////////////////////////////////////////////////

    const endTime =
        Tone.Time("4n") * totalBeats;

    Tone.Transport.scheduleOnce(() => {

        if (this.countInEvent !== null) {

            Tone.Transport.clear(this.countInEvent);

            this.countInEvent = null;

        }

        Tone.Transport.stop();

        Tone.Transport.position = 0;

        callback();

    }, endTime);

    ////////////////////////////////////////////////////////////
    // Arrancar
    ////////////////////////////////////////////////////////////

    Tone.Transport.start();

}

    ////////////////////////////////////////////////////////////
    // RESTART
    ////////////////////////////////////////////////////////////


restart() {

    if (!this.playing) {return;}

//    if (!this.lastNotes || this.lastNotes.length === 0) {return;}

    if (this.lastMode === "sequence") {

        this.playSequence(this.lastNotes);

    }else if (this.lastMode === "chord") {

        this.playChord(this.lastNotes);

    }

}

    ////////////////////////////////////////////////////////////
    // PLAY
    ////////////////////////////////////////////////////////////

playSequence(listaNotas) {
    this.playEvents(listaNotas,"sequence");
}

playChord(chordArray) {
    this.playEvents(chordArray,"chord");
}

playEvents(items, mode) {

    this.stop();

    this.lastNotes = [...items];
    this.lastMode = mode;

    const stepSeconds = Tone.Time(this.metronome.subdivisionFigure()).toSeconds();
    const gate = this.gate;
    const stepsPerBar = this.metronome.beatsPerBar * this.metronome.subdivision;
    const totalBars = Math.max(1, Math.ceil(items.length / stepsPerBar));
    const eventos = [];

    let tiempo = 0;

    for (let i = 0; i < items.length; i++) {

        const beat =
            Math.floor(i / this.metronome.subdivision) %
            this.metronome.beatsPerBar + 1;

        const subBeat =
            i % this.metronome.subdivision + 1;

        eventos.push([tiempo, { value: items[i], beat, subBeat }]);

        if (this.swingFeel && this.metronome.subdivision === 2)
            tiempo += subBeat === 1 ? stepSeconds * (this.swingAmount * 2) : stepSeconds * ((1 - this.swingAmount) * 2);
        else
            tiempo += stepSeconds;

    }

    const duracion = stepsPerBar * totalBars * stepSeconds;

    this.part = new Tone.Part((time, data) => {

        Tone.Draw.schedule(
            () => emitPlayerBeat(data.beat, data.subBeat, "tick"),
            time
        );

        this.instrument.triggerAttackRelease(
            data.value,
            gate,
            time,
            this.getVelocity(data.beat, data.subBeat)
        );

    }, eventos);

    this.part.loop = true;
    this.part.loopStart = 0;
    this.part.loopEnd = duracion;
    this.part.start(0);

    this.repeatEvents = [];

    for (let r = 1; r <= this.repeticiones; r++) {

        this.repeatEvents.push(
            Tone.Transport.scheduleOnce(
                () => emitPlayerBeat(1, 1, "repeat", r),
                duracion * (r - 1)
            )
        );

    }

    Tone.Transport.position = 0;
    Tone.Transport.loop = false;

    if (this.stopEvent !== null)
        Tone.Transport.clear(this.stopEvent);

    this.stopEvent = Tone.Transport.scheduleOnce(
        () => {

            emitPlayerBeat(1, 1, "end");

            this.stop();

        },
        duracion * this.repeticiones
    );

    if (this.metronomeOn) {

        this.autoMetronome = true;
        this.metronome.start();

    }
    else {

        this.autoMetronome = false;

    }

    if (Tone.Transport.state !== "started")
        Tone.Transport.start();

    this.playing = true;

}

    ////////////////////////////////////////////////////////////
    // STOP
    ////////////////////////////////////////////////////////////

stop() {

    if (this.stopEvent !== null) {
        Tone.Transport.clear(this.stopEvent);
        this.stopEvent = null;
    }

    if (this.repeatEvents) {
        this.repeatEvents.forEach(id => Tone.Transport.clear(id));
        this.repeatEvents = [];
    }

    Tone.Transport.stop();
    Tone.Transport.position = 0;

    if (this.part) {
        this.part.stop();
        this.part.dispose();
        this.part = null;
    }

    if (this.audioPlayer) {
        this.audioPlayer.stop();
        this.audioPlayer.dispose();
        this.audioPlayer = null;
    }

    if (this.autoMetronome)
        this.metronome.stop();

    this.autoMetronome = false;
    this.playing = false;

    emitPlayerBeat(1,1,"stop");

}

}