const BASE_URL = "https://byte-size-news-backend.onrender.com";
console.log("script loading");
console.log("base url:", BASE_URL);
const news = document.getElementById("newsContainer");
const modal = document.getElementById("authModal");
const form = document.getElementById("authForm");
const title = document.getElementById("formTitle");
const subtitle = document.getElementById("formSubtitle");
const button = form.querySelector("button");
const btn = form.querySelector(".submit-btn");
const toggleText = document.querySelector(".toggle-text");
const passwordRules = document.getElementById("passwordRules");
let langvar  = "en";
window.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("language");
  if (savedLang) {
    document.getElementById("Language").value = savedLang;
    langvar = savedLang;
  }
});

let currentStep = "form";
let tempEmail = "";
let tempPassword = "";
let isLogin = false;
let temp = null;
let isOtpVerified = false;

// ================= TTS SETUP =================
let voices = [];
let langsarr = [];

function loadVoices() {
    voices = speechSynthesis.getVoices();
    voices.forEach(voice => langsarr.push(voice.lang));
}
speechSynthesis.onvoiceschanged = loadVoices;

const langmap = {
    "en": "en-IN",
    "hi": "hi-IN",
    "mr": "mr-IN",
    "pa": "pa-IN",
};

// ================= MODAL HELPERS =================
function resetModal() {
    // Reset state flags
    isLogin = false;
    currentStep = "form";
    tempEmail = "";
    tempPassword = "";
    temp = null;
    isOtpVerified = false;

    // Reset form fields
    form.reset();
    document.getElementById("otpInput").value = "";
    document.getElementById("resetEmail").value = "";
    document.getElementById("resetOtp").value = "";
    document.getElementById("newPassword").value = "";

    // Reset password rule indicators
    ruleLength.textContent = "❌ At least 8 characters";
    ruleUpper.textContent = "❌ One uppercase letter";
    ruleNumber.textContent = "❌ One number";
    ruleLength.classList.remove("valid");
    ruleUpper.classList.remove("valid");
    ruleNumber.classList.remove("valid");

    // Reset sections visibility
    document.getElementById("authForm").style.display = "block";
    document.getElementById("otpSection").style.display = "none";
    document.getElementById("forgotSection").style.display = "none";
    document.getElementById("fp-email").style.display = "block";
    document.getElementById("fp-otp").style.display = "none";
    document.getElementById("fp-password").style.display = "none";

    // Reset to Sign Up state
    title.innerText = "Sign Up";
    subtitle.innerText = "Create your account to continue";
    btn.innerText = "Sign Up";
    btn.disabled = false;
    toggleText.innerHTML = `Already have an account? <span onclick="toggleForm()">Login</span>`;
    passwordRules.style.display = "flex";
    document.getElementById("forgotPassword").style.display = "none";
}

// ================= DASHBOARD =================
async function hamburger() {
    const dashboard = document.getElementById("dashboard");
    const overlay = document.getElementById("dashboardOverlay");
    const isHidden = dashboard.classList.contains("hidden");

    if (!isHidden) { closeDashboard(); return; }

    dashboard.classList.remove("hidden");
    overlay.classList.add("visible");

    const messageBox = document.getElementById("dashboardMessage");
    const contentBox = document.getElementById("dashboardContent");

    messageBox.innerHTML = "";
    contentBox.style.display = "none";

    const res = await fetch(`${BASE_URL}/auth/verifytoken`, { credentials: "include" });

    if (!res.ok) {
        messageBox.innerHTML = `
            <div class="dash-login-prompt">
                <div class="prompt-icon">🔒</div>
                <h4>Login Required</h4>
                <p>Sign in to access your dashboard and saved articles.</p>
                <button class="dash-login-btn" id="dashLoginBtn">Login / Sign Up</button>
            </div>`;
        document.getElementById("dashLoginBtn").onclick = () => {
            closeDashboard();
            modal.style.display = "flex";
            news.classList.add("blur-bg");
        };
        return;
    }

    contentBox.style.display = "flex";
    loadDashboard();
}

function closeDashboard() {
    document.getElementById("dashboard").classList.add("hidden");
    document.getElementById("dashboardOverlay").classList.remove("visible");
}

