const API_URL = 'http://localhost:8080/weather/update?city='; // Your Ballerina backend URL

const cityEl = document.getElementById('city');
const datetimeEl = document.getElementById('datetime');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const feelsLikeEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const weatherIconEl = document.getElementById('weatherIcon');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const sunriseCountdownEl = document.getElementById('sunriseCountdown');
const sunsetCountdownEl = document.getElementById('sunsetCountdown');
const hourlyContainer = document.getElementById('hourlyContainer');
const dailyContainer = document.getElementById('dailyContainer');
const aqiEl = document.getElementById('aqi');
const aqiAdviceEl = document.getElementById('aqiAdvice');
const uvBarEl = document.getElementById('uvBar');
const uvLevelEl = document.getElementById('uvLevel');
const themeToggleBtn = document.getElementById('themeToggle');

let autoRefreshInterval = null;

function kelvinToCelsius(k) {
  return (k - 273.15).toFixed(1);
}

function unixToTime(unix, timezone) {
  const date = new Date((unix + timezone) * 1000);
  return date.toUTCString().match(/\d{2}:\d{2}:\d{2}/)[0];
}

function formatTime(unix, timezone) {
  const date = new Date((unix + timezone) * 1000);
  return date.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'});
}

function formatDate(unix, timezone) {
  const date = new Date((unix + timezone) * 1000);
  return date.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
}

function degreesToDirection(deg) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(deg / 45) % 8];
}

function formatTimezone(seconds) {
  const sign = seconds >= 0 ? '+' : '-';
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = (abs % 3600) / 60;
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getAQILevel(aqi) {
  if (aqi <= 50) return {text:'Good', color:'var(--aqi-good)', advice:'Air quality is satisfactory.'};
  if (aqi <= 100) return {text:'Moderate', color:'var(--aqi-moderate)', advice:'Acceptable for most.'};
  return {text:'Unhealthy', color:'var(--aqi-unhealthy)', advice:'Limit outdoor activities.'};
}

function getUVColor(uv) {
  if (uv <= 2) return {color:'var(--uv-low)', level:'Low'};
  if (uv <= 5) return {color:'var(--uv-moderate)', level:'Moderate'};
  return {color:'var(--uv-high)', level:'High'};
}

function updateCountdown(unix, timezone, el) {
  function tick() {
    const now = new Date();
    const target = new Date((unix + timezone) * 1000);
    const diff = target - now;
    if(diff < 0) {
      el.textContent = '00:00:00';
      return;
    }
    const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
    const m = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const s = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
  }
  tick();
  return setInterval(tick, 1000);
}

async function fetchWeather(city) {
  try {
    const res = await fetch(API_URL + city);
    if(!res.ok) throw new Error('API error');
    const data = await res.json();
    return data;
  } catch(e) {
    alert('Failed to fetch weather data.');
    console.error(e);
    return null;
  }
}

function renderCurrent(data) {
  const {current, timezone_offset, timezone, city} = data;
  cityEl.textContent = city + ` (UTC${formatTimezone(timezone_offset)})`;
  const dt = new Date((current.dt + timezone_offset) * 1000);
  datetimeEl.textContent = dt.toLocaleString();

  tempEl.textContent = `${kelvinToCelsius(current.temp)}°C`;
  descEl.textContent = current.weather[0].description;
  feelsLikeEl.textContent = `Feels like: ${kelvinToCelsius(current.feels_like)}°C`;
  humidityEl.textContent = `Humidity: ${current.humidity}%`;
  windEl.textContent = `Wind: ${current.wind_speed}m/s ${degreesToDirection(current.wind_deg)}`;

  weatherIconEl.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;
  weatherIconEl.alt = current.weather[0].description;

  sunriseEl.textContent = formatTime(data.current.sunrise, timezone_offset);
  sunsetEl.textContent = formatTime(data.current.sunset, timezone_offset);

  // Clear old intervals if any
  if(window.sunriseInterval) clearInterval(window.sunriseInterval);
  if(window.sunsetInterval) clearInterval(window.sunsetInterval);

  window.sunriseInterval = updateCountdown(current.sunrise, timezone_offset, sunriseCountdownEl);
  window.sunsetInterval = updateCountdown(current.sunset, timezone_offset, sunsetCountdownEl);
}

function renderHourly(data) {
  hourlyContainer.innerHTML = '';
  const {hourly, timezone_offset} = data;
  // Show next 12 hours
  hourly.slice(0,12).forEach(hour => {
    const hourDate = new Date((hour.dt + timezone_offset) * 1000);
    const hourStr = hourDate.toLocaleTimeString(undefined, {hour:'2-digit', hour12:true});
    const icon = hour.weather[0].icon;
    const temp = kelvinToCelsius(hour.temp);
    const card = document.createElement('div');
    card.className = 'hour-card';
    card.innerHTML = `
      <div>${hourStr}</div>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${hour.weather[0].description}" />
      <div>${temp}°C</div>
    `;
    hourlyContainer.appendChild(card);
  });
}

function renderDaily(data) {
  dailyContainer.innerHTML = '';
  const {daily, timezone_offset} = data;
  // Show next 5 days
  daily.slice(1,6).forEach(day => {
    const dayStr = formatDate(day.dt, timezone_offset);
    const icon = day.weather[0].icon;
    const maxTemp = kelvinToCelsius(day.temp.max);
    const minTemp = kelvinToCelsius(day.temp.min);
    const card = document.createElement('div');
    card.className = 'day-card';
    card.innerHTML = `
      <div>${dayStr}</div>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${day.weather[0].description}" />
      <div>${maxTemp}° / ${minTemp}°C</div>
    `;
    dailyContainer.appendChild(card);
  });
}

function renderAQI(aqi) {
  const level = getAQILevel(aqi);
  aqiEl.textContent = level.text;
  aqiEl.style.backgroundColor = level.color;
  aqiAdviceEl.textContent = level.advice;
}

function renderUV(uv) {
  const uvInfo = getUVColor(uv);
  uvBarEl.style.width = `${Math.min(uv, 11) * 9}%`; // max UV index 11+
  uvBarEl.style.backgroundColor = uvInfo.color;
  uvLevelEl.textContent = uvInfo.level;
}

function applyTheme(isDark) {
  if(isDark) {
    document.body.classList.add('dark');
    themeToggleBtn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    themeToggleBtn.textContent = '🌙';
  }
  localStorage.setItem('darkTheme', isDark);
}

themeToggleBtn.addEventListener('click', () => {
  applyTheme(!document.body.classList.contains('dark'));
});

async function updateDashboard(city='Colombo') {
  const data = await fetchWeather(city);
  if(!data) return;
  renderCurrent(data);
  renderHourly(data);
  renderDaily(data);
  // Mock AQI and UV from current data (for demo)
  renderAQI(data.current.aqi || 42);
  renderUV(data.current.uvi || 3);
}

function init() {
  // Load theme from localStorage
  const darkTheme = localStorage.getItem('darkTheme') === 'true';
  applyTheme(darkTheme);

  updateDashboard();

  // Refresh every 10 minutes
  if(autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = setInterval(() => updateDashboard(), 10 * 60 * 1000);
}

init();
