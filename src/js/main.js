
/*
The general software architecture pattern used here is known as Model-View-Controller (aka MVC).
reference: https://www.youtube.com/watch?v=fa8eUcu30Lw

Each individual component (Model, View or Controller)
is designed using the Revealing Module Pattern.
reference: https://www.youtube.com/watch?v=pOfwp6VlnlM
*/

/* ************************************************************************
VALIDATOR & PAGE SPEED (TOOLBOX) VIEW
************************************************************************* */

(function makeToolboxView() {
  const htmlBox = $('.valid-container.html-validator');
  const cssBox = $('.valid-container.css-validator');
  const toolsBox = $('.tools-container');
  const speedBox = $('.page-speed-container');

  function toggleToolbox(e) {
    if (htmlBox.is(':visible') && !htmlBox.find(e.target).length) {
      htmlBox.fadeOut();
    } else if (!htmlBox.is(':visible') && e.target === $('#html-val')[0]) {
      toolsBox.fadeOut();
      htmlBox.fadeIn();
    } else if (speedBox.is(':visible') && !speedBox.find(e.target).length) {
      speedBox.fadeOut();
    } else if (!speedBox.is(':visible') && e.target === $('#insights')[0]) {
      toolsBox.fadeOut();
      speedBox.fadeIn();
    } else if (cssBox.is(':visible') && !cssBox.find(e.target).length) {
      cssBox.fadeOut();
    } else if (!cssBox.is(':visible') && e.target === $('#css-val')[0]) {
      toolsBox.fadeOut();
      cssBox.fadeIn();
    } else if (toolsBox.is(':visible') && !toolsBox.find(e.target).length) {
      toolsBox.fadeOut();
    } else if (!toolsBox.is(':visible') && e.target === $('.fa-wrench')[0]) {
      toolsBox.fadeIn();
    }
  }

  window.app.toolboxView = {
    toggleToolbox,
  };
}());
/* ************************************************************************
CONTROLLER
************************************************************************* */
(function makeController(
  clocksModel,
  clocksView,
  greetingModel,
  greetingView,
  newsfeedModel,
  newsfeedView,
  toolboxView,
) {
/* ***** POMODORO SECTION ******** */

  function togglePomodoroActive() {
    clocksModel.toggleActive();
    clocksView.toggleActive(clocksModel.getStatus().isActive);
    clocksView.togglePause(clocksModel.getStatus().isPaused);
    clocksView.toggleWorkBreak(clocksModel.getStatus().isOnBreak);
  }

  function togglePomodoroPause() {
    clocksModel.togglePause();
    clocksView.togglePause(clocksModel.getStatus().isPaused);
  }

  function toggleWorkBreak() {
    clocksModel.toggleWorkBreak();
    clocksView.toggleWorkBreak(clocksModel.getStatus().isOnBreak);
    clocksView.togglePause(clocksModel.getStatus().isPaused);
  }

  function resetPomodoro() {
    clocksModel.resetClock();
    clocksView.togglePause(clocksModel.getStatus().isPaused);
  }

  // continuous loop that updates clock display. reference https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
  function clocksHandler() {
    if (!clocksModel.getStatus().isActive) {
      clocksView.updateTime(clocksModel.getTime());
    } else if (clocksModel.getStatus().isActive) {
      const countdown = clocksModel.cycle();
      const task = clocksModel.getStatus().isOnBreak ? 'break' : 'work';

      if (countdown == '0:00') {
        clocksModel.triggerSound(clocksModel.alarm);
        toggleWorkBreak();
      }
      clocksView.updateCountdown(countdown, task);
    }
    requestAnimationFrame(clocksHandler);
  }

  // basic web audio API audio loading function. reference: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData
  // free sound effects from soundbible.com

  function loadSounds() {
    fetch('./assets/audio/alarm.mp3')
      .then(response => response.arrayBuffer())
      .then((buffer) => {
        clocksModel.audio.decodeAudioData(buffer, (decodedData) => {
          clocksModel.alarm = decodedData;
        });
      });
  }

  /* ***** USER GREETING SECTION ******** */

  function setUserName(e) {
    e.preventDefault();
    greetingModel.setUserName($('#name-input').val());
    greetingView.showGreeting(greetingModel.getUserName());
  }

  function toggleNameInput() {
    return greetingView.toggleNameInput(greetingModel.getUserName());
  }

  /* ******** NEWSFEED SECTION ******* */

  function loadNewsArticles() {
    newsfeedModel.sources.forEach((source) => {
      fetch(`https://newsapi.org/v1/articles?source=${source}&sortBy=top&apiKey=${newsfeedModel.APIKey}`)
        .then(response => response.json())
        .then((data) => {
          const content = data.articles.map((article) => {
            return newsfeedView.generateArticle(
              data.source,
              article.url,
              article.urlToImage,
              article.title,
              article.author,
            );
          });
          newsfeedView.append(`${content.filter((item, index) => index < 3).join('\r\n')}`);
        });
    });
  }

  /* ********* GENERAL ************ */

  function setupEventListeners() {
    $(window).on('click', toggleNameInput())
      .on('click', newsfeedView.toggleNewsfeed)
      .on('click', toolboxView.toggleToolbox);
    $('#name-form').on('submit', setUserName);
    $('.start, .stop').on('click', togglePomodoroActive);
    $('.pause').on('click', togglePomodoroPause);
    $('.reset').on('click', resetPomodoro);
    $('.work-break').on('click', toggleWorkBreak);
  }

  function initialize() {
    greetingView.showGreeting(greetingModel.getUserName());
    clocksView.updateTime(clocksModel.getTime());
    setupEventListeners();
    loadSounds();
    loadNewsArticles();
    clocksHandler();
  }

  window.app.controller = {
    initialize,
  };
}(
  window.app.clocksModel,
  window.app.clocksView,
  window.app.greetingModel,
  window.app.greetingView,
  window.app.newsfeedModel,
  window.app.newsfeedView,
  window.app.toolboxView,
));

