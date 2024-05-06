//NEVER PASTE UNALANYZED FOREIGN CODE
//Example code
for (var i = 0; i < allImages.length; i++) {
    var img = allImages[i];
    var pathsplit = img.path.split("\\")
    var parentfolder = pathsplit[pathsplit.length-2];
    var klasse = parentfolder.trim("Klasse");
    var address = `${klasse}@wg.nuernberg.de`;
    print(address);
    print(await sendEmail(address, `Klassenfoto ${klasse}`, `Liebe Klasse ${klasse},\nanbei euer Klassenfoto. Als Erinnerung: Das weitere verbreiten, bearbeiten, verkaufen oder anderweitig missbrauchen des Bildes ist verboten. Falls ihr die IG Fotografie, die diese Dienstleistung ehrenamtlich durchführt, unterstützen möchtet, könnt ihr an das folgende Konto mit dem Verwendungszweck „IG Fotografie“ spenden;\nIBAN: DE69 76050101 0005 906771\tBIC: SSKNDE77XXX\n\nEure IG Fotografie`, img.name, img.base64));
    await sleep(3);
}