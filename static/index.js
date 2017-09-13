(function(){
  'use strict';

  let device;

  const headline = document.querySelector('.headline-js');
  const editorStatus = document.querySelector('.status-js');

  const connectButton = document.querySelector('.connect-js');
  connectButton.addEventListener('click', () => connect());

  const form = document.querySelector('.form-js');
  form.addEventListener('submit', () => upload(event));


  /**
   * Requests a pairing with Arduino and displays a message when
   * successful. Also opens up device and request control over interface #2.
   * Only works on localhost or https.
   */
  const connect = () => {
    navigator.usb.requestDevice({
      filters: [{ vendorId: 0x2341 }] // 0x2341 = Arduino
    })
      .then(selectedDevice => device = selectedDevice)
      .then(() => console.log(device))
      .then(() => {
        headline.innerHTML = `You have currently connected an <span class="u-italic">${device.manufacturerName}</span>.`;
        connectButton.removeEventListener('click', () => connect());
        connectButton.innerText = 'Connected';
        connectButton.classList.add('Button--connected');
        connectButton.setAttribute('disabled', '');
      })
      .catch(err => console.error(err));
  };

  /**
   * Sends code to compiler and, if successful, converts the returned data to an
   * arrayBuffer, which is later converted to an Uint8Array. The Uint8Array is
   * transferred to the USB device.
   *
   * @param {object} event
   */
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

        // Return the data as an arrayBuffer, since it's needed when converting to Uint8Array
        return body.arrayBuffer();
      })
      .then(buffer => {
        // Data is what we want to transfer to Arduino.
        const data = new Uint8Array(buffer);

        device.open() // Begin a session

          .then(() => device.selectConfiguration(1))
          .then(() => device.claimInterface(2))
          .then(() => device.selectAlternateInterface(2, 0))
          .then(() => device.controlTransferOut({
            requestType: 'class',
            recipient: 'interface',
            request: 0x22,
            value: 0x01,
            index: 0x02
          }))

          // Sending an Uint8Array works. It's probably something wrong with converting from ino to Uint8Array.
          .then(() => device.transferOut(4, new Uint8Array([1,2,4])))
          .then(result => {
            console.log(`Transfer results: ${result instanceof USBOutTransferResult}, results status: ${result.status}, bytes written: ${result.bytesWritten}`);

            if (result.status === 'ok') {
              editorStatus.innerText = 'Code uploaded.';
            }

          })
          .then(() => device.close());
      })
      .catch(err => console.error(err));
  };
}());

