const API_URL = "http://localhost:5503/weather/update"; // Your Ballerina backend URL
const API_KEY = ""; // Not used if your backend handles the API

// Elements
const loadingEl = document.getElementById('loading');
const weatherInfo = document.getElementById('weather-info');
const errorMsg = document.getElementById('error-msg');
const refreshBtn = document.getElementById('refresh-btn');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

const cityEl = document.getElementById('city');
const timezoneEl = document.getElementById('timezone');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const detailsEl = document.getElementById('details');
const windEl = document.getElementById('wind');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const weatherIconEl = document.getElementById('weather-icon');
const forecastEl = document.getElementById('forecast');

let autoRefreshInterval = null;

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = searchInput.value.trim();
  if (city) {
    fetchWeather(city);
  }
});

async function fetchWeather(city) {
  try {
    showLoading(true);
    showError(false);
    weatherInfo.classList.add('hidden');

    // Make request to your backend API that calls OpenWeatherMap or another API
    const response = await fetch(`${API_URL}?city=${encodeURIComponent(city)}`);
    if (!response.ok) {
      throw new Error('City not found or server error.');
    }
    const data = await response.json();

    updateUI(data);
    setupAutoRefresh(city);
  } catch (err) {
    showError(true, err.message);
  } finally {
    showLoading(false);
  }
}

function updateUI(data) {
  cityEl.textContent = `${data.name}, ${data.sys.country}`;
  timezoneEl.textContent = `Timezone: UTC${formatTimezone(data.timezone)}`;

  const tempC = kelvinToCelsius(data.main.temp);
  tempEl.textContent = `${tempC}°C`;
  descEl.textContent = data.weather[0].description;

  detailsEl.textContent = `Feels like: ${kelvinToCelsius(data.main.feels_like)}°C | Humidity: ${data.main.humidity}%`;
  windEl.textContent = `Wind: ${data.wind.speed} m/s, ${degreesToDirection(data.wind.deg)}`;

  sunriseEl.textContent = `Sunrise: ${unixToTime(data.sys.sunrise, data.timezone)}`;
  sunsetEl.textContent = `Sunset: ${unixToTime(data.sys.sunset, data.timezone)}`;

  weatherIconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  weatherIconEl.alt = data.weather[0].description;

  // Forecast (assuming data.forecast array available)
  if (data.forecast && data.forecast.length) {
    forecastEl.innerHTML = '';
    data.forecast.forEach(day => {
      const dayEl = document.createElement('div');
      dayEl.classList.add('forecast-day');
      dayEl.innerHTML = `
        <div class="date">${formatDate(day.dt, data.timezone)}</div>
        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}" />
        <div class="temp-max">${kelvinToCelsius(day.temp.max)}°</div>
        <div class="temp-min">${kelvinToCelsius(day.temp.min)}°</div>
      `;
      forecastEl.appendChild(dayEl);
    });
  }

  weatherInfo.classList.remove('hidden');
}

function showLoading(show) {
  loadingEl.classList.toggle('hidden', !show);
}

function showError(show, message = '') {
  if (show) {
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
  } else {
    errorMsg.classList.add('hidden');
  }
}

function kelvinToCelsius(kelvin) {
  return (kelvin - 273.15).toFixed(1);
}

function unixToTime(unix, timezone) {
  // timezone is seconds offset from UTC
  const date = new Date((unix + timezone) * 1000);
  return date.toUTCString().match(/\d{2}:\d{2}:\d{2}/)[0];
}

function formatDate(unix, timezone) {
  const date = new Date((unix + timezone) * 1000);
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

function formatTimezone(seconds) {
  const sign = seconds >= 0 ? '+' : '-';
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = (abs % 3600) / 60;
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function degreesToDirection(deg) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

function setupAutoRefresh(city) {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = setInterval(() => fetchWeather(city), 10 * 60 * 1000);
}

// Initial load for default city
fetchWeather('Colombo');
