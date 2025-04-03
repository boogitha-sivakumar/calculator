// Calculator state
let runningTotal = 0;
let buffer = "0";
let previousOperator = null;
let calculationHistory = [];
let memoryValue = 0;
let currentTheme = "blue"; // Default theme

// DOM elements
const screen = document.querySelector(".screen");
const historyList = document.querySelector(".history-list");
const calculatorBody = document.querySelector(".wrapper");
const themeToggle = document.getElementById("theme-toggle");
const themeSelector = document.getElementById("theme-selector");
const settingsPanel = document.getElementById("settings-panel");
const historyPanel = document.getElementById("history-panel");

// Initialize calculator
function init() {
  // Button click event listener
  document
    .querySelector(".calc-buttons")
    .addEventListener("click", function (event) {
      if (event.target.tagName === "BUTTON") {
        // Play click sound if enabled
        if (localStorage.getItem("soundEnabled") === "true") {
          playClickSound();
        }

        // Add button press animation
        animateButton(event.target);

        // Process button click
        buttonClick(event.target.innerText);
      }
    });

  // Keyboard support
  document.addEventListener("keydown", handleKeyboardInput);

  // Load settings from local storage
  loadSettings();

  // Load history from local storage
  loadHistory();

  // Set up resize handler for responsive design
  window.addEventListener("resize", handleResize);
  handleResize();

  // Theme toggle setup
  setupThemeToggle();

  // Set up settings panel
  setupSettingsPanel();

  // Set up history panel
  setupHistoryPanel();
}

// Handle button clicks
function buttonClick(value) {
  if (isNaN(parseInt(value)) && value !== ".") {
    handleSymbol(value);
  } else {
    handleNumber(value);
  }
  screen.innerText = buffer;

  // Vibration feedback on mobile if enabled
  if (localStorage.getItem("hapticEnabled") === "true" && navigator.vibrate) {
    navigator.vibrate(20);
  }
}

// Handle symbol buttons
function handleSymbol(symbol) {
  switch (symbol) {
    case "C":
      buffer = "0";
      runningTotal = 0;
      previousOperator = null;
      break;
    case "CE":
      buffer = "0";
      break;
    case "=":
      if (previousOperator === null) {
        return;
      }

      // Save calculation to history before completing
      const calculation = `${runningTotal} ${previousOperator} ${buffer}`;

      flushOperation(parseFloat(buffer));
      previousOperator = null;

      // Add to history
      addToHistory(calculation, runningTotal.toString());

      buffer = runningTotal.toString();
      runningTotal = 0;
      break;
    case "←":
      if (buffer.length === 1) {
        buffer = "0";
      } else {
        buffer = buffer.substring(0, buffer.length - 1);
      }
      break;
    case "×":
    case "÷":
    case "−":
    case "+":
    case "%":
      handleMath(symbol);
      break;
    case "M+":
      memoryValue += parseFloat(buffer);
      buffer = "0";
      break;
    case "M-":
      memoryValue -= parseFloat(buffer);
      buffer = "0";
      break;
    case "MR":
      buffer = memoryValue.toString();
      break;
    case "MC":
      memoryValue = 0;
      break;
    case "±":
      buffer = (parseFloat(buffer) * -1).toString();
      break;
    case "√":
      buffer = Math.sqrt(parseFloat(buffer)).toString();
      break;
  }
}

// Handle math operations
function handleMath(symbol) {
  if (buffer === "0") {
    return;
  }
  const floatBuffer = parseFloat(buffer);
  if (runningTotal === 0) {
    runningTotal = floatBuffer;
  } else {
    flushOperation(floatBuffer);
  }
  previousOperator = symbol;
  buffer = "0";
}

// Process operations
function flushOperation(floatBuffer) {
  if (previousOperator === "+") {
    runningTotal += floatBuffer;
  } else if (previousOperator === "−") {
    runningTotal -= floatBuffer;
  } else if (previousOperator === "÷") {
    if (floatBuffer === 0) {
      // Handle divide by zero
      buffer = "Error";
      runningTotal = 0;
      previousOperator = null;
      return;
    }
    runningTotal /= floatBuffer;
  } else if (previousOperator === "×") {
    runningTotal *= floatBuffer;
  } else if (previousOperator === "%") {
    runningTotal %= floatBuffer;
  }

  // Fix floating point precision issues
  runningTotal = parseFloat(runningTotal.toFixed(10));
}

