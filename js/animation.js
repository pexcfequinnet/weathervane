const animationContainer = document.getElementById('weather-animation-container');

// Hàm xóa animation cũ (khi đổi thời tiết)
function clearAnimations() {
    if (animationContainer) {
        animationContainer.innerHTML = '';
    }
}

// Hàm tạo mưa
function createRain() {
    clearAnimations();
    const dropCount = 80; // Số lượng giọt mưa
    
    for (let i = 0; i < dropCount; i++) {
        let drop = document.createElement('div');
        drop.classList.add('raindrop');
        
        // Vị trí ngang ngẫu nhiên
        drop.style.left = Math.random() * 100 + 'vw';
        
        // Tốc độ rơi ngẫu nhiên (từ 0.4s đến 0.8s)
        drop.style.animationDuration = (Math.random() * 0.4 + 0.4) + 's';
        
        // Thời gian chờ ngẫu nhiên để mưa không rơi cùng lúc
        drop.style.animationDelay = Math.random() * 2 + 's';
        
        animationContainer.appendChild(drop);
    }
}

// Hàm tạo tuyết
function createSnow() {
    clearAnimations();
    const flakeCount = 50; // Số lượng bông tuyết
    
    for (let i = 0; i < flakeCount; i++) {
        let flake = document.createElement('div');
        flake.classList.add('snowflake');
        
        // Kích thước ngẫu nhiên (từ 3px đến 7px)
        let size = Math.random() * 4 + 3;
        flake.style.width = size + 'px';
        flake.style.height = size + 'px';
        
        flake.style.left = Math.random() * 100 + 'vw';
        
        // Tuyết rơi chậm hơn mưa (từ 3s đến 6s)
        flake.style.animationDuration = (Math.random() * 3 + 3) + 's';
        flake.style.animationDelay = Math.random() * 3 + 's';
        
        // Độ mờ ngẫu nhiên
        flake.style.opacity = Math.random() * 0.5 + 0.3;
        
        animationContainer.appendChild(flake);
    }
}

function createThunderstorm() {
    clearAnimations();
    
    // Giông bão thì mưa sẽ nặng hạt và rơi nhanh hơn bình thường
    const dropCount = 120; 
    for (let i = 0; i < dropCount; i++) {
        let drop = document.createElement('div');
        drop.classList.add('raindrop');
        drop.style.left = Math.random() * 100 + 'vw';
        // Mưa rơi nhanh hơn (0.2s - 0.5s)
        drop.style.animationDuration = (Math.random() * 0.3 + 0.2) + 's'; 
        drop.style.animationDelay = Math.random() * 2 + 's';
        animationContainer.appendChild(drop);
    }

    // Tạo màn chớp
    let flashDiv = document.createElement('div');
    flashDiv.classList.add('lightning-flash');
    animationContainer.appendChild(flashDiv);

    // Hàm đệ quy để chớp ngẫu nhiên
    function triggerFlash() {
        // Reset animation bằng cách gỡ class rồi gắn lại (trick nhỏ trong JS)
        flashDiv.classList.remove('flash-active');
        void flashDiv.offsetWidth; // Kích hoạt reflow
        flashDiv.classList.add('flash-active');
        
        // Hẹn giờ cho lần chớp tiếp theo ngẫu nhiên (từ 3 giây đến 8 giây)
        const nextFlashTime = Math.random() * 5000 + 3000;
        flashTimeout = setTimeout(triggerFlash, nextFlashTime);
    }
    
    // Khởi động cú chớp đầu tiên sau 1 khoảng delay ngắn
    flashTimeout = setTimeout(triggerFlash, 1500);
}

// Hàm tạo bão cát (Hạt bụi bay ngang màn hình với tốc độ chóng mặt)
function createSandstormAnimation() {
    clearAnimations();
    const particleCount = 150; // Rất nhiều bụi
    
    for (let i = 0; i < particleCount; i++) {
        let particle = document.createElement('div');
        particle.classList.add('sand-particle');
        
        // Kích thước hạt cát ngẫu nhiên
        let size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Vị trí xuất phát dọc ngẫu nhiên
        let startY = Math.random() * 100 + 'vh';
        particle.style.setProperty('--start-y', startY);
        // Bay là là xuống dưới một chút
        particle.style.setProperty('--end-y', (parseFloat(startY) + (Math.random() * 20 - 10)) + 'vh');
        
        // Tốc độ bay ngang cực nhanh (0.5s - 1.5s)
        particle.style.animationDuration = (Math.random() * 1.0 + 0.5) + 's';
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        animationContainer.appendChild(particle);
    }
}

// Hàm tạo mưa bão nghiêng rạp (Dành cho Cyclone và Tornado)
function createExtremeStormAnimation() {
    clearAnimations();
    const dropCount = 180; // Mưa xối xả
    
    for (let i = 0; i < dropCount; i++) {
        let drop = document.createElement('div');
        drop.classList.add('raindrop');
        
        drop.style.left = Math.random() * 140 - 20 + 'vw'; // Mở rộng vùng xuất phát vì mưa rơi nghiêng
        drop.style.animationDuration = (Math.random() * 0.2 + 0.2) + 's'; // Rơi siêu nhanh
        drop.style.animationDelay = Math.random() * 1 + 's';
        
        // Trick CSS trực tiếp: Làm giọt mưa dài ra và nghiêng 25 độ theo chiều gió
        drop.style.transform = 'rotate(25deg)';
        drop.style.height = '30px'; 
        drop.style.background = 'rgba(255, 255, 255, 0.6)';
        
        animationContainer.appendChild(drop);
    }
    
    // Vẫn có sấm chớp giật liên hồi
    let flashDiv = document.createElement('div');
    flashDiv.classList.add('lightning-flash');
    animationContainer.appendChild(flashDiv);

    function triggerFastFlash() {
        flashDiv.classList.remove('flash-active');
        void flashDiv.offsetWidth;
        flashDiv.classList.add('flash-active');
        // Tần suất chớp dày đặc hơn bão thường (mỗi 1.5s - 4s chớp một lần)
        flashTimeout = setTimeout(triggerFastFlash, Math.random() * 2500 + 1500);
    }
    flashTimeout = setTimeout(triggerFastFlash, 1000);
}

function triggerWeatherAnimation(weatherType) {
    if (weatherType === 'rain') {
        createRain();
    } else if (weatherType === 'snow') {
        createSnow();
    } else if (weatherType === 'thunder') {
        createThunderstorm();
    } else if (weatherType === 'sandstorm') {
        createSandstormAnimation();
    } else if (weatherType === 'extreme_storm') {
        createExtremeStormAnimation();
    } else {
        clearAnimations(); 
    }
}