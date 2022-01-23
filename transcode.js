const ffmpeg = require("fluent-ffmpeg");
const command = ffmpeg();
const { Subject } = require('rxjs');

function transcode(fileName, saveToDirectory) {
  const observable = new Subject();
  console.log(observable);

  ffmpeg({
    logger: console
  })
      .input(`${saveToDirectory}${fileName}`)
      .size('640x?')
      .aspect('16:9')
      .output(`${saveToDirectory}transcoded-${fileName}`)
      .on('start', function (commandLine) {
        observable.next("start");
        console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('codecData', function (data) {
        console.log('Input is ' + data.audio + ' audio ' +
            'with ' + data.video + ' video');
      })
      .on('progress', function(progress) {
        observable.next("progress");
        console.log('Processing: ' + progress.percent + '% done');
      })
      .on('stderr', function(stderrLine) {
        console.log('Stderr output: ' + stderrLine);
      })
      .on('end', function(stdout, stderr) {
        observable.next("end");
        console.log('Transcoding succeeded !');
      })
      .on('error', function(err, stdout, stderr) {
        console.log('Cannot process video: ' + err.message);
      })
      .run();

  return observable;
}

module.exports = transcode;