window.app.controller.initialize();

/* ***** color picker section ******** */

/*
 * Creation credit to Dario Corsi (reference: https://codepen.io/dariocorsi/pen/WwOWPE?editors=0010)
 * Uses tinycolor.js (reference: https://github.com/bgrins/TinyColor)
 * Hidden until triggered by clicking the paintbrush icon
 * A pop-up box appears allowing the user select colors and get corresponding HEX/RGB codes
*/

var modeToggle = document.getElementById('mode-toggle');
var colorIndicator = document.getElementById('color-indicator');

var spectrumCanvas = document.getElementById('spectrum-canvas');
var spectrumCtx = spectrumCanvas.getContext('2d');
var spectrumCursor = document.getElementById('spectrum-cursor');
var spectrumRect = spectrumCanvas.getBoundingClientRect();

var hueCanvas = document.getElementById('hue-canvas');
var hueCtx = hueCanvas.getContext('2d');
var hueCursor = document.getElementById('hue-cursor');
var hueRect = hueCanvas.getBoundingClientRect();

var hue = 0;
var saturation = 1;
var lightness = 0.5;

var rgbFields = document.getElementById('rgb-fields');
var hexField = document.getElementById('hex-field');
var hslFields = document.getElementById('hsl-fields');

var red = document.getElementById('red');
var blue = document.getElementById('blue');
var green = document.getElementById('green');
var hex = document.getElementById('hex');
var huedisplay = document.getElementById('huedisplay');
var saturationdisplay = document.getElementById('saturationdisplay');
var lightnessdisplay = document.getElementById('lightnessdisplay');

function refreshElementRects() {
  spectrumRect = spectrumCanvas.getBoundingClientRect();
  hueRect = hueCanvas.getBoundingClientRect();
}

function colorToHue(color) {
  var color = tinycolor(color);
  var hueString = tinycolor('hsl '+ color.toHsl().h + ' 1 .5').toHslString();
  return hueString;
}

function setColorValues(color) {
  // convert to tinycolor object
  var color = tinycolor(color);
  var rgbValues = color.toRgb();
  var hexValue = color.toHex();
  var hslValues = color.toHsl();
  // set inputs
  red.value = rgbValues.r;
  green.value = rgbValues.g;
  blue.value = rgbValues.b;
  hex.value = hexValue;
  huedisplay.value = Math.round(hslValues.h);
  saturationdisplay.value = Math.round(hslValues.s * 100);
  lightnessdisplay.value = Math.round(hslValues.l * 100);
}

function setCurrentColor(color) {
  color = tinycolor(color);
  colorIndicator.style.backgroundColor = color;
  spectrumCursor.style.backgroundColor = color;
  hueCursor.style.backgroundColor = 'hsl('+ color.toHsl().h +', 100%, 50%)';
}

function updateHueCursor(y) {
  hueCursor.style.top = y + 'px';
}

function updateSpectrumCursor(x, y) {
  // assign position
  spectrumCursor.style.left = x + 'px';
  spectrumCursor.style.top = y + 'px';
}

