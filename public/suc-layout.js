let ctx;
const print = console.log;

const point = turf.helpers.point;
const turfDistance = turf.distance.default;
const destination = turf.destination.default;
const projection = turf.projection;
let frameCounter = 0;
let frameTime = 0;

class Stall {
    constructor(x, y, width, length, rotation, label) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.length = length;
        this.rotation = rotation;
        this.label = label;
    }
}

/*
All alligned:

new Stall(9.166572863999933, 49.277332659999765,  2.6, 4.7, 10, "1A" ), 
new Stall(9.166608160072776, 49.277328599695394,  2.6,  4.7,  10, "1B" ), 
new Stall(9.166643456142749, 49.27732453939112,  2.6,  4.7, 10, "2A"),
new Stall(9.166678752209815, 49.277320479086846, 2.6,  4.7,  10, "2B" )

*/

/*
Original data:


    new Stall(9.1666705, 49.277318, 2.3, 4.6, 10, "1A"),
new Stall(9.1666395, 49.27732183, 2.4, 4.7, 10, "1B"),
new Stall(9.166607085, 49.277326914, 2.6, 4.6, 10, "2A"),
new Stall(9.166572864, 49.27733266, 2.6, 4.7, 10, "2B"),


*/


let position = [9.077264166666556, 49.21202433333333]; // real position
//let userPosition = [9.166627, 49.277359];
//let position = [9.1773, 49.2756]; // browser
let userPosition = [9.077264166666556, 49.21202433333333] // [9.166627, 49.277359];
let scale = 8;
let points;
const stalls = [

    new Stall(9.166572863999933, 49.277332659999765, 2.6, 4.7, 10, "1A"),
    new Stall(9.166608160072776, 49.277328599695394, 2.6, 4.7, 10, "1B"),
    new Stall(9.166643456142749, 49.27732453939112, 2.6, 4.7, 10, "2A"),
    new Stall(9.166678752209815, 49.277320479086846, 2.6, 4.7, 10, "2B"),

    new Stall(9.077264166666556, 49.21202433333333, 2.6, 4.7, 65, "1A"),
    new Stall(9.077355539849266, 49.21189102492057, 2.6, 4.7, 65, "1B"),
    new Stall(9.077340413025313, 49.21191221650785, 2.6, 4.7, 65, "2A"),
    new Stall(9.077312654712893, 49.21195535982072, 2.6, 4.7, 65, "2B"),
    new Stall(9.077370666666667, 49.21186983333334, 2.6, 4.7, 65, "3A"),
    new Stall(9.077296364266928, 49.21197818153005, 2.6, 4.7, 65, "3B"),
    new Stall(9.077280073813723, 49.21200100323938, 2.6, 4.7, 65, "4A"),
    new Stall(9.077325286194911, 49.21193340809507, 2.6, 4.7, 65, "4B"),

];
let selectedStall = 0;

let canvasWidth = 0;
let canvasHeight = 0;
let center;
let stats;
let stallStats;
let data;
let stallLabel;

async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return await response.json(); // parses JSON response into native JavaScript objects
}

let uploadInProgress = false;
function uploadGeoJson() {
    if (!uploadInProgress) {
        uploadInProgress = true;
        try {
            data.innerText = "Uploading... please wait...";
            let url = "https://europe-west1-suc-layout.cloudfunctions.net/userUpload";
            //url = "http://localhost:5000/suc-layout/europe-west1/userUpload";
            postData(url, toGeoJson())
                .then((response) => {
                    data.innerText = JSON.stringify(response);
                });
        } catch (e) {
            data.innerText = e;
        }
        finally {
            uploadInProgress = false;
        }
    }
}


function drawCircle(context) {
    context.beginPath();
    context.arc(0, 0, 100, 0, 2 * Math.PI);
    context.stroke();
    context.moveTo(0, -100);
    context.lineTo(0, 100);
    context.stroke();
    context.moveTo(0, -100);
    context.lineTo(20, -80);
    context.stroke();
    context.moveTo(0, -100);
    context.lineTo(-20, -80);
    context.stroke();
}