async function loadDashboard() {
    const savedContainer = document.getElementById("savedArticles");
    const emailEl = document.getElementById("userEmail");

    // Skeleton loaders while fetching
    savedContainer.innerHTML = [1, 2, 3].map(() => `
        <div class="dash-skeleton">
            <div class="dash-skel-line" style="width:85%"></div>
            <div class="dash-skel-line" style="width:55%"></div>
        </div>`).join("");

    try {
        const profileRes = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
        if (profileRes.ok) {
            const profile = await profileRes.json();
            emailEl.textContent = profile.email || "—";
        }
    } catch (_) { emailEl.textContent = "—"; }

    try {
        const res = await fetch(`${BASE_URL}/save/saved_articles`, { credentials: "include" });

        if (!res.ok) {
            savedContainer.innerHTML = `
                <div class="dash-empty">
                    <div class="dash-empty-icon">⚠️</div>
                    <p>Could not load saved articles.</p>
                </div>`;
            return;
        }

        const data = await res.json();
        savedContainer.innerHTML = "";

        if (!data.length) {
            savedContainer.innerHTML = `
                <div class="dash-empty">
                    <div class="dash-empty-icon">📭</div>
                    <p>No saved articles yet.<br>Bookmark articles to see them here.</p>
                </div>`;
            return;
        }

        data.forEach(article => {
            const a = document.createElement("a");
            a.className = "saved-item";
            a.href = article.url || "#";
            a.target = "_blank";
            a.innerHTML = `
                <div class="saved-dot"></div>
                <div class="saved-item-text">${article.title}</div>`;
            savedContainer.appendChild(a);
        });

    } catch (err) {
        savedContainer.innerHTML = `
            <div class="dash-empty">
                <div class="dash-empty-icon">⚠️</div>
                <p>Something went wrong.</p>
            </div>`;
    }
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
        credentials: "include",
        method: "POST"
    });
    if (!res.ok) {
        return alert("Logout failed");
    }
    // alert("Logged out Successfully!");
    location.reload();
});

function closeModal() {
    modal.style.display = "none";
    news.classList.remove("blur-bg");
    location.reload();
    resetModal();
}

// ================= LOGIN MODAL =================
document.getElementById("loginBtn").addEventListener("click", async () => {
    const res = await fetch(`${BASE_URL}/auth/verifytoken`, { credentials: "include" });
    if (res.ok) {
        alert("You are already logged in!");
        return;
    }
    resetModal();
    modal.style.display = "flex";
    news.classList.add("blur-bg");
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});

// ================= PASSWORD VALIDATION =================
const passwordInput = form.querySelector('input[type="password"]');
const ruleLength = document.getElementById("rule-length");
const ruleUpper = document.getElementById("rule-uppercase");
const ruleNumber = document.getElementById("rule-number");

passwordInput.addEventListener("input", () => {
    if (isLogin) return;

    const str = passwordInput.value;
    const isLengthValid = str.length >= 8;
    const hasUppercase = /[A-Z]/.test(str);
    const hasNumber = /[0-9]/.test(str);

    ruleLength.textContent = isLengthValid ? "✔ At least 8 characters" : "❌ At least 8 characters";
    ruleUpper.textContent = hasUppercase ? "✔ One uppercase letter" : "❌ One uppercase letter";
    ruleNumber.textContent = hasNumber ? "✔ One number" : "❌ One number";

    ruleLength.classList.toggle("valid", isLengthValid);
    ruleUpper.classList.toggle("valid", hasUppercase);
    ruleNumber.classList.toggle("valid", hasNumber);
});

// ================= FORGOT PASSWORD =================
function forgotPassword() {
    document.getElementById("authForm").style.display = "none";
    document.getElementById("otpSection").style.display = "none";
    document.getElementById("forgotSection").style.display = "block";

    title.innerText = "Reset Password";
    subtitle.innerText = "Enter your email to continue";
}
const btn1 = document.querySelector(".reset-password");
btn1.addEventListener("click", async () => {
    const email = document.getElementById("resetEmail").value.trim();
    temp = email;
    if (!email) return alert("Enter email");
    btn1.disabled = true;
    btn1.innerText = "Sending...";
    try {
        const res = await fetch(`${BASE_URL}/otp/gen_forgetpw`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) {
            btn1.disabled = false;
            btn1.innerText = "Send OTP";
            return alert(data.message || "Failed");
        }
        document.getElementById("fp-email").style.display = "none";
        document.getElementById("fp-otp").style.display = "block";
    } catch (err) {
        btn1.disabled = false;
        btn1.innerText = "Send OTP";
    }
});

