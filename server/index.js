const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const avrpizza = require('avr-pizza')
const tmp = require('tmp')
const fs = require('fs')


/*
 * Needed to receive POST data
 */
app.use(bodyParser.urlencoded({ extended: true }));

/*
 * Serve static files
 * from folder named "static"
 */
app.use(express.static('static'));

/*
 * When user POST form, data in editor is used to create
 * a sketch file.
 *
 * Only a proof of concept, if used in real life
 * the form data (of course) needs to be sanitized.
 */
app.post('/compile', function(req, res) {
  const formData = req.body.editor;

  tmp.file({
    dir: `${__dirname}/tmp_ino`,
    postfix: '.ino',
    keep: false
  }, (error, path, fd, cleanupCallback) => {
    if (error) {
      throw error;
    };

    /**
     * Writing a temporary ino file and saving it
     * in tmp_ino folder
     */
    function writeFileAsync(path, data) {
      return new Promise((resolve, reject) => {
        fs.writeFileSync(path, data);
        resolve();
      })
    }

    /*
     * Simple sketch with no
     * custom library dependencies
     */
    const package = {
      sketch: path,
      board: 'uno'
    }

    writeFileAsync(path, formData)
      .then(avrpizza.compile(package, (error, hex) => {
        cleanupCallback();

        if (error) {
          res.status(400).end(error.message);
          console.log(`Oh no! We got an error: ${error}`);
          return;
        }

        /* TODO: Instead of console.log, this hex should
         * upload to Arduino.
         */
        console.log(`Looks good! ${hex}`);
        res.end(hex);
      }));
  })
});


app.listen(3000, (err) => {
  if (err) throw err;
  console.log('🚀  Ready on http://localhost:3000/');
});
