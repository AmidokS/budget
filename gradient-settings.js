// gradient-settings.js
// Управление градиентным фоном через модальное окно

function updateGradientPreview() {
  const c1 = document.getElementById('color1').value;
  const c2 = document.getElementById('color2').value;
  const c3 = document.getElementById('color3').value;
  const c4 = document.getElementById('color4').value;
  const c5 = document.getElementById('color5').value;
  const speed = document.getElementById('gradientSpeed').value;
  const direction = document.getElementById('gradientDirection').value;
  document.getElementById('speedValue').textContent = speed;
  document.body.style.background = `linear-gradient(${direction}, ${c1}, ${c2}, ${c3}, ${c4}, ${c5}, ${c1})`;
  document.body.style.backgroundSize = '1200% 1200%';
  document.body.style.animation = `gradientBG ${speed}s ease infinite`;
}

['color1','color2','color3','color4','color5','gradientSpeed','gradientDirection'].forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('input', updateGradientPreview);
  }
});

// Открытие/закрытие модального окна
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');

if (settingsBtn && settingsModal && closeSettings) {
  settingsBtn.onclick = () => { 
    settingsModal.style.display = 'flex'; 
    // Скрыть панель кастомизации при открытии настроек градиента
    const customizePanel = document.getElementById('customizePanel');
    if (customizePanel) {
      customizePanel.style.display = 'none';
    }
  };
  
  closeSettings.onclick = () => { 
    settingsModal.style.display = 'none'; 
  };
  
  settingsModal.onclick = (e) => { 
    if (e.target === settingsModal) {
      settingsModal.style.display = 'none'; 
    }
  };
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
  updateGradientPreview();
});