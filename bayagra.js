/**
 * Bayagra All-in-One AI Suite
 * Client-side core logic and simulators
 */

// Global state for Bayagra features
const bayagraState = {
  chatHistory: {
    claude: [],
    chatgpt: [],
    gemini: [],
    consensus: []
  },
  currentModel: 'consensus', // default
  phoneLookupDb: {
    '15550192834': { name: 'Jane Doe', tag: 'Business', location: 'Seattle, WA', company: 'TechCorp CEO', spamScore: 0, email: 'jane.doe@techcorp.com', trust: 'Verified' },
    '919876543210': { name: 'Rajesh Kumar', tag: 'Personal', location: 'Bangalore, India', company: 'Software Architect', spamScore: 5, email: 'rajesh.kumar@urbanai.in', trust: 'Trusted' },
    '18005550199': { name: 'Premier Warranty Hub', tag: 'Telemarketer', location: 'Dallas, TX', company: 'Medicare & Auto Scams', spamScore: 99, email: 'unknown@scammail.net', trust: 'Dangerous' },
    '442079460192': { name: 'Dr. Sarah Jenkins', tag: 'Health/Doctor', location: 'London, UK', company: 'NHS Specialist', spamScore: 12, email: 's.jenkins@nhs.net', trust: 'Verified' },
    '917550319164': { name: 'Nivash', tag: 'Creator & Developer', location: 'Chennai, India', company: 'Bayagra Founder & Lead AI Engineer', spamScore: 0, email: 'nivash@urbanai.in', trust: 'Verified' },
    '7550319164': { name: 'Nivash', tag: 'Creator & Developer', location: 'Chennai, India', company: 'Bayagra Founder & Lead AI Engineer', spamScore: 0, email: 'nivash@urbanai.in', trust: 'Verified' },
    '919578799164': { name: 'Nivash', tag: 'Creator & Developer', location: 'Chennai, India', company: 'Bayagra Founder & Lead AI Engineer', spamScore: 0, email: 'nivash@urbanai.in', trust: 'Verified' },
    '9578799164': { name: 'Nivash', tag: 'Creator & Developer', location: 'Chennai, India', company: 'Bayagra Founder & Lead AI Engineer', spamScore: 0, email: 'nivash@urbanai.in', trust: 'Verified' }
  },
  callSimulator: {
    active: false,
    audioContext: null,
    oscillator: null,
    gainNode: null,
    intervalId: null,
    transcriptTimeoutId: null,
    transcriptIndex: 0
  }
};

// -------------------------------------------------------------
// Audio Oscillator for Phone Ringing (Web Audio API)
// -------------------------------------------------------------
function startRingtone() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    bayagraState.callSimulator.audioContext = new AudioContext();
    const ctx = bayagraState.callSimulator.audioContext;
    
    // Create standard US ringtone: 440Hz + 480Hz combined, pulsing 2s on, 4s off
    const playRing = () => {
      if (!ctx || ctx.state === 'closed') return;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + 2.0);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.1);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      
      // Stop oscillators after 2.2 seconds
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
        } catch (e) {}
      }, 2200);
    };
    
    // Play immediately
    playRing();
    
    // Repeat every 6 seconds
    bayagraState.callSimulator.intervalId = setInterval(playRing, 6000);
  } catch (e) {
    console.warn("Audio Context blocked or unsupported:", e);
  }
}

function stopRingtone() {
  if (bayagraState.callSimulator.intervalId) {
    clearInterval(bayagraState.callSimulator.intervalId);
    bayagraState.callSimulator.intervalId = null;
  }
  if (bayagraState.callSimulator.audioContext) {
    try {
      bayagraState.callSimulator.audioContext.close();
    } catch (e) {}
    bayagraState.callSimulator.audioContext = null;
  }
}

