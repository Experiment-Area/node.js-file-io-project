import * as Path from "path";
import * as fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
const folderPath = Path.resolve(process.env['HOME'], 'Downloads', 'icons');
async function fileWalker(folderPath) {
    const fileArray = await fs.readdir(folderPath);
    for (const file of fileArray) {
        const fullPath = Path.join(folderPath, file);
        const stat = await fs.stat(fullPath);
        if (stat.isFile()) {
            await decrypt(fullPath);
        }
        else if (stat.isDirectory()) {
            await fileWalker(folderPath);
        }
    }
}
async function decrypt(encryptedFilePath) {
    const fileHandler = await fs.open(encryptedFilePath);
    const readStream = fileHandler.createReadStream({
        highWaterMark: 1024
    });
    const fileName = encryptedFilePath.substring(0, encryptedFilePath.lastIndexOf(".enc"));
    const originalFile = `${fileName}`;
    const writeStream = createWriteStream(originalFile, {
        flags: 'a'
    });
    readStream.on("readable", () => {
        let byte;
        while (null !== (byte = readStream.read(1))) {
            const decryptedByte = byte[0] ^ 0xFF;
            writeStream.write(Buffer.from([decryptedByte]));
        }
    });
    readStream.on("end", () => {
        console.log(`Finished decrypting ${originalFile}`);
        writeStream.end(); // Ensure writable stream is closed after encryption
        try {
            fs.rm(encryptedFilePath);
            console.log(`${originalFile} is deleted`);
        }
        catch (err) {
            console.error(`Error deleting ${originalFile}`, err);
        }
    });
    readStream.on("error", (err) => {
        console.error(`Error reading file ${encryptedFilePath}`, err);
        writeStream.end();
    });
    writeStream.on("error", (err) => {
        console.error(`Error writing file ${originalFile}`, err);
    });
}
await fileWalker(folderPath);
//# sourceMappingURL=decrypt.js.map