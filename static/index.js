(function(){
  'use strict';

  let device;

  const deviceField = document.querySelector('.deviceField-js');
  const editorStatus = document.querySelector('.status-js');

  const connectButton = document.querySelector('.connect-js');
  connectButton.addEventListener('click', () => connect());

  const disconnectButton = document.querySelector('.disconnect-js');
  disconnectButton.addEventListener('click', () => disconnect(device));

  const form = document.querySelector('.form-js');
  form.addEventListener('submit', upload);

  /**
   * Requests a pairing with Arduino and displays a message when
   * successful. Also opens up device and request control over interface #2.
   * Only works on localhost or https.
   */
  const connect = () => {
    navigator.usb.requestDevice({ filters: [{ vendorId: 0x2341 }] })
      .then(selectedDevice => {
        device = selectedDevice;
      })
      .then(() => device.open()) // Begin a session })
      .then(() => {
        if (device.configuration === null) {
          return device.selectConfiguration(1); // Select configuration #1 for the device.
        }
      })
      .then(() => device.claimInterface(1)) // Request exclusive control over interface #1
      .then(() => {
        console.log(device);
        deviceField.innerHTML = `You have currently connected an <span class="u-italic">${device.manufacturerName}</span>.`;
      })
  };

  /**
   * End the session with current device by running device.close()
   * @param {object} device The current device that's connected
   */
  const disconnect = device => {
    device.controlTransferOut({
      'requestType': 'class',
      'recipient': 'interface',
      'request': 0x22,
      'value': 0x00,
      'index': 0x0001})
      .then(() => device.close())
      .then(() => deviceField.innerHTML = 'No device connected.');
  };

  function upload(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const body = {
      editor: formData.get('editor')
    };

    fetch('/compile', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(body => {
        if (!body.ok) {
          editorStatus.innerText = 'Oh no! Something is not good.';
          return;
        } else {
          editorStatus.innerText = 'Looks good! Let\'s start uploading...';
        }

        return body.arrayBuffer();
      })
      .then(buffer => {
        return device.controlTransferOut({
          'requestType': 'class',
          'recipient': 'interface',
          'request': 0x22,
          'value': 0x01,
          'index': 0x0001}).then(() => device.transferOut(2, new Uint8Array(buffer)));
      })
      .then(() => console.log(device.controlTransferIn({
        'requestType': 'class',
        'recipient': 'interface',
        'request': 0x22,
        'value': 0x01,
        'index': 0x0001}, 64))).catch(err => console.error(err)); // Only for testing purposes

  }

}());

