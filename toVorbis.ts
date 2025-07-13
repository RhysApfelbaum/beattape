import { readdirSync, mkdirSync, existsSync, statSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { $ } from 'bun';

const inputDir = './audio_assets';
const outputRoot = './static/track_audio';

function convertFileName(path: string) {
    return path
        .replaceAll(' ', '')
        .replaceAll('-Trimmed', '')
        .replaceAll(/[\(\)]/g, '')
        .replaceAll(/wav$/g, 'ogg');
}

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
        } else if (
            // Only convert trimmed .wav files
            stat.isFile() &&
            entry.toLowerCase().endsWith('.wav') &&
            entry.includes('Trimmed')
        ) {
            const oggOutputPath = convertFileName(fullOutputPath);
            console.log(`Converting ${fullInputPath} -> ${oggOutputPath}`);

            const result = spawnSync(
                'ffmpeg',
                [
                    '-i',
                    fullInputPath,
                    '-y',
                    '-codec:a',
                    'libvorbis',
                    '-qscale:a',
                    '4',
                    oggOutputPath,
                ],
                { stdio: 'inherit' },
            );

            if (result.error) {
                console.error(
                    `Error converting ${fullInputPath}:`,
                    result.error,
                );
            }
        }
    }
}

await $`rm -rf ${outputRoot}/*`;
convertDir(inputDir, outputRoot);