// Handle number input
function handleNumber(numberString) {
  if (numberString === "." && buffer.includes(".")) {
    return;
  }

  if (numberString === "00") {
    if (buffer === "0") {
      return;
    } else {
      buffer += "00";
    }
  } else if (buffer === "0" && numberString !== ".") {
    buffer = numberString;
  } else {
    buffer += numberString;
  }
}

// Handle keyboard input
function handleKeyboardInput(event) {
  const key = event.key;

  // Prevent default for calculator keys to avoid page scrolling
  if (
    /^[0-9+\-*/.=%]$/.test(key) ||
    key === "Enter" ||
    key === "Escape" ||
    key === "Backspace"
  ) {
    event.preventDefault();
  }

  // Number keys
  if (/^[0-9]$/.test(key)) {
    buttonClick(key);
  }

  // Operation keys
  switch (key) {
    case "+":
      buttonClick("+");
      break;
    case "-":
      buttonClick("−");
      break;
    case "*":
      buttonClick("×");
      break;
    case "/":
      buttonClick("÷");
      break;
    case "%":
      buttonClick("%");
      break;
    case ".":
      buttonClick(".");
      break;
    case "Enter":
      buttonClick("=");
      break;
    case "Backspace":
      buttonClick("←");
      break;
    case "Escape":
      buttonClick("C");
      break;
    case "m":
      buttonClick("MR");
      break;
    case "M":
      buttonClick("M+");
      break;
    case "n":
      buttonClick("M-");
      break;
    case "c":
      buttonClick("MC");
      break;
  }
}

// History functions
function addToHistory(calculation, result) {
  const historyItem = {
    calculation: calculation,
    result: result,
    timestamp: new Date().toISOString(),
  };

  calculationHistory.unshift(historyItem); // Add to beginning of array

  // Limit history to 10 items
  if (calculationHistory.length > 10) {
    calculationHistory.pop();
  }

  // Update history display
  updateHistoryDisplay();

  // Save to localStorage
  saveHistory();
}

function updateHistoryDisplay() {
  if (!historyList) return;

  historyList.innerHTML = "";

  if (calculationHistory.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "history-item";
    emptyMessage.textContent = "No calculations yet";
    historyList.appendChild(emptyMessage);
    return;
  }

  calculationHistory.forEach((item, index) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    historyItem.setAttribute("tabindex", "0");
    historyItem.setAttribute("role", "button");
    historyItem.setAttribute(
      "aria-label",
      `Recall calculation: ${item.calculation} equals ${item.result}`
    );

    const calcSpan = document.createElement("span");
    calcSpan.className = "history-calculation";
    calcSpan.textContent = item.calculation;

    const resultSpan = document.createElement("span");
    resultSpan.className = "history-result";
    resultSpan.textContent = ` = ${item.result}`;

    historyItem.appendChild(calcSpan);
    historyItem.appendChild(resultSpan);

    // Add click event to recall result
    historyItem.addEventListener("click", () => {
      buffer = item.result;
      screen.innerText = buffer;
      closeHistoryPanel();
    });

    historyList.appendChild(historyItem);
  });
}

function saveHistory() {
  localStorage.setItem("calculatorHistory", JSON.stringify(calculationHistory));
}

function loadHistory() {
  const savedHistory = localStorage.getItem("calculatorHistory");
  if (savedHistory) {
    calculationHistory = JSON.parse(savedHistory);
    updateHistoryDisplay();
  }
}

function clearHistory() {
  calculationHistory = [];
  updateHistoryDisplay();
  saveHistory();
}

// Animation and feedback
function animateButton(button) {
  button.classList.add("calc-button-active");
  setTimeout(() => {
    button.classList.remove("calc-button-active");
  }, 100);
}

function playClickSound() {
  const clickSound = new Audio(
    "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAABPAAdXV1dXV1dXV1dXV1dXWqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYLAAAAAAAA8Cs5iSIAAAAAAAD/4zLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
  );
  clickSound.play();
}