function getSpectrumColor(e) {
  // reference: http://stackoverflow.com/questions/23520909/get-hsl-value-given-x-y-and-hue
  e.preventDefault();
  // get x/y coordinates
  let x = e.pageX - spectrumRect.left;
  let y = e.pageY - spectrumRect.top;
  // constrain x max
  if (x > spectrumRect.width) { x = spectrumRect.width; }
  if (x < 0) { x = 0; }
  if (y > spectrumRect.height) { y = spectrumRect.height; }
  if (y < 0) { y = 0.1; }
  // convert between hsv and hsl
  const xRatio = (x / spectrumRect.width) * 100;
  const yRatio = (y / spectrumRect.height) * 100;
  const hsvValue = 1 - (yRatio / 100);
  const hsvSaturation = xRatio / 100;
  lightness = (hsvValue / 2) * (2 - hsvSaturation);
  saturation = (hsvValue * hsvSaturation) / (1 - Math.abs((2 * lightness) - 1));
  const color = tinycolor('hsl ' + hue + ' ' + saturation + ' ' + lightness);
  setCurrentColor(color);
  setColorValues(color);
  updateSpectrumCursor(x, y);
}

function endGetSpectrumColor() {
  spectrumCursor.classList.remove('dragging');
  window.removeEventListener('mousemove', getSpectrumColor);
}

const startGetSpectrumColor = (e) => {
  getSpectrumColor(e);
  spectrumCursor.classList.add('dragging');
  window.addEventListener('mousemove', getSpectrumColor);
  window.addEventListener('mouseup', endGetSpectrumColor);
};

function createShadeSpectrum(color) {
  const canvas = spectrumCanvas;
  const ctx = spectrumCtx;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!color) { color = '#f00'; }
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const whiteGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  whiteGradient.addColorStop(0, '#fff');
  whiteGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = whiteGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const blackGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  blackGradient.addColorStop(0, 'transparent');
  blackGradient.addColorStop(1, '#000');
  ctx.fillStyle = blackGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  canvas.addEventListener('mousedown', (e) => {
    startGetSpectrumColor(e);
  });
}

function getHueColor(e) {
  e.preventDefault();
  let y = e.pageY - hueRect.top;
  if (y > hueRect.height) { y = hueRect.height; }
  if (y < 0) { y = 0; }
  const percent = y / hueRect.height;
  hue = 360 - (360 * percent);
  const hueColor = tinycolor('hsl '+ hue + ' 1 .5').toHslString();
  const color = tinycolor('hsl '+ hue + ' ' + saturation + ' ' + lightness).toHslString();
  createShadeSpectrum(hueColor);
  updateHueCursor(y, hueColor)
  setCurrentColor(color);
  setColorValues(color);
}

function endGetHueColor() {
  hueCursor.classList.remove('dragging');
  window.removeEventListener('mousemove', getHueColor);
}

function startGetHueColor(e) {
  getHueColor(e);
  hueCursor.classList.add('dragging');
  window.addEventListener('mousemove', getHueColor);
  window.addEventListener('mouseup', endGetHueColor);
}

function createHueSpectrum() {
  const canvas = hueCanvas;
  const ctx = hueCtx;
  const hueGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  hueGradient.addColorStop(0.00, 'hsl(0,100%,50%)');
  hueGradient.addColorStop(0.17, 'hsl(298.8, 100%, 50%)');
  hueGradient.addColorStop(0.33, 'hsl(241.2, 100%, 50%)');
  hueGradient.addColorStop(0.50, 'hsl(180, 100%, 50%)');
  hueGradient.addColorStop(0.67, 'hsl(118.8, 100%, 50%)');
  hueGradient.addColorStop(0.83, 'hsl(61.2,100%,50%)');
  hueGradient.addColorStop(1.00, 'hsl(360,100%,50%)');
  ctx.fillStyle = hueGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  canvas.addEventListener('mousedown', (e) => {
    startGetHueColor(e);
  });
}

function colorToPos(color) {
  var color = tinycolor(color);
  const hsl = color.toHsl();
  hue = hsl.h;
  const hsv = color.toHsv();
  const x = spectrumRect.width * hsv.s;
  const y = spectrumRect.height * (1 - hsv.v);
  const hueY = hueRect.height - ((hue / 360) * hueRect.height);
  updateSpectrumCursor(x, y);
  updateHueCursor(hueY);
  setCurrentColor(color);
  createShadeSpectrum(colorToHue(color));
}

// Add event listeners

red.addEventListener('change', () => {
  const color = tinycolor('rgb ' + red.value + ' ' + green.value + ' ' + blue.value );
  colorToPos(color);
});

green.addEventListener('change', () => {
  const color = tinycolor('rgb ' + red.value + ' ' + green.value + ' ' + blue.value );
  colorToPos(color);
});

blue.addEventListener('change', () => {
  const color = tinycolor('rgb ' + red.value + ' ' + green.value + ' ' + blue.value );
  colorToPos(color);
});

hex.addEventListener('change', () => {
  let color = tinycolor('#' + hex.value );
  colorToPos(color);
});

