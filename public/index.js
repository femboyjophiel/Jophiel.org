
document.querySelector('#arrow svg').addEventListener('click', () => {
  const start = performance.now();
  !function step() {
    const progress = (performance.now() - start) / 200;
    const amount = (p => --p * p * p + 1)(progress);
    scrollTo({ top: (innerWidth > 880 ? .3 : .8) * innerHeight * amount });
    if (progress < 1) requestAnimationFrame(step);
  }();
});
(window.setScroll = () => document.body.style.setProperty('--scroll', scrollY / innerHeight))();
addEventListener('scroll', setScroll);
addEventListener('resize', setScroll);

const background = document.querySelector('#background');
addEventListener('mousemove', ({ clientX, clientY }) => {
  background.style.setProperty('--tx', `${20 * (clientX - innerWidth / 2) / innerWidth}px`);
  background.style.setProperty('--ty', `${20 * (clientY - innerHeight / 2) / innerHeight}px`);
});
document.addEventListener('mouseleave', () => {
  background.removeAttribute('style');
  background.style.transition = 'transform .1s linear';
  setTimeout(() => background.style.transition = '', 100);
});
document.addEventListener('mouseenter', () => {
  background.style.transition = 'transform .1s linear';
  setTimeout(() => background.style.transition = '', 100);
});
addEventListener('touchstart', () => background.classList.add('touch-device'), { once: true });

const main = document.querySelector('main');
(window.setSquareSizeAndGap = () => {
  const columns = getComputedStyle(main).gridTemplateColumns.split(' ').length;
  const gap = parseInt(getComputedStyle(main).columnGap);
  const squareSize = (main.offsetWidth - gap * (columns - 1)) / columns;
  main.style.setProperty('--square-size', `${squareSize}px`);
  main.style.setProperty('--gap', `${gap}px`);
})();
addEventListener('resize', setSquareSizeAndGap);

const visit = new Date(new Date().setSeconds(0, 0)).getTime();
const map = new Map();
!function setClock() {
  const date = new Date();
  const time = date.getTime();
  const { year, month, day, hour, minute, second } = (() => {
    const obj = {};
    new Intl.DateTimeFormat([], {
      timeZone: 'America/New_York', // Change to America/New_York for EST
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short', // Include time zone abbreviation
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }).formatToParts(new Date()).forEach(({ type, value }) => obj[type] = parseInt(value));
    return obj;
  })();
  const hourOff = -date.getTimezoneOffset() / 60;
  const minuteOff = new Date(time - time % 1000 - hourOff * 60 * 60 * 1000);
  const tzOff = (new Date(year, month - 1, day, hour, minute, second) - minuteOff) / 1000 / 60 / 60;
  const tzDiff = tzOff - hourOff;
  update('#hour-hand', `rotate(${hour % 12 / 12 * 360 + minute / 60 * 30 + second / 60 / 60 * 30}deg)`);
  update('#minute-hand', `rotate(${minute / 60 * 360 + second / 60 * 6}deg)`);
  update('#second-hand', `rotate(${360 * Math.floor((time - visit) / 60 / 1000) + second / 60 * 360}deg)`);
  update('#date', new Date(time + tzDiff * 60 * 60 * 1000).toLocaleDateString());
  update('#hour', hour.toString().padStart(2, '0'));
  update('#minute', minute.toString().padStart(2, '0'));
  update('#second', second.toString().padStart(2, '0'));
  update('#timezone-diff', tzDiff === 0 ? 'same time' : (tzDiff > 0 ? `${format(tzDiff)} ahead` : `${format(-tzDiff)} behind`));
  update('#utc-offset', ` / UTC ${(tzOff >= 0 ? '+' : '')}${Math.floor(tzOff)}:${(tzOff % 1 * 60).toString().padStart(2, '0')}`);
  setRpcTimestamp(map.get('timestamp'));
  setTimeout(setClock, 1000 - time % 1000);
  function format(tzDiff) {
    if (tzDiff < 0) return `-${format(-tzDiff)}`;
    const minute = tzDiff % 1 * 60;
    tzDiff = Math.floor(tzDiff);
    return minute ? `${tzDiff}h ${minute}m` : `${tzDiff}h`;
  }
}();


