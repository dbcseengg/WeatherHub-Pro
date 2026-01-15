(function() {
    window.NETLIFY_API_KEY = 'demo'; // Local fallback
    
    // Netlify injects this automatically in production
    if (typeof process !== 'undefined' && process.env && process.env.NETLIFY_API_KEY) {
        window.NETLIFY_API_KEY = process.env.NETLIFY_API_KEY;
    }
})();

const cities = [
    "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata",
    "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Surat"
];

// Store current weather data and recent searches
let currentWeatherData = null;
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// Background themes
const bgThemes = {
    hot: { class: 'bg-hot', tempRange: [30, 60] },
    warm: { class: 'bg-sunny', tempRange: [20, 30] },
    mild: { class: 'bg-cloudy', tempRange: [10, 20] },
    cold: { class: 'bg-cold', tempRange: [0, 10] },
    freezing: { class: 'bg-snowy', tempRange: [-100, 0] }
};

const weatherThemes = {
    'Clear': 'bg-sunny',
    'Clouds': 'bg-cloudy',
    'Rain': 'bg-rainy',
    'Snow': 'bg-snowy',
    'Thunderstorm': 'bg-thunder',
    'Drizzle': 'bg-rainy'
};

// Fetch weather by city
async function fetchWeather(city) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${window.NETLIFY_API_KEY}&units=metric`
        );
        return await response.json();
    } catch (error) {
        console.error('Weather fetch error:', error);
        return { cod: 404 };
    }
}

// Update background based on temperature and weather
function updateBackground(temp, weatherMain = '') {
    // Temperature-based theme
    let bgClass = 'bg-cloudy';
    for (let theme in bgThemes) {
        let [minTemp, maxTemp] = bgThemes[theme].tempRange;
        if (temp >= minTemp && temp <= maxTemp) {
            bgClass = bgThemes[theme].class;
            break;
        }
    }

    // Weather override
    if (weatherThemes[weatherMain]) {
        bgClass = weatherThemes[weatherMain];
    }

    const bg = document.getElementById('weatherBg');
    bg.className = `weather-bg ${bgClass}`;
    createParticles(bgClass);
}

// Create animated particles
function createParticles(bgClass) {
    const particlesContainer = document.getElementById('particles');
    particlesContainer.innerHTML = '';

    const particleCount = bgClass.includes('rain') || bgClass.includes('snow') ? 100 : 60;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 4 + 's';
        particle.style.animationDuration = (Math.random() * 4 + 3) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Add particle styles dynamically
if (!document.querySelector('style[data-particles]')) {
    const particleStyle = document.createElement('style');
    particleStyle.setAttribute('data-particles', 'true');
    particleStyle.textContent = `
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255,255,255,0.7);
            border-radius: 50%;
            animation: fall linear infinite;
            top: -10%;
        }
        
        .bg-rainy .particle,
        .bg-snowy .particle { 
            width: 2px; 
            height: 14px; 
            background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.9)); 
        }
        
        .bg-sunny .particle {
            background: radial-gradient(circle, #ffd700, transparent);
            box-shadow: 0 0 12px #ffd700;
            width: 6px;
            height: 6px;
        }
        
        @keyframes fall {
            to {
                transform: translateY(100vh) rotate(360deg);
            }
        }
    `;
    document.head.appendChild(particleStyle);
}

// Display main weather
function displayMainWeather(data, originalCity = '') {
    const container = document.getElementById("weatherMain");

    if (data.cod !== 200) {
        container.innerHTML = `
            <div class="weather-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>City not found</h2>
                <p>Please check the spelling and try again</p>
            </div>
        `;
        return;
    }

    currentWeatherData = data; // Store current data permanently

    const temp = Math.round(data.main.temp);
    const weatherMain = data.weather[0].main;

    // Update background
    updateBackground(temp, weatherMain);

    container.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <h1>${temp}°C</h1>
        <div class="weather-icon">
            <i class="fas fa-${getWeatherIcon(weatherMain, data.weather[0].icon)}"></i>
        </div>
        <p class="weather-desc">${data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)}</p>
        <div class="weather-details">
            <div><i class="fas fa-tint"></i> ${data.main.humidity}%</div>
            <div><i class="fas fa-wind"></i> ${data.wind.speed.toFixed(1)} m/s</div>
            <div><i class="fas fa-eye"></i> ${data.main.pressure} hPa</div>
            <div><i class="fas fa-thermometer-half"></i> ${data.main.feels_like.toFixed(1)}°C</div>
        </div>
    `;

    // Add smooth entrance animation
    container.classList.add('animate');
    // setTimeout(() => container.classList.remove('animate'), 300000);

    // Add to recent searches
    addToRecentSearches(originalCity || data.name);
}