huedisplay.addEventListener('change', () => {
  const color = tinycolor('hsl ' + huedisplay.value + ' ' + saturationdisplay.value + ' ' + lightnessdisplay.value );
  colorToPos(color);
});

saturationdisplay.addEventListener('change', () => {
  const color = tinycolor('hsl ' + huedisplay.value + ' ' + saturationdisplay.value + ' ' + lightnessdisplay.value );
  colorToPos(color);
});

lightnessdisplay.addEventListener('change', () => {
  const color = tinycolor('hsl ' + huedisplay.value + ' ' + saturationdisplay.value + ' ' + lightnessdisplay.value );
  colorToPos(color);
});

modeToggle.addEventListener('click', () => {
  if (rgbFields.classList.contains('active')) {
    rgbFields.classList.remove('active');
    hexField.classList.add('active');
  } else if (hexField.classList.contains('active')) {
    hexField.classList.remove('active');
    hslFields.classList.add('active');
  } else if (hslFields.classList.contains('active')) {
    hslFields.classList.remove('active');
    rgbFields.classList.add('active');
  }
});

window.addEventListener('resize', () => {
  refreshElementRects();
});

function ColorPicker() {
  createShadeSpectrum();
  createHueSpectrum();
}

ColorPicker();
$('.color-picker-panel').hide();

// Create click event to open color picker when icon is clicked
// $('#color-picker-icon').click((e) => {
//   $('.color-picker-panel').fadeToggle(300);
//   e.stopPropagation();
//   return false;
// });

// Create click event to close color picker when clicked anywhere else
// $(document).click((e) => {
//   if (e.target.className !== 'color-picker-panel' && !$('.color-picker-panel').find(e.target).length) {
//     $('.color-picker-panel').fadeOut(300);
//   }
// });

$(window).click((e) => {
  const colpic = $('.color-picker-panel');
  if (colpic.is(':visible') && !colpic.find(e.target).length) {
    colpic.fadeOut();
  } else if (!colpic.is(':visible') && e.target === $('.fa-paint-brush')[0]) {
    colpic.fadeIn();
  }
});

/* ***** Background Image Rotation ******** */

/*
 * Background images change every time tab is opened or page is refreshed
 * Background images categorized into daytime (7AM-6:59PM) and nighttime (7PM-6:59AM)
 * Background image shown depends on user's local time (day/night)
*/

