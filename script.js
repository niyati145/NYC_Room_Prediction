const form = document.getElementById('predictForm');
const predictBtn = document.getElementById('predictBtn');
const formError = document.getElementById('formError');
const resultEmpty = document.getElementById('resultEmpty');
const resultLive = document.getElementById('resultLive');
const resultLabel = document.getElementById('resultLabel');
const barsEl = document.getElementById('bars');
const resetBtn = document.getElementById('resetBtn');
const apiBaseInput = document.getElementById('apiBase');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

const ROOM_TYPES = [
  { key: 'Entire home/apt', color: 'var(--amber)' },
  { key: 'Private room', color: 'var(--violet)' },
  { key: 'Shared room', color: 'var(--shared)' },
];

function apiBase() {
  return apiBaseInput.value.trim().replace(/\/$/, '');
}

async function checkApiHealth() {
  try {
    const res = await fetch(`${apiBase()}/`, { method: 'GET' });
    if (res.ok) {
      statusDot.className = 'status__dot online';
      statusText.textContent = 'api connected';
    } else {
      throw new Error('bad status');
    }
  } catch {
    statusDot.className = 'status__dot offline';
    statusText.textContent = 'api unreachable';
  }
}

checkApiHealth();
apiBaseInput.addEventListener('change', checkApiHealth);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const data = Object.fromEntries(new FormData(form).entries());
  const payload = {
    latitude: parseFloat(data.latitude),
    longitude: parseFloat(data.longitude),
    price: parseFloat(data.price),
    minimum_nights: parseInt(data.minimum_nights, 10),
    number_of_reviews: parseInt(data.number_of_reviews, 10),
    reviews_per_month: parseFloat(data.reviews_per_month),
    calculated_host_listings_count: parseInt(data.calculated_host_listings_count, 10),
    availability_365: parseInt(data.availability_365, 10),
    neighbourhood_group: data.neighbourhood_group,
    neighbourhood: data.neighbourhood,
  };

  predictBtn.classList.add('loading');

  try {
    const res = await fetch(`${apiBase()}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail ? JSON.stringify(body.detail) : `Request failed (${res.status})`);
    }

    const result = await res.json();
    renderResult(result);
    statusDot.className = 'status__dot online';
    statusText.textContent = 'api connected';
  } catch (err) {
    formError.textContent = `Couldn't get a prediction: ${err.message}`;
    formError.hidden = false;
    statusDot.className = 'status__dot offline';
    statusText.textContent = 'api unreachable';
  } finally {
    predictBtn.classList.remove('loading');
  }
});

function renderResult({ prediction_room_type, probability }) {
  resultLabel.textContent = prediction_room_type;

  barsEl.innerHTML = ROOM_TYPES.map(({ key, color }, i) => {
    const pct = Math.round((probability[i] ?? 0) * 100);
    return `
      <div class="bar-row">
        <div class="bar-row__top">
          <span>${key}</span>
          <span class="bar-row__pct">${pct}%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" data-pct="${pct}" style="background:${color}"></div>
        </div>
      </div>`;
  }).join('');

  resultEmpty.hidden = true;
  resultLive.hidden = false;
  resultLive.classList.remove('result-live'); // restart animation
  void resultLive.offsetWidth;
  resultLive.classList.add('result-live');

  requestAnimationFrame(() => {
    barsEl.querySelectorAll('.bar-fill').forEach((el) => {
      el.style.width = `${el.dataset.pct}%`;
    });
  });
}

resetBtn.addEventListener('click', () => {
  resultLive.hidden = true;
  resultEmpty.hidden = false;
  form.reset();
  formError.hidden = true;
});
