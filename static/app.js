/**
 * Combined Application Orchestrator
 * Integrates original Urban Issue AI APIs and Snake Game with Bayagra AI Suite
 */

// Original Municipal Triage state
const state = {
  issues: [],
  departments: [],
  categories: [],
  priorities: [],
  statuses: [],
  selectedIssueId: null
};

// ElevenLabs Speech Synthesis reference
let currentSpeechUtterance = null;

// Initialize all features on load
async function bootstrap() {
  // 1. Load original municipal services metadata and issues
  await Promise.all([loadMetadata(), loadIssues(), loadTrends()]);
  bindMunicipalForms();

  // 2. Initialize Bayagra workspace UI navigation
  initWorkspaceTabs();

  // 3. Initialize Bayagra specific components
  initChatArena();
  initTruecallerConsole();
  initPerplexitySearch();
  initCreativeStudio();
}

// -------------------------------------------------------------
// Workspace Navigation (Tab Switching)
// -------------------------------------------------------------
function initWorkspaceTabs() {
  const navButtons = document.querySelectorAll(".sidebar-nav .nav-item");
  const tabPanels = document.querySelectorAll(".workspace-main .tab-panel");
  const headerTitle = document.getElementById("header-title");

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      
      // Update sidebar active buttons
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Update visible tab panels
      tabPanels.forEach(panel => {
        panel.classList.remove("active");
        if (panel.id === `panel-${tabId}`) {
          panel.classList.add("active");
        }
      });
      
      // Update header title breadcrumb
      headerTitle.textContent = btn.querySelector("span").textContent;
    });
  });

  // Floating quick call simulation button
  document.getElementById("btn-quick-call").addEventListener("click", () => {
    triggerIncomingCallSimulation();
  });
}