// Settings functions
function loadSettings() {
  // Load theme preference
  const savedTheme = localStorage.getItem("calculatorTheme");
  if (savedTheme) {
    currentTheme = savedTheme;
    applyTheme(currentTheme);

    // Set theme selector to match
    if (themeSelector) {
      themeSelector.value = currentTheme;
    }
  }

  // Load dark mode preference
  const darkModeEnabled = localStorage.getItem("darkModeEnabled") === "true";
  if (darkModeEnabled) {
    document.body.classList.add("dark-mode");
    if (themeToggle) {
      themeToggle.checked = true;
    }
  }

  // Load sound preference
  const soundEnabled = localStorage.getItem("soundEnabled");
  if (soundEnabled !== null) {
    const soundToggle = document.getElementById("sound-toggle");
    if (soundToggle) {
      soundToggle.checked = soundEnabled === "true";
    }
  } else {
    // Default to true for sound if not set
    localStorage.setItem("soundEnabled", "true");
    const soundToggle = document.getElementById("sound-toggle");
    if (soundToggle) {
      soundToggle.checked = true;
    }
  }

  // Load haptic feedback preference
  const hapticEnabled = localStorage.getItem("hapticEnabled");
  if (hapticEnabled !== null) {
    const hapticToggle = document.getElementById("haptic-toggle");
    if (hapticToggle) {
      hapticToggle.checked = hapticEnabled === "true";
    }
  } else {
    // Default to true for haptic if not set
    localStorage.setItem("hapticEnabled", "true");
    const hapticToggle = document.getElementById("haptic-toggle");
    if (hapticToggle) {
      hapticToggle.checked = true;
    }
  }
}

function applyTheme(theme) {
  // Remove all theme classes
  calculatorBody.classList.remove(
    "theme-blue",
    "theme-green",
    "theme-purple",
    "theme-orange",
    "theme-high-contrast"
  );

  // Add selected theme class
  calculatorBody.classList.add(`theme-${theme}`);

  // Save to localStorage
  localStorage.setItem("calculatorTheme", theme);
  currentTheme = theme;
}

function setupThemeToggle() {
  if (!themeToggle) return;

  themeToggle.addEventListener("change", function () {
    if (this.checked) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkModeEnabled", "true");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkModeEnabled", "false");
    }
  });

  if (themeSelector) {
    themeSelector.addEventListener("change", function () {
      applyTheme(this.value);
    });
  }
}

// Panel control functions
function setupSettingsPanel() {
  const settingsBtn = document.getElementById("settings-btn");
  const closeSettingsBtn = document.getElementById("close-settings-btn");
  const soundToggle = document.getElementById("sound-toggle");
  const hapticToggle = document.getElementById("haptic-toggle");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  if (settingsBtn) {
    settingsBtn.addEventListener("click", openSettingsPanel);
  }

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener("click", closeSettingsPanel);
  }

  if (soundToggle) {
    soundToggle.addEventListener("change", function () {
      localStorage.setItem("soundEnabled", this.checked ? "true" : "false");
    });
  }

  if (hapticToggle) {
    hapticToggle.addEventListener("change", function () {
      localStorage.setItem("hapticEnabled", this.checked ? "true" : "false");
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", function () {
      clearHistory();
      alert("History cleared.");
    });
  }
}

function openSettingsPanel() {
  if (settingsPanel) {
    settingsPanel.classList.add("active");
    historyPanel.classList.remove("active"); // Close history panel if open
  }
}

function closeSettingsPanel() {
  if (settingsPanel) {
    settingsPanel.classList.remove("active");
  }
}

function setupHistoryPanel() {
  const historyBtn = document.getElementById("history-btn");
  const closeHistoryBtn = document.getElementById("close-history-btn");
  const clearHistoryPanelBtn = document.getElementById(
    "clear-history-from-panel-btn"
  );
  const clearBtn = document.getElementById("clear-btn");

  if (historyBtn) {
    historyBtn.addEventListener("click", openHistoryPanel);
  }

  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener("click", closeHistoryPanel);
  }

  if (clearHistoryPanelBtn) {
    clearHistoryPanelBtn.addEventListener("click", function () {
      clearHistory();
      alert("History cleared.");
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      buffer = "0";
      runningTotal = 0;
      previousOperator = null;
      screen.innerText = buffer;
    });
  }
}

function openHistoryPanel() {
  if (historyPanel) {
    historyPanel.classList.add("active");
    settingsPanel.classList.remove("active"); // Close settings panel if open
  }
}

function closeHistoryPanel() {
  if (historyPanel) {
    historyPanel.classList.remove("active");
  }
}

// Responsive design handler
function handleResize() {
  // Check if in landscape mode on mobile
  if (window.innerHeight < 500 && window.innerWidth > window.innerHeight) {
    calculatorBody.classList.add("landscape-mode");
  } else {
    calculatorBody.classList.remove("landscape-mode");
  }
}

// Initialize calculator when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
