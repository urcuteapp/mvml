console.log("JS is running");

document.addEventListener("DOMContentLoaded", function () {

    // --- POP SOUND FUNCTION ---
  function playPop() {
    const pop = new Audio("sounds/pop.mp3"); // make sure you have sounds/pop.mp3
    pop.volume = 0.5; // adjust 0.0 - 1.0
    pop.play();
  }

  // ================= COIN SYSTEM =================
  let coins = parseInt(localStorage.getItem("coins")) || 0;
  const coinCountEl = document.getElementById("coinCount");
  coinCountEl.textContent = coins;

  // FIX: simpler formula instead of static mapping
  function getReward(minutes) {
    if (minutes < 10) return 0;
    return Math.floor((minutes - 5) / 5); // 10m=1, 15m=2, 20m=3, 25m=4...
  }

  // Function to add coins
  function addCoins(minutes) {
    const reward = getReward(minutes);
    coins += reward;
    localStorage.setItem("coins", coins);
    coinCountEl.textContent = coins;
  }

  // ================= MENU TOGGLE =================
  const menuToggle = document.getElementById('menuToggle');
  const menu = document.getElementById('menu');
  const overlay = document.getElementById('overlay');

  menuToggle.addEventListener('click', () => {
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    menu.classList.remove('active');
    overlay.classList.remove('active');
  });


  // ================= STORE FEATURE =================
  const storeToggle = document.getElementById("storeToggle");
  const storePanel = document.getElementById("storePanel");
  const storeItemsEl = document.getElementById("storeItems");

  // Moods available in store
  const moodsForSale = [
    { name: "sleepycat", img: "sleepycat.jpg", price: 10 },
    { name: "missinyoucat", img: "missinyoucat.jpg", price: 6 },
    { name: "angrycat", img: "angrycat.jpg", price: 3 },
    { name: "freakycat", img: "freakycat.jpg", price: 5 },
    { name: "tampocat", img: "tampocat.jpg", price: 4 },
    { name: "annoyeddog", img: "annoyeddog.jpg", price: 1 },
    { name: "scareddog", img: "scareddog.jpg", price: 3 },
    { name: "stresseddog", img: "stresseddog.jpg", price: 5 },
    { name: "worriedcat", img: "worriedcat.jpg", price: 2 }
  ];

  // Load unlocked moods
  let unlockedMoods = JSON.parse(localStorage.getItem("unlockedMoods")) || [];

  function updateCoins(newAmount) {
    coins = newAmount;
    localStorage.setItem("coins", coins);
    coinCountEl.textContent = coins;
    renderStore();
  }

  // Render store
  function renderStore() {
    storeItemsEl.innerHTML = "";
    moodsForSale.forEach(mood => {
      const item = document.createElement("div");
      item.classList.add("store-item");

      let buttonHTML;
      if (unlockedMoods.includes(mood.img)) {
        buttonHTML = `<button disabled>BOUGHT</button>`; // ⭐ FIX
      } else {
        buttonHTML = `<button ${coins < mood.price ? "disabled" : ""}>Buy</button>`;
      }

      item.innerHTML = `
        <img src="images/${mood.img}" alt="${mood.name}">
        <p>${mood.name}</p>
        <p>${mood.price} coins</p>
        ${buttonHTML}
      `;

      const buyBtn = item.querySelector("button");
      if (!unlockedMoods.includes(mood.img)) {
        buyBtn.addEventListener("click", () => {
          if (coins >= mood.price) {
            updateCoins(coins - mood.price);
            unlockedMoods.push(mood.img); // ⭐ FIX: save by img name
            localStorage.setItem("unlockedMoods", JSON.stringify(unlockedMoods));
            renderAnimalPicker(); // ⭐ FIX: update picker immediately
            renderStore(); // refresh store
          } else {
            alert("Not enough coins!");
          }
        });
      }

      storeItemsEl.appendChild(item);
    });
  }

  storeToggle.addEventListener("click", () => {
    storePanel.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!storePanel.contains(e.target) && e.target !== storeToggle && !storeToggle.contains(e.target)) {
      storePanel.classList.remove("active");
    }
  });

  renderStore();

  // ================= iOS FULLSCREEN HEIGHT =================
  function setVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  setVh();
  window.addEventListener('resize', setVh);


  // ================= ANIMAL PICKER =================
  const animalImage = document.getElementById("animalImage");
  const animalPicker = document.getElementById("animalPicker");

  animalPicker.classList.remove("active"); // hide initially

  animalImage.addEventListener("click", (e) => {
    e.stopPropagation();
    animalPicker.classList.toggle("active"); // toggle visibility
  });

  animalPicker.addEventListener("click", e => e.stopPropagation());

  // EVENT DELEGATION FOR ALL ANIMAL OPTIONS
  document.querySelector(".animal-options").addEventListener("click", (e) => {
    if (e.target.tagName === "IMG") {
      const moodImage = e.target.getAttribute("data-mood");
      const moodName = moodImage.replace(/\.[^/.]+$/, "");
      animalImage.src = `images/${moodImage}`;
      localStorage.setItem("currentMood", moodImage); // ⭐ keep forever

      animalPicker.classList.remove("active");
      console.log("Sending mood:", moodImage);

      fetch(`https://script.google.com/macros/s/AKfycbxlYPXUbXWiGTDh0d4cDh4ISOeQeQ3NyxQyl37ZQ6AKwq7wPoha7Al_fzQsXCT1kZFW/exec?mood=${encodeURIComponent(moodName)}`)
        .then(res => res.text())
        .then(msg => console.log("Mood sent:", msg))
        .catch(err => console.error("Failed to send mood:", err));
    }
  });

  document.addEventListener("click", function (event) {
    const isClickInside = animalPicker.contains(event.target);
    const isMainImage = event.target === animalImage;
    if (!isClickInside && !isMainImage) {
      animalPicker.classList.remove("active");
    }
  });


  // ================= CIRCULAR SLIDER + LIVE TIMER =================
  const sliderRing = document.querySelector(".slider-ring");
  const sliderFill = document.querySelector(".slider-fill");
  const timerDisplay = document.getElementById("timerDisplay");
  const sliderDot = document.createElement("div");
  sliderDot.classList.add("slider-dot");
  sliderRing.parentElement.appendChild(sliderDot);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  sliderFill.style.strokeDasharray = circumference;
  sliderFill.style.strokeDashoffset = circumference;

  let maxMinutes = 120;
  let selectedMinutes = 25;
  let isSliding = false;
  let countdownRunning = false;
  let countdownInterval = null;

  // TOTAL TIME TRACKER
  let totalTimeSeconds = 0;
  const totalTimeDisplay = document.getElementById("totalTimeDisplay");

  const allowedMinutes = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120];

  function angleToMinutes(angle) {
    let roughMinutes = Math.round((angle / 360) * maxMinutes);
    let closest = allowedMinutes.reduce((prev, curr) =>
      Math.abs(curr - roughMinutes) < Math.abs(prev - roughMinutes) ? curr : prev
    );
    return closest;
  }

  function setSlider(minutes) {
    selectedMinutes = minutes;
    const offset = circumference * (1 - minutes / maxMinutes);
    sliderFill.style.strokeDashoffset = offset;

    const angle = (minutes / maxMinutes) * 360;
    const rad = (angle - 90) * (Math.PI / 180);
    const center = sliderRing.getBoundingClientRect();
    const cx = center.width / 2;
    const cy = center.height / 2;
    const dotRadius = radius;
    sliderDot.style.left = `${cx + dotRadius * Math.cos(rad) - 10}px`;
    sliderDot.style.top = `${cy + dotRadius * Math.sin(rad) - 10}px`;

    timerDisplay.textContent = `${minutes}:00`;
  }

  function updateSlide(e) {
    if (!isSliding || countdownRunning) return;
    const rect = sliderRing.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left - rect.width / 2;
    const y = (e.clientY || e.touches[0].clientY) - rect.top - rect.height / 2;
    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    const minutes = angleToMinutes(angle);
    setSlider(minutes);
  }

  function startSlide(e) {
    e.preventDefault();
    if (countdownRunning) return;
    isSliding = true;
    window.addEventListener("pointermove", updateSlide);
    window.addEventListener("pointerup", endSlide);
  }

  function endSlide() {
    isSliding = false;
    window.removeEventListener("pointermove", updateSlide);
    window.removeEventListener("pointerup", endSlide);
  }

  sliderRing.addEventListener("pointerdown", startSlide);
  setSlider(selectedMinutes);


  // ================= POMODORO COUNTDOWN =================
  const startButton = document.getElementById("startButton");
  let preCountdownInterval = null;

  function startCountdown() {
    countdownRunning = true;
    let timeLeft = selectedMinutes * 60;

    countdownInterval = setInterval(() => {
      const percent = timeLeft / (selectedMinutes * 60);
      sliderFill.style.strokeDashoffset = circumference * (1 - percent);

      let displayMinutes = Math.floor(timeLeft / 60);
      let displaySeconds = timeLeft % 60;
      if (displaySeconds < 10) displaySeconds = '0' + displaySeconds;
      timerDisplay.textContent = `${displayMinutes}:${displaySeconds}`;

      totalTimeSeconds++;
      const totalMins = Math.floor(totalTimeSeconds / 60);
      const totalSecs = totalTimeSeconds % 60;
      totalTimeDisplay.textContent = `${totalMins}m ${totalSecs}s`;

      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        countdownRunning = false;
        startButton.textContent = "Start"; // FIX: auto reset to Start
        setSlider(selectedMinutes);        // FIX: reset slider position
        addCoins(selectedMinutes);

        alert(`Pomodoro complete! +${getReward(selectedMinutes)} coins`);
      }
      timeLeft--;
    }, 1000);
  }

  // ================= START BUTTON WITH PRE-COUNTDOWN =================
  startButton.addEventListener("click", function () {
    if (countdownRunning) {
      clearInterval(countdownInterval);
      countdownRunning = false;
      startButton.textContent = "Start";
      setSlider(selectedMinutes);
      return;
    }

    if (preCountdownInterval) {
      clearInterval(preCountdownInterval);
      preCountdownInterval = null;
      startButton.textContent = "Start";
      startButton.classList.remove("pulse");
      return;
    }

    let preCount = 5;
    startButton.textContent = preCount;
    startButton.classList.add("pulse");

    preCountdownInterval = setInterval(() => {
      preCount--;
      if (preCount > 0) {
        startButton.textContent = preCount;
      } else {
        clearInterval(preCountdownInterval);
        preCountdownInterval = null;
        startButton.classList.remove("pulse");
        startButton.textContent = "STOP";
        startCountdown();
      }
    }, 1000);
  });

  const defaultMoods = [
    { name: "Sad Cat", img: "sadcat.jpg" },
    { name: "Happy Cat", img: "happycat.jpg" },
    { name: "Tired Cat", img: "tiredcat.jpg" }
  ];

  // ⭐ FIX: merge unlocked moods properly
  function renderAnimalPicker() {
    const animalOptions = document.querySelector(".animal-options");
    animalOptions.innerHTML = "";

    const allMoods = [...defaultMoods];

    unlockedMoods.forEach(imgName => {
      if (!allMoods.some(m => m.img === imgName)) {
        allMoods.push({
          name: imgName.replace(/\.[^/.]+$/, ""),
          img: imgName
        });
      }
    });

    allMoods.forEach(mood => {
      const div = document.createElement("div");
      div.classList.add("animal-item");
      div.innerHTML = `
        <img src="images/${mood.img}" alt="${mood.name}" data-mood="${mood.img}">
        <span>${mood.name}</span>
      `;
      animalOptions.appendChild(div);
    });
  }

  renderAnimalPicker();

    // --- ADD POP SOUND TO ALL CLICKABLES ---
  document.querySelectorAll("button, .menu-btn, .shop-btn, .coin-btn, img, a").forEach(el => {
    el.addEventListener("click", () => {
      playPop();
    });
  });

});

