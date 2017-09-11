(function(){
  'use strict';

  const deviceField = document.querySelector('.deviceField-js');

  const connectButton = document.querySelector('.button-js');
  connectButton.addEventListener('click', connect);

  const form = document.querySelector('.form-js');
  form.addEventListener('submit', upload);

  /**
   * Requests a pairing with Arduino and displays a message when
   * successful. Only works on localhost or https.
   */
  function connect() {
    navigator.usb.requestDevice({ filters: [{ vendorId: 0x2341 }] }).then(function(device){
      deviceField.innerHTML = `You have currently connected an <span class="u-italic">${device.manufacturerName}</span>.`;
    });
  }

  function upload(event) {
    event.preventDefault();

    fetch('/compile', {
      method: 'POST',
      body: new FormData(event.target)
    })
    .then(body => body.text())
    .then(text => console.log(text));
  }
}());
