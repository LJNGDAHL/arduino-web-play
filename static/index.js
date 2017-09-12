(function(){
  'use strict';

  let device;

  const headline = document.querySelector('.headline-js');
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
    navigator.usb.requestDevice({
      filters: [{ vendorId: 0x2341 }] // 0x2341 = Arduino
    })
      .then(selectedDevice => device = selectedDevice )
      .then(() => device.open()) // Begin a session
      .then(() => device.selectConfiguration(1))
      .then(() => device.claimInterface(1)) // Request exclusive control


      /* This is from Chromes USB tests.
       * TODO: If you manage to get this to work,
       * exchange code further down.
       *
       * https://chromium.googlesource.com/chromium/src.git/+/lkgr/third_party/WebKit/LayoutTests/usb/usbDevice.html
       */
      .then(() => device.controlTransferOut({
        requestType: 'class',
        recipient: 'interface',
        request: 0x42,
        value: 0x1234,
        index: 0x0001
      }, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])))
      .then(result => {
        console.log(result instanceof USBOutTransferResult);
        console.log(result.status, 'ok');
        console.log(result.bytesWritten, 8);
        if (result.status === 'stall') {
          editorStatus.innerText = 'Upload stalled.';
        } else if (result.status === 'ok') {
          editorStatus.innerText = 'Upload accepted.';
        }
        return device.close();
      })
      /* This is where Chrome's test ends. */


      .then(() => {
        console.log(device); // Used during testing
        headline.innerHTML = `You have currently connected an <span class="u-italic">${device.manufacturerName}</span>.`;
      });
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
      .then(() => headline.innerHTML = 'No device connected.');
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
          // TODO: Elaborate of course.
          editorStatus.innerText = 'Oh no! Something is not good.';
          return;
        } else {
          editorStatus.innerText = 'Looks good! Let\'s start uploading...';
        }
        // arrayBuffer is needed when transferring data
        return body.arrayBuffer();
      })
      .then(buffer => {
        /* More info about setup: https://wicg.github.io/webusb/#transfers */
        return device.controlTransferOut({
          'requestType': 'class', // Can be 'standard', 'class' or 'vendor'
          'recipient': 'interface', // 'device', 'interface', 'endpoint' or 'other'
          'request': 0x22, // Still unclear
          'value': 0x01, // Still unclear
          'index': 0x0001 // Seems to be correlate with interface #1
        })

          /* 2 = endpointNumber #2, correlates to interface #2
           * Trying Uint8Array, since it is used in Chrome's test and
           * this library that is connecting WebUSB and Arduino:
           * https://github.com/webusb/arduino/blob/gh-pages/library/WebUSB/WebUSB.h
           */
          .then(() => device.transferOut(2, new Uint8Array(buffer)));
      })
      // Only for testing purposes
      .then(() => console.log(device.controlTransferIn({
        'requestType': 'class',
        'recipient': 'interface',
        'request': 0x22,
        'value': 0x01,
        'index': 0x0001}, 64))).catch(err => console.error(err));
  }
}());