// -------------------------------------------------------------
// Bayagra Feature 1: Chat Arena Handler
// -------------------------------------------------------------
function initChatArena() {
  const form = document.getElementById("chat-input-form");
  const input = document.getElementById("chat-user-input");
  const conversation = document.getElementById("chat-conversation");
  const modelButtons = document.querySelectorAll(".model-select-btn");
  const drawers = document.querySelectorAll(".chat-drawer-container .drawer-panel");
  const dropArea = document.getElementById("gemini-file-drop");

  // Toggle models
  modelButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modelButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const model = btn.dataset.model;
      bayagraState.currentModel = model;

      // Update side drawer view
      drawers.forEach(d => d.classList.remove("active"));
      
      // Gemini file drop area toggle
      if (model === 'gemini') {
        dropArea.style.display = 'block';
        document.getElementById("drawer-gemini-features").classList.add("active");
      } else if (model === 'claude') {
        dropArea.style.display = 'none';
        document.getElementById("drawer-claude-artifacts").classList.add("active");
      } else if (model === 'chatgpt') {
        dropArea.style.display = 'none';
        document.getElementById("drawer-chatgpt-features").classList.add("active");
      } else {
        dropArea.style.display = 'none';
        document.getElementById("drawer-claude-artifacts").classList.add("active");
      }

      // Add a small system notification in chat log
      appendSystemMessage(`Switched channel to **${model.toUpperCase()} Engine**.`);
    });
  });

  // Handle Form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const prompt = input.value.trim();
    if (!prompt) return;

    // Append User message
    appendChatMessage('user', '👤', prompt);
    input.value = "";

    // Trigger AI response stream
    const activeModel = bayagraState.currentModel;
    
    // Add typing bubble
    const typingBubble = appendChatMessage('ai typing', '🤖', 'Generating response...');
    const bubbleContent = typingBubble.querySelector(".bubble");

    setTimeout(() => {
      if (activeModel === 'consensus') {
        runConsensusDebate(prompt, bubbleContent, typingBubble);
      } else {
        // Individual model response
        const modelData = AI_SIM_RESPONSES[activeModel];
        const fullText = modelData.default(prompt);
        typingBubble.className = `chat-message ${activeModel}`;
        typingBubble.querySelector(".avatar").textContent = activeModel === 'claude' ? '🍁' : (activeModel === 'chatgpt' ? '❇️' : '♊');
        
        simulateStreamText(bubbleContent, fullText, () => {
          // Check for Claude artifacts in response text
          if (activeModel === 'claude') {
            extractAndRenderArtifact(fullText);
          }
        });
      }
    }, 800);
  });

  // Drag and drop mock for Gemini
  dropArea.addEventListener("click", () => {
    // Simulate uploading a file
    const files = ["invoice_details.pdf", "pothole_photo_raw.jpg", "customer_feedback.csv", "financial_sheet.xlsx"];
    const randomFile = files[Math.floor(Math.random() * files.length)];
    
    const fileList = document.getElementById("gemini-uploaded-list");
    const emptyMsg = fileList.querySelector(".empty");
    if (emptyMsg) emptyMsg.remove();
    
    const fileCard = document.createElement("div");
    fileCard.className = "card font-small";
    fileCard.style.marginTop = "6px";
    fileCard.style.borderColor = "var(--accent-gemini-start)";
    fileCard.innerHTML = `<strong>📄 ${randomFile}</strong> Size: ${(Math.random() * 5 + 1).toFixed(1)} MB | Enriched analysis ready.`;
    fileList.appendChild(fileCard);

    appendSystemMessage(`Uploaded file \`${randomFile}\` into Gemini multi-modal context.`);
  });

  // ChatGPT Voice Mode simulator trigger
  const voiceToggle = document.getElementById("btn-toggle-voice");
  const voicePulse = document.getElementById("voice-pulse");
  const voiceStatus = document.getElementById("voice-status");

  voiceToggle.addEventListener("click", () => {
    if (voicePulse.classList.contains("pulsing")) {
      voicePulse.classList.remove("pulsing");
      voiceToggle.textContent = "Start Voice Session";
      voiceStatus.textContent = "Voice Session Disconnected";
      stopRingtone();
    } else {
      voicePulse.classList.add("pulsing");
      voiceToggle.textContent = "Stop Voice Session";
      voiceStatus.textContent = "Listening... speak now";
      
      // Speak greeting
      setTimeout(() => {
        voiceStatus.textContent = "ChatGPT speaking...";
        const msg = new SpeechSynthesisUtterance(AI_SIM_RESPONSES.chatgpt.greeting);
        window.speechSynthesis.speak(msg);
        msg.onend = () => {
          voiceStatus.textContent = "Listening... speak now";
        };
      }, 1000);
    }
  });
}

function appendChatMessage(sender, avatar, text) {
  const conversation = document.getElementById("chat-conversation");
  const msg = document.createElement("div");
  msg.className = `chat-message ${sender}`;
  msg.innerHTML = `
    <div class="avatar">${avatar}</div>
    <div class="bubble">${parseSimulatedMarkdown(text)}</div>
  `;
  conversation.appendChild(msg);
  conversation.scrollTop = conversation.scrollHeight;
  return msg;
}

function appendSystemMessage(text) {
  const conversation = document.getElementById("chat-conversation");
  const msg = document.createElement("div");
  msg.className = `chat-message system`;
  msg.style.alignSelf = 'center';
  msg.style.maxWidth = '100%';
  msg.innerHTML = `
    <div class="bubble" style="background: rgba(255,255,255,0.02); text-align: center; border-radius: 99px; padding: 4px 16px; font-size: 0.8rem; color: var(--text-muted);">
      ${parseSimulatedMarkdown(text)}
    </div>
  `;
  conversation.appendChild(msg);
  conversation.scrollTop = conversation.scrollHeight;
}