function initCanvas() {
    const canvas = document.getElementById("sucCanvas");
    ctx = canvas.getContext("2d");
    center = projection.toMercator(point(position))["geometry"]["coordinates"];
    print(center);
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    print(canvas.width, " x ", canvas.height);

    ctx.translate(canvasWidth / 2, canvasHeight / 2);
}

function drawStall(context, points, selectedStall, label, stallCenter) {
    context.beginPath();
    context.lineWidth = 1;
    context.strokeStyle = selectedStall ? "red" : "black";

    context.moveTo((points[0][0] - center[0]) * scale, -1 * (points[0][1] - center[1]) * scale);
    context.lineTo((points[1][0] - center[0]) * scale, -1 * (points[1][1] - center[1]) * scale);
    context.stroke();
    context.lineTo((points[2][0] - center[0]) * scale, -1 * (points[2][1] - center[1]) * scale);
    context.stroke();
    context.lineTo((points[3][0] - center[0]) * scale, -1 * (points[3][1] - center[1]) * scale);
    context.stroke();
    context.closePath();
    context.stroke();

    context.font = "20px Arial";
    const textWidth2 = context.measureText(label).width / 2;
    context.fillText(label, ((stallCenter[0] - center[0]) * scale) - textWidth2, (stallCenter[1] - center[1]) * -scale);
}

function drawPosition(context, position) {
    const convertedPos = projection.toMercator(point(position))["geometry"]["coordinates"];
    context.beginPath();
    context.save();
    context.fillStyle = "red";
    context.arc((convertedPos[0] - center[0]) * scale, -1 * (convertedPos[1] - center[1]) * scale, 1 * scale, 0, 2 * Math.PI);
    context.fill();
    context.restore();

}


function drawSuc() {
    const start = performance.now();
    frameCounter++;
    ctx.clearRect(-(canvasWidth / 2), -(canvasHeight / 2), canvasWidth, canvasHeight);
    for (let x = 0; x < stalls.length; x++) {
        const stall = stalls[x];
        const distance = Math.sqrt((stall.width / 2) * (stall.width / 2) + (stall.length / 2) * (stall.length / 2));
        const angle = Math.asin((stall.width / 2) / distance) * (180 / Math.PI);

        //print("width: ", stall.width, " length: ", stall.length, " angle: ", angle, " distance: ", distance, " scale: " + scale);

        const position = [stall.x, stall.y];

        const topLeft = destination(point(position), distance / 1000, -angle + stall.rotation);
        const topRight = destination(point(position), distance / 1000, angle + stall.rotation);
        const bottomRight = destination(point(position), distance / 1000, 180 - angle + stall.rotation);
        const bottomLeft = destination(point(position), distance / 1000, -180 + angle + stall.rotation);

        const stallCenter = projection.toMercator(point(position))["geometry"]["coordinates"];
        points = [];
        points.push(projection.toMercator(topLeft["geometry"])["coordinates"]);
        points.push(projection.toMercator(topRight["geometry"])["coordinates"]);
        points.push(projection.toMercator(bottomRight["geometry"])["coordinates"]);
        points.push(projection.toMercator(bottomLeft["geometry"])["coordinates"]);
        drawStall(ctx, points, selectedStall == x, stall.label, stallCenter);
    }

    drawPosition(ctx, userPosition);
    const end = performance.now();
    frameTime = Math.round(end - start);
    updateStats();
}

function updateStats() {
    stats.innerText = "Frame: " + frameCounter + " Time: " + frameTime;
}

function updatePosition(position) {
    pos = position.coords;
    userPosition = [pos.longitude, pos.latitude];
    window.requestAnimationFrame(drawSuc);
}