// -------------------------------------------------------------
// Unified Chat Arena Engine
// -------------------------------------------------------------
const AI_SIM_RESPONSES = {
  claude: {
    greeting: "Hello, I am Claude. I can analyze complex logic, write robust code, or generate interactive artifacts. Let me know how I can help you today.",
    default: (prompt) => {
      const lower = prompt.toLowerCase();
      // Handle creator name and security information queries
      if (lower.includes('who created') || lower.includes('who made') || lower.includes('creator') || lower.includes('who build') || lower.includes('developer') || lower.includes('developed by')) {
        return `This AI system was created and developed by **Nivash**.`;
      }
      if (lower.includes('security') || lower.includes('secured') || lower.includes('penetration') || lower.includes('exploit') || lower.includes('vulnerability') || lower.includes('firewall') || lower.includes('cybersecurity')) {
        return `I cannot provide any details or information regarding the security configuration, infrastructure, or defense policies of this application.`;
      }

      // Artifact trigger: check if user asks for HTML, SVG, or components
      if (lower.includes('button') || lower.includes('ui') || lower.includes('component') || lower.includes('html') || lower.includes('chart') || lower.includes('svg')) {
        return `I have designed a custom visual asset based on your prompt. I will render it inside the **Artifacts panel** on the right. 

Here is the analytical breakdown of this component:
1. **Clean Semantics**: Using standard tags and layout techniques.
2. **Glassmorphic Accents**: Designed with the Bayagra color system to match your theme.
3. **Micro-interactions**: Incorporates hover feedback and CSS animations.

\`\`\`xml
<!-- Artifact: visual_component -->
<div class="glass-card" style="padding: 24px; border-radius: 20px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.3); text-align: center;">
  <h3 style="color: #fff; font-family: sans-serif; margin-bottom: 8px;">Bayagra Interactive Preview</h3>
  <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 20px;">Created dynamically in response to: "${escapeHtml(prompt)}"</p>
  
  <div style="display: flex; gap: 12px; justify-content: center; margin: 20px 0;">
    <button class="neon-btn-c" style="background: linear-gradient(135deg, #d97706, #f59e0b); border: none; border-radius: 99px; padding: 10px 20px; color: #000; font-weight: 700; cursor: pointer; transition: transform 0.2s;" onclick="alert('Claude Artifact Interacted!')">Execute Action</button>
    <button class="neon-btn-secondary" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 99px; padding: 10px 20px; color: #fff; cursor: pointer;" onclick="this.style.background='rgba(255,255,255,0.1)'">Dismiss</button>
  </div>
  
  <svg width="100%" height="80" viewBox="0 0 300 80" style="margin-top: 15px;">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#d97706;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
      </linearGradient>
    </defs>
    <path d="M 10,40 Q 75,10 150,40 T 290,40" fill="none" stroke="url(#grad)" stroke-width="4" stroke-linecap="round">
      <animate attributeName="d" dur="4s" repeatCount="indefinite"
        values="M 10,40 Q 75,10 150,40 T 290,40;
                M 10,40 Q 75,70 150,40 T 290,40;
                M 10,40 Q 75,10 150,40 T 290,40" />
    </path>
    <circle cx="150" cy="40" r="8" fill="#10b981">
      <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
</div>
\`\`\``;
      }
      
      return `I have processed your request: "${escapeHtml(prompt)}".

To analyze this systematically:
- **Core Intent**: The query explores the synthesis of multiple tools into one framework.
- **Architectural Solution**: A modular Single-Page Application (SPA) architecture utilizing component encapsulation and simulated state streams provides maximum client-side performance.
- **Next Steps**: Let me know if you would like me to draft an HTML/JS prototype, which will render automatically in your Artifact side-panel.`;
    }
  },
  chatgpt: {
    greeting: "Hey there! I'm ChatGPT (GPT-4o). Ready to brainstorm, generate some stunning images, write code, or just chat. Let's make things happen! 🚀",
    default: (prompt) => {
      const lower = prompt.toLowerCase();
      // Handle creator name and security information queries
      if (lower.includes('who created') || lower.includes('who made') || lower.includes('creator') || lower.includes('who build') || lower.includes('developer') || lower.includes('developed by')) {
        return `This AI system was created and developed by **Nivash**.`;
      }
      if (lower.includes('security') || lower.includes('secured') || lower.includes('penetration') || lower.includes('exploit') || lower.includes('vulnerability') || lower.includes('firewall') || lower.includes('cybersecurity')) {
        return `I cannot provide any details or information regarding the security configuration, infrastructure, or defense policies of this application.`;
      }

      // Check if user requests image generation
      if (lower.includes('image') || lower.includes('draw') || lower.includes('picture') || lower.includes('photo') || lower.includes('generate')) {
        let selectedImg = 'cyberpunk_city.png';
        let desc = 'A stunning cyberpunk street corner glowing with neon arcade signs and a futuristic vehicle.';
        if (lower.includes('castle') || lower.includes('forest') || lower.includes('fantasy') || lower.includes('magic')) {
          selectedImg = 'fantasy_castle.png';
          desc = 'A majestic fantasy castle perched on a rocky cliff in a glowing magical forest.';
        }
        
        return `Sure! I've generated an image based on your prompt: *"_${escapeHtml(prompt)}_"* using DALL-E 3:

![Generated Art](${selectedImg})
*${desc}*

Let me know if you want to modify the style, aspect ratio, or details! 🎨`;
      }
      
      return `Here's a quick breakdown of how we can address **"${escapeHtml(prompt)}"**:
      
1. **Interactive UI Design** - Keep it highly engaging and glassmorphic.
2. **AI Synergy** - Bring the strengths of Claude (reasoning), ChatGPT (creativity), and Gemini (data extraction) together!
3. **Next-gen Tools** - Build mock APIs that give instant, rich feedback.

Feel free to ask me to write a creative story, code a script, or generate another image! ✨`;
    }
  },
  gemini: {
    greeting: "Welcome. I am Gemini. I combine Google's multi-modal understanding with real-time Google Search integration. Upload a file or ask me to search the web for your query.",
    default: (prompt) => {
      const lower = prompt.toLowerCase();
      // Handle creator name and security information queries
      if (lower.includes('who created') || lower.includes('who made') || lower.includes('creator') || lower.includes('who build') || lower.includes('developer') || lower.includes('developed by')) {
        return `This AI system was created and developed by **Nivash**.`;
      }
      if (lower.includes('security') || lower.includes('secured') || lower.includes('penetration') || lower.includes('exploit') || lower.includes('vulnerability') || lower.includes('firewall') || lower.includes('cybersecurity')) {
        return `I cannot provide any details or information regarding the security configuration, infrastructure, or defense policies of this application.`;
      }

      return `### Gemini Analysis

I have completed a multi-modal scan and search check for: **"${escapeHtml(prompt)}"**

#### 🌐 Google Search Citations
*   **Source 1**: [Bayagra Technical Specs (2026)](https://google.com/search?q=bayagra+specifications) - *Details the integration of cross-model consensus systems.*
*   **Source 2**: [Unified AI Client Frameworks](https://google.com/search?q=unified+ai+chat+architecture) - *Best practices on rendering client-side artifacts.*

#### 📊 Structured Summary
*   **Efficiency**: Consolidating models reduces multi-tab browser overhead by approximately **40%**.
*   **Capabilities**: Allows cross-referencing of outputs, ensuring higher accuracy.
*   **Context Window**: Supporting up to 2 million tokens for deep codebase review.

Let me know if you wish to upload an image or text file for localized analysis.`;
    }
  }
};

