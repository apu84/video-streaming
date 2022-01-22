const express = require("express");
const app = express();
const fs = require("fs");
const videoDirectory = "/Users/apu/videos/";

app.get("/", (request, response) => {
  response.sendFile(__dirname + '/index.html', (error) => {
    if (error) {
      console.error(error);
    }
  });
});

app.get("/list", async (request, response) => {
  const videos = await getVideos();
  response.setHeader("Content-Type", "application/json");
  response
      .status(200)
      .send(JSON.stringify(videos));
})

app.get("/video/:id", (request, response) => {
  let range = request.headers.range || '0-';
  const videoFileName = `${videoDirectory}${request.params.id}`;
  const videoFile = fs.statSync(videoFileName);
  if(videoFile.isFile()) {
    const videoSize = videoFile.size;
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
    const videoStream = fs.createReadStream(videoFileName, { start, end });
    videoStream.pipe(response);
  }
  else {
    response.status(400).send("Invalid video url");
  }
});

async function getVideos() {
  return new Promise((resolve, reject) => {
    fs.readdir(videoDirectory, (err, files) => {
      const videoFiles = files
          .filter((fileName) => {
            const file = fs.statSync(`${videoDirectory}${fileName}`);
            return file.isFile() && fileName.endsWith(".mp4");
          })
          .map((fileName) => {
            const file = fs.statSync(`${videoDirectory}${fileName}`);
            return {
              name: fileName,
              size: file.size
            }
          });
      resolve(videoFiles);
    });
  });
}

app.listen(8000, () => {
  console.log("Listening on port 8000");
});
