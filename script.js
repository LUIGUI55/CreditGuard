document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('predictionForm');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultSection = document.getElementById('resultSection');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultDescription = document.getElementById('resultDescription');
    const probValue = document.getElementById('probValue');
    const progressFill = document.getElementById('progressFill');

    // New Buttons
    const autoBtn = document.getElementById('autoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const shutdownBtn = document.getElementById('shutdownBtn');
    const themeToggle = document.getElementById('themeToggle');
    const themeText = document.getElementById('themeText');

    // Theme Switcher Logic
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('selected-theme', theme);
        
        if (theme === 'dark') {
            themeText.textContent = 'Modo Claro';
        } else {
            themeText.textContent = 'Modo Obscuro';
        }
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('selected-theme') || 'light';
    setTheme(savedTheme);

    // Shutdown API Logic
    shutdownBtn.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que quieres apagar el servidor API?')) {
            try {
                const response = await fetch('http://localhost:8000/shutdown', { method: 'POST' });
                if (response.ok) {
                    alert('El servidor se está apagando. Ya puedes cerrar esta pestaña.');
                    shutdownBtn.textContent = 'Servidor Apagado';
                    shutdownBtn.disabled = true;
                }
            } catch (error) {
                console.error('Error al apagar el servidor:', error);
                alert('No se pudo contactar con el servidor. Es posible que ya esté apagado.');
            }
        }
    });

    // Clear Form Logic
    clearBtn.addEventListener('click', () => {
        form.reset();
        resultSection.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Auto-Generate Logic
    autoBtn.addEventListener('click', () => {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            const id = input.id;
            
            if (id === 'LIMIT_BAL') {
                input.value = Math.floor(Math.random() * (500000 - 10000) + 10000);
            } else if (id === 'SEX') {
                input.value = Math.floor(Math.random() * 2) + 1;
            } else if (id === 'EDUCATION') {
                input.value = Math.floor(Math.random() * 4) + 1;
            } else if (id === 'MARRIAGE') {
                input.value = Math.floor(Math.random() * 3) + 1;
            } else if (id === 'AGE') {
                input.value = Math.floor(Math.random() * (70 - 21) + 21);
            } else if (id.startsWith('PAY_0') || id.startsWith('PAY_2') || id.startsWith('PAY_3') || id.startsWith('PAY_4') || id.startsWith('PAY_5') || id.startsWith('PAY_6')) {
                input.value = Math.floor(Math.random() * 3) - 1; // Most likely -1, 0, 1
            } else if (id.startsWith('BILL_AMT')) {
                input.value = Math.floor(Math.random() * 50000);
            } else if (id.startsWith('PAY_AMT')) {
                input.value = Math.floor(Math.random() * 10000);
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        calculateBtn.textContent = 'Analizando...';
        calculateBtn.disabled = true;

        // Collect form data
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = parseFloat(value);
        });

        try {
            // Call the FastAPI endpoint
            const response = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Servidor no disponible o error en la petición');
            }

            const result = await response.json();
            displayResult(result);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con la API. Asegúrate de que el servidor FastAPI esté corriendo.');
        } finally {
            calculateBtn.textContent = 'CALCULAR RIESGO';
            calculateBtn.disabled = false;
        }
    });

    function displayResult(result) {
        resultSection.classList.remove('hidden');
        resultSection.style.opacity = '1';
        
        const isDefault = result.default_prediction === 1;
        const probability = (result.probability * 100).toFixed(2);

        if (isDefault) {
            resultSection.className = 'glass-card result-section danger-result';
            resultIcon.innerHTML = '⚠️';
            resultIcon.style.background = 'rgba(239, 68, 68, 0.2)';
            resultTitle.textContent = 'Alto Riesgo de Incumplimiento';
            resultDescription.textContent = 'El modelo predice que es probable que el cliente no realice el pago el próximo mes. Se recomienda precaución.';
        } else {
            resultSection.className = 'glass-card result-section safe-result';
            resultIcon.innerHTML = '✅';
            resultIcon.style.background = 'rgba(16, 185, 129, 0.2)';
            resultTitle.textContent = 'Bajo Riesgo de Incumplimiento';
            resultDescription.textContent = 'El historial del cliente sugiere un comportamiento de pago estable. Es probable que cumpla con sus compromisos.';
        }

        probValue.textContent = `${probability}%`;
        progressFill.style.width = `${probability}%`;
        
        // Color transition for the progress bar
        if (probability > 70) {
            progressFill.style.background = 'var(--danger)';
        } else if (probability > 40) {
            progressFill.style.background = '#f59e0b'; // Amber
        } else {
            progressFill.style.background = 'var(--safe)';
        }

        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }
});
