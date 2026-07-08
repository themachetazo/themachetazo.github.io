"use strict";

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
