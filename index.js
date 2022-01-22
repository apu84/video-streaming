const express = require("express");
const app = express();
const fs = require("fs");
const { request, response } = require("express");
const videoDirectory = "/Users/apu/Downloads/Stibodx/sample-video/";

app.get("/", (request, response) => {
  response.sendFile(__dirname + '/index.html', (error) => {
    if (error) {
      console.error(error);
    }
  })
});

app.get("/video", (request, response) => {
  const range = request.headers.range;
  if (!range) {
    response.status(400).send("Requires Range header");
  }
  const videoFile = `${videoDirectory}video.mp4`;
  const videoSize = fs.statSync(videoFile).size;
  const CHUNK_SIZE = 10 ** 6;
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;
  const responseHeader = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4"
  }
  response.writeHead(206, responseHeader);
  const videoStream = fs.createReadStream(videoFile, { start, end });
  videoStream.pipe(response);
});

app.listen(8000, () => {
  console.log("Listening on port 8000");
});
