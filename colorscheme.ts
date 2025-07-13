import sharp from 'sharp';

const hexToRgb = (hex: string): RGB => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
};

type RGB = [number, number, number];

const rgbToHex = (rgb: RGB) => {
    const [red, green, blue] = rgb.map((color) =>
        color.toString(16).padStart(2, '0'),
    );
    return `#` + red + green + blue;
};

// Euclidean squared distance between two points in RGB color space
const colorDistance = (color1: RGB, color2: RGB) => {
    const [r1, g1, b1] = color1;
    const [r2, g2, b2] = color2;
    return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
};

const { data: imageBuffer, info } = await sharp(
    './static/art/images/wintertime_chillin.webp',
)
    .raw()
    .toBuffer({ resolveWithObject: true });

const referenceColors = {
    brightLight: '#FDE89D',
    lightTint: '#FDCE7F',
    warmLight: '#FD9C58',
    warmTint: '#8f502f',
    grey: '#7E7B69',
    background: '#1d2232',
    darkTint: '#5d4438',
    dark: '#20222C',
};

const referenceDistances = {
    brightLight: 64982,
    lightTint: 51866,
    warmLight: 36349,
    warmTint: 3302,
    grey: 7094,
    background: 4541,
    darkTint: 29,
    dark: 4304,
};

const referenceMean: RGB = [88, 66, 56];

const meanColor = (imageBuffer: Buffer): RGB => {
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    const numPixels = imageBuffer.length / 3;

    for (let i = 0; i < imageBuffer.length; i += 3) {
        totalR += imageBuffer[i];
        totalG += imageBuffer[i + 1];
        totalB += imageBuffer[i + 2];
    }

    return [
        Math.round(totalR / numPixels),
        Math.round(totalG / numPixels),
        Math.round(totalB / numPixels),
    ];
};

Object.keys(referenceColors).forEach((key) => {
    const color = hexToRgb(
        referenceColors[key as keyof typeof referenceColors],
    );
    // console.log(color, colorDistance(referenceMean, color))
});

const nearestDistance = (imageBuffer: Buffer, distance: number): RGB => {
    const mean = meanColor(imageBuffer);
    let result: RGB = [0, 0, 0];
    let lowestDistanceDifference = Number.MAX_VALUE;
    for (let i = 0; i < imageBuffer.length; i += 3) {
        const color: RGB = [
            imageBuffer[i],
            imageBuffer[i + 1],
            imageBuffer[i + 2],
        ];
        const distanceDifference = Math.abs(
            colorDistance(color, mean) - distance,
        );
        if (distanceDifference < lowestDistanceDifference) {
            lowestDistanceDifference = distanceDifference;
            result = color;
        }
    }
    return result;
};

const nearestColor = (imageBuffer: Buffer, reference: RGB): RGB => {
    let result: RGB = [0, 0, 0];
    let lowestDistance = Number.MAX_VALUE;
    for (let i = 0; i < imageBuffer.length; i += 3) {
        const color: RGB = [
            imageBuffer[i],
            imageBuffer[i + 1],
            imageBuffer[i + 2],
        ];
        const distance = colorDistance(color, reference);
        if (distance < lowestDistance) {
            lowestDistance = distance;
            result = color;
        }
    }
    return result;
};

const generateTheme = (imageBuffer: Buffer) => {
    const result = {
        brightLight: '#FDE89D',
        lightTint: '#FDCE7F',
        warmLight: '#FD9C58',
        warmTint: '#8f502f',
        grey: '#7E7B69',
        background: '#1d2232',
        darkTint: '#5d4438',
        dark: '#20222C',
    };

    const referenceDistances = {
        brightLight: 64982,
        lightTint: 51866,
        warmLight: 36349,
        warmTint: 3302,
        grey: 7094,
        background: 4541,
        darkTint: 29,
        dark: 4304,
    };

    // hexToRgb(result[key as keyof typeof result])
    Object.keys(result).forEach((key) => {
        result[key as keyof typeof result] = rgbToHex(
            nearestColor(
                imageBuffer,
                hexToRgb(result[key as keyof typeof result]),
            ),
        );
    });
    return result;
};

console.log(generateTheme(imageBuffer));