// Get weather icon
function getWeatherIcon(main, icon) {
    const icons = {
        'Clear': 'sun',
        'Clouds': 'cloud',
        'Rain': 'cloud-rain',
        'Snow': 'snowflake',
        'Thunderstorm': 'bolt',
        'Drizzle': 'cloud-drizzle',
        'Mist': 'smog',
        'Smoke': 'smog',
        'Haze': 'smog',
        'Dust': 'wind',
        'Fog': 'smog'
    };
    return icons[main] || 'cloud';
}

// NEW: Recent searches functionality
function addToRecentSearches(city) {
    // Remove if already exists (most recent first)
    recentSearches = recentSearches.filter(c => c !== city);
    recentSearches.unshift(city);

    // Keep only last 7
    if (recentSearches.length > 7) {
        recentSearches = recentSearches.slice(0, 7);
    }

    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    displayRecentSearches();
}

function displayRecentSearches() {
    const container = document.getElementById('recentContainer');

    if (recentSearches.length === 0) {
        container.innerHTML = '<p style="text-align: center; opacity: 0.7; width: 100%;">No recent searches</p>';
        return;
    }

    container.innerHTML = recentSearches.map(city =>
        `<div class="recent-item" onclick="getWeatherByRecent('${city}')">
            <i class="fas fa-search"></i> ${city}
        </div>`
    ).join('');
}

async function getWeatherByRecent(city) {
    document.getElementById('cityInput').value = city;
    await getWeatherByCity();
}

// Main city weather search
async function getWeatherByCity() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) return;

    const data = await fetchWeather(city);
    displayMainWeather(data, city);
    document.getElementById("cityInput").value = '';
}

// Load carousel
async function loadCarousel() {
    const container = document.getElementById("carouselContainer");

    for (let city of cities) {
        try {
            const data = await fetchWeather(city);

            const card = document.createElement("div");
            card.className = "city-card";

            if (data.cod === 200) {
                const temp = Math.round(data.main.temp);
                card.innerHTML = `
                    <div class="card-icon">
                        <i class="fas fa-${getWeatherIcon(data.weather[0].main, data.weather[0].icon)}"></i>
                    </div>
                    <h3>${city}</h3>
                    <div class="card-temp">${temp}°C</div>
                    <p>${data.weather[0].main}</p>
                `;
            } else {
                card.innerHTML = `
                    <div class="card-icon">
                        <i class="fas fa-cloud-question"></i>
                    </div>
                    <h3>${city}</h3>
                    <div class="card-temp">--°C</div>
                    <p>Unavailable</p>
                `;
            }

            card.onclick = () => displayMainWeather(data, city);
            container.appendChild(card);
        } catch (error) {
            console.error(`Error loading ${city}:`, error);
        }
    }
}

// Enter key support
document.getElementById('cityInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        getWeatherByCity();
    }
});

// Initialize app
async function initApp() {
    // Load recent searches first
    displayRecentSearches();

    // Load carousel
    await loadCarousel();

    // Set initial background
    updateBackground(22, 'Clouds');
}

// Add CSS for animation class
const animateStyle = document.createElement('style');
animateStyle.textContent = `
    .weather-main.animate {
        transform: translateY(0) scale(1);
        opacity: 1;
        transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .weather-main {
        transform: translateY(30px);
        opacity: 0;
    }
`;
document.head.appendChild(animateStyle);

initApp();



