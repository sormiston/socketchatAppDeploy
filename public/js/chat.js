const socket = io();
dayjs.extend(window.dayjs_plugin_localizedFormat)

// Elements
const $messageForm = document.querySelector('form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationShareTemplate = document.querySelector('#link-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Constants
const params = new URLSearchParams(location.search);
const username = params.get('username');
const room = params.get('room');

const autoscroll = () => {
  // New message element
  $newMessage = $messages.lastElementChild
  // Get height of new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
  
  // get visible height
  const visibleHeight = $messages.offsetHeight
  
  // Height of messages scrollable
  const containerHeight = $messages.scrollHeight
  
  // How far are we scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  // if we WERE at the bottom....autoscroll
  if (containerHeight - newMessageHeight <= scrollOffset + 2) {
    $messages.scrollTop = $messages.scrollHeight // scrollTop can never equal scrollHeight but browsers caps this accordingly
  }
}

// Listeners

socket.on('message', (message) => {
  console.log('message: ' + message.text);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: dayjs(message.createdAt).format('LTS')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll()
});

socket.on('locationMessage', (locationMessage) => {
  const html = Mustache.render(locationShareTemplate, {
    username: locationMessage.username,
    url: locationMessage.url,
    createdAt: dayjs(locationMessage.createdAt).format('LTS')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll()
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // disable while emitting
  $messageFormButton.setAttribute('disabled', true);
  const message = $messageFormInput.value;

  socket.emit('sendMessage', message, (error) => {
    // enable again
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log('Message delivered!');
  });
});

$sendLocationButton.addEventListener('click', () => {
  $sendLocationButton.setAttribute('disabled', true);
  // GEOLOCATION API
  if (!navigator.geolocation) {
    return alert('Geolocation not supported by your browser.');
  }

  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    socket.emit('sendLocation', { latitude, longitude }, (ack) => {
      console.log(ack);
      $sendLocationButton.removeAttribute('disabled');
    });
  });
});

// onload run
socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})