document.querySelector(".verify_otp").addEventListener("click", async () => {
    if (!temp) return alert("Generate OTP first");
    const otp = document.getElementById("resetOtp").value.trim();
    if (!otp) return alert("Enter OTP");

    const res = await fetch(`${BASE_URL}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: temp, otp })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message);

    isOtpVerified = true;
    // alert("OTP verified!");
    document.getElementById("fp-otp").style.display = "none";
    document.getElementById("fp-password").style.display = "block";
});

document.querySelector(".reset_password").addEventListener("click", async () => {
    if (!isOtpVerified) return alert("Verify OTP first");
    const newPassword = document.getElementById("newPassword").value.trim();
    if (!newPassword) return alert("Enter password");

    const valid = newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
    if (!valid) return alert("Password must be strong (8+ chars, uppercase, number)");

    const res = await fetch(`${BASE_URL}/auth/reset_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: temp, newPassword })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message);

    alert("Password reset successful!");
    location.reload();
});

// ================= OTP VERIFY (SIGNUP) =================
document.getElementById("verifyOtp").addEventListener("click", async () => {
    const otp = document.getElementById("otpInput").value.trim();
    if (!otp) return alert("Enter OTP");

    const res = await fetch(`${BASE_URL}/otp/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempEmail, otp })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message);

    const signup = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempEmail, password: tempPassword })
    });
    const result = await signup.json();

    if (signup.ok) {
        // alert(result.message);
        closeModal();
    } else {
        alert(result.message);
    }
});

// ================= TOGGLE LOGIN/SIGNUP =================
function toggleForm() {
    isLogin = !isLogin;

    document.getElementById("forgotSection").style.display = "none";
    document.getElementById("authForm").style.display = "block";
    document.getElementById("otpSection").style.display = "none";

    if (isLogin) {
        title.innerText = "Login";
        subtitle.innerText = "Welcome back!";
        button.innerText = "Login";
        toggleText.innerHTML = `New here? <span onclick="toggleForm()">Sign Up</span>`;
        passwordRules.style.display = "none";
        document.getElementById("forgotPassword").style.display = "block";
    } else {
        title.innerText = "Sign Up";
        subtitle.innerText = "Create your account to continue";
        button.innerText = "Sign Up";
        toggleText.innerHTML = `Already have an account? <span onclick="toggleForm()">Login</span>`;
        passwordRules.style.display = "flex";
        document.getElementById("forgotPassword").style.display = "none";
    }
}

// ================= FORM SUBMIT =================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) return alert("Fill all fields");

    btn.disabled = true;
    if (isLogin) {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            // alert(data.message);
            closeModal();
        } else {
            alert(data.message);
        }
        btn.disabled = false;
        return;
    }

    tempEmail = email;
    tempPassword = password;

    const res = await fetch(`${BASE_URL}/otp/gen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        btn.disabled = false;
        return;
    }

    document.getElementById("otpSection").style.display = "block";
    btn.innerText = "OTP Sent ✓";
    currentStep = "otp";
    btn.disabled = false;
});

// ================= SEARCH =================
const topicMap = {
    tech: "technology",
    technology: "technology",
    sports: "sports",
    business: "business",
    health: "health",
    science: "science",
    world: "world",
    news: "breaking-news"
};

document.getElementById("searchBtn").addEventListener("click", () => {
    speechSynthesis.cancel();
    const input = document.getElementById("searchInput").value.toLowerCase().trim();
    const topic = topicMap[input] || "breaking-news";
    const lang = document.getElementById("Language").value || "en";
    loadnews(topic, "in", lang);
});

document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("searchBtn").click();
});

function quickSearch(topic) {
    document.getElementById("searchInput").value = topic;
    const lang = document.getElementById("Language").value || "en";
    loadnews(topic, "in", lang);
}