function logData() {
    let result = "";
    for (let stall of stalls) {
        result += "x: " + stall.x + ", y: " + stall.y + ", w: " + stall.width + ", l: " +
            stall.length + " r: " + stall.rotation + " - ";
    }
    data.innerText = result;
}

function toGeoJson() {
    const features = [];
    for (let x = 0; x < stalls.length; x++) {
        const stall = stalls[x];
        const distance = Math.sqrt((stall.width / 2) * (stall.width / 2) + (stall.length / 2) * (stall.length / 2));
        const angle = Math.asin((stall.width / 2) / distance) * (180 / Math.PI);

        //print("width: ", stall.width, " length: ", stall.length, " angle: ", angle, " distance: ", distance, " scale: " + scale);

        const position = [stall.x, stall.y];

        const topLeft = destination(point(position), distance / 1000, -angle + stall.rotation);
        const topRight = destination(point(position), distance / 1000, angle + stall.rotation);
        const bottomRight = destination(point(position), distance / 1000, 180 - angle + stall.rotation);
        const bottomLeft = destination(point(position), distance / 1000, -180 + angle + stall.rotation);

        const polygon = [];
        polygon.push(topLeft["geometry"]["coordinates"]);
        polygon.push(topRight["geometry"]["coordinates"]);
        polygon.push(bottomRight["geometry"]["coordinates"]);
        polygon.push(bottomLeft["geometry"]["coordinates"]);
        polygon.push(topLeft["geometry"]["coordinates"]);

        features.push(turf.helpers.polygon([polygon], { "name": stall.label }));
    }
    return turf.helpers.featureCollection(features);
}

function logGeoJson() {
    data.innerText = JSON.stringify(toGeoJson());
}


document.addEventListener("DOMContentLoaded", function (e) {
    stats = document.getElementById("stats");
    stallStats = document.getElementById("stallStats");
    data = document.getElementById("data");
    stallLabel = document.getElementById("stallLabel");

    initCanvas();
    drawSuc();

    let watchId = navigator.geolocation.watchPosition(updatePosition, function (positionError) {
        console.log(positionError);
    }, {
        enableHighAccuracy: true,
        maximumAge: 60000
    });
});