function runConsensusDebate(prompt, targetBubbleContent, typingBubble) {
  // Start debate streaming
  typingBubble.remove(); // Remove initial placeholder
  
  // 1. Claude debates
  const claudeMsg = appendChatMessage('claude', '🍁', '*Claude is formulating logical thesis...*');
  const claudeBubble = claudeMsg.querySelector(".bubble");
  
  setTimeout(() => {
    const claudeResp = `### Claude's Analysis:
Based on logical decomposition of the request, my thesis suggests a modular single-tab view solves user-interface density issues. We must prioritize structural integrity.`;
    simulateStreamText(claudeBubble, claudeResp, () => {
      
      // 2. ChatGPT debates
      const gptMsg = appendChatMessage('chatgpt', '❇️', '*ChatGPT is adding creative spin...*');
      const gptBubble = gptMsg.querySelector(".bubble");
      
      setTimeout(() => {
        const gptResp = `### ChatGPT's Response:
I agree with Claude, but let's make it highly interactive! Users love sliders, bright neon glowing alerts, and fluid animation curves. We should add a Voice mode and Midjourney prompt builders to maximize retention.`;
        simulateStreamText(gptBubble, gptResp, () => {
          
          // 3. Gemini debates
          const gemMsg = appendChatMessage('gemini', '♊', '*Gemini is searching and indexing sources...*');
          const gemBubble = gemMsg.querySelector(".bubble");
          
          setTimeout(() => {
            const gemResp = `### Gemini's Synthesis:
According to Google search models, unified dashboards perform best when data sources are normalized. I advise integrating Google Sheets export cards and a multi-modal PDF upload gateway to support these recommendations.`;
            simulateStreamText(gemBubble, gemResp, () => {
              
              // 4. Synthesized consensus final bubble
              const consensusMsg = appendChatMessage('consensus', '🤖', '*Consensus Engine merging insights...*');
              const consensusBubble = consensusMsg.querySelector(".bubble");
              
              setTimeout(() => {
                const finalConsensus = `### 🤝 Bayagra Consensus Report
Claude's structural focus, ChatGPT's interactive presets, and Gemini's workspace integrations have been consolidated. 

**Definitive Solution Vector:**
- We will construct a sleek **Glassmorphic Sidebar SPA**.
- Integrate the original **Urban Triage Core** under a dedicated tab.
- Provide unified access to caller lookups, search modules, voice laboratories, and art builders.`;
                simulateStreamText(consensusBubble, finalConsensus);
              }, 1200);
              
            });
          }, 1200);
          
        });
      }, 1200);
      
    });
  }, 800);
}

function extractAndRenderArtifact(text) {
  // Regex to extract XML block starting with <!-- Artifact: visual_component -->
  const match = text.match(/<!-- Artifact: visual_component -->([\s\S]*?)<\/div>/);
  if (match) {
    const code = match[0];
    const target = document.getElementById("artifact-render-target");
    target.innerHTML = code;
    
    // Slide open drawer
    document.getElementById("chat-drawer").classList.add("active");
  }
}

