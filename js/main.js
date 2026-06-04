async function getCoordinates(locationName) {
    const url =
        `https://geocoding-api.open-meteo.com/v1/search` +
        `?name=${encodeURIComponent(locationName)}` +
        `&count=1` +
        `&language=vi` +
        `&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Lỗi Geocoding API");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("Không tìm thấy địa điểm");
    }

    return {
        latitude: data.results[0].latitude,
        longitude: data.results[0].longitude,
        name: data.results[0].name
    };
}

async function getWeatherData(locationName) {

    const loadingOverlay =
        document.getElementById('loading-overlay');

    if (loadingOverlay)
        loadingOverlay.style.display = 'flex';

    try {

        const location =
            await getCoordinates(locationName);

        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${location.latitude}` +
            `&longitude=${location.longitude}` +
            `&current=&current=temperature_2m,relative_humidity_2m,wind_speed_10m,is_day,weather_code,cloud_cover,visibility` +
            `&hourly=temperature_2m,weather_code,is_day,cloud_cover,visibility,rain,showers,snowfall,wind_speed_10m` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
            `&forecast_days=7` +
            `&timezone=auto`;

        const response =
            await fetch(weatherUrl);

        if (!response.ok) {
            throw new Error("Lỗi Weather API");
        }

        const [weatherData, aqiData] =
            await Promise.all([

                fetch(weatherUrl)
                    .then(r => r.json()),

                getAQI(
                    location.latitude,
                    location.longitude
                )
            ]);

        weatherData.airQuality =
            aqiData.current;

        updateUI(
            weatherData,
            location.name
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Không tìm thấy dữ liệu thời tiết."
        );
    }
    finally {

        if (loadingOverlay)
            loadingOverlay.style.display = 'none';
    }
}

