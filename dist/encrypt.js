import * as Path from "path";
import * as fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
const folderPath = Path.resolve(process.env['HOME'], 'Downloads', 'icons');
async function fileWalker(folderPath) {
    try {
        const fileArray = await fs.readdir(folderPath);
        for (const file of fileArray) {
            const fullPath = Path.join(folderPath, file);
            const stat = await fs.stat(fullPath);
            if (stat.isFile()) {
                await encryptFile(fullPath);
            }
            else if (stat.isDirectory()) {
                await fileWalker(fullPath);
            }
        }
    }
    catch (err) {
        console.error(`Error processing ${folderPath}:`, err);
    }
}
async function encryptFile(originalPath) {
    const fileHandler = await fs.open(originalPath);
    const readStream = fileHandler.createReadStream({
        highWaterMark: 1024 //Read 1 kb at a time
    });
    const outputFilePath = `${originalPath} .enc`;
    const writeStream = createWriteStream(outputFilePath, {
        flags: 'a'
    });
    readStream.on("readable", () => {
        let byte;
        while (null !== (byte = readStream.read(1))) { // Read one byte at a time
            const encryptedByte = byte[0] ^ 0xFF; // Simple XOR encryption
            writeStream.write(Buffer.from([encryptedByte])); // Write the encrypted byte
        }
    });
    readStream.on("end", async () => {
        console.log(`Finished encrypting ${originalPath}`);
        writeStream.end(); // Ensure writable stream is closed after encryption
        try {
            await fs.rm(originalPath); // Deletes the original file after encryption
            console.log(`${originalPath} is Deleted`);
        }
        catch (err) {
            console.error(`Error deleting ${originalPath}`, err);
        }
    });
    readStream.on("error", (err) => {
        console.error(`Error reading file ${originalPath}:`, err);
        writeStream.end(); // Ensure writable stream is closed on error
    });
    writeStream.on("error", (err) => {
        console.error(`Error writing to file ${outputFilePath}:`, err);
    });
}
await fileWalker(folderPath);
//# sourceMappingURL=encrypt.js.map