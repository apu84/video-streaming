const express = require("express");
const app = express();
const fileUpload = require("express-fileupload");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");

const videoDirectory = "/Users/apu/videos/";
const CHUNK_SIZE = 10 ** 6;

app.use(fileUpload({
  createParentPath: true
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
  if (videoFile.isFile()) {
    const videoSize = videoFile.size;
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
  } else {
    response.status(400).send("Invalid video url");
  }
});

app.post("/upload", async (request, response) => {
  try {
    if(!request.files) {
      response.status(400).send("No file uploaded");
    }
    else {
      const videoFile = request.files.videoFile;
      videoFile.mv(`/Users/apu/videos/${videoFile.name}`);
      response.status(200).send("File is uploaded");
    }
  } catch (e) {
    console.error(e);
    response.status(500).send(e);
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

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