// -------------------------------------------------------------
// Bayagra Feature 2: Truecaller AI Console & Simulator
// -------------------------------------------------------------
function initTruecallerConsole() {
  const form = document.getElementById("truecaller-search-form");
  const input = document.getElementById("truecaller-phone-input");
  const resultsContainer = document.getElementById("truecaller-results");
  const blockForm = document.getElementById("add-blocklist-form");
  const blockInput = document.getElementById("new-block-number");
  const blocklistUl = document.getElementById("truecaller-blocklist");

  // Phone Lookup Search
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const phoneNum = input.value.replace(/\D/g, "");
    if (!phoneNum) return;

    resultsContainer.innerHTML = '<p class="status-msg ring-anim">🔍 Querying Bayagra Caller identity databases...</p>';

    setTimeout(() => {
      // Find or generate mock profile
      let profile = bayagraState.phoneLookupDb[phoneNum];
      if (!profile) {
        // Generate random realistic user lookup
        const firstNames = ["Emily", "David", "Michael", "Sophia", "Liam", "Carlos"];
        const lastNames = ["Smith", "Rodriguez", "O'Connor", "Chen", "Patel", "Gomez"];
        const locations = ["New York, NY", "San Francisco, CA", "Chicago, IL", "London, UK", "Mumbai, India"];
        const occupations = ["Product Manager", "Financial Analyst", "Independent Contractor", "Real Estate Agent"];
        
        const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        const spam = Math.floor(Math.random() * 45); // low-med spam score
        profile = {
          name: name,
          tag: 'Identified Caller',
          location: locations[Math.random() * locations.length],
          company: occupations[Math.floor(Math.random() * occupations.length)],
          spamScore: spam,
          email: `${name.toLowerCase().replace(" ", ".")}@mailprovider.com`,
          trust: spam < 15 ? 'Trusted' : 'Verified'
        };
      }

      // Render caller card
      const trustClass = profile.trust.toLowerCase();
      const spamClass = profile.spamScore > 75 ? 'high' : 'low';
      
      resultsContainer.innerHTML = `
        <div class="caller-id-card">
          <div class="caller-main">
            <div class="caller-avatar">${profile.name[0]}</div>
            <div class="caller-name-meta">
              <h3>${escapeHtml(profile.name)}</h3>
              <p>${escapeHtml(profile.tag)}</p>
              <span class="caller-trust-pill ${trustClass}">${profile.trust}</span>
            </div>
          </div>
          <div class="caller-details-list">
            <div class="details-item"><strong>Location</strong>${escapeHtml(profile.location)}</div>
            <div class="details-item"><strong>Affiliation</strong>${escapeHtml(profile.company)}</div>
            <div class="details-item"><strong>Email</strong>${escapeHtml(profile.email)}</div>
            <div class="details-item"><strong>Status</strong>Clean / Whitelisted</div>
          </div>
          <div class="spam-meter-section">
            <div class="spam-meter-label">
              <span>Spam Threat Rating</span>
              <span class="score ${spamClass}">${profile.spamScore}%</span>
            </div>
            <div class="bar-bg">
              <div class="bar-fill ${profile.spamScore > 50 ? 'amber' : 'emerald'}" style="width: ${profile.spamScore}%"></div>
            </div>
          </div>
        </div>
      `;
    }, 1000);
  });

  // Blocklist builder
  blockForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const num = blockInput.value.trim();
    if (!num) return;

    const li = document.createElement("li");
    li.innerHTML = `🚫 ${escapeHtml(num)} - Blocked by User (Spam 100%)`;
    blocklistUl.appendChild(li);
    
    // Add to state lookup database
    const rawNum = num.replace(/\D/g, "");
    if (rawNum) {
      bayagraState.phoneLookupDb[rawNum] = {
        name: 'Blocklisted Number',
        tag: 'Telemarketer',
        location: 'Unknown',
        company: 'Unknown Sales',
        spamScore: 100,
        email: 'blocked@spam.com',
        trust: 'Dangerous'
      };
    }
    
    // Update dashboard blocked counter
    const countSpan = document.getElementById("dashboard-blocked-calls");
    countSpan.textContent = Number(countSpan.textContent) + 1;
    
    // Append to system logs
    const logConsole = document.getElementById("dashboard-logs");
    if (logConsole) {
      const logLine = document.createElement("div");
      logLine.className = "log-line warn";
      logLine.innerHTML = `<span class="timestamp">[${new Date().toLocaleTimeString()}]</span> User manually blocklisted ${escapeHtml(num)}.`;
      logConsole.appendChild(logLine);
      logConsole.scrollTop = logConsole.scrollHeight;
    }

    blockInput.value = "";
  });

  // Incoming Call modal button links
  document.getElementById("btn-answer").addEventListener("click", () => {
    answerCallSimulation();
  });
  
  document.getElementById("btn-screen").addEventListener("click", () => {
    screenCallSimulation();
  });
  
  document.getElementById("btn-decline").addEventListener("click", () => {
    declineCallSimulation();
  });
}

// -------------------------------------------------------------
// Bayagra Feature 3: Perplexity Deep Search
// -------------------------------------------------------------
function initPerplexitySearch() {
  const form = document.getElementById("perplexity-form");
  const input = document.getElementById("perplexity-query");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    runPerplexitySearch(query);
  });
}