async function getAQI(lat, lon) {

    const response =
        await fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`
        );

    return await response.json();
}

document.getElementById('btn-geo').onclick = () => {

    navigator.geolocation.getCurrentPosition(
        async pos => {

            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            getWeatherByCoords(lat, lon);

        },
        () => {

            alert(
                "Không thể lấy vị trí hiện tại"
            );
        }
    );
};

function updateBackgrounds(isDay, weatherCode, visibility = 10000, windSpeed = 0) {
    const card = document.getElementById('landscape-card');
    const body = document.body;

    // Hằng số gió (đặt tạm ở đây nếu bạn chưa khai báo global)
    const WIND = {
        TORNADO: 120,
        CYCLONE: 80
    };

    // Mặc định là trời quang (Clear sky - Code: 0)
    let bgImage = isDay ? 'clearskyday.png' : 'clearskynight.png';
    let themeClass = isDay ? 'theme-sunny' : 'theme-night';
    let animationType = 'clear'; // Biến cờ lưu trạng thái hiệu ứng rơi

    // ==========================================
    // 1. NHÓM MÃ THỜI TIẾT THEO CHUẨN WMO
    // ==========================================
    const scatteredCodes = [1];          // Ít mây (Mainly clear)
    const cloudyCodes = [2];             // Có mây (Partly cloudy)
    const overcastCodes = [3];           // Âm u nhiều mây (Overcast)
    const fogCodes = [45, 48];           // Sương mù (Fog/Mist)

    // Các loại mưa
    const drizzleCodes = [51, 53, 56];   // Mưa phùn
    const rainCodes = [61, 63];          // Mưa rả rích
    const heavyRainCodes = [55, 57, 65]; // Mưa to
    const showerCodes = [80, 81, 82];    // Mưa rào

    const snowCodes = [71, 73, 75, 77, 85, 86]; // Tuyết (thêm vào dự phòng)
    const thunderCodes = [95, 96, 99];   // Giông sấm sét

    // ==========================================
    // 2. XỬ LÝ LOGIC ĐỔI ẢNH, THEME VÀ ANIMATION
    // ==========================================
    
    // --- ƯU TIÊN 1: NHÓM THỜI TIẾT CỰC ĐOAN ---
    if (windSpeed >= WIND.TORNADO) {
        bgImage = 'tornado.png';
        themeClass = 'theme-tornado';
        animationType = 'extreme_storm';
    } 
    else if (windSpeed >= WIND.CYCLONE) {
        bgImage = 'cyclone.png';
        themeClass = 'theme-cyclone';
        animationType = 'extreme_storm';
    } 
    else if (weatherCode <= 3 && windSpeed > 40 && visibility < 1000) {
        bgImage = 'sandstorm.png'; 
        themeClass = 'theme-sandstorm';
        animationType = 'sandstorm';
    } 
    else if (weatherCode <= 3 && windSpeed > 20 && visibility < 3000) {
        bgImage = 'haze-day.png'; 
        themeClass = 'theme-haze';
        animationType = 'haze';
    }

    // --- ƯU TIÊN 2: NHÓM THỜI TIẾT BÌNH THƯỜNG ---
    // Nhóm Mây
    else if (scatteredCodes.includes(weatherCode)) {
        bgImage = isDay ? 'scattered-clouds-day.png' : 'scattered-clouds-night.png';
        themeClass = isDay ? 'theme-cloudy' : 'theme-night';
    } 
    else if (cloudyCodes.includes(weatherCode)) {
        bgImage = isDay ? 'cloudyskyday.png' : 'cloudyskynight.png';
        themeClass = isDay ? 'theme-cloudy' : 'theme-night';
    } 
    else if (overcastCodes.includes(weatherCode)) {
        bgImage = isDay ? 'overcastday.png' : 'overcastnight.png';
        themeClass = 'theme-overcast';
    }
    
    // Nhóm Sương Mù
    else if (fogCodes.includes(weatherCode)) {
        bgImage = isDay ? 'mistday.png' : 'mistnight.png'; 
        themeClass = 'theme-overcast';
    }
    
    // Nhóm Mưa 
    else if (drizzleCodes.includes(weatherCode)) {
        bgImage = 'lightshower.png';
        themeClass = 'theme-rain';
        animationType = 'rain';
    } 
    else if (rainCodes.includes(weatherCode)) {
        bgImage = isDay ? 'rain-day.png' : 'rain-night.png';
        themeClass = 'theme-rain';
        animationType = 'rain';
    } 
    else if (heavyRainCodes.includes(weatherCode)) {
        bgImage = 'heavyshower.png';
        themeClass = 'theme-rain';
        animationType = 'rain';
    } 
    else if (showerCodes.includes(weatherCode)) {
        bgImage = weatherCode === 80 ? 'lightshower.png' : 'shower.png';
        themeClass = 'theme-rain';
        animationType = 'rain';
    }
    
    // Nhóm Tuyết 
    else if (snowCodes.includes(weatherCode)) {
        bgImage = weatherCode === 75 || weatherCode === 86 ? 'snowstorm.png' : 'snow.png';
        themeClass = 'theme-snow'; // Cập nhật sang class nền tuyết đã tạo
        animationType = 'snow';
    }
    
    // Nhóm Sấm Sét
    else if (thunderCodes.includes(weatherCode)) {
        bgImage = weatherCode === 95 ? 'lightthunderstorm.png' : 'thunderstorm.png';
        themeClass = 'theme-thunderstorm';
        animationType = 'thunder';
    }

    // ==========================================
    // 3. CẬP NHẬT GIAO DIỆN
    // ==========================================
    
    // Chạy hiệu ứng hạt rơi (Gom lại gọi 1 lần cho sạch code)
    if (typeof triggerWeatherAnimation === 'function') {
        triggerWeatherAnimation(animationType);
    }

    if (card) {
        card.style.backgroundImage = `url('assets/backgrounds/${bgImage}')`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';
        card.style.backgroundColor = '#141e30'; 
    }

    // Reset lại toàn bộ class của body trước khi gán mới để tránh bị trùng lặp màu nền
    body.className = '';
    body.classList.add(isDay ? 'day-mode' : 'night-mode');
    body.classList.add(themeClass);
}

function updateUI(data, cityName) {

    // ===== Thông tin hiện tại =====

    document.getElementById('city-name').innerText =
        cityName;

    document.getElementById('main-temp').innerText =
        `${Math.round(data.current.temperature_2m)}°`;

    document.getElementById('weather-desc').innerText =
        getWeatherDescription(
            data.current.weather_code
        );

    document.getElementById('humidity').innerText =
        data.current.relative_humidity_2m;

    document.getElementById('wind-speed').innerText =
        Math.round(
            data.current.wind_speed_10m
        );

    document.getElementById('main-icon').src =
        getWeatherIcon(
            data.current.weather_code,
            data.current.is_day,
            data.current.cloud_cover,
            10000,
            0,
            0,
            0,
            data.current.wind_speed_10m
        );

    document.getElementById('current-date').innerText =
        new Date().toLocaleDateString(
            'vi-VN',
            {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            }
        );
    // ===== CHI TIẾT THỜI TIẾT (WIDGETS) =====
    
    // 1. Tốc độ gió (Cập nhật cho ô widget vuông nếu bạn dùng Cách 2)
    const windBox = document.getElementById('wind-speed-box');
    if (windBox) {
        windBox.innerText = `${Math.round(data.current.wind_speed_10m || 0)} km/h`;
    }

    // 2. Tầm nhìn (chuyển từ mét sang km, lấy 1 số thập phân)
    const visibilityBox = document.getElementById('visibility-box');
    if (visibilityBox) {
        const visKm = ((data.current.visibility || 0) / 1000).toFixed(1);
        visibilityBox.innerText = `${visKm} km`;
    }

    // 3. Phủ mây
    const cloudBox = document.getElementById('cloud-cover-box');
    if (cloudBox) {
        cloudBox.innerText = `${data.current.cloud_cover || 0} %`;
    }
    // ===== AQI =====

if (data.airQuality?.us_aqi != null) {
        const aqi = Math.round(data.airQuality.us_aqi);
        
        let status = 'Tốt';
        let colorClass = 'aqi-good'; // Mặc định là xanh lá

        if (aqi > 50) {
            status = 'Trung bình';
            colorClass = 'aqi-moderate';
        }
        if (aqi > 100) {
            status = 'Kém';
            colorClass = 'aqi-sensitive';
        }
        if (aqi > 150) {
            status = 'Xấu';
            colorClass = 'aqi-unhealthy';
        }
        if (aqi > 200) {
            status = 'Rất xấu';
            colorClass = 'aqi-very-unhealthy';
        }
        if (aqi > 300) {
            status = 'Nguy hiểm';
            colorClass = 'aqi-hazardous';
        }

        // Cập nhật số
        document.getElementById('aqi-num').innerText = aqi;

        // Cập nhật chữ và màu nền cho Badge
        const aqiBadge = document.getElementById('aqi-status');
        aqiBadge.innerText = status;
        
        // className sẽ đè lên toàn bộ class cũ, nên mình cần giữ lại class "badge" của Bootstrap
        aqiBadge.className = `badge ${colorClass}`; 
    }

    // ===== Bình minh / Hoàng hôn =====

    document.getElementById('sunrise').innerText =
        new Date(
            data.daily.sunrise[0]
        ).toLocaleTimeString(
            'vi-VN',
            {
                hour: '2-digit',
                minute: '2-digit'
            }
        );

    document.getElementById('sunset').innerText =
        new Date(
            data.daily.sunset[0]
        ).toLocaleTimeString(
            'vi-VN',
            {
                hour: '2-digit',
                minute: '2-digit'
            }
        );

    // ===== Background =====

    updateBackgrounds(
        data.current.is_day,
        data.current.weather_code
    );

    // ===== Dự báo theo giờ =====

    updateHourly(data);

    // ===== Dự báo theo ngày =====

    updateDaily(data);
}

// ===============================
// 1. CODE GROUPS (dễ mở rộng)
// ===============================

const WIND = {
    TORNADO: 120,
    CYCLONE: 80
};

const CLOUD_CODES = new Set([1, 2, 3]);
const FOG_CODES = new Set([45, 48]);
const DRIZZLE_CODES = new Set([51, 53, 55]);
const FREEZING_DRIZZLE_CODES = new Set([56, 57]);
const RAIN_CODES = new Set([61, 63, 65]);
const FREEZING_RAIN_CODES = new Set([66, 67]);
const SNOW_CODES = new Set([71, 73, 75, 77]);
const SHOWER_CODES = new Set([80, 81, 82]);
const SNOW_SHOWER_CODES = new Set([85, 86]);
const THUNDER_CODES = new Set([95, 96, 99]);

// ===============================
// 2. WEATHER DESCRIPTION
// ===============================
function getWeatherDescription(
    code,
    isDay = true,
    cloudCover = 0,
    visibility = 10000,
    rain = 0,
    showers = 0,
    snowfall = 0,
    windSpeed = 0
) {
    // ===== WIND EXTREME =====
    if (windSpeed >= WIND.TORNADO) return "Lốc xoáy";
    if (windSpeed >= WIND.CYCLONE) return "Bão";

    // ===== DUST & SANDSTORM =====
    if (code <= 3) {
        if (windSpeed > 40 && visibility < 1000) return "Bão cát";
        if (windSpeed > 20 && visibility < 3000) return "Bụi mù";
    }

    // ===== CLEAR =====
    if (code === 0) {
        if (isDay) {
            return cloudCover < 10 ? "Trời nắng trong" : "Hầu như quang đãng";
        }
        return cloudCover < 10 ? "Trời quang" : "Hầu như quang đãng";
    }

    // ===== CLOUDS =====
    if (code === 1) {
        return "Hầu như quang đãng";
    }

    if (code === 2) {
        return cloudCover < 50 ? "Có mây rải rác" : "Phần lớn nhiều mây";
    }

    if (code === 3) {
        return cloudCover >= 95 ? "Trời âm u" : "Nhiều mây";
    }

    // ===== FOG =====
    if (FOG_CODES.has(code)) {
        if (visibility < 500) return "Sương mù dày đặc";
        if (visibility < 1000) return "Sương mù";
        if (visibility < 2500) return "Sương ướt dày";
        if (visibility < 5000) return "Sương mù vừa";
        return "Sương mù nhẹ";
    }

    // ===== DRIZZLE =====
    if (DRIZZLE_CODES.has(code)) {
        if (code === 51) return "Mưa phùn nhẹ";
        if (code === 53) return "Mưa phùn";
        return "Mưa phùn dày";
    }

    // ===== FREEZING DRIZZLE =====
    if (FREEZING_DRIZZLE_CODES.has(code)) {
        return code === 56 ? "Mưa phùn đóng băng nhẹ" : "Mưa phùn đóng băng";
    }

    // ===== RAIN =====
    if (RAIN_CODES.has(code)) {
        if (rain < 1) return "Mưa rải rác";
        if (rain < 3) return "Mưa vừa";
        if (rain < 10) return "Mưa";
        if (rain < 20) return "Mưa lớn";
        return "Mưa rất lớn";
    }

    // ===== FREEZING RAIN =====
    if (FREEZING_RAIN_CODES.has(code)) {
        return code === 66 ? "Mưa đóng băng nhẹ" : "Mưa đóng băng lớn";
    }

    // ===== SNOW =====
    if (SNOW_CODES.has(code)) {
        if (snowfall < 0.5) return "Tuyết rơi nhẹ";
        if (snowfall < 2) return "Tuyết rơi";
        if (snowfall < 5) return "Tuyết rơi dày";
        return "Bão tuyết";
    }

    // ===== SHOWERS =====
    if (SHOWER_CODES.has(code)) {
        if (showers < 1) return "Mưa rào nhẹ";
        if (showers < 5) return "Mưa rào";
        if (showers < 15) return "Mưa rào lớn";
        return "Mưa rào xối xả";
    }

    // ===== SNOW SHOWERS =====
    if (SNOW_SHOWER_CODES.has(code)) {
        return code === 85 ? "Tuyết rào nhẹ" : "Tuyết rào lớn";
    }

    // ===== THUNDERSTORM =====
    if (THUNDER_CODES.has(code)) {
        if (code === 95) return "Dông nhẹ";
        if (code === 96) return "Dông có sấm sét";
        return "Dông mạnh kèm mưa đá";
    }

    return "Không xác định";
}

// ===============================
// 3. MAIN ICON FUNCTION
// ===============================

function getWeatherIcon(
    code,
    isDay,
    cloudCover = 0,
    visibility = 10000,
    rain = 0,
    showers = 0,
    snowfall = 0,
    windSpeed = 0
) {

    const p = { isDay, cloudCover, visibility, rain, showers, snowfall, windSpeed };

    // ===== WIND EXTREME =====
    if (windSpeed >= WIND.TORNADO)
        return 'assets/icons/tornado.svg';

    if (windSpeed >= WIND.CYCLONE)
        return 'assets/icons/cyclone.svg';


    // ===== DUST & SANDSTORM =====
    // Chỉ xét nếu trời không có mưa/tuyết (mã từ 0 đến 3)
    if (code <= 3) {
        // Gió rất mạnh (ví dụ > 40km/h) và tầm nhìn rất thấp (< 1000m) -> Bão cát
        if (windSpeed > 40 && visibility < 1000) {
            return 'assets/icons/sandstorm.svg';
        }
        
        // Gió mạnh vừa (ví dụ > 20km/h) và tầm nhìn mờ (< 3000m) -> Có bụi
        if (windSpeed > 20 && visibility < 3000) {
            return 'assets/icons/dust.svg';
        }
    }
    
    // ===== CLEAR =====
    if (code === 0) {
        if (isDay) {
            return cloudCover < 10
                ? 'assets/icons/sunny.svg'
                : 'assets/icons/mostly-sunny.svg';
        }

        return cloudCover < 10
            ? 'assets/icons/clear.svg'
            : 'assets/icons/mostly-clear.svg';
    }

    // ===== CLOUDS =====
    if (code === 1) {
        return isDay
            ? 'assets/icons/mostly-sunny.svg'
            : 'assets/icons/mostly-clear.svg';
    }

    if (code === 2) {
        if (cloudCover < 50) {
            return isDay
                ? 'assets/icons/partly-cloudy-day.svg'
                : 'assets/icons/partly-cloudy-night.svg';
        }

        return isDay
            ? 'assets/icons/mostly-cloudy-day.svg'
            : 'assets/icons/mostly-cloudy-night.svg';
    }

    if (code === 3) {
        return cloudCover >= 95
            ? 'assets/icons/overcast.svg'
            : 'assets/icons/cloudy.svg';
    }

    // ===== FOG =====
    if (FOG_CODES.has(code)) {
        if (visibility < 500) return 'assets/icons/dense-fog.svg';
        if (visibility < 1000) return 'assets/icons/fog.svg';
        if (visibility < 2500) return 'assets/icons/mist-heavy.svg';
        if (visibility < 5000) return 'assets/icons/mist-medium.svg';
        return 'assets/icons/mist-light.svg';
    }

    // ===== DRIZZLE =====
    if (DRIZZLE_CODES.has(code)) {
        if (code === 51) return 'assets/icons/light-drizzle.svg';
        if (code === 53) return 'assets/icons/drizzle.svg';
        return 'assets/icons/heavy-drizzle.svg';
    }

    // ===== FREEZING DRIZZLE =====
    if (FREEZING_DRIZZLE_CODES.has(code)) {
        return code === 56
            ? 'assets/icons/sleet.svg'
            : 'assets/icons/sleet-rain.svg';
    }

    // ===== RAIN =====
    if (RAIN_CODES.has(code)) {

        if (rain < 1) {
            return isDay
                ? 'assets/icons/light-rain-day.svg'
                : 'assets/icons/light-rain-night.svg';
        }

        if (rain < 3) return 'assets/icons/medium-rain.svg';
        if (rain < 10) return 'assets/icons/rain.svg';
        if (rain < 20) return 'assets/icons/heavy-rain.svg';

        return 'assets/icons/very-heavy-rain.svg';
    }

    // ===== FREEZING RAIN =====
    if (FREEZING_RAIN_CODES.has(code)) {
        return code === 66
            ? 'assets/icons/sleet-rain.svg'
            : 'assets/icons/mixed-rain-snow.svg';
    }

    // ===== SNOW =====
    if (SNOW_CODES.has(code)) {
        if (snowfall < 0.5) return 'assets/icons/light-snow.svg';
        if (snowfall < 2) return 'assets/icons/snow.svg';
        if (snowfall < 5) return 'assets/icons/heavy-snow.svg';
        return 'assets/icons/snowstorm.svg';
    }

    // ===== SHOWERS =====
    if (SHOWER_CODES.has(code)) {
        if (showers < 1) return 'assets/icons/light-shower.svg';
        if (showers < 5) return 'assets/icons/shower.svg';
        if (showers < 15) return 'assets/icons/heavy-shower.svg';
        return 'assets/icons/very-heavy-shower.svg';
    }

    // ===== SNOW SHOWERS =====
    if (SNOW_SHOWER_CODES.has(code)) {
        return isDay
            ? 'assets/icons/sunny-snow.svg'
            : 'assets/icons/night-snow.svg';
    }

    // ===== THUNDERSTORM =====
    if (THUNDER_CODES.has(code)) {
        if (code === 95) return 'assets/icons/light-thunderstorm.svg';
        if (code === 96) return 'assets/icons/thunderstorm.svg';
        return 'assets/icons/heavy-thunderstorm.svg';
    }

    return 'assets/icons/unknown.svg';
}

function updateHourly(data) {

    const hourlyCont =
        document.getElementById('hourly-container');

    hourlyCont.innerHTML = '';

    const now = new Date();
    let startIndex = data.hourly.time.findIndex(time => new Date(time) >= now);

    if (startIndex === -1) {
        startIndex = 0;
    }
    // Hiển thị 8 giờ tiếp theo

    for (
        let i = startIndex;
        i < startIndex + 24 &&
        i < data.hourly.time.length;
        i++
    ) {

        const time = new Date(data.hourly.time[i]);

        const timeString =
            time.toLocaleTimeString(
                'vi-VN',
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            );

        const temp =
            Math.round(
                data.hourly.temperature_2m[i]
            );

        const weatherCode =
            data.hourly.weather_code[i];

        const cloudCover =
            data.hourly.cloud_cover[i];

        const visibility =
            data.hourly.visibility[i];

        const rain =
            data.hourly.rain[i];

        const showers =
            data.hourly.showers[i];

        const snowfall =
            data.hourly.snowfall[i];

        const windSpeed =
            data.hourly.wind_speed_10m?.[i] || 0;
        
        const isDayTime = data.hourly.is_day[i] === 1;
        
        hourlyCont.innerHTML += `
            <div class="hourly-item">

                <small>${timeString}</small>

                <img
                    src="${getWeatherIcon(
                        weatherCode,
                        isDayTime,
                        cloudCover,
                        visibility,
                        rain,
                        showers,
                        snowfall,
                        windSpeed
                    )}"
                    width="40"
                >

                <p class="mb-0 fw-bold">
                    ${temp}°
                </p>

            </div>
        `;
    }
}

function updateDaily(data) {

    const dailyCont =
        document.getElementById('daily-container');

    dailyCont.innerHTML = '';

    for (
        let i = 0;
        i < data.daily.time.length;
        i++
    ) {

        const date =
            new Date(
                data.daily.time[i]
            );

        const dayName =
            date.toLocaleDateString(
                'vi-VN',
                {
                    weekday: 'short'
                }
            );

        const maxTemp =
            Math.round(
                data.daily.temperature_2m_max[i]
            );

        const minTemp =
            Math.round(
                data.daily.temperature_2m_min[i]
            );

        const weatherCode =
            data.daily.weather_code[i];

        dailyCont.innerHTML += `
            <div class="daily-item">

                <span>
                    ${dayName}
                </span>

            <img
                src="${getWeatherIcon(
                    weatherCode,
                    true
                )}"
                width="35"
            >

                <span>
                    ${maxTemp}° / ${minTemp}°
                </span>

            </div>
        `;
    }
}
async function getWeatherByCoords(lat, lon) {

    const loadingOverlay =
        document.getElementById('loading-overlay');

    if (loadingOverlay)
        loadingOverlay.style.display = 'flex';

    try {

        // Forecast

        const weatherResponse =
            await fetch(
                `https://api.open-meteo.com/v1/forecast` +
                `?latitude=${lat}` +
                `&longitude=${lon}` +
                `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,is_day,weather_code,cloud_cover,visibility` +
                `&hourly=temperature_2m,weather_code,is_day,cloud_cover,visibility,rain,showers,snowfall,wind_speed_10m` +
                `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
                `&forecast_days=7` +
                `&timezone=auto`
            );

        if (!weatherResponse.ok) {
            throw new Error('Không thể lấy dữ liệu thời tiết');
        }

        const weatherData =
            await weatherResponse.json();

        // AQI

        const aqiResponse =
            await fetch(
                `https://air-quality-api.open-meteo.com/v1/air-quality` +
                `?latitude=${lat}` +
                `&longitude=${lon}` +
                `&current=us_aqi`
            );


        const aqiData =
            await getAQI(
                lat,
                lon
            );

        weatherData.airQuality =
            aqiData.current;
        // Reverse Geocoding
        // Lấy tên địa điểm từ tọa độ

        let cityName = 'Vị trí hiện tại';

        try {

            const geoResponse =
                await fetch(
                    `https://geocoding-api.open-meteo.com/v1/reverse` +
                    `?latitude=${lat}` +
                    `&longitude=${lon}` +
                    `&language=vi`
                );

            const geoData =
                await geoResponse.json();

            if (
                geoData.results &&
                geoData.results.length > 0
            ) {
                cityName =
                    geoData.results[0].name;
            }

        } catch (e) {

            console.warn(
                'Không lấy được tên địa điểm'
            );

        }

        updateUI(
            weatherData,
            cityName
        );

    }
    catch (error) {

        console.error(error);

        alert(
            'Không thể lấy dữ liệu thời tiết.'
        );
    }
    finally {

        if (loadingOverlay)
            loadingOverlay.style.display =
                'none';
    }
}
document.getElementById('btn-geo').onclick = () => {

    navigator.geolocation.getCurrentPosition(

        pos => {

            const latitude =
                pos.coords.latitude;

            const longitude =
                pos.coords.longitude;

            getWeatherByCoords(
                latitude,
                longitude
            );
        },

        () => {

            alert(
                'Không thể lấy vị trí hiện tại. Vui lòng cấp quyền truy cập vị trí.'
            );
        }
    );
};


