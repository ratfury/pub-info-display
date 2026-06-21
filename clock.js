export function initClock(analogRoot, digitalRoot) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('class', 'analog-clock');
  svg.innerHTML = `
    <circle cx="100" cy="100" r="96" class="clock-face" />
    <line x1="100" y1="100" x2="100" y2="42" class="hand hour-hand" />
    <line x1="100" y1="100" x2="100" y2="24" class="hand minute-hand" />
    <line x1="100" y1="100" x2="100" y2="16" class="hand second-hand" />
    <circle cx="100" cy="100" r="6" class="clock-center" />
  `;
  analogRoot.appendChild(svg);

  const hourHand = svg.querySelector('.hour-hand');
  const minuteHand = svg.querySelector('.minute-hand');
  const secondHand = svg.querySelector('.second-hand');

  const tickMarks = document.createDocumentFragment();
  for (let i = 0; i < 12; i += 1) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const angle = (i * 30 * Math.PI) / 180;
    line.setAttribute('x1', String(100 + Math.sin(angle) * 78));
    line.setAttribute('y1', String(100 - Math.cos(angle) * 78));
    line.setAttribute('x2', String(100 + Math.sin(angle) * 88));
    line.setAttribute('y2', String(100 - Math.cos(angle) * 88));
    line.setAttribute('class', 'tick');
    tickMarks.appendChild(line);
  }
  svg.insertBefore(tickMarks, hourHand);

  function render() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const hourAngle = hours * 30 + minutes * 0.5;
    const minuteAngle = minutes * 6;
    const secondAngle = seconds * 6;

    hourHand.setAttribute('transform', `rotate(${hourAngle} 100 100)`);
    minuteHand.setAttribute('transform', `rotate(${minuteAngle} 100 100)`);
    secondHand.setAttribute('transform', `rotate(${secondAngle} 100 100)`);

    digitalRoot.textContent = now.toLocaleString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  render();
  setInterval(render, 1000);
}