// Store background picture information (day/night, authors, links)
const bgInfo = [
  {
    day: {
      author: 'Eberhard Grossgasteiger',
      url: 'https://www.pexels.com/u/eberhardgross/',
    },
    night: {
      author: 'Unknown',
      url: '',
    },
  },
  {
    day: {
      author: 'unknown',
      url: '',
    },
    night: {
      author: 'skeeze',
      url: 'https://pixabay.com/en/milky-way-night-landscape-1669986/',
    },
  },
  {
    day: {
      author: 'unknown',
      url: '',
    },
    night: {
      author: 'Nout Gons',
      url: 'https://www.pexels.com/u/nout-gons-80280/',
    },
  },
  {
    day: {
      author: 'Alex Mihis',
      url: 'https://www.pexels.com/u/mcraftpix/',
    },
    night: {
      author: 'Josh Sorenson',
      url: 'https://www.pexels.com/u/joshsorenson/',
    },
  },
  {
    day: {
      author: 'Paul Ijsendoorn',
      url: 'https://www.pexels.com/u/paul-ijsendoorn-148531/',
    },
    night: {
      author: 'CC0 Creative Commons',
      url: 'https://pixabay.com/en/maldives-pier-dock-lights-bay-1768714/',
    },
  },
  {
    day: {
      author: 'CC0 Creative Commons',
      url: 'https://pixabay.com/en/bled-slovenia-lake-mountains-1899264/',
    },
    night: {
      author: 'Eberhard Grossgasteiger',
      url: 'https://www.pexels.com/u/eberhardgross/',
    },
  },
  {
    day: {
      author: 'CC0 Creative Commons',
      url: 'https://pixabay.com/en/sand-dunes-ripples-wind-wilderness-1550396/',
    },
    night: {
      author: 'CC0 Creative Commons',
      url: 'https://pixabay.com/en/fog-dawn-landscape-morgenstimmung-1494433/',
    },
  },
  {
    day: {
      author: 'Mateusz Dach',
      url: 'https://www.pexels.com/u/mateusz-dach-99805/',
    },
    night: {
      author: 'Ales Krivec',
      url: 'https://www.pexels.com/u/ales-krivec-166939/',
    },
  },
  {
    day: {
      author: 'Matt Read',
      url: 'https://www.pexels.com/u/matt-read-14552/',
    },
    night: {
      author: 'Priseom',
      url: 'https://www.pexels.com/u/priseom-39551/',
    },
  },
  {
    day: {
      author: 'CC0 Creative Commons',
      url: 'https://pixabay.com/en/gleise-old-railroad-tracks-seemed-1555348/',
    },
    night: {
      author: 'CC0 Creative Commons',
      url: 'https://pixabay.com/en/storm-weather-atmosphere-cold-front-2211333/',
    },
  },
  {
    day: {
      author: 'Jonathan Peterson',
      url: 'https://www.pexels.com/u/grizzlybear/',
    },
    night: {
      author: 'CC0 Creative Commons',
      url: 'https://pixabay.com/en/winter-sun-sun-so-sunbeam-sunset-1547273/',
    },
  },
  {
    day: {
      author: 'Jonathan Peterson',
      url: 'https://www.pexels.com/u/grizzlybear/',
    },
    night: {
      author: 'CC0 Creative Commons',
      url: 'https://pixabay.com/en/autumn-fog-colorful-leaves-nature-1127616/',
    },
  },
  {
    day: {
      author: 'Despierres Cecile',
      url: 'https://www.pexels.com/u/despierres-cecile-93261/',
    },
    night: {
      author: 'Nikolai Ulltang',
      url: 'https://www.pexels.com/u/ulltangfilms/',
    },
  },
  {
    day: {
      author: 'Flo Dahm',
      url: 'https://www.pexels.com/u/flo-dahm-154317/',
    },
    night: {
      author: 'Snapwire',
      url: 'https://www.pexels.com/u/snapwire/',
    },
  },
  {
    day: {
      author: 'CC0 Creative Commons',
      url: 'https://pixabay.com/en/beach-rocks-water-sky-east-sunset-1336083/',
    },
    night: {
      author: 'Pixabay',
      url: 'https://www.pexels.com/u/pixabay/',
    },
  },
  {
    day: {
      author: 'Uncoated',
      url: 'https://www.pexels.com/u/uncoated/',
    },
    night: {
      author: 'Kaique Rocha',
      url: 'https://www.pexels.com/u/kaiquestr/',
    },
  },
  {
    day: {
      author: 'Margerretta',
      url: 'https://www.pexels.com/u/margerretta-157232/',
    },
    night: {
      author: 'Pixabay',
      url: 'https://www.pexels.com/u/pixabay/',
    },
  },
  {
    day: {
      author: 'Pixabay',
      url: 'https://www.pexels.com/u/pixabay/',
    },
    night: {
      author: 'Mateusz Dach',
      url: 'https://www.pexels.com/u/mateusz-dach-99805/',
    },
  },
  {
    day: {
      author: 'freestocks',
      url: 'https://www.pexels.com/u/freestocks/',
    },
    night: {
      author: 'Uncoated',
      url: 'https://www.pexels.com/u/uncoated/',
    },
  },
  {
    day: {
      author: 'Daniel Frank',
      url: 'https://www.pexels.com/u/fr3nks/',
    },
    night: {
      author: 'Kaique Rocha',
      url: 'https://www.pexels.com/u/kaiquestr/',
    },
  },
  {
    day: {
      author: 'Alexandre Perotto',
      url: 'https://www.pexels.com/u/alexandre-perotto-44133/',
    },
    night: {
      author: 'Photo Collections',
      url: 'https://www.pexels.com/u/photocollections/',
    },
  },
  {
    day: {
      author: 'Maria Portelles',
      url: 'https://www.pexels.com/u/helioz/',
    },
    night: {
      author: 'Pixabay',
      url: 'https://www.pexels.com/u/pixabay/',
    },
  },
];

const randomNum = Math.floor(Math.random() * 22);

/* Function gets user's local time and converts to an integer (1-24)
 * Between 7-19 indicates day time
 * Between 1-7 and 19-24 indicates night time
 * Randomly selects background image and associated author and reference link for page
 */
function bgChange() {
  const curTime = new Date();
  const picTime = parseInt(curTime.toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }), 10);
  if (picTime > 6 && picTime < 19) {
    $('body').css('background-image', `url('./assets/img/dayPics/sample${randomNum}.jpeg')`).fadeIn(3000);
    $('.credits p a').attr('href', bgInfo[randomNum].day.url);
    $('#pic-author').text(bgInfo[randomNum].day.author);
  } else {
    $('body').css('background-image', `url('./assets/img/nightPics/sample${randomNum}.jpeg')`).fadeIn(3000);
    $('#pic-author').attr('href', bgInfo[randomNum].night.url);
    $('#pic-author').text(bgInfo[randomNum].night.author);
  }
}

bgChange();