document.getElementById('btn-search')
.addEventListener('click', () => {

    const location =
        document.getElementById('location-input')
        .value.trim();

    if (location) {
        getWeatherData(location);
    }
});

const locationInput =
    document.getElementById('location-input');

document.getElementById('btn-search')
.addEventListener('click', () => {

    const location =
        locationInput.value.trim();

    if (location) {
        getWeatherData(location);
    }
});

const suggestionsBox =
    document.getElementById('search-suggestions');

async function searchLocations(keyword) {

    if (keyword.length < 2) {

        suggestionsBox.style.display = 'none';
        return;
    }

    try {

        const response =
            await fetch(
                `https://geocoding-api.open-meteo.com/v1/search` +
                `?name=${encodeURIComponent(keyword)}` +
                `&count=10` +
                `&language=vi` +
                `&format=json`
            );

        const data =
            await response.json();

        showSuggestions(
            data.results || []
        );
    }
    catch (error) {

        console.error(error);

        suggestionsBox.style.display =
            'none';
    }
}
function showSuggestions(results) {

    suggestionsBox.innerHTML = '';

    if (results.length === 0) {

        suggestionsBox.style.display =
            'none';

        return;
    }

    results.forEach(location => {

        const item =
            document.createElement('div');

        item.className =
            'suggestion-item';

        item.innerText =
            `${location.name}${
                location.admin1
                    ? ', ' + location.admin1
                    : ''
            }`;

        item.onclick = () => {

            locationInput.value =
                item.innerText;

            suggestionsBox.style.display =
                'none';

            getWeatherData(
                location.name
            );
        };

        suggestionsBox.appendChild(item);
    });

    suggestionsBox.style.display =
        'block';
}