// -------------------------------------------------------------
// Bayagra Feature 4: Creative Media Studio
// -------------------------------------------------------------
function initCreativeStudio() {
  // Midjourney Image Generator
  const form = document.getElementById("midjourney-form");
  const promptInput = document.getElementById("midjourney-prompt");
  const ratioSelect = document.getElementById("midjourney-ratio");
  const styleSelect = document.getElementById("midjourney-style");
  const renderArea = document.getElementById("midjourney-render-area");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    renderArea.innerHTML = `
      <div class="studio-empty-state">
        <p class="ring-anim">⚡ Initializing Midjourney v6 weights...</p>
        <div class="bar-bg" style="width: 200px; margin: 12px auto 0;">
          <div class="bar-fill amber" id="mj-progress-bar" style="width: 0%"></div>
        </div>
        <p id="mj-progress-text" style="font-size: 0.8rem; margin-top: 6px;">Progress: 0%</p>
      </div>
    `;

    // Progress bar counter
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15 + 5);
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        
        // Load image
        let src = '/cyberpunk_city.png';
        let desc = `Cyberpunk city render for: "${escapeHtml(prompt)}"`;
        const lower = prompt.toLowerCase();
        if (lower.includes('castle') || lower.includes('forest') || lower.includes('fantasy') || lower.includes('magic')) {
          src = '/fantasy_castle.png';
          desc = `Fantasy landscape render for: "${escapeHtml(prompt)}"`;
        }

        renderArea.innerHTML = `
          <div class="chat-generated-img" style="max-width: 100%; border: none; height: 100%; width: 100%; margin: 0;">
            <img src="${src}" alt="${desc}" class="studio-result-img blur-load" id="mj-output-img" />
            <div class="img-caption" style="position: absolute; bottom: 0; width: 100%;">${desc} (${ratioSelect.value})</div>
          </div>
        `;
        
        // Trigger blur reveal transition
        setTimeout(() => {
          const img = document.getElementById("mj-output-img");
          if (img) {
            img.classList.remove("blur-load");
            img.classList.add("sharp-reveal");
          }
        }, 100);

      } else {
        const fill = document.getElementById("mj-progress-bar");
        const text = document.getElementById("mj-progress-text");
        if (fill && text) {
          fill.style.width = `${progress}%`;
          text.textContent = `Progress: ${progress}% (resolving denoising diffusion)`;
        }
      }
    }, 300);
  });

  // ElevenLabs Voice Lab
  const ttsForm = document.getElementById("elevenlabs-form");
  const ttsText = document.getElementById("elevenlabs-text");
  const ttsVoice = document.getElementById("elevenlabs-voice");
  const ttsRate = document.getElementById("elevenlabs-rate");
  const ttsBars = document.querySelectorAll("#tts-waveform .wbar");

  ttsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const textVal = ttsText.value.trim();
    if (!textVal) return;

    // Terminate current speech if active
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      ttsBars.forEach(b => b.classList.remove("active"));
    }

    // Set voice waveform dancing
    ttsBars.forEach(b => b.classList.add("active"));

    // Build Speech synthesis
    currentSpeechUtterance = new SpeechSynthesisUtterance(textVal);
    currentSpeechUtterance.rate = parseFloat(ttsRate.value);

    // Pick speech voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    if (ttsVoice.value === 'female1') {
      // Find a female voice (English)
      selectedVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Zira") || v.name.includes("Samantha"));
    } else if (ttsVoice.value === 'male1') {
      // Find a male voice
      selectedVoice = voices.find(v => v.name.includes("Microsoft David") || v.name.includes("Daniel") || v.name.includes("Alex"));
    }
    
    if (selectedVoice) {
      currentSpeechUtterance.voice = selectedVoice;
    }

    currentSpeechUtterance.onend = () => {
      ttsBars.forEach(b => b.classList.remove("active"));
    };

    currentSpeechUtterance.onerror = () => {
      ttsBars.forEach(b => b.classList.remove("active"));
    };

    window.speechSynthesis.speak(currentSpeechUtterance);
  });
}