function update(selector, value = '') {
  if (Array.isArray(selector)) return selector.forEach(s => update(s, value));
  if (map.get(selector) === value) return;
  const e = document.querySelector(selector);
  if (value.startsWith('rotate')) e.style.transform = value;
  else if (value.match(/^#[a-f0-9]+$/)) e.style.backgroundColor = value;
  else if (value.startsWith('--image')) e.style.setProperty(value.split(':')[0], value.split(' ')[1]);
  else if (value === '' && (['#big', '#small'].includes(selector))) e.removeAttribute('style');
  else e.textContent = value;
  map.set(selector, value);
}
/*
!async function() {
  const data = await fetch('/functions/repo.js').then(r => r.json());
  document.querySelectorAll('.star span').forEach((repo, i) => repo.textContent = data[i].star);
  document.querySelectorAll('.fork span').forEach((repo, i) => repo.textContent = data[i].fork);
}();*/

!function lanyard() {
  const ActivityType = ['Playing', 'Streaming to', 'Listening to', 'Watching', 'Custom status', 'Competing in'];
  const StatusColor = { online: '#4b8', idle: '#fa1', dnd: '#f44', offline: '#778' };
  const ws = new WebSocket('wss://api.lanyard.rest/socket');
  ws.addEventListener('open', () => ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: '563848987636006934' } })));
  ws.addEventListener('error', () => ws.close());
  ws.addEventListener('close', () => setTimeout(lanyard, 1000));
  ws.addEventListener('message', async ({ data }) => {
    const { t, d } = JSON.parse(data);
    if (t !== 'INIT_STATE' && t !== 'PRESENCE_UPDATE') return;
    update('#name', d.discord_user.display_name);
    update('#dot', StatusColor[d.discord_status]);
    const activities = d.activities.filter(a => a.type !== 3 && a.type !== 4);
    if (!activities.length) {
      update('#status', d.discord_status);
      update(['#big', '#small', '#activity', '#details', '#state']);
      return setRpcTimestamp();
    }
    const a = activities[0];
    update('#big', !a.assets?.large_image ? '' : a.assets.large_image.startsWith('mp:')
      ? `--image: url(https://media.discordapp.net/${a.assets.large_image.slice(3)}?width=96&height=96)`
      : a.assets.large_image.startsWith('spotify:')
        ? `--image: url(https://i.scdn.co/image/${a.assets.large_image.slice(8)})`
        : `--image: url(https://cdn.discordapp.com/app-assets/${a.application_id}/${a.assets.large_image}.png?size=96)`);
    update('#small', !a.assets?.small_image ? '' : a.assets.small_image.startsWith('mp:')
      ? `--image: url(https://media.discordapp.net/${a.assets.small_image.slice(3)}?width=40&height=40)`
      : `--image: url(https://cdn.discordapp.com/app-assets/${a.application_id}/${a.assets.small_image}.png?size=40)`);
    update('#status', ActivityType[a.type]);
    update('#activity', a.name);
    update('#details', a.details);
    update('#state', a.state);
    const timestamp = a.timestamps?.end ? a.timestamps.end : a.timestamps?.start;
    if (map.get('timestamp') !== timestamp) setRpcTimestamp(map.set('timestamp', timestamp).get('timestamp'));
  });
}();

function setRpcTimestamp(timestamp) {
  if (!timestamp) {
    update('#timestamp');
    return map.delete('timestamp');
  }
  const diff = Math.abs(timestamp - Date.now());
  const hour = Math.floor(diff / 1000 / 60 / 60);
  const minute = Math.floor(diff / 1000 / 60) % 60;
  const second = Math.floor(diff / 1000) % 60;
  const format = (n) => n.toString().padStart(2, '0');
  update('#timestamp', `${hour ? `${format(hour)}:` : ''}${format(minute)}:${format(second)} ${timestamp > Date.now() ? 'left' : 'elapsed'}`);
}

function updateStats() {
  // Fetch data from stats.json
  fetch('stats.json')
      .then(response => response.json())
      .then(data => {
          // Update Points
          document.getElementById('codeCampPoints').textContent = data.points_data;

          // Update Current Streak
          document.getElementById('codeCampCurrentStreak').textContent = data.streak_data[1] + " days";

          // Update Longest Streak
          document.getElementById('codeCampLongestStreak').textContent = data.streak_data[0] + " days";
      })
      .catch(error => {
          console.error('Error:', error);
      });
}
      const audio = document.getElementById("music");
              const playPauseButton = document.querySelector(".play-pause-button");
              const volumeSlider = document.querySelector(".volume-slider");
              const timeDisplay = document.querySelector(".time-display");

              // Update the time display
              function updateTimes() {
                const currentTime = formatTime(audio.currentTime);
                const duration = formatTime(audio.duration);
                timeDisplay.textContent = currentTime + " / " + duration;
              }

              // Format time in MM:SS
              function formatTime(time) {
                const minutes = Math.floor(time / 60);
                const seconds = Math.floor(time % 60);
                return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
              }

              // Toggle play/pause
              playPauseButton.addEventListener("click", () => {
                if (audio.paused) {
                  updateTimes();
                  audio.play();
                  playPauseButton.textContent = "❚❚";
                } else {
                  audio.pause();
                  playPauseButton.textContent = "▶";
                }
              });
const sym = document.querySelector("#audioIcon")
              // Update volume on slider change
  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
    if (volumeSlider.value < 0.01) {
      sym.innerHTML = "🔇"
    } else if (volumeSlider.value < 0.3) {
      sym.innerHTML = "🔈"
    } else if (volumeSlider.value < 0.6) {
      sym.innerHTML = "🔉"
    } else {
      sym.innerHTML = "🔊"
    }
  });

              // Update time display on timeupdate
              audio.addEventListener("timeupdate", updateTimes);
// Call the updateStats function when the page loads
window.onload = updateStats;