let searchTimeout;

locationInput.addEventListener(
    'input',
    () => {

        clearTimeout(
            searchTimeout
        );

        searchTimeout =
            setTimeout(() => {

                searchLocations(
                    locationInput.value.trim()
                );

            }, 500);
    }
);

locationInput.addEventListener('keydown', e => {

    if (e.key === 'Enter') {

        const location =
            locationInput.value.trim();

        if (location) {
            getWeatherData(location);
        }
    }
});
window.onload = () => {

    getWeatherData(
        'Hồ Chí Minh'
    );

};

// Mở bảng thông báo khi click "Thông tin nhóm"
document.addEventListener("DOMContentLoaded", function () {
    const openModalLink = document.getElementById("view-group-info");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const modalOverlay = document.getElementById("group-modal");

    // 1. Mở bảng thông báo khi click "Thông tin nhóm"
    if (openModalLink) {
        openModalLink.addEventListener("click", function (e) {
            e.preventDefault(); // Ngăn trang bị cuộn lên đầu
            modalOverlay.classList.remove("hidden");
        });
    }

    // 2. Đóng bảng khi click nút X
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", function () {
            modalOverlay.classList.add("hidden");
        });
    }

    // 3. Đóng bảng khi click vào vùng nền đen bên ngoài tấm card
    if (modalOverlay) {
        modalOverlay.addEventListener("click", function (e) {
            // Nếu click chính xác vào lớp phủ overlay chứ không phải click vào trong card
            if (e.target === modalOverlay) {
                modalOverlay.classList.add("hidden");
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    // ---- QUẢN LÝ MODAL THÔNG TIN NHÓM ----
    const openGroupBtn = document.getElementById("view-group-info");
    const closeGroupBtn = document.getElementById("close-modal-btn");
    const groupModal = document.getElementById("group-modal");

    if (openGroupBtn && groupModal) {
        openGroupBtn.addEventListener("click", function (e) {
            e.preventDefault(); // Chặn hành vi chuyển hướng mặc định
            groupModal.classList.remove("hidden");
        });
    }
    if (closeGroupBtn && groupModal) {
        closeGroupBtn.addEventListener("click", function () {
            groupModal.classList.add("hidden");
        });
    }

    // ---- QUẢN LÝ MODAL OPEN-METEO ----
    const openApiBtn = document.getElementById("view-api-info");
    const closeApiBtn = document.getElementById("close-api-modal-btn");
    const apiModal = document.getElementById("api-modal");

    if (openApiBtn && apiModal) {
        openApiBtn.addEventListener("click", function (e) {
            e.preventDefault(); // Chặn việc nhảy link thẳng sang tab mới khi chưa xem thông tin
            apiModal.classList.remove("hidden");
        });
    }
    if (closeApiBtn && apiModal) {
        closeApiBtn.addEventListener("click", function () {
            apiModal.classList.add("hidden");
        });
    }

    // ---- ĐÓNG MODAL KHI BẤM RA NGOÀI VÙNG TRỐNG ----
    window.addEventListener("click", function (e) {
        if (e.target === groupModal) {
            groupModal.classList.add("hidden");
        }
        if (e.target === apiModal) {
            apiModal.classList.add("hidden");
        }
    });
});