// -------------------------------------------------------------
// Original Municipal Operations Logic Integration
// -------------------------------------------------------------
async function loadMetadata() {
  const response = await fetch("/api/departments");
  const data = await response.json();
  state.departments = data.departments;
  state.categories = data.categories;
  state.priorities = data.priorities;
  state.statuses = data.statuses;
  
  // Set triage mode
  document.getElementById("ai-mode").textContent = data.aiMode;
  
  // Populate dropdown lists
  populateSelect(document.querySelector('#override-form select[name="category"]'), state.categories);
  populateSelect(document.querySelector('#override-form select[name="priority"]'), state.priorities);
  populateSelect(document.querySelector('#override-form select[name="department"]'), state.departments);
  populateSelect(document.querySelector('#status-form select[name="status"]'), state.statuses);
}

async function loadIssues() {
  const response = await fetch("/api/issues");
  const data = await response.json();
  state.issues = data.issues;
  renderMetrics();
  renderTable();
  if (state.selectedIssueId && state.issues.some((issue) => issue.id === state.selectedIssueId)) {
    renderDetail(state.issues.find((issue) => issue.id === state.selectedIssueId));
  }
}

async function loadTrends() {
  const response = await fetch("/api/trends");
  const data = await response.json();
  renderTrends(data);
}

function populateSelect(select, options) {
  if (!select) return;
  select.innerHTML = options.map((option) => `<option value="${option}">${option}</option>`).join("");
}

function renderMetrics() {
  const reviewCount = state.issues.filter((issue) => issue.requiresHumanReview).length;
  const urgentCount = state.issues.filter((issue) => issue.priority === "URGENT").length;
  
  // Update spans across both dashboard and core triage tab
  const counts = document.querySelectorAll("#issue-count");
  counts.forEach(span => span.textContent = state.issues.length);
  
  const reviews = document.querySelectorAll("#review-count");
  reviews.forEach(span => span.textContent = reviewCount);

  const urgents = document.querySelectorAll("#urgent-count");
  urgents.forEach(span => span.textContent = urgentCount);
}

function renderTable() {
  const table = document.getElementById("issue-table");
  if (!table) return;

  table.innerHTML = state.issues.map((issue) => `
    <tr data-id="${issue.id}" class="${issue.id === state.selectedIssueId ? "active" : ""}">
      <td>#${issue.id}</td>
      <td>${issue.source}</td>
      <td>${escapeHtml(issue.area || "Unspecified")}</td>
      <td>${issue.category}</td>
      <td><span class="pill ${issue.priority === "URGENT" || issue.priority === "HIGH" ? "high" : "ok"}">${issue.priority}</span></td>
      <td>${escapeHtml(issue.assignedDepartment)}</td>
      <td><span class="pill engine">${escapeHtml(issue.triageEngine || "Unknown")}</span></td>
      <td><span class="pill ${issue.requiresHumanReview ? "review" : "ok"}">${issue.requiresHumanReview ? "Review" : "Clear"}</span></td>
      <td>${issue.status}</td>
      <td>${escapeHtml(issue.translatedText.slice(0, 72))}</td>
    </tr>
  `).join("");

  table.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => {
      const issue = state.issues.find((item) => item.id === Number(row.dataset.id));
      state.selectedIssueId = issue.id;
      renderTable();
      renderDetail(issue);
      syncForms(issue);
    });
  });

  if (!state.selectedIssueId && state.issues.length) {
    state.selectedIssueId = state.issues[0].id;
    renderTable();
    renderDetail(state.issues[0]);
    syncForms(state.issues[0]);
  }
}