// ================= NEWS =================
async function loadnews(topic, country, lang) {
    speechSynthesis.cancel();
    const container = document.getElementById("news-container");
    container.innerHTML = "";

    // Skeleton loaders
    for (let i = 0; i < 4; i++) {
        const sk = document.createElement("div");
        sk.className = "news-card";
        sk.style.cssText = "animation: shimmer 1.5s infinite;";
        sk.innerHTML = `
            <div style="height:20px;background:var(--surface-3);border-radius:6px;margin-bottom:12px;width:75%;"></div>
            <div style="height:14px;background:var(--surface-3);border-radius:6px;margin-bottom:8px;"></div>
            <div style="height:14px;background:var(--surface-3);border-radius:6px;width:60%;"></div>
        `;
        container.appendChild(sk);
    }

    try {
        const res = await fetch(`${BASE_URL}/news?topic=${topic}&country=${country}&lang=${lang}`);
        const articles = await res.json();
        container.innerHTML = "";

        for (let article of articles) {
            const card = document.createElement("div");
            card.className = "news-card";

            card.innerHTML = `
                <h3>${article.title}</h3>
                <p>${article.description || ""}</p>
                <div class="card-footer">
                    <a href="${article.url}" target="_blank">Read more</a>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="summarize-btn">✦ Summarize</button>
                       <button class="save_btn" title="Save article">
  <svg class="save-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
  </svg>
</button>
                    </div>
                </div>
                <div class="summary"></div>
                <div class="tts-controls" style="display:none;">
                    <button class="listen-btn">🔊 Listen</button>
                    <button class="stop-btn" disabled>🔇 Stop</button>
                </div>
            `;

            const summarizeBtn = card.querySelector(".summarize-btn");
            const summaryBox = card.querySelector(".summary");
            const ttsControls = card.querySelector(".tts-controls");
            const listenBtn = card.querySelector(".listen-btn");
            const stopBtn = card.querySelector(".stop-btn");

            const saveBtn = card.querySelector(".save_btn");
            saveBtn.addEventListener("click", async () => {
                const res = await fetch(`${BASE_URL}/save/save_article`, {
                    credentials: "include",
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: article.title, description: article.description, url: article.url })
                });
                if (res.ok) {
                    saveBtn.classList.add("saved");
                } else {
                    alert("Failed to save article.");
                }

            });

            let isSpeaking = false;
            let currentAudio = null;

            // ---- Listen ----
            listenBtn.addEventListener("click", async () => {
                if (isSpeaking) return;
                isSpeaking = true;
                listenBtn.disabled = true;
                stopBtn.disabled = false;

                const summaryText = summaryBox.innerText;

                // CASE 1: Local TTS if voice available
                if (langsarr.includes(langmap[lang])) {
                    const utterance = new SpeechSynthesisUtterance(summaryText);
                    utterance.lang = langmap[lang];
                    utterance.onend = () => {
                        isSpeaking = false;
                        listenBtn.disabled = false;
                        stopBtn.disabled = true;
                    };
                    speechSynthesis.speak(utterance);
                    return;
                }

                // CASE 2: External TTS
                try {
                    alert("Currently not available !");
                    //     const ttsRes = await fetch(`${BASE_URL}/tts`, {
                    //         method: "POST",
                    //         headers: { "Content-Type": "application/json" },
                    //         body: JSON.stringify({ text: summaryText, voiceid: "JBFqnCBsd6RMkjVDRZzb" })
                    //     });
                    //     const audioBlob = await ttsRes.blob();
                    //     const audioUrl = URL.createObjectURL(audioBlob);
                    //     currentAudio = new Audio(audioUrl);
                    //     currentAudio.onended = () => {
                    //         isSpeaking = false;
                    //         listenBtn.disabled = false;
                    //         stopBtn.disabled = true;
                    //         currentAudio = null;
                    //     };
                    //     currentAudio.play();
                } catch (err) {
                    isSpeaking = false;
                    listenBtn.disabled = false;
                    stopBtn.disabled = true;
                }
            });

            // ---- Stop ----
            stopBtn.addEventListener("click", () => {
                speechSynthesis.cancel();
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    currentAudio = null;
                }
                isSpeaking = false;
                listenBtn.disabled = false;
                stopBtn.disabled = true;
            });

            // ---- Summarize ----
            summarizeBtn.addEventListener("click", async () => {
                // Stop any ongoing speech before new summary
                speechSynthesis.cancel();
                if (currentAudio) { currentAudio.pause(); currentAudio = null; }
                isSpeaking = false;

                summarizeBtn.disabled = true;
                summaryBox.innerText = "Summarizing...";
                summaryBox.style.display = "block";
                ttsControls.style.display = "none";

                const res = await fetch(`${BASE_URL}/ai`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: article.content || article.title, lang: lang })
                });
                const data = await res.json();
                summaryBox.innerText = data.summary;
                summarizeBtn.disabled = false;

                // Show listen/stop after summary is ready
                listenBtn.disabled = false;
                stopBtn.disabled = true;
                ttsControls.style.display = "flex";
            });

            container.appendChild(card);
        }

    } catch (err) {
        container.innerHTML = `<div class="news-card" style="text-align:center;color:var(--ink-soft);padding:40px;">
            <p style="font-size:15px;">Could not load news. Please try again.</p>
        </div>`;
    }
}
const languageSelect = document.getElementById("Language");
languageSelect.addEventListener("change", function () {
    const selectedLang = this.value;
    // Save in localStorage
    localStorage.setItem("language", selectedLang);
    loadnews("breaking-news", "in", selectedLang);
});

loadnews("breaking-news", "in", langvar);