/* ***** VALIDATOR SECTION ******** */

/*
 * Hidden until triggered by clicking the wrench icon
 * Wrench icon shows link options to click on
 * A pop-up box appears allowing the user enter HTML/CSS code
 * The user needs to click on the 'check' button for the function to perform
 * The corresponding validations are shows
 * If the text exceeds the text fields, the user can scroll to see all the content
*/

function loadHTMLValidator() {
  const $input = $('#html-markup');
  const $output = $('#html-validated>code');
  const format = function getData(data) {
    const useData = data.messages;
    function filter(filterdata) {
      return (`Type: ${filterdata.type}\nLine: ${filterdata.lastLine}\nMessage: ${filterdata.message}\n\n`);
    }

    return (useData.map(filter).join(''));
  };

  $input.on('submit', function makeData(e) {
    e.preventDefault();

    const newdata = new FormData(this);

    $.ajax({
      url: 'https://validator.w3.org/nu/',
      data: newdata,
      method: 'POST',
      processData: false,
      contentType: false,
      success: (content) => {
        $output.text(format(content, { type: 'error' }));
      },
      error: () => {
        $output.text('Sorry, it looks like this code is outdated. Please update your extension or feel free to send a pull request with your own personal updates.');
      },
    });
  });

  $input.trigger('submit');
}

$('.tools-container').hide();
$('.valid-container').hide();
$('.page-speed-container').hide();
loadHTMLValidator();

function loadCSSValidator() {
  const $input = $('#css-markup');
  const $output = $('#css-validated>code');

  function format(type, line, message) {
    return `
    Type: ${type}
    Line: ${line}
    Message: ${message}
    `;
  }

  $input.on('submit', (e) => {
    e.preventDefault();

    const content = $('#css-markup textarea').val().replace(/\n/ig, '%0A');

    const proxyURL = 'https://cors-anywhere.herokuapp.com/';
    const validatorURL = `http://jigsaw.w3.org/css-validator/validator?text=${content}&profile=css3&output=json`;
    fetch(proxyURL + validatorURL)
      .then(response => response.json())
      .then(results => $output.text(results.cssvalidation.errors.map((item) => {
        return format(item.type, item.line, item.message);
      }).join('')));
  });
}
loadCSSValidator();

/* ***** PAGE SPEED SECTION ******** */

/*
 * Hidden until triggered by clicking the wrench icon
 * Wrench icon shows link options to click on
 * A pop-up box appears allowing the user enter a URL
 * The user needs to click on the 'desktop' or 'mobile' button for the function to perform
 * The corresponding page speed information is shown
 * If the text exceeds the text fields, the user can scroll to see all the content
 * Googe's Page Speed Insights API: https://developers.google.com/speed/docs/insights/v2/first-app
*/

const API_KEY = 'AIzaSyDKAeC02KcdPOHWVEZqdR1t5wwgaFJJKiM';
const API_URL = 'https://www.googleapis.com/pagespeedonline/v1/runPagespeed?';
const callbacks = {};
let input = '';
$('.returnresults').hide();
$('#loader-icon').hide();

// Create function to begin speed checker
function runPagespeedDesktop() {
  const s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = false;
  const query = [
    `url=${input}`,
    'callback=runPagespeedCallbacks',
    `key=${API_KEY}`,
  ].join('&');
  s.src = API_URL + query;
  document.head.insertBefore(s, null);
}

// Create function to begin speed checker
function runPagespeedMobile() {
  const s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = false;
  const query = [
    `url=${input}`,
    'callback=runPagespeedCallbacks',
    `key=${API_KEY}`,
    'strategy=mobile',
  ].join('&');
  s.src = API_URL + query;
  document.head.insertBefore(s, null);
}

// JSONP callback. Checks for errors, then invokes callback handlers.
function runPagespeedCallbacks(result) {
  if (result.error) {
    const errors = result.error.errors;
    for (var i = 0, len = errors.length; i < len; ++i) {
      if (errors[i].reason === 'badRequest' && API_KEY === 'yourAPIKey') {
        console.log('Please specify your Google API key in the API_KEY variable.');
        $('#speed-page-error').append('Please specify your Google API key in the API_KEY variable.');
      } else {
        console.log(errors[i].message);
        $('#speed-page-error').append(`${errors[i].message}`);
      }
    }
    return;
  }

  // Sent to each function on callbacks object.
  for (const fn in callbacks) {
    const f = callbacks[fn];
    if (typeof f == 'function') {
      callbacks[fn](result);
    }
  }
}

