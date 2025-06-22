
import { readdirSync, mkdirSync, existsSync, statSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";

const inputDir = "./static/track_audio";  // root directory to start scanning
const outputRoot = "./static/mp3_output";  // root output directory

function convertDir(inputPath: string, outputPath: string) {
    if (!existsSync(outputPath)) {
        mkdirSync(outputPath, { recursive: true });
    }

    const entries = readdirSync(inputPath);

    for (const entry of entries) {
        const fullInputPath = path.join(inputPath, entry);
        const fullOutputPath = path.join(outputPath, entry);

        const stat = statSync(fullInputPath);

        if (stat.isDirectory()) {
            // Recurse into subdirectory
            convertDir(fullInputPath, fullOutputPath);
        } else if (stat.isFile() && entry.toLowerCase().endsWith(".wav")) {
            const mp3OutputPath = fullOutputPath.replace(/\.wav$/i, ".mp3");
            console.log(`Converting ${fullInputPath} -> ${mp3OutputPath}`);

            const result = spawnSync("ffmpeg", [
                "-i", fullInputPath,
                "-codec:a", "libmp3lame",
                "-qscale:a", "2",
                mp3OutputPath,
            ], { stdio: "inherit" });

            if (result.error) {
                console.error(`Error converting ${fullInputPath}:`, result.error);
            }
        }
    }
}

convertDir(inputDir, outputRoot);
