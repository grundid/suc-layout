const functions = require('firebase-functions');
const admin = require("firebase-admin");
var app = admin.initializeApp();

exports.userUpload = functions.region("europe-west1").https.onRequest(async (request, response) => {
    if (request.method === "OPTIONS") {
        response.set({
            "Access-Control-Allow-Origin": request.get("origin"),
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        });
        response.sendStatus(200);
    } else if (request.method === "POST") {
        response.set({
            "Access-Control-Allow-Origin": request.get("origin"),
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        });
        const dataString = request.rawBody.toString();
        await app.firestore().collection("userUploads").add({
            created: new Date(),
            data: dataString
        });
        return response.send({ status: "OK" });
    }
});
