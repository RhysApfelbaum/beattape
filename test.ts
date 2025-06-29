const input = 'Tracks/bells/snare - Trimmed (2).wav';



const result = input
    .replaceAll(' ', '')
    .replaceAll('-Trimmed', '')
    .replaceAll(/[\(\)]/g, '')
    .replaceAll(/wav$/g, 'mp3');
console.log(result);
