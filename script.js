function updateSliderValues() {
    document.getElementById("health-val").innerHTML = document.getElementById("health-slider").value;
    document.getElementById("intensity-val").innerHTML = document.getElementById("intensity-slider").value;
    updateStateValue();
}

function calculateState(health, intensity) {
    if (health == 0) return "Death";
    if (intensity == 100) return "Win";
    if (intensity <= 20) return "Idle";
    else if (intensity <= 60) return "Exploration"
    return "Action";
}

function updateStateValue() {
    let health = document.getElementById("health-val").innerHTML
    let intensity = document.getElementById("intensity-val").innerHTML
    document.getElementById("state").innerHTML = calculateState(health, intensity);
}

updateSliderValues();
updateStateValue();