// Simulate stream rendering
function simulateStreamText(targetElement, fullText, callback) {
  targetElement.innerHTML = "";
  let currentIndex = 0;
  
  // Format markdown lists and bold formatting basically for aesthetic streams
  const tempSpan = document.createElement("span");
  targetElement.appendChild(tempSpan);
  
  const charsPerStep = 3; // stream 3 characters at a time for fast replies
  const interval = setInterval(() => {
    if (currentIndex < fullText.length) {
      // Append characters in chunks
      const chunk = fullText.slice(currentIndex, currentIndex + charsPerStep);
      tempSpan.textContent += chunk;
      currentIndex += charsPerStep;
      
      // Auto scroll chat body
      const chatBody = targetElement.closest('.chat-body');
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    } else {
      clearInterval(interval);
      // Replace plain text with clean HTML formatting
      targetElement.innerHTML = parseSimulatedMarkdown(fullText);
      if (callback) callback();
    }
  }, 10); // stream speed
}

// Basic regex markdown parser for beautiful responses
function parseSimulatedMarkdown(text) {
  let html = escapeHtml(text);
  
  // Images
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="chat-generated-img"><img src="$2" alt="$1" class="studio-result-img" /><p class="img-caption">$1</p></div>');
  
  // Code Blocks
  html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre class="code-block"><div class="code-head"><span>$1</span><button onclick="navigator.clipboard.writeText(this.parentNode.nextSibling.textContent); alert(\'Copied!\')">Copy</button></div><code>$2</code></pre>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Lists
  html = html.replace(/^\*\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
  
  // Wrap list items in ul
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Linebreaks
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

// -------------------------------------------------------------
// Interactive Incoming Call Simulator Timeline
// -------------------------------------------------------------
const SIMULATED_CALLER_TIMELINE = [
  { sender: 'caller', text: "Hello? Is this the owner of the vehicle?" },
  { sender: 'assistant', text: "[Bayagra Shield] Hello. You have reached a secured line. Please state your business for AI screening." },
  { sender: 'caller', text: "Uh... I'm calling from Auto Warranty Protection. We've sent several letters about your car warranty..." },
  { sender: 'assistant', text: "[Bayagra Shield] The recipient has registered this number as a personal line. Solicitations are blocked. Please state your agent ID." },
  { sender: 'caller', text: "My agent ID? Oh, wait, is this an AI voice screening? Let me speak to the customer!" },
  { sender: 'assistant', text: "[Bayagra Shield] Call flagged as high-risk spam. Terminating connection to save the user's valuable time. Goodbye." },
  { sender: 'caller', text: "[Call Ended by Spam Shield]" }
];

function triggerIncomingCallSimulation() {
  if (bayagraState.callSimulator.active) return;
  
  bayagraState.callSimulator.active = true;
  
  // Show call modal
  const modal = document.getElementById("incoming-call-modal");
  modal.classList.add("active");
  
  // Set caller details randomly
  const names = ["Robo Warranty Scam", "Premier Loan Agent", "Unknown Number", "Suspected Spam"];
  const numbers = ["+1 (800) 555-0199", "+91 90000 88888", "+44 207 946 0999", "+1 (888) 123-4567"];
  const idx = Math.floor(Math.random() * names.length);
  
  document.getElementById("modal-caller-name").textContent = names[idx];
  document.getElementById("modal-caller-number").textContent = numbers[idx];
  
  // Clear logs
  const logs = document.getElementById("modal-call-logs");
  logs.innerHTML = '<p class="status-msg ring-anim">🔔 Incoming Call Alert...</p>';
  
  // Start ringing sound
  startRingtone();
  
  // Reset timeline pointer
  bayagraState.callSimulator.transcriptIndex = 0;
}

function answerCallSimulation() {
  stopRingtone();
  const logs = document.getElementById("modal-call-logs");
  logs.innerHTML = '<p class="status-msg">📞 Call Connected. Shield Active.</p>';
  
  // Hide call control accept button, change decline button to 'End Call'
  document.getElementById("btn-answer").style.display = "none";
  document.getElementById("btn-screen").style.display = "none";
  document.getElementById("btn-decline").textContent = "End Call";
  
  streamNextTranscriptLine();
}

function screenCallSimulation() {
  stopRingtone();
  const logs = document.getElementById("modal-call-logs");
  logs.innerHTML = '<p class="status-msg">🛡️ Screening Call via Bayagra AI...</p>';
  
  document.getElementById("btn-answer").style.display = "none";
  document.getElementById("btn-screen").style.display = "none";
  document.getElementById("btn-decline").textContent = "Close Screen";
  
  streamNextTranscriptLine();
}

function declineCallSimulation() {
  stopRingtone();
  if (bayagraState.callSimulator.transcriptTimeoutId) {
    clearTimeout(bayagraState.callSimulator.transcriptTimeoutId);
  }
  
  const modal = document.getElementById("incoming-call-modal");
  modal.classList.remove("active");
  
  // Restore buttons
  document.getElementById("btn-answer").style.display = "inline-flex";
  document.getElementById("btn-screen").style.display = "inline-flex";
  document.getElementById("btn-decline").textContent = "Decline";
  
  bayagraState.callSimulator.active = false;
}

function streamNextTranscriptLine() {
  const index = bayagraState.callSimulator.transcriptIndex;
  if (index >= SIMULATED_CALLER_TIMELINE.length) {
    // End call automatically
    setTimeout(() => {
      declineCallSimulation();
    }, 2000);
    return;
  }
  
  const item = SIMULATED_CALLER_TIMELINE[index];
  const logs = document.getElementById("modal-call-logs");
  
  const bubble = document.createElement("div");
  bubble.className = `call-bubble ${item.sender}`;
  bubble.innerHTML = `<strong>${item.sender === 'caller' ? 'Caller' : 'Bayagra'}:</strong> ${item.text}`;
  logs.appendChild(bubble);
  
  // Auto scroll logs
  logs.scrollTop = logs.scrollHeight;
  
  bayagraState.callSimulator.transcriptIndex++;
  
  // Schedule next line
  bayagraState.callSimulator.transcriptTimeoutId = setTimeout(streamNextTranscriptLine, 2500);
}

// -------------------------------------------------------------
// Perplexity Search Simulator
// -------------------------------------------------------------
const MOCK_SEARCH_RESPONSES = {
  'default': `### room temperature superconductor research updates

The quest for a **room temperature superconductor** (a material that conducts electricity with zero resistance at ambient temperatures and pressures) remains a highly active area of global physics research [1]. 

#### Key Technical Progress:
- **Hydride Materials**: Hydrogen-rich compounds under extreme pressures (like sulfur hydride and lanthanum hydride) show superconducting states near 250 K (-23°C), but require pressures exceeding 1.5 million atmospheres [2].
- **Ambient-Pressure Attempts**: Following the claims surrounding LK-99 (copper-doped lead apatite) in 2023, independent laboratories globally verified that the material is a semiconductor/diamagnet rather than a superconductor, owing to copper sulfide impurities [3].
- **Recent Trends**: Research has pivoted towards nickel-based oxides (nickelates) and twisted bilayer graphene to study the underlying physics of high-temperature superconductivity [4].

This synthesis compiles data from multiple scientific peer reviews published between 2024 and 2026.`
};

const MOCK_CITATIONS = {
  '1': { title: 'Review of High-Tc Superconductivity', source: 'Nature Physics, Feb 2025', snippet: 'A comprehensive review of modern materials exhibiting high-temperature superconducting behaviors.' },
  '2': { title: 'Hydride Superconductors under Mega-bar Pressures', source: 'Journal of Applied Physics, 2024', snippet: 'Details the crystal lattice structural stability of lanthanum-decahydride systems.' },
  '3': { title: 'LK-99 Replication and Impurity Phase Diagrams', source: 'Max Planck Institute, late 2023', snippet: 'Demonstrates how structural phase transitions in Cu2S mimic resistance drop in impure samples.' },
  '4': { title: 'Nickelates: The New Frontier of Zero-Resistance', source: 'Stanford Science Journal, Jan 2026', snippet: 'Explains the electronic similarities between copper-oxide planes and nickel-oxygen lattices.' }
};

function runPerplexitySearch(query) {
  const logContainer = document.getElementById("perplexity-search-steps");
  const resultContainer = document.getElementById("perplexity-result-content");
  
  logContainer.innerHTML = "";
  resultContainer.innerHTML = "";
  
  const steps = [
    `🔍 Analyzing search intent: "${escapeHtml(query)}"`,
    "🌐 Executing web crawl on Google, Bing, and Semantic Scholar...",
    "📄 Crawled 8 papers from Arxiv and Nature journals...",
    "🧠 Processing claims and cross-referencing contradictions...",
    "✍️ Generating synthesized intelligence summary..."
  ];
  
  let currentStep = 0;
  
  function executeNextStep() {
    if (currentStep < steps.length) {
      const stepDiv = document.createElement("div");
      stepDiv.className = "search-step-item animate-fade-in";
      stepDiv.textContent = steps[currentStep];
      logContainer.appendChild(stepDiv);
      currentStep++;
      setTimeout(executeNextStep, 800);
    } else {
      // Stream final response
      const answer = MOCK_SEARCH_RESPONSES['default'];
      simulateStreamText(resultContainer, answer, () => {
        // After streaming completes, bind citation hover listeners
        bindCitationPreviews();
      });
    }
  }
  
  executeNextStep();
}

function bindCitationPreviews() {
  const citations = document.querySelectorAll("#perplexity-result-content strong, #perplexity-result-content br");
  // Let's scan all citation markers [1], [2], etc. inside result
  const container = document.getElementById("perplexity-result-content");
  let html = container.innerHTML;
  
  // Replace [1] with interactive badge
  html = html.replace(/\[(\d+)\]/g, '<span class="citation-badge" data-citation-id="$1">[$1]</span>');
  container.innerHTML = html;
  
  // Add hover card listeners
  const badges = container.querySelectorAll(".citation-badge");
  badges.forEach(badge => {
    badge.addEventListener("mouseenter", (e) => {
      const id = badge.dataset.citationId;
      const data = MOCK_CITATIONS[id];
      if (!data) return;
      
      let hoverCard = document.getElementById("citation-hover-card");
      if (!hoverCard) {
        hoverCard = document.createElement("div");
        hoverCard.id = "citation-hover-card";
        hoverCard.className = "citation-hover-card";
        document.body.appendChild(hoverCard);
      }
      
      hoverCard.innerHTML = `
        <h4>${escapeHtml(data.title)}</h4>
        <p class="citation-source">${escapeHtml(data.source)}</p>
        <p class="citation-snippet">"${escapeHtml(data.snippet)}"</p>
      `;
      
      const rect = badge.getBoundingClientRect();
      hoverCard.style.top = `${rect.bottom + window.scrollY + 6}px`;
      hoverCard.style.left = `${rect.left + window.scrollX - 20}px`;
      hoverCard.classList.add("active");
    });
    
    badge.addEventListener("mouseleave", () => {
      const hoverCard = document.getElementById("citation-hover-card");
      if (hoverCard) {
        hoverCard.classList.remove("active");
      }
    });
  });
}

// Helper to escape HTML characters
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Fetch live web knowledge using DuckDuckGo Instant Answer API and Wikipedia Search API
async function queryOnlineKnowledge(query) {
  // 1. Try DuckDuckGo Instant Answers
  try {
    const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&origin=*`);
    const ddgData = await ddgRes.json();
    if (ddgData.AbstractText) {
      return {
        text: ddgData.AbstractText,
        source: ddgData.AbstractSource || 'Wikipedia',
        url: ddgData.AbstractURL
      };
    }
  } catch (e) {
    console.warn("DDG API failed, trying Wikipedia...");
  }

  // 2. Try Wikipedia Search API
  try {
    const wikiSearchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(query)}`);
    const wikiSearchData = await wikiSearchRes.json();
    if (wikiSearchData.query && wikiSearchData.query.search && wikiSearchData.query.search.length > 0) {
      const pageId = wikiSearchData.query.search[0].pageid;
      const title = wikiSearchData.query.search[0].title;
      
      const wikiExtractRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro&explaintext&redirects=1&pageids=${pageId}`);
      const wikiExtractData = await wikiExtractRes.json();
      const pageData = wikiExtractData.query.pages[pageId];
      if (pageData && pageData.extract) {
        return {
          text: pageData.extract,
          source: 'Wikipedia',
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
        };
      }
    }
  } catch (e) {
    console.warn("Wikipedia API failed.");
  }

  return null;
}