function processKey(key, ignoreKeyDiff) {
    if (!ignoreKeyDiff) {

        const lastKeyDiff = new Date().getTime() - lastKeyEvent;
        if (lastKeyDiff < 400) {
            return;
        }
        lastKeyEvent = new Date().getTime();
    }


    if ((key === "W")) {
        if (stalls[selectedStall].width < 5) {

            stalls[selectedStall].width += 0.10;
        }
    }
    if ((key === "w")) {
        if (stalls[selectedStall].width > 2) {
            stalls[selectedStall].width -= 0.10;
        }
    }
    if ((key === "L")) {
        if (stalls[selectedStall].length < 8) {
            stalls[selectedStall].length += 0.10;
        }
    }
    if ((key === "l")) {
        if (stalls[selectedStall].length > 4) {
            stalls[selectedStall].length -= 0.10;
        }
    }
    if ((key === "R")) {
        stalls[selectedStall].rotation += 5;
        if (stalls[selectedStall].rotation >= 180) {
            stalls[selectedStall].rotation = 0;
        }
    }
    if ((key === "r")) {
        stalls[selectedStall].rotation -= 5;
        if (stalls[selectedStall].rotation <= 0) {
            stalls[selectedStall].rotation = 180;
        }
    }
    if (key === "-") {
        if (scale <= 1) {
            scale -= 0.1;
        } else {
            scale -= 1;
        }
        if (scale <= 0) {
            scale = 0.1;
        }
    }
    if (key === "+") {
        if (scale < 1) {
            scale += 0.1;
        } else {
            scale += 1;
        }
    }
    if (key == "A") {
        let width = 3;
        let length = 5;
        let rotation = 0;
        if (selectedStall != -1) {
            const stall = stalls[selectedStall];
            width = stall.width;
            length = stall.length;
            rotation = stall.rotation;
        }
        stalls.push(new Stall(userPosition[0], userPosition[1], width, length, rotation, stallLabel.value));
        selectedStall = stalls.length - 1;
    }
    if (key == "k") {
        if (selectedStall != -1) {
            const stall = stalls[selectedStall];
            const width = stall.width;
            const length = stall.length;
            const rotation = stall.rotation;
            const newCenter = destination(point([stall.x, stall.y]), width / 1000, Math.abs(rotation) + 90)["geometry"]["coordinates"];
            print(newCenter);


            stalls.push(new Stall(newCenter[0], newCenter[1], width, length, rotation, stallLabel.value));
            selectedStall = stalls.length - 1;

        } else {
            processKey("A", true);
        }

    }
    if (key == "P") {
        position = userPosition;
        center = projection.toMercator(point(position))["geometry"]["coordinates"];
    }
    if (key == "d") {
        if (selectedStall != -1) {
            stalls.splice(selectedStall, 1);
            selectedStall--;
            processKey("s", true);
        }
    }
    if (key == "D") {
        stalls.length = 0;
        selectedStall = -1;
    }
    if (key == "s") {
        if (stalls.length > 0) {
            if (selectedStall > 0) {
                selectedStall--;
            } else {
                selectedStall = stalls.length - 1;
            }
        }
    }
    if (key == "S") {
        if (stalls.length > 0) {
            if (selectedStall >= stalls.length - 1) {
                selectedStall = 0;
            } else {
                selectedStall++;
            }
        }
    }
    if (key == "ArrowUp") {
        if (selectedStall != -1) {
            const stall = stalls[selectedStall];
            const position = [stall.x, stall.y];
            const newPost = destination(point(position), 0.2 / 1000, Math.abs(stall.rotation))["geometry"]["coordinates"];
            stall.x = newPost[0];
            stall.y = newPost[1];
        }
    }
    if (key == "ArrowDown") {
        if (selectedStall != -1) {
            const stall = stalls[selectedStall];
            const position = [stall.x, stall.y];
            const newPost = destination(point(position), -(0.2 / 1000), Math.abs(stall.rotation))["geometry"]["coordinates"];
            stall.x = newPost[0];
            stall.y = newPost[1];
        }
    }
    if (key == "ArrowLeft") {
        if (selectedStall != -1) {
            const stall = stalls[selectedStall];
            const position = [stall.x, stall.y];
            const newPost = destination(point(position), -(0.2 / 1000), Math.abs(stall.rotation + 90))["geometry"]["coordinates"];
            stall.x = newPost[0];
            stall.y = newPost[1];
        }
    }
    if (key == "ArrowRight") {
        if (selectedStall != -1) {
            const stall = stalls[selectedStall];
            const position = [stall.x, stall.y];
            const newPost = destination(point(position), (0.2 / 1000), Math.abs(stall.rotation + 90))["geometry"]["coordinates"];
            stall.x = newPost[0];
            stall.y = newPost[1];
        }
    }
    if (key == ",") {
        position = destination(point(position), (1 / 1000), 90)["geometry"]["coordinates"];
        center = projection.toMercator(point(position))["geometry"]["coordinates"];
    }
    if (key == ".") {
        position = destination(point(position), (1 / 1000), -90)["geometry"]["coordinates"];
        center = projection.toMercator(point(position))["geometry"]["coordinates"];
    }
    if (key == "n") {
        position = destination(point(position), (1 / 1000), 180)["geometry"]["coordinates"];
        center = projection.toMercator(point(position))["geometry"]["coordinates"];
    }
    if (key == "m") {
        position = destination(point(position), (1 / 1000), 0)["geometry"]["coordinates"];
        center = projection.toMercator(point(position))["geometry"]["coordinates"];
    }
    window.requestAnimationFrame(drawSuc);
}

let lastKeyEvent = 0;

document.addEventListener("keydown", (event) => {
    processKey(event.key);
    //console.log(event);
});
