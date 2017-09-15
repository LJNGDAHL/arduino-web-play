(function(){

  const editorStatus = document.querySelector('.status-js');
  const form = document.querySelector('.form-js');
  form.addEventListener('submit', () => upload(event));

  const upload = (event) => {
    event.preventDefault();
    editorStatus.innerText = 'Sends code to compiler, hang in there...';

    const formData = new FormData(event.target);
    const body = { editor: formData.get('editor') };

    fetch('/compile', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(body => {
        if (!body.ok) {
          editorStatus.innerText = 'Something is wrong with your code.';
          return;
        } else {
          editorStatus.innerText = 'Looks good! Let\'s start uploading...';
        }

        return body.text();
      })
      .then(text => {
        // Hardcoded for testing purposes.
        const board = 'uno';

        // Robotkodarn's Chrome App ID
        const extensionid = 'ndgpoelmajhffaldfniajffgechfkllc';
        const port = chrome.runtime.connect(extensionid);

        // Payload ready to send to the Chrome App
        const message = {
          board: board,
          file: text
        };

        // Send the message to Chrome App
        port.postMessage(message);

        // Give user feedback
        port.onMessage.addListener((msg) => {
          editorStatus.innerText = 'Upload complete!';
          console.log(msg);
        });
      })
      .catch(error => console.log(error));
  };
}());