function renderDetail(issue) {
  const root = document.getElementById("issue-detail");
  if (!root) return;
  
  root.classList.remove("empty");
  const overrides = issue.overrides.length
    ? issue.overrides.map((item) => `<li>${item.field}: ${escapeHtml(item.previousValue)} -> ${escapeHtml(item.newValue)} (${escapeHtml(item.reviewer)})</li>`).join("")
    : "<li>No overrides yet.</li>";
  
  root.innerHTML = `
    <h3>Issue #${issue.id}</h3>
    <p>${escapeHtml(issue.originalText)}</p>
    <div class="detail-grid">
      <div class="card"><strong>Translated text</strong>${escapeHtml(issue.translatedText)}</div>
      <div class="card"><strong>Detected language</strong>${escapeHtml(issue.detectedLanguage)}</div>
      <div class="card"><strong>AI engine</strong>${escapeHtml(issue.triageEngine || "Unknown")}</div>
      <div class="card"><strong>Confidence</strong>${(issue.classificationConfidence * 100).toFixed(0)}% classification / ${(issue.routingConfidence * 100).toFixed(0)}% routing</div>
      <div class="card"><strong>Department</strong>${escapeHtml(issue.assignedDepartment)}</div>
      <div class="card"><strong>Triage notes</strong>${escapeHtml(issue.triageNotes || "No notes")}</div>
      <div class="card"><strong>Duplicate signal</strong>${escapeHtml(issue.duplicateOf || "No duplicate match")}</div>
    </div>
    <div class="card" style="margin-top: 12px;">
      <strong>Override history</strong>
      <ul>${overrides}</ul>
    </div>
  `;
}

function renderTrends(data) {
  const hotspotsEl = document.getElementById("hotspots");
  if (hotspotsEl) {
    hotspotsEl.innerHTML = `
      <div class="card"><strong>Hotspots</strong>${data.hotspots.map((spot) => `${escapeHtml(spot.area)}: ${spot.totalIssues} issues, top ${spot.topCategory}`).join("<br>") || "No hotspots yet."}</div>
    `;
  }
  const recurringEl = document.getElementById("recurring");
  if (recurringEl) {
    recurringEl.innerHTML = `
      <div class="card"><strong>Recurring categories</strong>${data.recurringCategories.map(escapeHtml).join("<br>") || "No recurring categories yet."}</div>
    `;
  }
  const anomaliesEl = document.getElementById("anomalies");
  if (anomaliesEl) {
    anomaliesEl.innerHTML = `
      <div class="card"><strong>Anomaly notes</strong>${data.anomalyNotes.map(escapeHtml).join("<br>") || "No anomaly notes yet."}</div>
    `;
  }
}

function syncForms(issue) {
  const oForm = document.getElementById("override-form");
  const sForm = document.getElementById("status-form");
  if (!oForm || !sForm) return;

  oForm.querySelector('input[name="issueId"]').value = issue.id;
  sForm.querySelector('input[name="issueId"]').value = issue.id;
  oForm.querySelector('select[name="category"]').value = issue.category;
  oForm.querySelector('select[name="priority"]').value = issue.priority;
  oForm.querySelector('select[name="department"]').value = issue.assignedDepartment;
  sForm.querySelector('select[name="status"]').value = issue.status;
}

function bindMunicipalForms() {
  const reportForm = document.getElementById("report-form");
  if (reportForm) {
    reportForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(form)
      });
      const message = document.getElementById("form-message");
      if (!response.ok) {
        const data = await response.json();
        message.textContent = data.error || "Could not create report.";
        return;
      }
      const issue = await response.json();
      message.textContent = `Issue #${issue.id} triaged as ${issue.category} and routed to ${issue.assignedDepartment}.`;
      event.currentTarget.reset();
      await Promise.all([loadIssues(), loadTrends()]);
    });
  }

  const overrideForm = document.getElementById("override-form");
  if (overrideForm) {
    overrideForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const issueId = form.get("issueId");
      await fetch(`/api/issues/${issueId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(form)
      });
      await Promise.all([loadIssues(), loadTrends()]);
    });
  }

  const statusForm = document.getElementById("status-form");
  if (statusForm) {
    statusForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const issueId = form.get("issueId");
      await fetch(`/api/issues/${issueId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(form)
      });
      await loadIssues();
    });
  }
}

// Start client-side bootstrap
bootstrap();