callbacks.displayPageSpeedScore = (result) => {
  const region = document.getElementById('output');
  const rules = result.formattedResults.ruleResults;
  const redirects = rules.AvoidLandingPageRedirects;
  const compress = rules.EnableGzipCompression;
  const caching = rules.LeverageBrowserCaching;
  const responseTime = rules.MainResourceServerResponseTime;
  const minCss = rules.MinifyCss;
  const minHtml = rules.MinifyHTML;
  const minJs = rules.MinifyJavaScript;
  const resources = rules.MinimizeRenderBlockingResources;
  const images = rules.OptimizeImages;
  const content = rules.PrioritizeVisibleContent;
  const rulesArray = [redirects, compress, caching, responseTime, minCss, minHtml,
    minJs, resources, images, content];
  const possibleRules = [];
  const foundRules = [];

  rulesArray.map((i) => {
    if (i.ruleImpact > 0) {
      possibleRules.push(i);
      possibleRules.sort((a, b) => b.ruleImpact - a.ruleImpact);
    } else {
      foundRules.push(i);
    }
    return i;
  });

  $('#output').hide().slideDown(500);
  $('#possible').hide().slideDown(500);
  $('#found').hide().slideDown(500);

  $(`
    <div class="speed-score-box">
      <h4 id="results-speed-title">Score: ${result.score}</h4>
      <span>URL: ${result.id}</span>
    </div>
    `).appendTo(region);
  if ($('#analyzePage')[0].className === 'active') {
    $('#results-speed-title').prepend('Desktop ');
  } else {
    $('#results-speed-title').prepend('Mobile ');
  }

  // Make container for possible optimizations
  const possible = document.getElementById('possible');
  if (possibleRules.length > 0) {
    $('<h1 class=optimizationTitles>Possible Optimizations</h1>').appendTo(possible);
  } else {
    $('<h1 class=optimizationTitles>Congratulations! No issues found.</h1>').appendTo(possible);
  }

  possibleRules.map((i) => {
    $(`<h4 class="speedTitles">${i.localizedRuleName}</h4>`).appendTo(possible);
    // possible.append(`${i.localizedRuleName}\n`);
    $(`
      <button class="click-details inactive" type="submit" id="${possibleRules.indexOf(i)}button">More Details</button>
      <div class="addInfo" id="${possibleRules.indexOf(i)}">
        <span id="${possibleRules.indexOf(i)}info"></span>
        <span><a href="#" id="${possibleRules.indexOf(i)}link" class="learn-more-link" target="_blank"></a></span>
        <span id="${possibleRules.indexOf(i)}these"></span>
      </div>
    `).appendTo(possible);

    const first = $(`#${possibleRules.indexOf(i)}info`);
    const second = $(`#${possibleRules.indexOf(i)}link`);
    const third = $(`#${possibleRules.indexOf(i)}these`);

    $('#output').hide().slideDown(500);
    $('#possible').hide().slideDown(500);
    $('#found').hide().slideDown(500);
    $(`#${possibleRules.indexOf(i)}`).hide();

    // Show more info when clicking 'More Details' button
    $(`#${possibleRules.indexOf(i)}button`).on('click', () => {
      if ($(`#${possibleRules.indexOf(i)}button`)[0].className === 'click-details inactive') {
        $(`#${possibleRules.indexOf(i)}button`).removeClass('inactive');
        $(`#${possibleRules.indexOf(i)}button`).addClass('active');
        $(`#${possibleRules.indexOf(i)}button`).text('Less Details');

        // Show possible optimizations
        // Specific test cases per rule
        for (let j = 0; j < i.urlBlocks.length; j += 1) {
          if (i.urlBlocks.length > 2 && j === 1) {
            first.append(`${i.urlBlocks[j].header.format}\n`);
          }
          if (i.urlBlocks.length > 2 && j === 2) {
            second.append(`${i.urlBlocks[j].header.format}\n`);
            second.attr('href', `${i.urlBlocks[j].header.args[0].value}`);
            for (let k = 0; k < i.urlBlocks[j].urls.length; k += 1) {
              third.append(`${i.urlBlocks[j].urls[k].result.args[0].value}\n`);
            }
          }
          if (i.urlBlocks.length <= 2) {
            if (j === 0) {
              if (i.localizedRuleName === 'Reduce server response time') {
                first.append(`In our test, your server responded in ${i.urlBlocks[j].header.args[0].value}. There are many factors that can slow down your server response time. Please read our recommendations to learn how you can monitor and measure where your server is spending the most time.\n`);
                second.append('Learn More');
                second.attr('href', `${i.urlBlocks[j].header.args[1].value}`);
              } else {
                first.append(`${i.urlBlocks[j].header.format}\n`);
              }
            }
            if (j === 1) {
              if (i.localizedRuleName === 'Prioritize visible content') {
                third.append(`${i.urlBlocks[j].header.format}\n`);
                second.append(`${i.localizedRuleName}\n`);
                second.attr('href', `${i.urlBlocks[j].header.args[0].value}`);
              } else if (i.localizedRuleName === 'Reduce server response time') {
                first.append(`In our test, your server responded in ${i.urlBlocks[j].header.args[0].value}. There are many factors that can slow down your server response time. Please read our recommendations to learn how you can monitor and measure where your server is spending the most time.\n`);
                second.append('Learn More');
                second.attr('href', `${i.urlBlocks[j].header.args[1].value}`);
              } else {
                second.append(`${i.localizedRuleName} of the following:\n`);
                second.attr('href', `${i.urlBlocks[j].header.args[0].value}`);
                for (let k = 0; k < i.urlBlocks[j].urls.length; k += 1) {
                  third.append(`${i.urlBlocks[j].urls[k].result.args[0].value}\n`);
                }
              }
            }
          }
        }
        $(`#${possibleRules.indexOf(i)}`).slideDown(500);
      } else {
        $(`#${possibleRules.indexOf(i)}button`).removeClass('active');
        $(`#${possibleRules.indexOf(i)}button`).addClass('inactive');
        $(`#${possibleRules.indexOf(i)}button`).text('More Details');
        $(`#${possibleRules.indexOf(i)}`).slideUp(500, () => {
          first.empty();
          second.empty();
          second.attr('href', '#');
          third.empty();
        });
      }
    });
    return i;
  });

  // Create top of found optimizations container
  const found = document.getElementById('found');
  $('<h1 class=optimizationTitles>Optimizations Found</h1>').appendTo(found);
  $('<button class="click-details inactive" type="submit" id="moreFoundOptimizations">More Details</button><div class="addFoundOptimizations"</div>').appendTo(found);

  // Show more info when clicking 'More Details' button
  $('#moreFoundOptimizations').on('click', () => {
    if ($('#moreFoundOptimizations')[0].className === 'click-details inactive') {
      $('#moreFoundOptimizations').removeClass('inactive');
      $('#moreFoundOptimizations').addClass('active');
      $('#moreFoundOptimizations').text('Less Details');
      $('.addFoundOptimizations').hide();

      foundRules.map((m) => {
        $(`
          <h4 id="${foundRules.indexOf(m)}title" class="speedTitles"></h4>
          <div class="addFoundInfo">
            <div id="${foundRules.indexOf(m)}content"></div>
            <div><a href="#" id="${foundRules.indexOf(m)}anchor" class="learn-more-link" target="_blank"></a></div>
          </div>
          `).appendTo($('.addFoundOptimizations'));

        const title = $(`#${foundRules.indexOf(m)}title`);
        const top = $(`#${foundRules.indexOf(m)}content`);
        const bottom = $(`#${foundRules.indexOf(m)}anchor`);

        // Fill container for found optimizations
        title.append(`${m.localizedRuleName}`);

        // Show found optimizations
        top.append(`${m.urlBlocks[0].header.format}`);
        bottom.append('Learn More');
        bottom.attr('href', `${m.urlBlocks[0].header.args[0].value}`);
        // $(`#${foundRules.indexOf(m)}`).slideDown(500);
        return m;
      });
      $('.addFoundOptimizations').slideDown(500);
    } else {
      $('#moreFoundOptimizations').removeClass('active');
      $('#moreFoundOptimizations').addClass('inactive');
      $('#moreFoundOptimizations').text('More Details');
      $('.addFoundOptimizations').slideUp(500, () => {
        $('.addFoundOptimizations').empty();
      });
    }
  });
  $('.returnresults').slideDown(500);
  $('#loader-icon').removeClass('spin').hide();
  $('#analyzePage').removeAttr('disabled', 'disabled');
  $('#switch-speed-view').removeAttr('disabled', 'disabled');
};

$('#analyzePage').on('click', () => {
  // Clear previous results
  $('.returnresults').slideUp(500);
  $('.page-speed-box').slideUp(500).empty();
  // Cannot click again until fully loaded
  $('#analyzePage').addClass('active').attr('disabled', 'disabled');
  // Loading icon to indicate user to be patient
  $('#loader-icon').show().addClass('spin');
  input = $('#path').val();
  runPagespeedDesktop();
});

$('#switch-speed-view').on('click', () => {
  // Clear previous results
  $('.returnresults').slideUp(500);
  $('.page-speed-box').slideUp(500).empty();
  $('#analyzePage').removeClass('active');
  // Cannot click again until fully loaded
  $('#switch-speed-view').attr('disabled', 'disabled');
  // Loading icon to indicate user to be patient
  $('#loader-icon').show().addClass('spin');
  input = $('#path').val();
  runPagespeedMobile();
});
