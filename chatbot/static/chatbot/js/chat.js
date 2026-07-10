document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menuBtn');
  const chatScroll = document.getElementById('chatScroll');
  const composerInput = document.getElementById('composerInput');
  const sendBtn = document.getElementById('sendBtn');
  const clearChatBtn = document.getElementById('btn-clear-chat');
  const hcpCountFooter = document.getElementById('hcpCountFooter');

  const TERRITORIES = ['Territory-01','Territory-02','Territory-03','Territory-04','Territory-05','Territory-06','Territory-07','Territory-08','Territory-09','Territory-10','Territory-11','Territory-12'];
  const CHANNELS = ['Direct','SPP'];
  const WRITER_STATUSES = ['New Writer','Established Writer','Lapsed Writer'];
  const PATIENT_TYPES = ['New Patient','Established Patient'];

  const state = {
    channel: new Set(),
    writer_status: new Set(),
    patient_type: new Set(),
    territory: new Set(),
    threshold: 14,
  };

  function updateHCPCount() {
    const csrfToken = getCookie('csrftoken') || document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    const payload = {
      filters: {
        channel: Array.from(state.channel),
        writer_status: Array.from(state.writer_status),
        patient_type: Array.from(state.patient_type),
        territory: Array.from(state.territory),
        threshold: state.threshold
      }
    };

    fetch('/api/filter_count/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (!response.ok) throw new Error('Filter Count Request Failed.');
      return response.json();
    })
    .then(data => {
      hcpCountFooter.textContent = `${data.filtered} / ${data.total}`;
    })
    .catch(error => {
      console.error('Error updating HCP count:', error);
    });
  }

  // ---------- Filter chips ----------
  function buildChipGroup(container, values, setKey){
    container.innerHTML = '';
    values.forEach(v => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.textContent = v;
      chip.onclick = () => {
        if(state[setKey].has(v)) state[setKey].delete(v); else state[setKey].add(v);
        renderFilters();
        updateHCPCount();
      };
      container.appendChild(chip);
    });
  }

  const keyMap = {
    channelChips: 'channel',
    writerChips: 'writer_status',
    patientChips: 'patient_type',
    territoryChips: 'territory'
  };

  function renderFilters(){
    ['channelChips','writerChips','patientChips','territoryChips'].forEach(id => {
      const stateKey = keyMap[id];
      document.querySelectorAll(`#${id} .chip`).forEach(el => {
        el.classList.toggle('active', state[stateKey].has(el.textContent));
      });
    });
  }

  buildChipGroup(document.getElementById('channelChips'), CHANNELS, 'channel');
  buildChipGroup(document.getElementById('writerChips'), WRITER_STATUSES, 'writer_status');
  buildChipGroup(document.getElementById('patientChips'), PATIENT_TYPES, 'patient_type');
  buildChipGroup(document.getElementById('territoryChips'), TERRITORIES, 'territory');

  document.getElementById('territoryAllBtn').onclick = () => {
    state.territory.clear(); renderFilters(); updateHCPCount();
  };
  document.getElementById('resetFiltersBtn').onclick = () => {
    state.channel.clear(); state.writer_status.clear(); state.patient_type.clear(); state.territory.clear();
    state.threshold = 14;
    document.getElementById('thresholdSlider').value = 14;
    document.getElementById('thresholdVal').textContent = '14d';
    renderFilters();
    updateHCPCount();
  };
  document.getElementById('thresholdSlider').oninput = (e) => {
    state.threshold = Number(e.target.value);
    document.getElementById('thresholdVal').textContent = state.threshold + 'd';
  };
  document.getElementById('thresholdSlider').onchange = () => {
    updateHCPCount();
  };

  updateHCPCount();

  // ---------- Sidebar toggle ----------
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // ---------- Chat ----------
  function scrollDown(){ chatScroll.scrollTop = chatScroll.scrollHeight; }

  function escapeHTML(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function parseMarkdown(text) {
    let html = text;
    const codeBlockRegex = /```(?:[a-zA-Z]*)\n([\s\S]*?)\n```/g;
    html = html.replace(codeBlockRegex, (match, code) => `<pre><code>${escapeHTML(code)}</code></pre>`);
    html = html.replace(/`([^`]+)`/g, (match, code) => `<code>${escapeHTML(code)}</code>`);
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    const tableLines = html.split('\n');
    let inTable = false, tableHTML = '', processedLines = [];
    for (let i = 0; i < tableLines.length; i++) {
      let line = tableLines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (line.includes('-') && !inTable) continue;
        const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (!inTable) {
          inTable = true;
          tableHTML = '<table><thead><tr>';
          cells.forEach(cell => { tableHTML += `<th>${cell}</th>`; });
          tableHTML += '</tr></thead><tbody>';
        } else {
          tableHTML += '<tr>';
          cells.forEach(cell => { tableHTML += `<td>${cell}</td>`; });
          tableHTML += '</tr>';
        }
      } else {
        if (inTable) { tableHTML += '</tbody></table>'; processedLines.push(tableHTML); inTable = false; tableHTML = ''; }
        processedLines.push(tableLines[i]);
      }
    }
    if (inTable) { tableHTML += '</tbody></table>'; processedLines.push(tableHTML); }
    html = processedLines.join('\n');
    const lines = html.split('\n');
    let inList = false, listHTML = '', listProcessed = [];
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      const listMatch = line.match(/^[•\-\*]\s+(.+)$/);
      if (listMatch) {
        if (!inList) { inList = true; listHTML = '<ul>'; }
        listHTML += `<li>${listMatch[1]}</li>`;
      } else {
        if (inList) { listHTML += '</ul>'; listProcessed.push(listHTML); inList = false; listHTML = ''; }
        listProcessed.push(lines[i]);
      }
    }
    if (inList) { listHTML += '</ul>'; listProcessed.push(listHTML); }
    html = listProcessed.join('\n');
    const numLines = html.split('\n');
    let inNumList = false, numListHTML = '', numListProcessed = [];
    for (let i = 0; i < numLines.length; i++) {
      let line = numLines[i].trim();
      const numMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (numMatch) {
        if (!inNumList) { inNumList = true; numListHTML = '<ol>'; }
        numListHTML += `<li>${numMatch[2]}</li>`;
      } else {
        if (inNumList) { numListHTML += '</ol>'; numListProcessed.push(numListHTML); inNumList = false; numListHTML = ''; }
        numListProcessed.push(numLines[i]);
      }
    }
    if (inNumList) { numListHTML += '</ol>'; numListProcessed.push(numListHTML); }
    html = numListProcessed.join('\n');
    const finalBlocks = html.split('\n\n').map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<table') || block.startsWith('<pre') || block.startsWith('<ul') || block.startsWith('<ol')) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    });
    return finalBlocks.filter(b => b).join('');
  }

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  function addUserMessage(text) {
    const el = document.createElement('div');
    el.className = 'msg user';
    el.innerHTML = `<div class="avatar user">You</div><div class="bubble"><p>${escapeHTML(text)}</p></div>`;
    chatScroll.appendChild(el);
    scrollDown();
  }

  function addBotMessage(html) {
    const el = document.createElement('div');
    el.className = 'msg bot';
    el.innerHTML = `<div class="avatar bot">M</div><div class="bubble">${html}</div>`;
    chatScroll.appendChild(el);
    scrollDown();
    return el;
  }

  function addTyping() {
    const el = document.createElement('div');
    el.className = 'msg bot';
    el.id = 'typingMsg';
    el.innerHTML = `<div class="avatar bot">M</div><div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
    chatScroll.appendChild(el);
    scrollDown();
  }
  function removeTyping() {
    const el = document.getElementById('typingMsg');
    if (el) el.remove();
  }

  function suggestChipsHtml(){
    const prompts = [
      'Show active JAKAFI alerts',
      'Who is the highest priority HCP?',
      'Summarize prescription KPIs',
      'Forecast next week\'s Rx growth',
    ];
    return `<div class="chips-row">${prompts.map(p => `<div class="suggest-chip" onclick="document.getElementById('composerInput').value='${p.replace(/'/g,"\\'")}'; document.getElementById('sendBtn').click();">${p}</div>`).join('')}</div>`;
  }

  // ---------- Send message to backend ----------
  function sendMessage(text) {
    if (!text.trim()) return;
    addUserMessage(text);
    addTyping();

    const csrfToken = getCookie('csrftoken') || document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    const payload = {
      message: text,
      filters: {
        channel: Array.from(state.channel),
        writer_status: Array.from(state.writer_status),
        patient_type: Array.from(state.patient_type),
        territory: Array.from(state.territory),
        threshold: state.threshold
      }
    };

    fetch('/api/chat/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (!response.ok) throw new Error('API Request Failed.');
      return response.json();
    })
    .then(data => {
      removeTyping();

      let botFormatted = parseMarkdown(data.response);

      if (data.response && !data.response.includes("System Exception") && !data.response.includes("empty")) {
        const escapedText = text.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const escapedResp = data.response.replace(/\n/g, "\\n").replace(/'/g, "\\'").replace(/"/g, '\\"');
        botFormatted += `<button class="download-btn" onclick="downloadReport('${escapedText}', '${escapedResp}')">&#11015; Download Report (.md)</button>`;
      }

      addBotMessage(botFormatted);

      if (data.suggestions && data.suggestions.length > 0) {
        const chipsHtml = `<div class="chips-row">${data.suggestions.map(s => `<div class="suggest-chip" onclick="document.getElementById('composerInput').value='${s.replace(/'/g,"\\'")}'; document.getElementById('sendBtn').click();">${s}</div>`).join('')}</div>`;
        addBotMessage(chipsHtml);
      }
    })
    .catch(error => {
      removeTyping();
      console.error('Error:', error);
      addBotMessage(`<p style="color:var(--red)"><strong>System Exception:</strong> Failed to connect to the backend server.</p>`);
    });
  }

  // ---------- Event listeners ----------
  function submitComposer() {
    const text = composerInput.value.trim();
    if (!text) return;
    composerInput.value = '';
    composerInput.style.height = 'auto';
    sendMessage(text);
  }

  sendBtn.addEventListener('click', submitComposer);
  composerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComposer();
    }
  });
  composerInput.addEventListener('input', () => {
    composerInput.style.height = 'auto';
    composerInput.style.height = Math.min(composerInput.scrollHeight, 120) + 'px';
  });

  // Clear conversation
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      chatScroll.innerHTML = '';
      addBotMessage(`<p><b>Welcome to MOSAIC.</b> Ask me about JAKAFI alerts, prescription KPIs, or HCP details.</p>${suggestChipsHtml()}`);
    });
  }

  // ---------- Boot ----------
  const welcomeBubble = document.getElementById('welcomeBubble');
  if (welcomeBubble) {
    welcomeBubble.innerHTML = `<p><b>Welcome to MOSAIC.</b> Ask me about JAKAFI alerts, prescription KPIs, or HCP details.</p>${suggestChipsHtml()}`;
  }

  scrollDown();
});

window.downloadReport = function(query, content) {
  const cleanQuery = query || 'Report';
  const cleanContent = content || '';
  const markdown = `# Mosaic AI Report\n\n**Query:** ${cleanQuery}\n\n---\n\n${cleanContent.replace(/\\n/g, '\n')}\n\n---\n*Generated by Mosaic JAKAFI Assistant*`;
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `mosaic_report_${cleanQuery.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
