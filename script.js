

// =========================================================================
// 1. FIREBASE CONFIGURATION & CONSTANTS
// =========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCL1WOkrFOQVdmY_oTbQqfaRSaaWSnIyFw",
  authDomain: "ai-academy-48993.firebaseapp.com",
  databaseURL: "https://ai-academy-48993-default-rtdb.firebaseio.com",
  projectId: "ai-academy-48993",
  storageBucket: "ai-academy-48993.firebasestorage.app",
  messagingSenderId: "352314326199",
  appId: "1:352314326199:android:9c742a61ff12b563286132"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

const WATCH_ADS_WEB_URL = "https://freeearningsonline.github.io";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.po.di";
const DISPOSABLE_DOMAINS = [
  "tempmail.com","10minutemail.com","guerrillamail.com","mailinator.com",
  "tempmail.net","dispostable.com","yopmail.com","emailondeck.com",
  "getnada.com","throwawaymail.com","trashmail.com","sharklasers.com"
];

// =========================================================================
// 2. CENTRAL APPLICATION STATE
// =========================================================================
const state = {
  route: 'home',
  routeParam: null,
  searchQuery: '',
  selectedCategory: 'All',
  coursesVisibleCount: 4,
  toolsVisibleCount: 4,
  jobsFilter: 'All',
  jobsSearch: '',
  noticesFilter: 'All',
  mockTestsFilter: 'All',
  activeMockTest: null,
  mockTimerInterval: null,
  mockSecondsLeft: 0,
  mockAnswers: {},
  mockSubmitted: false,
  activeQuizCourseId: null,
  quizAnswers: {},
  quizSubmitted: false,
  activeBuiltInTool: null,
  calcExpr: '',

  fbUser: null,
  user: null,
  myInstructorApp: null,
  myRewardWallet: { balance: 0, adsWatchedToday: 0, stampsCollected: 0, isLoyaltyRewardClaimed: false, loyaltyTid: '', lastGeneratedTid: '' },
  myRewardHistory: [],
  loyaltyConfig: { rewardAmount: 100, requiredStamps: 12 },

  courses: [],
  rawCourses: [],
  categories: [],
  banners: [],
  books: [],
  rawBooks: [],
  liveSessions: [],
  rawLive: [],
  tools: [],
  jobs: [],
  notices: [],
  mockTests: [],
  faculty: [],
  posts: [],
  paymentMethods: [],
  verifications: [],
  earnings: [],
  withdrawals: [],
  supportSettings: {
    facebookUrl: 'https://facebook.com',
    whatsappNumber: '+923437269309',
    whatsappChannelUrl: 'https://whatsapp.com',
    youtubeUrl: 'https://youtube.com',
    privacyPolicyUrl: 'https://example.com/privacy',
    returnPolicyUrl: 'https://example.com/return'
  },
  appSettings: {
    imgbbApiKey: 'e58b8d4f434005e80391db6822a969cc',
    latestVersionCode: 14,
    latestVersionName: '14.0',
    updateUrl: PLAY_STORE_URL
  },
  userListenersAttachedFor: null,
  activeUserRefs: []
};

// =========================================================================
// 3. UTILITIES & SECURITY
// =========================================================================
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function fixUrl(u) {
  const t = (u || '').trim();
  if (!t) return '';
  return (t.startsWith('http://') || t.startsWith('https://')) ? t : 'https://' + t;
}
function safeNum(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

// تمام قیمتیں ڈالر ($) میں
function fmtPrice(n) {
  const v = safeNum(n, 0);
  return v <= 0 ? 'FREE' : '$' + (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2));
}
const fmtRs = fmtPrice; // سیفٹی کے لیے پرانا فنکشن بھی $ واپس کرے گا

function showToast(msg) {
  const el = document.getElementById('toastEl');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 3200);
}

function copyText(text) {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast('Copied: ' + text)).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('Copied: ' + text); } catch(_) {}
  ta.remove();
}

// بیک بٹن ہسٹری کے ساتھ موڈل اوپنر
function openModal(title, html) {
  const tEl = document.getElementById('modalTitle');
  const bEl = document.getElementById('modalBody');
  const dEl = document.getElementById('modalBackdrop');
  if (tEl) tEl.textContent = title;
  if (bEl) bEl.innerHTML = html;
  if (dEl) {
    dEl.classList.add('open');
    history.pushState({ isModal: true }, '', window.location.hash || '#view');
  }
}

function closeModal(popHistory = false) {
  const dEl = document.getElementById('modalBackdrop');
  if (dEl && dEl.classList.contains('open')) {
    dEl.classList.remove('open');
    const bEl = document.getElementById('modalBody');
    if (bEl) bEl.innerHTML = '';
    if (popHistory && history.state && history.state.isModal) {
      history.back();
    }
  }
}

function getWebDeviceId() {
  let id = localStorage.getItem('mda_web_device_id');
  if (!id) {
    id = 'web_' + Math.random().toString(36).slice(2) + '_' + Date.now();
    localStorage.setItem('mda_web_device_id', id);
  }
  return id;
}

function generateReferralCode(uid) {
  const clean = (uid || 'USER').slice(-4).toUpperCase();
  const rand = Math.floor(10 + Math.random() * 89);
  return 'MDA-' + clean + rand;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function monthStr() { return new Date().toISOString().slice(0, 7); }

function userCalcLevel(u) {
  const c = safeNum(u?.referralCount, 0);
  if (c >= 120) return 5;
  if (c >= 60) return 4;
  if (c >= 30) return 3;
  if (c >= 15) return 2;
  if (c >= 5) return 1;
  return 0;
}

function userAvailableFreeCredits(u) {
  if (!u) return 0;
  const claimed = Array.isArray(u.claimedFreeCourseIds) ? u.claimedFreeCourseIds.length : 0;
  return Math.max(0, userCalcLevel(u) - claimed);
}

function userNextMilestone(u) {
  const c = safeNum(u?.referralCount, 0);
  if (c < 5) return 5;
  if (c < 15) return 15;
  if (c < 30) return 30;
  if (c < 60) return 60;
  if (c < 120) return 120;
  return Math.max(120, userCalcLevel(u) * 60);
}

function isInstructorUnlocked() {
  return !!(state.user && (
    state.user.isInstructorApproved === true ||
    String(state.user.role || '').toLowerCase() === 'instructor' ||
    String(state.myInstructorApp?.status || '').toLowerCase() === 'approved'
  ));
}

function hasCourseAccess(courseId) {
  if (!courseId) return false;
  const c = state.courses.find(x => x.id === courseId);
  if (c && (!c.isPaid || safeNum(c.price) <= 0)) return true;
  if (!state.user) return false;
  if (String(state.user.role || '').toLowerCase() === 'admin') return true;
  if (c && c.instructorId === state.user.id) return true;
  if (Array.isArray(state.user.purchasedCourseIds) && state.user.purchasedCourseIds.includes(courseId)) return true;
  return state.verifications.some(v => v.userId === state.user.id && v.status === 'Approved' && v.courseId === courseId);
}

function hasBookAccess(bookId) {
  const b = state.books.find(x => x.id === bookId);
  if (b && (!b.isPaid || safeNum(b.price) <= 0)) return true;
  if (!state.user) return false;
  if (String(state.user.role || '').toLowerCase() === 'admin') return true;
  if (b && b.instructorId === state.user.id) return true;
  if (Array.isArray(state.user.purchasedBookIds) && state.user.purchasedBookIds.includes(bookId)) return true;
  return state.verifications.some(v => v.userId === state.user.id && v.status === 'Approved' && v.bookId === bookId);
}

function hasLiveAccess(sessionId) {
  const s = state.liveSessions.find(x => x.id === sessionId);
  if (s && (!s.isPaid || safeNum(s.price) <= 0)) return true;
  if (!state.user) return false;
  if (String(state.user.role || '').toLowerCase() === 'admin') return true;
  if (s && s.instructorId === state.user.id) return true;
  if (Array.isArray(state.user.paidLiveSessionIds) && state.user.paidLiveSessionIds.includes(sessionId)) return true;
  return state.verifications.some(v => v.userId === state.user.id && v.status === 'Approved' && v.liveSessionId === sessionId);
}

function ytVideoId(url) {
  const u = (url || '').trim();
  const m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function embedVideoUrl(rawUrl) {
  const u = fixUrl(rawUrl);
  const yt = ytVideoId(u);
  if (yt) return 'https://www.youtube.com/embed/' + yt + '?rel=0&modestbranding=1';
  const gd = u.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (gd) return 'https://drive.google.com/file/d/' + gd[1] + '/preview';
  return u;
}

function filterVisibleContent(item) {
  const u = state.user;
  if (u && String(u.role || '').toLowerCase() === 'admin') return true;
  if (u && isInstructorUnlocked() && (item.isApproved || item.instructorId === u.id)) return true;
  return item.isApproved !== false;
}

// =========================================================================
// 4. FIREBASE REALTIME LISTENERS
// =========================================================================
function initPublicListeners() {
  db.ref('categories').on('value', snap => {
    const list = [];
    snap.forEach(ch => {
      const v = ch.val() || {};
      if (v.name) list.push({ id: ch.key, name: v.name, iconUrl: fixUrl(v.iconUrl) });
    });
    state.categories = list;
    render();
  });

  db.ref('banners').on('value', snap => {
    const list = [];
    snap.forEach(ch => {
      const v = ch.val() || {};
      const img = fixUrl(v.imageUrl || v.url || v.image || v.pictureUrl || v.pictureLink || v.pic || '');
      const title = v.title || v.name || '';
      if (img || title) {
        list.push({
          id: ch.key, imageUrl: img, title,
          linkedCourseId: v.linkedCourseId || null,
          isBundle: !!v.isBundle,
          bundlePrice: safeNum(v.bundlePrice, 0),
          linkedCourseIds: Array.isArray(v.linkedCourseIds) ? v.linkedCourseIds : Object.values(v.linkedCourseIds || {})
        });
      }
    });
    state.banners = list;
    render();
  });

  db.ref('courses').on('value', snap => {
    const list = [];
    snap.forEach(ch => {
      const v = ch.val() || {};
      const pic = fixUrl(v.pictureLink || v.pictureUrl || v.imageUrl || v.pic || '') || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085';
      const lecs = Object.entries(v.lectures || {}).map(([k, l], idx) => ({
        id: k, title: l.title || ('Lecture ' + (idx + 1)), videoLink: l.videoLink || l.url || '',
        sequence: safeNum(l.sequence, idx + 1), isFree: !!l.isFree
      })).sort((a, b) => a.sequence - b.sequence);
      const mcqs = Object.entries(v.mcqs || {}).map(([k, q]) => ({
        id: k, question: q.question || '',
        options: Array.isArray(q.options) ? q.options : Object.values(q.options || {}),
        correctAnswerIndex: safeNum(q.correctAnswerIndex, 0)
      })).filter(q => q.question);
      const price = safeNum(v.price, 0);
      list.push({
        id: ch.key, title: v.title || 'Academy Course',
        shortDescription: v.shortDescription || v.description || '',
        pictureLink: pic, price, discountPrice: safeNum(v.discountPrice, 0),
        isPaid: v.isPaid !== undefined ? !!v.isPaid : price > 0,
        categoryId: v.categoryId || '', categoryName: v.categoryName || v.category || '',
        lectures: lecs, mcqs, requiredWatchMinutes: safeNum(v.requiredWatchMinutes, 0),
        instructorId: v.instructorId || 'admin',
        isApproved: v.isApproved !== undefined ? !!v.isApproved : true
      });
    });
    state.rawCourses = list;
    state.courses = list.filter(filterVisibleContent);
    render();
  });

  db.ref('books').on('value', snap => {
    const list = [];
    snap.forEach(ch => {
      const v = ch.val() || {};
      const price = safeNum(v.price, 0);
      list.push({
        id: ch.key, title: v.title || 'eBook', author: v.author || 'Nazim Mustafa',
        pictureLink: fixUrl(v.pictureLink || v.pictureUrl || ''),
        driveLink: v.driveLink || '', price,
        isPaid: v.isPaid !== undefined ? !!v.isPaid : price > 0,
        description: v.description || '',
        instructorId: v.instructorId || 'admin',
        isApproved: v.isApproved !== undefined ? !!v.isApproved : true
      });
    });
    state.rawBooks = list;
    state.books = list.filter(filterVisibleContent);
    render();
  });

  db.ref('live_sessions').on('value', snap => {
    const list = [];
    snap.forEach(ch => {
      const v = ch.val() || {};
      const price = safeNum(v.price, 0);
      list.push({
        id: ch.key, title: v.title || 'Live Class',
        pictureUrl: fixUrl(v.pictureUrl || v.pic || ''),
        googleMeetLink: v.googleMeetLink || '',
        startTime: v.startTime || 'Every Saturday, 8:00 PM',
        price, isPaid: v.isPaid !== undefined ? !!v.isPaid : price > 0,
        instructor: v.instructor || 'Nazim Mustafa',
        instructorId: v.instructorId || 'admin',
        isApproved: v.isApproved !== undefined ? !!v.isApproved : true
      });
    });
    state.rawLive = list;
    state.liveSessions = list.filter(filterVisibleContent);
    render();
  });

  db.ref('tools').on('value', snap => {
    const list = [];
    snap.forEach(ch => {
      const v = ch.val() || {};
      const name = (v.shortName || v.name || v.title || '').trim();
      const pic = fixUrl(v.pictureUrl || v.iconUrl || v.pic || v.imageUrl || '');
      const url = fixUrl(v.websiteUrl || v.url || v.link || '');
      if (name && url) list.push({ id: ch.key, shortName: name, pictureUrl: pic, websiteUrl: url, timestamp: safeNum(v.timestamp, 0) });
    });
    state.tools = list.sort((a, b) => b.timestamp - a.timestamp);
    render();
  });

  db.ref('jobs').on('value', snap => {
    const list = [];
    snap.forEach(ch => { const v = ch.val() || {}; list.push({ id: ch.key, ...v }); });
    state.jobs = list.sort((a, b) => safeNum(b.timestamp) - safeNum(a.timestamp));
    render();
  });

  db.ref('notices').on('value', snap => {
    const list = [];
    snap.forEach(ch => { const v = ch.val() || {}; list.push({ id: ch.key, ...v }); });
    state.notices = list.sort((a, b) => safeNum(b.timestamp) - safeNum(a.timestamp));
    render();
  });

  db.ref('mock_tests').on('value', snap => {
    const list = [];
    snap.forEach(ch => {
      const v = ch.val() || {};
      const qs = Object.entries(v.questions || {}).map(([k, q]) => ({
        id: k, question: q.question || '',
        options: Array.isArray(q.options) ? q.options : Object.values(q.options || {}),
        correctAnswerIndex: safeNum(q.correctAnswerIndex, 0)
      })).filter(q => q.question);
      list.push({ id: ch.key, ...v, questions: qs });
    });
    state.mockTests = list.sort((a, b) => safeNum(b.timestamp) - safeNum(a.timestamp));
    render();
  });

  db.ref('instructor_applications').on('value', snap => {
    const fac = [];
    snap.forEach(ch => {
      const app = ch.val() || {};
      if (String(app.status || '').toLowerCase() === 'approved') {
        const d = app.details || {};
        fac.push({
          id: ch.key,
          name: app.userName || 'Verified Instructor',
          title: d.qualification || 'Certified Instructor',
          academyName: d.academyName || 'Mustafa Digital Academy',
          pictureUrl: fixUrl(d.cnicPictureUrl || ''),
          bio: 'Verified professional instructor at ' + (d.academyName || 'Mustafa Digital Academy') + '.',
          rating: 4.9
        });
      }
    });
    state.faculty = fac;
    render();
  });

  db.ref('community_posts').on('value', snap => {
    const list = [];
    snap.forEach(ch => { const v = ch.val() || {}; list.push({ id: ch.key, ...v }); });
    state.posts = list.sort((a, b) => safeNum(b.timestamp) - safeNum(a.timestamp));
    render();
  });

  db.ref('payment_methods').on('value', snap => {
    const list = [];
    snap.forEach(ch => { const v = ch.val() || {}; list.push({ id: ch.key, ...v }); });
    state.paymentMethods = list;
    render();
  });

  db.ref('support_settings').on('value', snap => {
    if (snap.exists()) state.supportSettings = { ...state.supportSettings, ...snap.val() };
  });

  db.ref('app_settings').on('value', snap => {
    if (snap.exists()) state.appSettings = { ...state.appSettings, ...snap.val() };
  });

  db.ref('settings/loyalty_config').on('value', snap => {
    if (snap.exists()) {
      const v = snap.val();
      state.loyaltyConfig = { rewardAmount: safeNum(v.rewardAmount, 100), requiredStamps: safeNum(v.requiredStamps, 12) };
      render();
    }
  });

  db.ref('verifications').on('value', snap => {
    const list = [];
    snap.forEach(ch => { const v = ch.val() || {}; list.push({ id: ch.key, ...v }); });
    state.verifications = list.sort((a, b) => safeNum(b.timestamp) - safeNum(a.timestamp));
    render();
  });
}

function detachUserListeners() {
  state.activeUserRefs.forEach(({ ref, fn }) => { try { ref.off('value', fn); } catch(_) {} });
  state.activeUserRefs = [];
  state.userListenersAttachedFor = null;
}

function attachUserListeners(fbUser) {
  if (!fbUser || state.userListenersAttachedFor === fbUser.uid) return;
  detachUserListeners();
  state.userListenersAttachedFor = fbUser.uid;
  const uid = fbUser.uid;

  const uRef = db.ref('users/' + uid);
  const uFn = snap => {
    if (snap.exists()) {
      const u = snap.val() || {};
      u.id = uid;
      u.purchasedCourseIds = Array.isArray(u.purchasedCourseIds) ? u.purchasedCourseIds : Object.values(u.purchasedCourseIds || {});
      u.purchasedBookIds = Array.isArray(u.purchasedBookIds) ? u.purchasedBookIds : Object.values(u.purchasedBookIds || {});
      u.paidLiveSessionIds = Array.isArray(u.paidLiveSessionIds) ? u.paidLiveSessionIds : Object.values(u.paidLiveSessionIds || {});
      u.passedQuizCourseIds = Array.isArray(u.passedQuizCourseIds) ? u.passedQuizCourseIds : Object.values(u.passedQuizCourseIds || {});
      u.claimedFreeCourseIds = Array.isArray(u.claimedFreeCourseIds) ? u.claimedFreeCourseIds : Object.values(u.claimedFreeCourseIds || {});
      if (!u.referralCode) {
        u.referralCode = generateReferralCode(uid);
        uRef.child('referralCode').set(u.referralCode);
      }
      state.user = u;
    } else {
      const email = fbUser.email || '';
      const newUser = {
        id: uid,
        name: fbUser.displayName || 'Student',
        email,
        role: email.toLowerCase() === 'nazimmustafa785@gmail.com' ? 'Admin' : 'Student',
        referralCode: generateReferralCode(uid),
        deviceId: getWebDeviceId(),
        purchasedCourseIds: [], purchasedBookIds: [], paidLiveSessionIds: [], passedQuizCourseIds: [], claimedFreeCourseIds: [],
        referralCount: 0, walletBalance: 0, totalEarned: 0
      };
      uRef.set(newUser);
      state.user = newUser;
    }
    if (state.rawCourses) state.courses = state.rawCourses.filter(filterVisibleContent);
    if (state.rawBooks) state.books = state.rawBooks.filter(filterVisibleContent);
    if (state.rawLive) state.liveSessions = state.rawLive.filter(filterVisibleContent);
    updateHeaderAuthBtn();
    render();
  };
  uRef.on('value', uFn);
  state.activeUserRefs.push({ ref: uRef, fn: uFn });

  const appRef = db.ref('instructor_applications/' + uid);
  const appFn = snap => { state.myInstructorApp = snap.exists() ? snap.val() : null; render(); };
  appRef.on('value', appFn);
  state.activeUserRefs.push({ ref: appRef, fn: appFn });

  const rwRef = db.ref('users/' + uid + '/reward_wallet');
  const rwFn = snap => {
    const w = snap.exists() ? (snap.val() || {}) : {};
    const t = todayStr(), m = monthStr();
    let changed = false;
    if (w.lastWatchDate && w.lastWatchDate !== t) { w.adsWatchedToday = 0; w.lastWatchDate = t; changed = true; }
    if (w.lastStampResetMonth && w.lastStampResetMonth !== m) {
      w.stampsCollected = 0; w.lastStampResetMonth = m; w.isLoyaltyRewardClaimed = false; changed = true;
    }
    if (changed && snap.exists()) rwRef.set(w);
    state.myRewardWallet = { balance: 0, adsWatchedToday: 0, stampsCollected: 0, ...w };
    render();
  };
  rwRef.on('value', rwFn);
  state.activeUserRefs.push({ ref: rwRef, fn: rwFn });

  const rhRef = db.ref('users/' + uid + '/reward_history');
  const rhFn = snap => {
    const arr = [];
    snap.forEach(ch => arr.push(ch.val()));
    state.myRewardHistory = arr.sort((a, b) => safeNum(b.timestamp) - safeNum(a.timestamp));
    render();
  };
  rhRef.on('value', rhFn);
  state.activeUserRefs.push({ ref: rhRef, fn: rhFn });

  const earnRef = db.ref('earnings').orderByChild('instructorId').equalTo(uid);
  const earnFn = snap => {
    const arr = [];
    snap.forEach(ch => arr.push(ch.val()));
    state.earnings = arr.sort((a, b) => safeNum(b.timestamp) - safeNum(a.timestamp));
    render();
  };
  earnRef.on('value', earnFn);
  state.activeUserRefs.push({ ref: earnRef, fn: earnFn });

  const wdRef = db.ref('withdrawals').orderByChild('instructorId').equalTo(uid);
  const wdFn = snap => {
    const arr = [];
    snap.forEach(ch => arr.push({ id: ch.key, ...ch.val() }));
    state.withdrawals = arr.sort((a, b) => safeNum(b.timestamp) - safeNum(a.timestamp));
    render();
  };
  wdRef.on('value', wdFn);
  state.activeUserRefs.push({ ref: wdRef, fn: wdFn });
}

auth.onAuthStateChanged(fbUser => {
  state.fbUser = fbUser;
  if (fbUser) {
    attachUserListeners(fbUser);
  } else {
    detachUserListeners();
    state.user = null;
    state.myInstructorApp = null;
    state.myRewardWallet = { balance: 0, adsWatchedToday: 0, stampsCollected: 0, isLoyaltyRewardClaimed: false };
    state.myRewardHistory = [];
    state.earnings = [];
    state.withdrawals = [];
    if (state.rawCourses) state.courses = state.rawCourses.filter(filterVisibleContent);
    if (state.rawBooks) state.books = state.rawBooks.filter(filterVisibleContent);
    if (state.rawLive) state.liveSessions = state.rawLive.filter(filterVisibleContent);
    updateHeaderAuthBtn();
    render();
  }
});

function updateHeaderAuthBtn() {
  const btn = document.getElementById('headerAuthBtn');
  if (!btn) return;
  btn.textContent = state.user ? (state.user.name?.split(' ')[0] || 'Account') : 'Sign In';
}

// =========================================================================
// 5. NAVIGATION & AUTHENTICATION
// =========================================================================
function navigate(route, param = null, pushHistory = true) {
  if (state.mockTimerInterval) { clearInterval(state.mockTimerInterval); state.mockTimerInterval = null; }
  state.route = route;
  state.routeParam = param;

  const landing = document.getElementById('landingSections');
  if (landing) {
    landing.style.display = (route === 'home' && !state.searchQuery.trim()) ? 'block' : 'none';
  }

  if (pushHistory) {
    const hash = '#' + route + (param ? '-' + param : '');
    if (window.location.hash !== hash) {
      history.pushState({ route: route, param: param }, '', hash);
    }
  }

  const appRoot = document.getElementById('appRoot');
  if (appRoot && route !== 'home') {
    appRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  render();
}
window.navigate = navigate;

function focusSearch() {
  if (state.route !== 'home') { navigate('home'); }
  setTimeout(() => {
    const i = document.getElementById('homeSearchInput');
    if (i) { i.focus(); i.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }, 100);
}

function handleHeaderAuth() {
  if (state.user) navigate('profile');
  else openAuthModal(false);
}

function openAuthModal(startSignUp = false) {
  openModal(startSignUp ? 'Create MDA Account' : 'Sign In to MDA', `
    <div style="display:flex;gap:8px;margin-bottom:14px;">
      <button class="btn btn-sm ${!startSignUp ? 'btn-primary' : 'btn-soft'}" style="flex:1;" onclick="openAuthModal(false)">Sign In</button>
      <button class="btn btn-sm ${startSignUp ? 'btn-primary' : 'btn-soft'}" style="flex:1;" onclick="openAuthModal(true)">Create Account</button>
    </div>
    <form onsubmit="submitAuthForm(event, ${startSignUp})">
      ${startSignUp ? `
        <div class="field"><label>Full Name</label><input class="input" id="authName" required placeholder="e.g. Ghulam Mustafa" /></div>
      ` : ''}
      <div class="field"><label>Email Address</label><input class="input" type="email" id="authEmail" required placeholder="name@gmail.com" /></div>
      <div class="field"><label>Password</label><input class="input" type="password" id="authPass" required minlength="6" placeholder="Minimum 6 characters" /></div>
      ${startSignUp ? `
        <div class="field"><label>Referral Code (Optional)</label><input class="input" id="authRef" placeholder="e.g. MDA-4QZ287" /></div>
      ` : ''}
      <div id="authErr" style="color:var(--danger);font-size:13px;font-weight:700;margin-bottom:10px;"></div>
      <button class="btn btn-primary btn-block" type="submit" id="authSubmitBtn">${startSignUp ? 'Create Account' : 'Sign In'}</button>
    </form>
  `);
}

async function submitAuthForm(e, isSignUp) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPass').value;
  const errEl = document.getElementById('authErr');
  const btn = document.getElementById('authSubmitBtn');
  errEl.textContent = '';

  if (isSignUp) {
    const domain = (email.split('@')[1] || '').toLowerCase();
    if (DISPOSABLE_DOMAINS.some(d => domain.includes(d))) {
      errEl.textContent = 'Temporary/disposable emails are blocked for security.';
      return;
    }
  }

  btn.disabled = true; btn.textContent = 'Please wait...';
  try {
    if (!isSignUp) {
      await auth.signInWithEmailAndPassword(email, pass);
      closeModal();
      showToast('Welcome back!');
    } else {
      const name = document.getElementById('authName').value.trim();
      const refInput = (document.getElementById('authRef').value || '').trim().toUpperCase();
      const res = await auth.createUserWithEmailAndPassword(email, pass);
      if (res.user) {
        await res.user.updateProfile({ displayName: name });
        const devId = getWebDeviceId();
        const newUser = {
          id: res.user.uid, name, email, password: pass,
          role: email.toLowerCase() === 'nazimmustafa785@gmail.com' ? 'Admin' : 'Student',
          referralCode: generateReferralCode(res.user.uid),
          referredByCode: refInput,
          deviceId: devId,
          purchasedCourseIds: [], purchasedBookIds: [], paidLiveSessionIds: [], passedQuizCourseIds: [], claimedFreeCourseIds: [],
          referralCount: 0, walletBalance: 0, totalEarned: 0
        };
        await db.ref('users/' + res.user.uid).set(newUser);
        if (refInput) {
          const allSnap = await db.ref('users').once('value');
          let dup = false, referrerUid = null, referrerCount = 0;
          allSnap.forEach(ch => {
            const u = ch.val() || {};
            if ((u.referralCode || '').toUpperCase() === refInput) {
              referrerUid = ch.key;
              referrerCount = safeNum(u.referralCount, 0);
            }
            if (u.deviceId === devId && u.referredByCode && ch.key !== res.user.uid) dup = true;
          });
          if (!dup && referrerUid) {
            await db.ref('users/' + referrerUid + '/referralCount').set(referrerCount + 1);
          }
        }
        closeModal();
        showToast('Account created successfully!');
      }
    }
  } catch (err) {
    errEl.textContent = err.message || 'Authentication failed.';
    btn.disabled = false; btn.textContent = isSignUp ? 'Create Account' : 'Sign In';
  }
}

function requireLogin() {
  if (state.user) return true;
  openAuthModal(false);
  showToast('Please sign in first to continue.');
  return false;
}

// =========================================================================
// 6. HOME, UNIVERSAL SEARCH & COURSES
// =========================================================================
function renderHome() {
  const q = state.searchQuery.trim().toLowerCase();
  const isSearching = q.length > 0;

  const html = `
    <div class="hero-welcome">
      <div>
        <div style="font-size:12px;opacity:0.9;font-weight:700;">Welcome ${state.user ? 'Back,' : 'to'}</div>
        <h2 style="margin:2px 0 4px 0;font-size:22px;font-weight:800;">${esc(state.user ? state.user.name : 'Mustafa Digital Academy')}</h2>
        <div style="font-size:12px;color:var(--accent);font-weight:700;">Courses • eBooks • Live Classes • Tools • Rewards</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-sm btn-warning" onclick="window.open('${WATCH_ADS_WEB_URL}','_blank','noopener')">📺 Watch & Earn Ads</button>
        <button class="btn btn-sm" style="background:rgba(255,255,255,0.18);color:#fff;" onclick="navigate('tools')">🛠️ Smart Tools</button>
      </div>
    </div>

    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input id="homeSearchInput" class="search-input" value="${esc(state.searchQuery)}"
        placeholder="Search courses, tools, books, live classes, jobs, faculty..."
        oninput="state.searchQuery=this.value;renderHomeSearchArea();" />
      <button id="searchClearBtn" class="search-clear" style="display:${isSearching ? 'block' : 'none'}"
        onclick="state.searchQuery='';document.getElementById('homeSearchInput').value='';renderHomeSearchArea();">✕</button>
    </div>
    <div id="homeDynamicArea"></div>
  `;
  document.getElementById('appRoot').innerHTML = html;
  renderHomeSearchArea();
}

function renderHomeSearchArea() {
  const box = document.getElementById('homeDynamicArea');
  const clr = document.getElementById('searchClearBtn');
  const landing = document.getElementById('landingSections');
  if (!box) return;
  const q = state.searchQuery.trim().toLowerCase();
  if (clr) clr.style.display = q ? 'block' : 'none';

  if (landing) {
    landing.style.display = (q.length > 0 || state.route !== 'home') ? 'none' : 'block';
  }

  if (q) {
    const mCourses = state.courses.filter(c => (c.title + ' ' + c.shortDescription + ' ' + c.categoryName).toLowerCase().includes(q));
    const mTools = getAllToolsForSearch().filter(t => t.shortName.toLowerCase().includes(q));
    const mBooks = state.books.filter(b => (b.title + ' ' + b.author).toLowerCase().includes(q));
    const mLive = state.liveSessions.filter(s => (s.title + ' ' + s.instructor).toLowerCase().includes(q));
    const mMock = state.mockTests.filter(m => (m.title + ' ' + m.category).toLowerCase().includes(q));
    const mJobs = state.jobs.filter(j => (j.title + ' ' + j.company + ' ' + j.location).toLowerCase().includes(q));
    const mNotices = state.notices.filter(n => (n.title + ' ' + n.message).toLowerCase().includes(q));
    const mFaculty = state.faculty.filter(f => (f.name + ' ' + f.title + ' ' + f.academyName).toLowerCase().includes(q));

    const total = mCourses.length + mTools.length + mBooks.length + mLive.length + mMock.length + mJobs.length + mNotices.length + mFaculty.length;
    if (total === 0) {
      box.innerHTML = `<div class="card" style="text-align:center;padding:34px;">
        <div style="font-size:32px;">🔍</div>
        <h3 style="margin:8px 0 4px;">No matching results found</h3>
        <p style="margin:0;color:var(--muted);font-size:13px;">Try searching with another keyword across MDA courses, tools, or portals.</p>
      </div>`;
      return;
    }

    let sHtml = `<div style="font-size:13px;font-weight:800;color:var(--primary);margin-bottom:12px;">Found ${total} matching results for "${esc(state.searchQuery)}"</div>`;
    if (mCourses.length) sHtml += `<h3 class="section-title" style="margin-bottom:10px;">📚 Courses (${mCourses.length})</h3><div class="grid-cards">${mCourses.map(courseCardHtml).join('')}</div>`;
    if (mTools.length) sHtml += `<h3 class="section-title" style="margin:18px 0 10px;">🛠️ Tools (${mTools.length})</h3><div class="grid-2">${mTools.map(toolTileHtml).join('')}</div>`;
    if (mBooks.length) sHtml += `<h3 class="section-title" style="margin:18px 0 10px;">📖 Books & eBooks (${mBooks.length})</h3><div class="grid-cards">${mBooks.map(bookCardHtml).join('')}</div>`;
    if (mLive.length) sHtml += `<h3 class="section-title" style="margin:18px 0 10px;">📺 Live Sessions (${mLive.length})</h3><div class="grid-cards">${mLive.map(liveCardHtml).join('')}</div>`;
    if (mMock.length) sHtml += `<h3 class="section-title" style="margin:18px 0 10px;">📝 Mock Tests (${mMock.length})</h3><div class="grid-cards">${mMock.map(mockCardHtml).join('')}</div>`;
    if (mJobs.length) sHtml += `<h3 class="section-title" style="margin:18px 0 10px;">💼 Jobs (${mJobs.length})</h3><div class="grid-cards">${mJobs.map(jobCardHtml).join('')}</div>`;
    if (mNotices.length) sHtml += `<h3 class="section-title" style="margin:18px 0 10px;">📢 Notices (${mNotices.length})</h3><div class="grid-cards">${mNotices.map(noticeCardHtml).join('')}</div>`;
    if (mFaculty.length) sHtml += `<h3 class="section-title" style="margin:18px 0 10px;">👩‍🏫 Faculty (${mFaculty.length})</h3><div class="grid-cards">${mFaculty.map(facultyCardHtml).join('')}</div>`;
    box.innerHTML = sHtml;
    return;
  }

  let out = '';

  if (state.banners.length > 0) {
    out += `<div class="banners-track">` + state.banners.map(b => `
      <div class="banner-slide" onclick="handleBannerClick('${esc(b.id)}')">
        ${b.imageUrl ? `<img src="${esc(b.imageUrl)}" alt="${esc(b.title)}" onerror="this.style.display='none'"/>` : ''}
        <div class="banner-overlay">
          <div>
            ${b.isBundle ? `<span class="badge" style="background:var(--accent);color:#2D0C57;margin-bottom:4px;">MEGA BUNDLE • $${Math.round(b.bundlePrice)}</span>` : ''}
            <div style="font-weight:800;font-size:15px;">${esc(b.title || 'Featured Academy Offer')}</div>
          </div>
          <span style="font-size:12px;font-weight:800;color:var(--accent);">Open →</span>
        </div>
      </div>
    `).join('') + `</div>`;
  }

  if (state.categories.length > 0) {
    out += `<div class="chips-row">
      <button class="chip ${state.selectedCategory === 'All' ? 'active' : ''}" onclick="state.selectedCategory='All';state.coursesVisibleCount=4;renderHomeSearchArea();">All</button>
      ${state.categories.map(c => `
        <button class="chip ${state.selectedCategory === c.name ? 'active' : ''}" onclick="state.selectedCategory='${esc(c.name)}';state.coursesVisibleCount=4;renderHomeSearchArea();">${esc(c.name)}</button>
      `).join('')}
    </div>`;
  }

  const filteredCourses = state.selectedCategory === 'All'
    ? state.courses
    : state.courses.filter(c => (c.categoryName || '').toLowerCase() === state.selectedCategory.toLowerCase());
  const visibleCourses = filteredCourses.slice(0, state.coursesVisibleCount);

  out += `<div class="section-head" style="margin-top:6px;">
    <div><p class="section-kicker">ACADEMY CURRICULUM</p><h2 class="section-title">Featured Courses (${filteredCourses.length})</h2></div>
  </div>`;

  if (visibleCourses.length > 0) {
    out += `<div class="grid-cards">${visibleCourses.map(courseCardHtml).join('')}</div>`;
    if (filteredCourses.length > visibleCourses.length) {
      out += `<div style="text-align:center;margin-top:16px;">
        <button class="btn btn-soft" onclick="state.coursesVisibleCount+=4;renderHomeSearchArea();">Load More Courses (${filteredCourses.length - visibleCourses.length} more)</button>
      </div>`;
    }
  } else {
    out += `<div class="card" style="text-align:center;color:var(--muted);padding:26px;">No courses available in this category yet.</div>`;
  }

  const portals = [];
  if (state.courses.length > 0) portals.push({ key:'courses_all', title:'Courses', sub: state.courses.length + ' Courses', icon:'🎓', bg:'#E3F2FD', count: state.courses.length, action:"state.selectedCategory='All';state.coursesVisibleCount=999;renderHomeSearchArea();window.scrollTo({top:220,behavior:'smooth'})" });
  portals.push({ key:'tools', title:'Smart Tools', sub: (5 + state.tools.length) + ' Tools', icon:'🛠️', bg:'#EDE7F6', count: 5 + state.tools.length, action:"navigate('tools')" });
  if (state.mockTests.length > 0) portals.push({ key:'mock', title:'Mock Tests', sub: state.mockTests.length + ' Exams', icon:'📝', bg:'#F3E5F5', count: state.mockTests.length, action:"navigate('mock_tests')" });
  if (state.books.length > 0) portals.push({ key:'library', title:'Books & eBooks', sub: state.books.length + ' Books', icon:'📚', bg:'#E8F5E9', count: state.books.length, action:"navigate('library')" });
  if (state.faculty.length > 0) portals.push({ key:'faculty', title:'Faculty', sub: state.faculty.length + ' Mentors', icon:'👩‍🏫', bg:'#FFF3E0', count: state.faculty.length, action:"navigate('faculty')" });
  if (state.jobs.length > 0) portals.push({ key:'jobs', title:'Jobs & Careers', sub: state.jobs.length + ' Openings', icon:'💼', bg:'#E0F7FA', count: state.jobs.length, action:"navigate('jobs')" });
  if (state.notices.length > 0) portals.push({ key:'notices', title:'Notice Board', sub: state.notices.length + ' Notices', icon:'📢', bg:'#FFEBEE', count: state.notices.length, action:"navigate('notices')" });
  portals.push({ key:'community', title:'Community', sub: state.posts.length + ' Posts', icon:'💬', bg:'#FFF8E1', count: state.posts.length, action:"navigate('community')" });

  out += `<div class="section-head">
    <div><p class="section-kicker">ACADEMY HUB & SERVICES</p><h2 class="section-title">Explore Learning & Career Portals</h2></div>
    <span class="pill-tag">★ ALL-IN-ONE</span>
  </div>
  <div class="grid-2">` + portals.map(p => `
    <div class="portal-card" onclick="${p.action}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="portal-icon" style="background:${p.bg};">${p.icon}</div>
        ${p.count > 0 ? `<span class="badge badge-paid">${p.count}</span>` : ''}
      </div>
      <div style="font-weight:800;font-size:15px;">${esc(p.title)}</div>
      <div style="font-size:12px;color:var(--muted);font-weight:600;">${esc(p.sub)}</div>
    </div>
  `).join('') + `</div>`;

  box.innerHTML = out;
}

function handleBannerClick(bannerId) {
  const b = state.banners.find(x => x.id === bannerId);
  if (!b) return;
  if (b.isBundle) { openBundleCheckout(b); return; }
  if (b.linkedCourseId) { navigate('course', b.linkedCourseId); return; }
  showToast(b.title || 'Mustafa Digital Academy');
}

function courseCardHtml(c) {
  const owned = hasCourseAccess(c.id);
  const isFree = !c.isPaid || safeNum(c.price) <= 0;
  const badge = owned && !isFree
    ? `<span class="badge badge-owned badge-float">✓ Enrolled</span>`
    : isFree
      ? `<span class="badge badge-free badge-float">FREE</span>`
      : `<span class="badge badge-paid badge-float">$${Math.round(c.discountPrice > 0 ? c.discountPrice : c.price)}</span>`;
  return `
    <div class="media-card" onclick="navigate('course','${esc(c.id)}')">
      <div class="media-thumb">
        <img src="${esc(c.pictureLink)}" alt="${esc(c.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085'"/>
        ${badge}
      </div>
      <div style="padding:14px;display:flex;flex-direction:column;gap:6px;flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
          <span style="font-size:11px;font-weight:800;color:#00838F;">${esc(c.categoryName || 'Course')}</span>
          ${!c.isApproved ? `<span class="badge badge-warn">Pending</span>` : ''}
        </div>
        <div style="font-weight:800;font-size:15px;line-height:1.3;">${esc(c.title)}</div>
        <div style="font-size:12px;color:var(--muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(c.shortDescription || 'Full video lectures & certificate included.')}</div>
        <div style="margin-top:auto;padding-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:700;color:var(--primary);">
          <span>🎬 ${c.lectures.length} Lectures</span>
          <span>Open Course →</span>
        </div>
      </div>
    </div>
  `;
}

// =========================================================================
// 7. COURSE DETAILS, VIDEO PLAYER (HD FIXED), CHECKOUT, QUIZ & CERTIFICATES
// =========================================================================
function renderCourseDetail(courseId) {
  const c = state.courses.find(x => x.id === courseId);
  if (!c) {
    document.getElementById('appRoot').innerHTML = `<div class="card">Course not found. <button class="btn btn-sm btn-primary" onclick="navigate('home')">Go Home</button></div>`;
    return;
  }
  const owned = hasCourseAccess(c.id);
  const effectivePrice = c.discountPrice > 0 ? c.discountPrice : c.price;
  const pendingOrder = state.user && state.verifications.find(v => v.userId === state.user.id && v.courseId === c.id && v.status === 'Pending');
  const freeCredits = userAvailableFreeCredits(state.user);
  const quizPassed = state.user && Array.isArray(state.user.passedQuizCourseIds) && state.user.passedQuizCourseIds.includes(c.id);

  const html = `
    <div class="sub-header">
      <button class="back-btn" onclick="navigate('home')">←</button>
      <div style="min-width:0;flex:1;">
        <div style="font-size:11px;font-weight:800;color:#00838F;">${esc(c.categoryName || 'Academy Course')}</div>
        <h2 style="margin:0;font-size:17px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(c.title)}</h2>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px;">
      <div id="coursePlayerSlot">
        <img src="${esc(c.pictureLink)}" alt="${esc(c.title)}" style="width:100%;max-height:280px;object-fit:cover;display:block;"/>
      </div>
      <div style="padding:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <span class="badge ${owned ? 'badge-free' : 'badge-paid'}">${owned ? '✓ Enrolled / Unlocked' : fmtPrice(effectivePrice)}</span>
            ${c.instructorId && c.instructorId !== 'admin' ? `<span class="badge badge-warn" style="margin-left:6px;">Instructor Course</span>` : `<span class="badge badge-owned" style="margin-left:6px;">Official MDA</span>`}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${!owned ? (pendingOrder
              ? `<span class="badge badge-warn">⏳ Payment Pending Admin Approval</span>`
              : `<button class="btn btn-primary btn-sm" onclick="openCheckoutModal({type:'course',id:'${esc(c.id)}',title:'${esc(c.title)}',amount:${effectivePrice},instructorId:'${esc(c.instructorId)}'})">💳 Enroll Now (${fmtPrice(effectivePrice)})</button>`
            ) : ''}
            ${!owned && freeCredits > 0 ? `<button class="btn btn-success btn-sm" onclick="claimFreeCourse('${esc(c.id)}')">🎁 Claim Free (${freeCredits} Credits)</button>` : ''}
            ${owned && c.mcqs.length > 0 ? `<button class="btn btn-secondary btn-sm" onclick="startCourseQuiz('${esc(c.id)}')">📝 ${quizPassed ? 'Retake Quiz (Passed ✓)' : 'Take Final Quiz'}</button>` : ''}
            ${owned && (quizPassed || c.mcqs.length === 0) ? `<button class="btn btn-warning btn-sm" onclick="openCourseCertificate('${esc(c.id)}')">🏆 Get Certificate</button>` : ''}
          </div>
        </div>
        <p style="margin:12px 0 0;color:#475569;font-size:14px;line-height:1.55;">${esc(c.shortDescription)}</p>
      </div>
    </div>

    <div class="card">
      <h3 style="margin:0 0 12px 0;font-size:16px;">🎬 Course Lectures (${c.lectures.length})</h3>
      ${c.lectures.length === 0 ? `<p style="color:var(--muted);margin:0;">Lectures are being uploaded.</p>` : c.lectures.map((lec, idx) => {
        const unlocked = owned || lec.isFree;
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px;border:1px solid var(--border);border-radius:12px;margin-bottom:8px;background:${unlocked ? '#fff' : '#F8FAFC'};">
            <div style="min-width:0;">
              <div style="font-weight:800;font-size:14px;">${idx + 1}. ${esc(lec.title)}</div>
              <div style="font-size:11px;color:${unlocked ? 'var(--success)' : 'var(--muted)'};font-weight:700;">
                ${lec.isFree ? 'Free Preview' : (owned ? 'Unlocked' : '🔒 Enroll to Watch')}
              </div>
            </div>
            <button class="btn btn-sm ${unlocked ? 'btn-primary' : 'btn-soft'}"
              onclick="${unlocked ? `playCourseLecture('${esc(lec.videoLink)}','${esc(lec.title)}')` : `openCheckoutModal({type:'course',id:'${esc(c.id)}',title:'${esc(c.title)}',amount:${effectivePrice},instructorId:'${esc(c.instructorId)}'})`}">
              ${unlocked ? '▶ Watch' : 'Unlock'}
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
  document.getElementById('appRoot').innerHTML = html;
}

// درست شدہ ایچ ڈی ویڈیو پلیئر (گوگل ڈرائیو اور یوٹیوب)
function playCourseLecture(rawUrl, title) {
  const slot = document.getElementById('coursePlayerSlot');
  if (!slot) return;
  const emb = embedVideoUrl(rawUrl);
  slot.innerHTML = `
    <div style="padding:10px 14px;background:#1E1B4B;color:#fff;font-weight:700;font-size:13px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">▶ Now Playing: ${esc(title)}</span>
      <a href="${esc(fixUrl(rawUrl))}" target="_blank" rel="noopener" style="color:var(--accent);font-size:12px;white-space:nowrap;flex-shrink:0;">Open External ↗</a>
    </div>
    <div class="video-player-wrap">
      <iframe class="video-frame" src="${esc(emb)}" allowfullscreen allow="autoplay; encrypted-media"></iframe>
    </div>
  `;
  slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function claimFreeCourse(courseId) {
  if (!requireLogin()) return;
  if (userAvailableFreeCredits(state.user) <= 0) return showToast('No free reward credits available.');
  const purchased = Array.from(new Set([...(state.user.purchasedCourseIds || []), courseId]));
  const claimed = Array.from(new Set([...(state.user.claimedFreeCourseIds || []), courseId]));
  await db.ref('users/' + state.user.id).update({ purchasedCourseIds: purchased, claimedFreeCourseIds: claimed });
  showToast('Congratulations! Course unlocked for FREE!');
}

function openBundleCheckout(banner) {
  openCheckoutModal({
    type: 'bundle', id: banner.id, title: banner.title || 'Mega Bundle',
    amount: safeNum(banner.bundlePrice, 0), instructorId: 'admin'
  });
}

function openCheckoutModal(item) {
  if (!requireLogin()) return;
  const isOfficial = !item.instructorId || item.instructorId === 'admin';
  const methodsHtml = state.paymentMethods.length === 0
    ? `<div class="card" style="background:#FFF8E1;margin-bottom:12px;font-size:13px;">Official payment accounts will be listed soon. You may contact support directly.</div>`
    : state.paymentMethods.map(m => `
        <div style="border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:8px;background:#F8FAFC;display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <div style="font-size:13px;">
            <div style="font-weight:800;color:var(--primary);">${esc(m.name || m.bankName || 'Account')}</div>
            <div>Account Title: <strong>${esc(m.accountName)}</strong></div>
            <div>Number: <strong>${esc(m.accountNumber)}</strong></div>
          </div>
          <button class="btn btn-sm btn-soft" type="button" onclick="copyText('${esc(m.accountNumber)}')">Copy</button>
        </div>
      `).join('');

  openModal('Complete Payment — ' + item.title, `
    <div style="background:var(--primary-soft);padding:12px;border-radius:12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-weight:700;font-size:13px;">Payable Amount:</span>
      <strong style="font-size:18px;color:var(--primary);">${fmtPrice(item.amount)}</strong>
    </div>
    <div style="font-weight:800;font-size:13px;margin-bottom:8px;">1. Send Payment:</div>
    ${methodsHtml}
    <form onsubmit="submitPaymentVerification(event)">
      <div class="field">
        <label>2. Enter Transaction ID (TID) / Reference Code ${isOfficial ? 'OR Loyalty TID (MDA-REW / MDA-LOYAL)' : ''}</label>
        <input class="input" id="checkoutTid" required placeholder="e.g. TRX987654321 or MDA-REW-123456" />
      </div>
      <div id="checkoutErr" style="color:var(--danger);font-size:13px;font-weight:700;margin-bottom:10px;"></div>
      <button class="btn btn-primary btn-block" id="checkoutBtn" type="submit">Submit for Approval</button>
    </form>
  `);
  state._pendingCheckoutItem = item;
}

async function submitPaymentVerification(e) {
  e.preventDefault();
  const item = state._pendingCheckoutItem;
  if (!item) return;
  const tid = document.getElementById('checkoutTid').value.trim();
  const errEl = document.getElementById('checkoutErr');
  const btn = document.getElementById('checkoutBtn');
  errEl.textContent = '';
  if (!tid) return;

  const upperTid = tid.toUpperCase();
  const isRewardOrLoyal = upperTid.startsWith('MDA-REW-') || upperTid.startsWith('MDA-LOYAL-');
  if (isRewardOrLoyal && item.instructorId && item.instructorId !== 'admin') {
    errEl.textContent = 'Reward Wallet & TIDs are valid ONLY on Official MDA Academy courses, not instructor courses.';
    return;
  }

  btn.disabled = true; btn.textContent = 'Verifying...';
  try {
    if (upperTid.startsWith('MDA-LOYAL-')) {
      const wSnap = await db.ref('users/' + state.user.id + '/reward_wallet').once('value');
      const w = wSnap.val() || {};
      if (safeNum(w.balance, 0) <= 0) {
        errEl.textContent = 'Your Loyalty Wallet balance is $0.00!';
        btn.disabled = false; btn.textContent = 'Submit for Approval';
        return;
      }
    } else if (upperTid.startsWith('MDA-REW-')) {
      const txSnap = await db.ref('wallet_transactions/' + upperTid).once('value');
      if (!txSnap.exists()) {
        errEl.textContent = 'Invalid Reward TID! No matching record found.';
        btn.disabled = false; btn.textContent = 'Submit for Approval';
        return;
      }
      const tx = txSnap.val();
      if (tx.isUsed) {
        errEl.textContent = 'This Reward TID has already been redeemed!';
        btn.disabled = false; btn.textContent = 'Submit for Approval';
        return;
      }
      const updTx = { ...tx, isUsed: true, usedForCourseId: item.id, usedForCourseTitle: item.title };
      await db.ref('wallet_transactions/' + upperTid).set(updTx);
      if (tx.userId) await db.ref('users/' + tx.userId + '/reward_history/' + upperTid).set(updTx);
    }

    const ref = db.ref('verifications').push();
    const payload = {
      id: ref.key,
      userId: state.user.id,
      userEmail: state.user.email,
      amount: safeNum(item.amount, 0),
      transactionId: tid,
      status: 'Pending',
      timestamp: Date.now(),
      courseId: item.type === 'course' ? item.id : null,
      courseTitle: item.type === 'course' ? item.title : '',
      bookId: item.type === 'book' ? item.id : null,
      bookTitle: item.type === 'book' ? item.title : '',
      liveSessionId: item.type === 'live' ? item.id : null,
      bundleId: item.type === 'bundle' ? item.id : null,
      bundleTitle: item.type === 'bundle' ? item.title : ''
    };
    await ref.set(payload);
    closeModal();
    showToast('Payment submitted! Access unlocks automatically once Admin approves.');
  } catch (err) {
    errEl.textContent = err.message || 'Submission failed.';
    btn.disabled = false; btn.textContent = 'Submit for Approval';
  }
}

function startCourseQuiz(courseId) {
  state.activeQuizCourseId = courseId;
  state.quizAnswers = {};
  state.quizSubmitted = false;
  navigate('quiz', courseId);
}

function renderQuizScreen() {
  const c = state.courses.find(x => x.id === state.activeQuizCourseId);
  if (!c) return navigate('home');
  let score = 0;
  if (state.quizSubmitted) {
    c.mcqs.forEach((q, idx) => { if (state.quizAnswers[idx] === q.correctAnswerIndex) score++; });
  }
  const pct = c.mcqs.length ? Math.round((score / c.mcqs.length) * 100) : 100;

  document.getElementById('appRoot').innerHTML = `
    <div class="sub-header">
      <button class="back-btn" onclick="navigate('course','${esc(c.id)}')">←</button>
      <div><h2 style="margin:0;font-size:17px;">Final Quiz: ${esc(c.title)}</h2><div style="font-size:12px;color:var(--muted);">Score 60% or above to unlock your Certificate</div></div>
    </div>
    ${state.quizSubmitted ? `
      <div class="card" style="margin-bottom:14px;background:${pct >= 60 ? 'var(--success-bg)' : 'var(--danger-bg)'};">
        <h3 style="margin:0 0 6px;">Result: ${score} / ${c.mcqs.length} (${pct}%)</h3>
        <p style="margin:0 0 10px;">${pct >= 60 ? 'Congratulations! You passed the course quiz.' : 'Please review and try again (minimum 60% required).'}</p>
        ${pct >= 60 ? `<button class="btn btn-warning btn-sm" onclick="openCourseCertificate('${esc(c.id)}', ${pct})">🏆 View & Download Certificate</button>` : `<button class="btn btn-primary btn-sm" onclick="startCourseQuiz('${esc(c.id)}')">Try Again</button>`}
      </div>
    ` : ''}
    <div class="card">
      ${c.mcqs.map((q, idx) => `
        <div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border);">
          <div style="font-weight:800;margin-bottom:8px;">Q${idx + 1}. ${esc(q.question)}</div>
          ${q.options.map((opt, oi) => {
            const picked = state.quizAnswers[idx] === oi;
            const isCorrect = q.correctAnswerIndex === oi;
            let bg = picked ? 'var(--primary-soft)' : '#F8FAFC';
            let border = picked ? 'var(--primary)' : 'var(--border)';
            if (state.quizSubmitted) {
              if (isCorrect) { bg = 'var(--success-bg)'; border = 'var(--success)'; }
              else if (picked && !isCorrect) { bg = 'var(--danger-bg)'; border = 'var(--danger)'; }
            }
            return `<div onclick="${state.quizSubmitted ? '' : `state.quizAnswers[${idx}]=${oi};renderQuizScreen();`}"
              style="padding:10px 12px;border-radius:10px;border:1.5px solid ${border};background:${bg};margin-bottom:6px;cursor:pointer;font-size:14px;font-weight:600;">
              ${esc(opt)}
            </div>`;
          }).join('')}
        </div>
      `).join('')}
      ${!state.quizSubmitted ? `<button class="btn btn-primary btn-block" onclick="submitCourseQuiz('${esc(c.id)}')">Submit Quiz</button>` : ''}
    </div>
  `;
}

async function submitCourseQuiz(courseId) {
  const c = state.courses.find(x => x.id === courseId);
  if (!c) return;
  state.quizSubmitted = true;
  let score = 0;
  c.mcqs.forEach((q, idx) => { if (state.quizAnswers[idx] === q.correctAnswerIndex) score++; });
  const pct = c.mcqs.length ? Math.round((score / c.mcqs.length) * 100) : 100;
  if (pct >= 60 && state.user) {
    const list = Array.from(new Set([...(state.user.passedQuizCourseIds || []), courseId]));
    await db.ref('users/' + state.user.id + '/passedQuizCourseIds').set(list);
  }
  renderQuizScreen();
}

async function openCourseCertificate(courseId, score = 95) {
  if (!requireLogin()) return;
  const c = state.courses.find(x => x.id === courseId);
  const certId = ('MDA-CERT-' + (state.user.id || 'U').slice(-4) + '-' + courseId.slice(-4)).toUpperCase();
  const cert = {
    id: certId,
    studentName: state.user.name,
    userEmail: state.user.email,
    userId: state.user.id,
    courseId, courseTitle: c ? c.title : 'Academy Course',
    score, issueDate: todayStr(),
    principalName: 'Nazim Mustafa',
    status: 'Verified'
  };
  await db.ref('issued_certificates/' + certId).set(cert);
  await db.ref('users/' + state.user.id + '/issuedCertificates/' + certId).set(cert);

  openModal('Official MDA Certificate', `
    <div id="certPrintArea" style="border:6px double var(--primary);padding:24px;border-radius:16px;text-align:center;background:#FFFDF7;">
      <div style="font-size:12px;font-weight:800;color:#00838F;letter-spacing:1.4px;">MUSTAFA DIGITAL ACADEMY</div>
      <h2 style="margin:6px 0 12px;color:var(--primary);font-size:24px;">Certificate of Completion</h2>
      <p style="margin:0;color:var(--muted);font-size:13px;">This is proudly presented to</p>
      <h3 style="margin:8px 0;font-size:22px;color:#111;border-bottom:2px solid #F59E0B;display:inline-block;padding:0 16px 4px;">${esc(cert.studentName)}</h3>
      <p style="margin:10px 0 4px;font-size:13px;color:var(--muted);">for successfully completing</p>
      <div style="font-weight:800;font-size:17px;color:var(--primary);margin-bottom:14px;">${esc(cert.courseTitle)}</div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#334155;margin-top:18px;padding-top:12px;border-top:1px solid #E2E8F0;">
        <div><strong>ID:</strong> ${esc(cert.id)}</div>
        <div><strong>Date:</strong> ${esc(cert.issueDate)}</div>
        <div><strong>Principal:</strong> ${esc(cert.principalName)}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;">
      <button class="btn btn-primary" style="flex:1;" onclick="window.print()">🖨️ Print / Save PDF</button>
      <button class="btn btn-soft" onclick="copyText('${esc(cert.id)}')">Copy ID</button>
    </div>
  `);
}

// =========================================================================
// 8. LIBRARY, LIVE SESSIONS & COMMUNITY
// =========================================================================
function bookCardHtml(b) {
  const owned = hasBookAccess(b.id);
  const isFree = !b.isPaid || safeNum(b.price) <= 0;
  return `
    <div class="media-card">
      <div class="media-thumb" style="height:150px;">
        <img src="${esc(b.pictureLink || 'https://images.unsplash.com/photo-1512820790803-83ca734da794')}" alt="${esc(b.title)}" onerror="this.src='https://images.unsplash.com/photo-1512820790803-83ca734da794'"/>
        <span class="badge ${owned ? 'badge-free' : 'badge-paid'} badge-float">${owned && !isFree ? '✓ Unlocked' : fmtPrice(b.price)}</span>
      </div>
      <div style="padding:14px;display:flex;flex-direction:column;gap:6px;flex:1;">
        <div style="font-weight:800;font-size:15px;">${esc(b.title)}</div>
        <div style="font-size:12px;color:var(--muted);">Author: ${esc(b.author)}</div>
        <div style="margin-top:auto;padding-top:8px;">
          ${owned
            ? `<a class="btn btn-success btn-sm btn-block" href="${esc(fixUrl(b.driveLink))}" target="_blank" rel="noopener">📖 Read / Download PDF</a>`
            : `<button class="btn btn-primary btn-sm btn-block" onclick="openCheckoutModal({type:'book',id:'${esc(b.id)}',title:'${esc(b.title)}',amount:${safeNum(b.price)},instructorId:'${esc(b.instructorId)}'})">💳 Buy eBook (${fmtPrice(b.price)})</button>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderLibrary() {
  document.getElementById('appRoot').innerHTML = `
    <div class="section-head" style="margin-top:0;">
      <div><p class="section-kicker">DIGITAL RESOURCES</p><h2 class="section-title">Books & eBooks Library (${state.books.length})</h2></div>
    </div>
    ${state.books.length === 0 ? `<div class="card" style="text-align:center;color:var(--muted);">No eBooks published yet.</div>` : `<div class="grid-cards">${state.books.map(bookCardHtml).join('')}</div>`}
  `;
}

function liveCardHtml(s) {
  const owned = hasLiveAccess(s.id);
  const isFree = !s.isPaid || safeNum(s.price) <= 0;
  return `
    <div class="media-card">
      <div class="media-thumb" style="height:150px;">
        <img src="${esc(s.pictureUrl || 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33')}" alt="${esc(s.title)}" onerror="this.src='https://images.unsplash.com/photo-1588702547923-7093a6c3ba33'"/>
        <span class="badge ${owned ? 'badge-free' : 'badge-paid'} badge-float">${owned && !isFree ? '✓ Joined' : fmtPrice(s.price)}</span>
      </div>
      <div style="padding:14px;display:flex;flex-direction:column;gap:6px;flex:1;">
        <div style="font-weight:800;font-size:15px;">${esc(s.title)}</div>
        <div style="font-size:12px;color:#00838F;font-weight:700;">🕒 ${esc(s.startTime)}</div>
        <div style="font-size:12px;color:var(--muted);">Instructor: ${esc(s.instructor)}</div>
        <div style="margin-top:auto;padding-top:8px;">
          ${owned
            ? `<a class="btn btn-secondary btn-sm btn-block" href="${esc(fixUrl(s.googleMeetLink))}" target="_blank" rel="noopener">🎥 Join Live Session</a>`
            : `<button class="btn btn-primary btn-sm btn-block" onclick="openCheckoutModal({type:'live',id:'${esc(s.id)}',title:'${esc(s.title)}',amount:${safeNum(s.price)},instructorId:'${esc(s.instructorId)}'})">🎟️ Register (${fmtPrice(s.price)})</button>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderLive() {
  document.getElementById('appRoot').innerHTML = `
    <div class="section-head" style="margin-top:0;">
      <div><p class="section-kicker">INTERACTIVE CLASSES</p><h2 class="section-title">Live Sessions (${state.liveSessions.length})</h2></div>
    </div>
    ${state.liveSessions.length === 0 ? `<div class="card" style="text-align:center;color:var(--muted);">No live sessions scheduled right now.</div>` : `<div class="grid-cards">${state.liveSessions.map(liveCardHtml).join('')}</div>`}
  `;
}

function renderCommunity() {
  document.getElementById('appRoot').innerHTML = `
    <div class="sub-header">
      <button class="back-btn" onclick="navigate('home')">←</button>
      <div><h2 style="margin:0;font-size:18px;">MDA Community Forum</h2><div style="font-size:12px;color:var(--muted);">Ask questions & connect with academy learners</div></div>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <form onsubmit="submitCommunityPost(event)">
        <div class="field"><input class="input" id="postTitle" required placeholder="Discussion title..." /></div>
        <div class="field"><textarea class="input" id="postDetails" rows="2" required placeholder="Write your question or update..."></textarea></div>
        <button class="btn btn-primary btn-sm" type="submit">Post to Community</button>
      </form>
    </div>
    ${state.posts.map(p => `
      <div class="card" style="margin-bottom:10px;">
        <div style="font-weight:800;font-size:15px;">${esc(p.title)}</div>
        <div style="font-size:12px;color:#00838F;font-weight:700;margin:2px 0 6px;">By ${esc(p.userName || 'Student')}</div>
        <div style="font-size:14px;color:#475569;">${esc(p.details)}</div>
      </div>
    `).join('')}
  `;
}

async function submitCommunityPost(e) {
  e.preventDefault();
  if (!requireLogin()) return;
  const title = document.getElementById('postTitle').value.trim();
  const details = document.getElementById('postDetails').value.trim();
  const ref = db.ref('community_posts').push();
  await ref.set({ id: ref.key, userId: state.user.id, userName: state.user.name, title, details, timestamp: Date.now() });
  e.target.reset();
  showToast('Post published!');
}

// =========================================================================
// 9. REWARDS & GOLDEN VIP LOYALTY CARD
// =========================================================================
function renderRewards() {
  const w = state.myRewardWallet || {};
  const adsToday = safeNum(w.adsWatchedToday, 0);
  const stamps = safeNum(w.stampsCollected, 0);
  const reqStamps = safeNum(state.loyaltyConfig.requiredStamps, 12);
  const rewardAmt = safeNum(state.loyaltyConfig.rewardAmount, 100);
  const refCount = safeNum(state.user?.referralCount, 0);
  const refLevel = userCalcLevel(state.user);
  const nextMile = userNextMilestone(state.user);
  const freeCredits = userAvailableFreeCredits(state.user);

  let stampsHtml = '';
  for (let i = 1; i <= reqStamps; i++) {
    const filled = i <= stamps;
    const isFinal = (i === reqStamps);
    const icon = filled ? '★' : (isFinal ? '🎁' : i);
    stampsHtml += `
      <div class="stamp-circle ${filled ? 'filled' : (isFinal ? 'final-goal' : '')}">
        <span>${icon}</span>
        <span class="s-num">#${i}</span>
      </div>
    `;
  }

  document.getElementById('appRoot').innerHTML = `
    <div class="section-head" style="margin-top:0;">
      <div><p class="section-kicker">EARN & SAVE</p><h2 class="section-title">Watch & Earn Rewards</h2></div>
    </div>

    <!-- Reward Balance Card -->
    <div class="card" style="background:linear-gradient(135deg,#4A148C,#7B1FA2);color:#fff;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:12px;opacity:0.85;font-weight:700;">REWARD WALLET BALANCE</div>
          <div style="font-size:34px;font-weight:800;">$${safeNum(w.balance, 0).toFixed(2)}</div>
          <div style="font-size:12px;color:var(--accent);font-weight:700;">Ads Watched Today (App Sync): ${adsToday} / 25</div>
        </div>
        <a href="${WATCH_ADS_WEB_URL}" target="_blank" rel="noopener" class="btn btn-warning" style="text-decoration:none;">
          📺 Watch Ads & Earn Now ↗
        </a>
      </div>
      <div style="margin-top:12px;background:rgba(255,255,255,0.12);padding:10px 12px;border-radius:12px;font-size:12px;">
        Reward Wallet & TIDs are valid exclusively on Official MDA Academy courses.
      </div>
    </div>

    <!-- 💎 ULTRA-MODERN VIP GOLDEN LOYALTY CARD -->
    <div class="loyalty-card">
      <div class="loyalty-head">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="loyalty-badge">🏅 VIP LOYALTY PASS</span>
            <span class="badge" style="background:#FFF3E0;color:#D97706;font-weight:800;">MONTHLY RESET</span>
          </div>
          <div style="font-size:13px;color:#475569;margin-top:6px;font-weight:600;">
            Collect all <strong>${reqStamps} stamps</strong> (1 per course purchase) to unlock your cash reward!
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px;font-weight:800;color:#92400E;letter-spacing:0.5px;">BONUS REWARD</div>
          <div class="loyalty-reward-amount">$${rewardAmt.toFixed(0)}</div>
        </div>
      </div>

      <div class="stamps-grid">
        ${stampsHtml}
      </div>

      <div class="loyalty-footer">
        <span class="loyalty-progress-pill">
          ⭐ Progress: ${stamps} / ${reqStamps} Stamps
        </span>
        ${w.loyaltyTid
          ? `<button class="btn btn-sm btn-soft" onclick="copyText('${esc(w.loyaltyTid)}')">Copy Master TID: ${esc(w.loyaltyTid)}</button>`
          : `<button class="btn btn-sm btn-gold-claim" onclick="claimLoyaltyBonus()">🎁 Claim $${rewardAmt.toFixed(0)} Loyalty Bonus</button>`
        }
      </div>
    </div>

    <!-- Refer & Earn Free Courses -->
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:16px;">🤝 Refer & Earn Free Courses</h3>
        <span class="badge badge-free">Level ${refLevel} • ${freeCredits} Free Credits</span>
      </div>
      ${state.user ? `
        <div style="margin:12px 0;padding:12px;border-radius:12px;background:var(--primary-soft);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div><div style="font-size:11px;color:var(--primary);font-weight:700;">YOUR REFERRAL CODE</div><strong style="font-size:18px;color:var(--primary);">${esc(state.user.referralCode)}</strong></div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-primary" onclick="copyText('${esc(state.user.referralCode)}')">Copy Code</button>
            <a class="btn btn-sm btn-success" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Join Mustafa Digital Academy (MDA) & learn digital skills! Use my referral code: ' + state.user.referralCode + ' - Website: ' + location.href)}">WhatsApp Share</a>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:6px;">
          <span>Progress to Next Level</span><span>${refCount} / ${nextMile} Joined</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, Math.round((refCount / nextMile) * 100))}%"></div></div>
      ` : `<p style="color:var(--muted);font-size:13px;">Sign in to get your referral code and track free course rewards.</p><button class="btn btn-primary btn-sm" onclick="openAuthModal(false)">Sign In</button>`}
    </div>

    <!-- Reward History -->
    <div class="card">
      <h3 style="margin:0 0 10px 0;font-size:16px;">🧾 Recent Reward TIDs (${state.myRewardHistory.length})</h3>
      ${state.myRewardHistory.length === 0 ? `<p style="color:var(--muted);font-size:13px;margin:0;">No reward transactions recorded yet.</p>` : state.myRewardHistory.slice(0, 15).map(tx => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);gap:8px;">
          <div>
            <div style="font-weight:800;font-size:13px;">${esc(tx.tid)} • $${safeNum(tx.amount).toFixed(2)}</div>
            <div style="font-size:11px;color:var(--muted);">${esc(tx.date || '')} • ${tx.isUsed ? 'Used' : 'Available'}</div>
          </div>
          <button class="btn btn-sm btn-soft" onclick="copyText('${esc(tx.tid)}')">Copy</button>
        </div>
      `).join('')}
    </div>
  `;
}

async function claimLoyaltyBonus() {
  if (!requireLogin()) return;
  const req = safeNum(state.loyaltyConfig.requiredStamps, 12);
  const rewardAmt = safeNum(state.loyaltyConfig.rewardAmount, 100);
  const stamps = safeNum(state.myRewardWallet?.stampsCollected, 0);
  if (stamps < req) return showToast(`You need ${req} stamps to claim (Currently ${stamps}/${req}).`);
  if (state.myRewardWallet?.isLoyaltyRewardClaimed) return showToast('Already claimed this month!');
  const masterTid = 'MDA-LOYAL-' + Math.floor(100000 + Math.random() * 899999);
  const newBal = Math.round((safeNum(state.myRewardWallet.balance, 0) + rewardAmt) * 100) / 100;
  const updWallet = { ...state.myRewardWallet, balance: newBal, isLoyaltyRewardClaimed: true, loyaltyTid: masterTid, lastGeneratedTid: masterTid };
  const tx = { tid: masterTid, userId: state.user.id, userEmail: state.user.email, amount: rewardAmt, timestamp: Date.now(), date: new Date().toLocaleString(), isUsed: false };
  await db.ref('users/' + state.user.id + '/reward_wallet').set(updWallet);
  await db.ref('users/' + state.user.id + '/reward_history/' + masterTid).set(tx);
  await db.ref('wallet_transactions/' + masterTid).set(tx);
  showToast('Loyalty Bonus $' + rewardAmt + ' added! TID: ' + masterTid);
}

// =========================================================================
// 10. SMART TOOLS HUB & 5 BUILT-IN TOOLS
// =========================================================================
const BUILT_IN_TOOLS = [
  { id: 'bi_calc', shortName: 'Calculator', icon: '🧮', builtInType: 'calc', isBuiltIn: true },
  { id: 'bi_yt', shortName: 'YT Thumbnail', icon: '🖼️', builtInType: 'yt_thumb', isBuiltIn: true },
  { id: 'bi_pic2link', shortName: 'Pic to Link', icon: '🔗', builtInType: 'pic_link', isBuiltIn: true },
  { id: 'bi_words', shortName: 'Word Counter', icon: '✍️', builtInType: 'word_count', isBuiltIn: true },
  { id: 'bi_qr', shortName: 'QR Generator', icon: '📱', builtInType: 'qr_gen', isBuiltIn: true }
];

function getAllToolsForSearch() { return [...BUILT_IN_TOOLS, ...state.tools]; }

function toolTileHtml(t) {
  return `
    <div class="tool-tile" onclick="openToolItem('${esc(t.id)}')">
      <div class="tool-avatar">
        ${t.pictureUrl ? `<img src="${esc(t.pictureUrl)}" alt="${esc(t.shortName)}" onerror="this.parentElement.textContent='🛠️'"/>` : (t.icon || '🛠️')}
      </div>
      <div style="font-weight:800;font-size:14px;">${esc(t.shortName)}</div>
      <span class="badge ${t.isBuiltIn ? 'badge-owned' : 'badge-paid'}">${t.isBuiltIn ? 'Built-In' : 'Web Tool'}</span>
    </div>
  `;
}

function renderTools() {
  const visibleAdminTools = state.tools.slice(0, state.toolsVisibleCount);
  document.getElementById('appRoot').innerHTML = `
    <div class="sub-header">
      <button class="back-btn" onclick="navigate('home')">←</button>
      <div><h2 style="margin:0;font-size:18px;">MDA Smart Tools Hub</h2><div style="font-size:12px;color:var(--muted);">Built-in utilities & Admin-curated web tools</div></div>
    </div>

    <h3 class="section-title" style="margin-bottom:10px;">⚡ Built-In Academy Tools (5)</h3>
    <div class="grid-2" style="margin-bottom:22px;">
      ${BUILT_IN_TOOLS.map(toolTileHtml).join('')}
    </div>

    ${state.tools.length > 0 ? `
      <h3 class="section-title" style="margin-bottom:10px;">🌐 More Web Tools (${state.tools.length})</h3>
      <div class="grid-2">${visibleAdminTools.map(toolTileHtml).join('')}</div>
      ${state.tools.length > visibleAdminTools.length ? `
        <div style="text-align:center;margin-top:14px;">
          <button class="btn btn-soft" onclick="state.toolsVisibleCount+=4;renderTools();">Load More Tools (${state.tools.length - visibleAdminTools.length} more)</button>
        </div>
      ` : ''}
    ` : ''}
  `;
}

function openToolItem(id) {
  const bi = BUILT_IN_TOOLS.find(x => x.id === id);
  if (bi) return openBuiltInToolModal(bi.builtInType);
  const t = state.tools.find(x => x.id === id);
  if (!t) return;
  openModal(t.shortName, `
    <div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="font-size:12px;color:var(--muted);word-break:break-all;">${esc(t.websiteUrl)}</span>
      <a class="btn btn-primary btn-sm" href="${esc(t.websiteUrl)}" target="_blank" rel="noopener">Open in New Tab ↗</a>
    </div>
    <iframe src="${esc(t.websiteUrl)}" style="width:100%;height:62vh;border:1px solid var(--border);border-radius:12px;background:#fff;"></iframe>
  `);
}

function openBuiltInToolModal(type) {
  if (type === 'calc') {
    state.calcExpr = '';
    openModal('Calculator', `
      <input id="calcDisp" class="input" readonly value="0" style="text-align:right;font-size:26px;font-weight:800;margin-bottom:12px;background:#F8FAFC;"/>
      <div class="calc-grid">
        ${['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='].map(k => `
          <button class="calc-btn ${['/','*','-','+','%','C','DEL'].includes(k) ? 'op' : ''} ${k === '=' ? 'eq' : ''}" onclick="calcPress('${k}')">${k}</button>
        `).join('')}
      </div>
    `);
  } else if (type === 'yt_thumb') {
    openModal('YouTube Thumbnail Downloader', `
      <div class="field"><label>Paste YouTube Video / Shorts URL</label><input class="input" id="ytUrlIn" placeholder="https://youtube.com/watch?v=..." /></div>
      <button class="btn btn-primary btn-block" onclick="extractYtThumbs()">Get HD Thumbnails</button>
      <div id="ytThumbRes" style="margin-top:14px;"></div>
    `);
  } else if (type === 'pic_link') {
    openModal('Picture to Link Generator', `
      <div class="field"><label>Select Image (JPG / PNG / WebP)</label><input class="input" type="file" accept="image/*" id="picFileIn" /></div>
      <button class="btn btn-primary btn-block" id="picUploadBtn" onclick="uploadToolImageToImgbb()">☁️ Upload & Generate Link</button>
      <div id="picLinkRes" style="margin-top:14px;"></div>
    `);
  } else if (type === 'word_count') {
    openModal('Word & Character Counter', `
      <textarea class="input" id="wcText" rows="6" placeholder="Paste or type your text here..." oninput="updateWordStats()"></textarea>
      <div id="wcStats" class="grid-2" style="margin-top:12px;"></div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn btn-soft btn-sm" onclick="copyText(document.getElementById('wcText').value)">Copy Text</button>
        <button class="btn btn-danger btn-sm" onclick="document.getElementById('wcText').value='';updateWordStats();">Clear</button>
      </div>
    `);
    updateWordStats();
  } else if (type === 'qr_gen') {
    openModal('QR Code Generator', `
      <div class="field"><label>Enter URL, Text, Phone, or Code</label><input class="input" id="qrTextIn" placeholder="https://..." /></div>
      <button class="btn btn-primary btn-block" onclick="generateQrNow()">Generate QR Code</button>
      <div id="qrBox" style="margin:16px auto;text-align:center;"></div>
      <button id="qrDlBtn" class="btn btn-success btn-block" style="display:none;" onclick="downloadQrPng()">⬇ Download QR PNG</button>
    `);
  }
}

function calcPress(k) {
  const d = document.getElementById('calcDisp');
  if (!d) return;
  if (k === 'C') state.calcExpr = '';
  else if (k === 'DEL') state.calcExpr = state.calcExpr.slice(0, -1);
  else if (k === '=') {
    try {
      const clean = state.calcExpr.replace(/[^0-9+\-*/.%()]/g, '');
      const val = clean ? Function('"use strict";return (' + clean + ')')() : 0;
      state.calcExpr = String(Number.isFinite(val) ? Math.round(val * 1000000) / 1000000 : 'Error');
    } catch(_) { state.calcExpr = 'Error'; }
  } else {
    if (state.calcExpr === 'Error') state.calcExpr = '';
    state.calcExpr += k;
  }
  d.value = state.calcExpr || '0';
}

function extractYtThumbs() {
  const id = ytVideoId(document.getElementById('ytUrlIn').value);
  const res = document.getElementById('ytThumbRes');
  if (!id) { res.innerHTML = `<div style="color:var(--danger);font-weight:700;">Invalid YouTube URL!</div>`; return; }
  const sizes = [
    { label: 'Max HD (1280x720)', url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg` },
    { label: 'Standard HQ (480x360)', url: `https://img.youtube.com/vi/${id}/hqdefault.jpg` }
  ];
  res.innerHTML = sizes.map(s => `
    <div class="card" style="margin-bottom:10px;padding:10px;">
      <div style="font-weight:800;font-size:13px;margin-bottom:6px;">${s.label}</div>
      <img src="${s.url}" style="width:100%;border-radius:10px;margin-bottom:8px;" />
      <div style="display:flex;gap:8px;">
        <a class="btn btn-primary btn-sm" style="flex:1;" href="${s.url}" target="_blank" rel="noopener">Open / Save ↗</a>
        <button class="btn btn-soft btn-sm" onclick="copyText('${s.url}')">Copy Link</button>
      </div>
    </div>
  `).join('');
}

async function uploadImageFileToImgbb(file) {
  const key = (state.appSettings?.imgbbApiKey || 'e58b8d4f434005e80391db6822a969cc').trim();
  const fd = new FormData();
  fd.append('image', file);
  const resp = await fetch('https://api.imgbb.com/1/upload?key=' + encodeURIComponent(key), { method: 'POST', body: fd });
  const data = await resp.json();
  if (!data.success) throw new Error(data.error?.message || 'ImgBB upload failed');
  return data.data.url;
}

async function uploadToolImageToImgbb() {
  const f = document.getElementById('picFileIn').files[0];
  const btn = document.getElementById('picUploadBtn');
  const res = document.getElementById('picLinkRes');
  if (!f) return showToast('Please choose an image first.');
  btn.disabled = true; btn.textContent = 'Uploading...';
  try {
    const url = await uploadImageFileToImgbb(f);
    res.innerHTML = `
      <div class="card" style="background:var(--success-bg);">
        <div style="font-weight:800;color:var(--success);margin-bottom:6px;">✓ Link Generated!</div>
        <input class="input" readonly value="${esc(url)}" style="margin-bottom:8px;" />
        <button class="btn btn-success btn-sm btn-block" onclick="copyText('${esc(url)}')">Copy Image Link</button>
      </div>
    `;
  } catch (err) {
    res.innerHTML = `<div style="color:var(--danger);font-weight:700;">${esc(err.message)}</div>`;
  } finally {
    btn.disabled = false; btn.textContent = '☁️ Upload & Generate Link';
  }
}

function updateWordStats() {
  const t = document.getElementById('wcText')?.value || '';
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  const chars = t.length;
  const noSp = t.replace(/\s/g, '').length;
  const sents = t.trim() ? t.split(/[.!?]+/).filter(x => x.trim()).length : 0;
  const statsBox = document.getElementById('wcStats');
  if (!statsBox) return;
  statsBox.innerHTML = `
    <div class="card" style="padding:10px;text-align:center;"><div style="font-size:20px;font-weight:800;color:var(--primary);">${words}</div><div style="font-size:11px;color:var(--muted);">Words</div></div>
    <div class="card" style="padding:10px;text-align:center;"><div style="font-size:20px;font-weight:800;color:var(--primary);">${chars}</div><div style="font-size:11px;color:var(--muted);">Characters</div></div>
    <div class="card" style="padding:10px;text-align:center;"><div style="font-size:20px;font-weight:800;color:#00838F;">${noSp}</div><div style="font-size:11px;color:var(--muted);">No Spaces</div></div>
    <div class="card" style="padding:10px;text-align:center;"><div style="font-size:20px;font-weight:800;color:#00838F;">${sents}</div><div style="font-size:11px;color:var(--muted);">Sentences</div></div>
  `;
}

function generateQrNow() {
  const txt = document.getElementById('qrTextIn').value.trim();
  const box = document.getElementById('qrBox');
  if (!txt) return showToast('Enter text or URL first.');
  box.innerHTML = '';
  if (typeof QRCode === 'undefined') { box.innerHTML = '<div style="color:var(--danger);">QR library offline.</div>'; return; }
  new QRCode(box, { text: txt, width: 220, height: 220, colorDark: '#4A148C', colorLight: '#ffffff' });
  document.getElementById('qrDlBtn').style.display = 'inline-flex';
}

function downloadQrPng() {
  const canvas = document.querySelector('#qrBox canvas');
  if (!canvas) return;
  const a = document.createElement('a');
  a.download = 'MDA-QR-' + Date.now() + '.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}

// =========================================================================
// 11. MOCK TESTS, JOBS, NOTICES & FACULTY
// =========================================================================
function mockCardHtml(m) {
  return `
    <div class="card" style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="badge badge-paid">${esc(m.category || 'General')}</span>
        <span style="font-size:12px;color:var(--muted);font-weight:700;">⏱ ${safeNum(m.durationMinutes, 15)} Mins</span>
      </div>
      <div style="font-weight:800;font-size:16px;">${esc(m.title)}</div>
      <div style="font-size:13px;color:var(--muted);">${esc(m.description || '')}</div>
      <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;padding-top:8px;">
        <span style="font-size:12px;font-weight:700;color:var(--success);">Questions: ${m.questions.length} • Pass: ${safeNum(m.passingMarks, 70)}%</span>
        <button class="btn btn-primary btn-sm" onclick="startMockTest('${esc(m.id)}')">▶ Start Exam</button>
      </div>
    </div>
  `;
}

function renderMockTests() {
  if (state.activeMockTest) {
    const m = state.activeMockTest;
    let score = 0;
    if (state.mockSubmitted) m.questions.forEach((q, i) => { if (state.mockAnswers[i] === q.correctAnswerIndex) score++; });
    const pct = m.questions.length ? Math.round((score / m.questions.length) * 100) : 0;
    const mins = Math.floor(state.mockSecondsLeft / 60), secs = state.mockSecondsLeft % 60;
    document.getElementById('appRoot').innerHTML = `
      <div class="sub-header">
        <button class="back-btn" onclick="state.activeMockTest=null;navigate('mock_tests')">←</button>
        <div style="flex:1;"><h2 style="margin:0;font-size:17px;">${esc(m.title)}</h2></div>
        <span class="badge badge-warn">⏱ ${mins}:${String(secs).padStart(2,'0')}</span>
      </div>
      ${state.mockSubmitted ? `<div class="card" style="margin-bottom:14px;background:${pct >= m.passingMarks ? 'var(--success-bg)' : 'var(--danger-bg)'};">
        <h3 style="margin:0;">Score: ${score}/${m.questions.length} (${pct}%) — ${pct >= m.passingMarks ? 'PASSED ✓' : 'Try Again'}</h3>
      </div>` : ''}
      <div class="card">
        ${m.questions.map((q, idx) => `
          <div style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border);">
            <div style="font-weight:800;margin-bottom:8px;">Q${idx + 1}. ${esc(q.question)}</div>
            ${q.options.map((o, oi) => {
              const picked = state.mockAnswers[idx] === oi;
              const right = q.correctAnswerIndex === oi;
              let bg = picked ? 'var(--primary-soft)' : '#F8FAFC';
              if (state.mockSubmitted) { if (right) bg = 'var(--success-bg)'; else if (picked) bg = 'var(--danger-bg)'; }
              return `<div onclick="${state.mockSubmitted ? '' : `state.mockAnswers[${idx}]=${oi};renderMockTests();`}"
                style="padding:10px;border-radius:10px;border:1px solid var(--border);background:${bg};margin-bottom:6px;cursor:pointer;font-size:14px;font-weight:600;">${esc(o)}</div>`;
            }).join('')}
          </div>
        `).join('')}
        ${!state.mockSubmitted ? `<button class="btn btn-primary btn-block" onclick="state.mockSubmitted=true;clearInterval(state.mockTimerInterval);renderMockTests();">Submit Exam</button>` : `<button class="btn btn-soft btn-block" onclick="state.activeMockTest=null;renderMockTests();">Back to All Mock Tests</button>`}
      </div>
    `;
    return;
  }

  const cats = ['All', ...Array.from(new Set(state.mockTests.map(m => m.category || 'General')))];
  const list = state.mockTestsFilter === 'All' ? state.mockTests : state.mockTests.filter(m => (m.category || 'General') === state.mockTestsFilter);
  document.getElementById('appRoot').innerHTML = `
    <div class="sub-header">
      <button class="back-btn" onclick="navigate('home')">←</button>
      <div><h2 style="margin:0;font-size:18px;">Online Mock Tests</h2><div style="font-size:12px;color:var(--muted);">Practice exams & instant evaluations</div></div>
    </div>
    <div class="chips-row">${cats.map(c => `<button class="chip ${state.mockTestsFilter === c ? 'active' : ''}" onclick="state.mockTestsFilter='${esc(c)}';renderMockTests();">${esc(c)}</button>`).join('')}</div>
    <div class="grid-cards">${list.map(mockCardHtml).join('')}</div>
  `;
}

function startMockTest(id) {
  const m = state.mockTests.find(x => x.id === id);
  if (!m) return;
  state.activeMockTest = m;
  state.mockAnswers = {};
  state.mockSubmitted = false;
  state.mockSecondsLeft = safeNum(m.durationMinutes, 15) * 60;
  clearInterval(state.mockTimerInterval);
  state.mockTimerInterval = setInterval(() => {
    if (state.mockSecondsLeft > 0) { state.mockSecondsLeft--; if (state.route === 'mock_tests') renderMockTests(); }
    else { state.mockSubmitted = true; clearInterval(state.mockTimerInterval); renderMockTests(); }
  }, 1000);
  navigate('mock_tests');
}

function jobCardHtml(j) {
  const url = fixUrl(j.applyUrl || '');
  return `
    <div class="card" style="display:flex;flex-direction:column;gap:6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;"><span class="badge badge-owned">${esc(j.type || 'Full-time')}</span><span style="font-size:11px;color:var(--muted);">${esc(j.date || '')}</span></div>
      <div style="font-weight:800;font-size:16px;">${esc(j.title)}</div>
      <div style="font-size:13px;font-weight:700;color:var(--primary);">${esc(j.company)} • ${esc(j.location)}</div>
      <div style="font-size:13px;font-weight:800;color:var(--success);">💰 ${esc(j.salary || '')}</div>
      <div style="font-size:13px;color:var(--muted);">${esc(j.description || '')}</div>
      ${url ? `<a class="btn btn-primary btn-sm" style="margin-top:auto;" href="${esc(url)}" target="_blank" rel="noopener">Apply Now ↗</a>` : ''}
    </div>
  `;
}

function renderJobs() {
  document.getElementById('appRoot').innerHTML = `
    <div class="sub-header">
      <button class="back-btn" onclick="navigate('home')">←</button>
      <div><h2 style="margin:0;font-size:18px;">Jobs & Career Portal</h2><div style="font-size:12px;color:var(--muted);">Verified remote & local opportunities</div></div>
    </div>
    <div class="field"><input class="input" id="jobsSearchIn" placeholder="Search job title or company..." value="${esc(state.jobsSearch)}" oninput="state.jobsSearch=this.value;renderJobsList();"/></div>
    <div id="jobsListArea"></div>
  `;
  renderJobsList();
}

function renderJobsList() {
  const box = document.getElementById('jobsListArea');
  if (!box) return;
  const types = ['All', 'Full-time', 'Part-time', 'Remote', 'Freelance', 'Internship'];
  const q = state.jobsSearch.toLowerCase();
  const list = state.jobs.filter(j => (state.jobsFilter === 'All' || (j.type || '').toLowerCase() === state.jobsFilter.toLowerCase()) && (!q || (j.title + ' ' + j.company + ' ' + j.location).toLowerCase().includes(q)));
  box.innerHTML = `
    <div class="chips-row">${types.map(t => `<button class="chip ${state.jobsFilter === t ? 'active' : ''}" onclick="state.jobsFilter='${t}';renderJobsList();">${t}</button>`).join('')}</div>
    <div class="grid-cards">${list.map(jobCardHtml).join('')}</div>
  `;
}

function noticeCardHtml(n) {
  return `
    <div class="card" style="border-left:4px solid ${n.isImportant ? 'var(--danger)' : 'var(--primary)'};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span class="badge ${n.isImportant ? 'badge-warn' : 'badge-paid'}">${esc(n.category || 'Announcement')}</span>
        <span style="font-size:11px;color:var(--muted);">${esc(n.date || '')}</span>
      </div>
      <div style="font-weight:800;font-size:15px;margin-bottom:4px;">${esc(n.title)}</div>
      <div style="font-size:13px;color:#475569;line-height:1.5;">${esc(n.message || '')}</div>
    </div>
  `;
}

function renderNotices() {
  const cats = ['All', ...Array.from(new Set(state.notices.map(n => n.category || 'Announcement')))];
  const list = state.noticesFilter === 'All' ? state.notices : state.notices.filter(n => (n.category || 'Announcement') === state.noticesFilter);
  document.getElementById('appRoot').innerHTML = `
    <div class="sub-header">
      <button class="back-btn" onclick="navigate('home')">←</button>
      <div><h2 style="margin:0;font-size:18px;">Official Notice Board</h2></div>
    </div>
    <div class="chips-row">${cats.map(c => `<button class="chip ${state.noticesFilter === c ? 'active' : ''}" onclick="state.noticesFilter='${esc(c)}';renderNotices();">${esc(c)}</button>`).join('')}</div>
    <div class="grid-cards">${list.map(noticeCardHtml).join('')}</div>
  `;
}

function facultyCardHtml(f) {
  return `
    <div class="card" style="display:flex;gap:12px;align-items:center;">
      <div style="width:62px;height:62px;border-radius:50%;overflow:hidden;background:var(--primary-soft);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--primary);flex-shrink:0;">
        ${f.pictureUrl ? `<img src="${esc(f.pictureUrl)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.remove()"/>` : esc((f.name || 'F').charAt(0).toUpperCase())}
      </div>
      <div style="min-width:0;">
        <div style="font-weight:800;font-size:15px;">${esc(f.name)}</div>
        <div style="font-size:12px;color:#00838F;font-weight:700;">${esc(f.title)} • ${esc(f.academyName)}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:3px;">⭐ ${f.rating} Verified Mentor</div>
      </div>
    </div>
  `;
}

function renderFaculty() {
  document.getElementById('appRoot').innerHTML = `
    <div class="sub-header">
      <button class="back-btn" onclick="navigate('home')">←</button>
      <div><h2 style="margin:0;font-size:18px;">Verified Academy Faculty</h2></div>
    </div>
    <div class="grid-cards">${state.faculty.map(facultyCardHtml).join('')}</div>
  `;
}

// =========================================================================
// 12. PROFILE & INSTRUCTOR DASHBOARD
// =========================================================================
function renderProfile() {
  if (!state.user) {
    document.getElementById('appRoot').innerHTML = `
      <div class="card" style="text-align:center;padding:38px 20px;">
        <div style="font-size:40px;margin-bottom:8px;">👤</div>
        <h2 style="margin:0 0 6px;">Sign In to Your MDA Account</h2>
        <p style="color:var(--muted);margin:0 0 18px;font-size:14px;">Access your enrolled courses, certificates, referral rewards, and instructor dashboard.</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="openAuthModal(false)">Sign In</button>
          <button class="btn btn-outline" onclick="openAuthModal(true)">Create Free Account</button>
        </div>
      </div>
    `;
    return;
  }

  const u = state.user;
  const purchased = state.courses.filter(c => hasCourseAccess(c.id) && c.isPaid);
  const instrUnlocked = isInstructorUnlocked();
  const appPending = state.myInstructorApp && String(state.myInstructorApp.status).toLowerCase() === 'pending';
  const waDigits = (state.supportSettings.whatsappNumber || '').replace(/[^0-9]/g, '');

  document.getElementById('appRoot').innerHTML = `
    <div class="card" style="background:linear-gradient(135deg,#4A148C,#6A1B9A);color:#fff;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="margin:0;font-size:21px;">${esc(u.name)}</h2>
          <div style="font-size:13px;opacity:0.85;">${esc(u.email)}</div>
          <span class="badge" style="margin-top:6px;background:var(--accent);color:#2D0C57;">${esc(u.role || 'Student')}</span>
        </div>
        <button class="btn btn-sm" style="background:rgba(255,255,255,0.18);color:#fff;" onclick="auth.signOut().then(()=>showToast('Signed out'))">🚪 Logout</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      ${instrUnlocked
        ? `<button class="btn btn-primary btn-block" style="padding:14px;" onclick="navigate('instructor_dash')">📊 OPEN INSTRUCTOR DASHBOARD</button>`
        : appPending
          ? `<div style="text-align:center;padding:8px;color:var(--warning);font-weight:800;">⏳ Your Instructor Application is Pending Admin Approval</div>`
          : `<button class="btn btn-soft btn-block" onclick="openApplyInstructorModal()">🎓 Apply to Become an Instructor</button>`
      }
    </div>

    <div class="grid-2" style="margin-bottom:16px;">
      <button class="btn btn-outline" onclick="openCertVerifierModal()">🔍 Verify Certificate ID</button>
      <a class="btn btn-success" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Learn digital skills with Mustafa Digital Academy (MDA)! Website: ' + location.href)}">📲 Share App on WhatsApp</a>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <h3 style="margin:0 0 12px 0;font-size:16px;">🎓 My Purchased Courses (${purchased.length})</h3>
      ${purchased.length === 0 ? `<p style="color:var(--muted);font-size:13px;margin:0;">Enrolled paid courses appear here once approved by Admin. <button class="btn btn-sm btn-soft" onclick="navigate('home')">Browse Courses</button></p>` : `<div class="grid-cards">${purchased.map(courseCardHtml).join('')}</div>`}
    </div>

    <div class="card">
      <h3 style="margin:0 0 10px 0;font-size:16px;">📞 Official Support & Policies</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${waDigits ? `<a class="btn btn-sm btn-success" href="https://wa.me/${waDigits}" target="_blank" rel="noopener">WhatsApp Support</a>` : ''}
        ${state.supportSettings.whatsappChannelUrl ? `<a class="btn btn-sm btn-secondary" href="${esc(fixUrl(state.supportSettings.whatsappChannelUrl))}" target="_blank" rel="noopener">WhatsApp Channel</a>` : ''}
        ${state.supportSettings.youtubeUrl ? `<a class="btn btn-sm btn-danger" href="${esc(fixUrl(state.supportSettings.youtubeUrl))}" target="_blank" rel="noopener">YouTube</a>` : ''}
        ${state.supportSettings.facebookUrl ? `<a class="btn btn-sm btn-primary" href="${esc(fixUrl(state.supportSettings.facebookUrl))}" target="_blank" rel="noopener">Facebook</a>` : ''}
        ${state.supportSettings.privacyPolicyUrl ? `<a class="btn btn-sm btn-soft" href="${esc(fixUrl(state.supportSettings.privacyPolicyUrl))}" target="_blank" rel="noopener">Privacy Policy</a>` : ''}
      </div>
    </div>
  `;
}

function openCertVerifierModal() {
  openModal('Verify Official MDA Certificate', `
    <div class="field"><label>Certificate ID</label><input class="input" id="verifyCertIn" placeholder="e.g. MDA-CERT-..." /></div>
    <button class="btn btn-primary btn-block" onclick="runCertVerify()">Verify Now</button>
    <div id="verifyCertRes" style="margin-top:12px;"></div>
  `);
}

async function runCertVerify() {
  const id = document.getElementById('verifyCertIn').value.trim().toUpperCase();
  const box = document.getElementById('verifyCertRes');
  if (!id) return;
  const snap = await db.ref('issued_certificates/' + id).once('value');
  if (!snap.exists()) { box.innerHTML = `<div style="color:var(--danger);font-weight:700;">Certificate ID not found in MDA records.</div>`; return; }
  const c = snap.val();
  box.innerHTML = `<div class="card" style="background:var(--success-bg);">
    <div style="font-weight:800;color:var(--success);">✓ Verified MDA Certificate</div>
    <div style="font-size:13px;margin-top:6px;"><strong>Student:</strong> ${esc(c.studentName)}<br/><strong>Course:</strong> ${esc(c.courseTitle)}<br/><strong>Issue Date:</strong> ${esc(c.issueDate)}<br/><strong>Status:</strong> ${esc(c.status)}</div>
  </div>`;
}

function openApplyInstructorModal() {
  if (!requireLogin()) return;
  openModal('Apply as Instructor', `
    <form onsubmit="submitInstructorApp(event)">
      <div class="field"><label>Academy / Channel Name</label><input class="input" id="appAcad" required /></div>
      <div class="field"><label>Father Name</label><input class="input" id="appFather" required /></div>
      <div class="field"><label>Mobile / WhatsApp Number</label><input class="input" id="appMobile" required /></div>
      <div class="field"><label>City / Address</label><input class="input" id="appAddr" required /></div>
      <div class="field"><label>CNIC Number</label><input class="input" id="appCnic" required /></div>
      <div class="field"><label>Qualification / Skills</label><input class="input" id="appQual" required /></div>
      <div class="field"><label>CNIC / Profile Photo (Optional Upload via ImgBB)</label><input class="input" type="file" accept="image/*" id="appCnicFile" /></div>
      <button class="btn btn-primary btn-block" id="appSubmitBtn" type="submit">Submit Application</button>
    </form>
  `);
}

async function submitInstructorApp(e) {
  e.preventDefault();
  const btn = document.getElementById('appSubmitBtn');
  btn.disabled = true; btn.textContent = 'Submitting...';
  try {
    let picUrl = '';
    const f = document.getElementById('appCnicFile').files[0];
    if (f) picUrl = await uploadImageFileToImgbb(f);
    const payload = {
      id: state.user.id, userId: state.user.id, userName: state.user.name, userEmail: state.user.email,
      details: {
        academyName: document.getElementById('appAcad').value.trim(),
        fatherName: document.getElementById('appFather').value.trim(),
        mobileNumber: document.getElementById('appMobile').value.trim(),
        address: document.getElementById('appAddr').value.trim(),
        cnicNumber: document.getElementById('appCnic').value.trim(),
        qualification: document.getElementById('appQual').value.trim(),
        cnicPictureUrl: picUrl
      },
      status: 'Pending',
      timestamp: Date.now()
    };
    await db.ref('instructor_applications/' + state.user.id).set(payload);
    closeModal();
    showToast('Instructor application submitted!');
  } catch (err) {
    showToast(err.message || 'Failed');
    btn.disabled = false; btn.textContent = 'Submit Application';
  }
}

function renderInstructorDash() {
  if (!isInstructorUnlocked()) return navigate('profile');
  const u = state.user;
  const myCourses = state.courses.filter(c => c.instructorId === u.id);
  const myBooks = state.books.filter(b => b.instructorId === u.id);
  const myLive = state.liveSessions.filter(s => s.instructorId === u.id);

  document.getElementById('appRoot').innerHTML = `
    <div class="sub-header">
      <button class="back-btn" onclick="navigate('profile')">←</button>
      <div><h2 style="margin:0;font-size:18px;">Instructor Dashboard</h2><div style="font-size:12px;color:var(--muted);">80% Revenue Share • Manage Courses, Books & Live Classes</div></div>
    </div>

    <div class="card" style="background:linear-gradient(135deg,#00695C,#00897B);color:#fff;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
      <div>
        <div style="font-size:12px;opacity:0.85;">AVAILABLE EARNINGS WALLET</div>
        <div style="font-size:30px;font-weight:800;">$${safeNum(u.walletBalance, 0).toFixed(2)}</div>
        <div style="font-size:12px;opacity:0.9;">Total Earned: $${safeNum(u.totalEarned, 0).toFixed(2)}</div>
      </div>
      <button class="btn btn-warning btn-sm" onclick="openInstructorWithdrawModal()">💸 Request Withdrawal</button>
    </div>

    <div class="grid-2" style="margin-bottom:16px;">
      <button class="btn btn-primary" onclick="openInstrAddCourseModal()">+ Add New Course</button>
      <button class="btn btn-secondary" onclick="openInstrAddBookModal()">+ Add eBook</button>
      <button class="btn btn-success" onclick="openInstrAddLiveModal()">+ Add Live Session</button>
    </div>

    <div class="card" style="margin-bottom:14px;">
      <h3 style="margin:0 0 10px 0;font-size:16px;">My Uploaded Content</h3>
      <div style="font-size:13px;color:var(--muted);margin-bottom:8px;">Courses: ${myCourses.length} • Books: ${myBooks.length} • Live: ${myLive.length}</div>
      ${[...myCourses.map(x => ({t:x.title,k:'Course',ok:x.isApproved})), ...myBooks.map(x => ({t:x.title,k:'Book',ok:x.isApproved})), ...myLive.map(x => ({t:x.title,k:'Live',ok:x.isApproved}))].map(item => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
          <strong>[${item.k}] ${esc(item.t)}</strong>
          <span class="badge ${item.ok ? 'badge-free' : 'badge-warn'}">${item.ok ? 'Approved' : 'Pending'}</span>
        </div>
      `).join('') || '<div style="font-size:13px;color:var(--muted);">No uploads yet.</div>'}
    </div>

    <div class="card">
      <h3 style="margin:0 0 10px 0;font-size:16px;">Withdrawal History (${state.withdrawals.length})</h3>
      ${state.withdrawals.map(w => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
          <div><strong>Net: $${safeNum(w.netAmount).toFixed(2)}</strong> (${esc(w.bankName)})</div>
          <span class="badge ${w.status === 'Approved' ? 'badge-free' : 'badge-warn'}">${esc(w.status)}</span>
        </div>
      `).join('') || '<div style="font-size:13px;color:var(--muted);">No withdrawal requests yet.</div>'}
    </div>
  `;
}

function openInstrAddCourseModal() {
  openModal('Add Course (Admin Approval Required)', `
    <form onsubmit="submitInstrCourse(event)">
      <div class="field"><label>Course Title</label><input class="input" id="icTitle" required /></div>
      <div class="field"><label>Short Description</label><textarea class="input" id="icDesc" rows="2" required></textarea></div>
      <div class="field"><label>Category Name</label><input class="input" id="icCat" value="Digital Skills" required /></div>
      <div class="field"><label>Price ($ 0 for Free)</label><input class="input" type="number" id="icPrice" value="0" min="0" step="any" required /></div>
      <div class="field"><label>Cover Thumbnail Image</label><input class="input" type="file" accept="image/*" id="icPicFile" /></div>
      <div class="field"><label>First Lecture Title</label><input class="input" id="icLecTitle" value="Lecture 1: Introduction" required /></div>
      <div class="field"><label>First Lecture Video Link (YouTube/Drive)</label><input class="input" id="icLecUrl" required /></div>
      <button class="btn btn-primary btn-block" id="icSaveBtn" type="submit">Submit Course</button>
    </form>
  `);
}

async function submitInstrCourse(e) {
  e.preventDefault();
  const btn = document.getElementById('icSaveBtn'); btn.disabled = true; btn.textContent = 'Saving...';
  try {
    let pic = '';
    const f = document.getElementById('icPicFile').files[0];
    if (f) pic = await uploadImageFileToImgbb(f);
    const ref = db.ref('courses').push();
    const price = safeNum(document.getElementById('icPrice').value, 0);
    await ref.set({
      id: ref.key,
      title: document.getElementById('icTitle').value.trim(),
      shortDescription: document.getElementById('icDesc').value.trim(),
      categoryName: document.getElementById('icCat').value.trim(),
      price, isPaid: price > 0, pictureLink: pic,
      instructorId: state.user.id, isApproved: false,
      lectures: [{ id: 'lec_1', title: document.getElementById('icLecTitle').value.trim(), videoLink: document.getElementById('icLecUrl').value.trim(), sequence: 1, isFree: price <= 0 }]
    });
    closeModal(); showToast('Course submitted for Admin review!');
  } catch (err) { showToast(err.message); btn.disabled = false; btn.textContent = 'Submit Course'; }
}

function openInstrAddBookModal() {
  openModal('Add eBook (Admin Approval Required)', `
    <form onsubmit="submitInstrBook(event)">
      <div class="field"><label>Book Title</label><input class="input" id="ibTitle" required /></div>
      <div class="field"><label>PDF / Google Drive Link</label><input class="input" id="ibDrive" required /></div>
      <div class="field"><label>Price ($ 0 for Free)</label><input class="input" type="number" id="ibPrice" value="0" min="0" step="any" required /></div>
      <div class="field"><label>Cover Photo</label><input class="input" type="file" accept="image/*" id="ibPic" /></div>
      <button class="btn btn-secondary btn-block" id="ibSaveBtn" type="submit">Submit Book</button>
    </form>
  `);
}

async function submitInstrBook(e) {
  e.preventDefault();
  const btn = document.getElementById('ibSaveBtn'); btn.disabled = true;
  try {
    let pic = '';
    const f = document.getElementById('ibPic').files[0];
    if (f) pic = await uploadImageFileToImgbb(f);
    const ref = db.ref('books').push();
    const price = safeNum(document.getElementById('ibPrice').value, 0);
    await ref.set({
      id: ref.key, title: document.getElementById('ibTitle').value.trim(),
      author: state.user.name, driveLink: document.getElementById('ibDrive').value.trim(),
      pictureLink: pic, price, isPaid: price > 0, instructorId: state.user.id, isApproved: false
    });
    closeModal(); showToast('Book submitted for Admin review!');
  } catch (err) { showToast(err.message); btn.disabled = false; }
}

function openInstrAddLiveModal() {
  openModal('Add Live Session', `
    <form onsubmit="submitInstrLive(event)">
      <div class="field"><label>Session Title</label><input class="input" id="ilTitle" required /></div>
      <div class="field"><label>Google Meet / Live Link</label><input class="input" id="ilMeet" required /></div>
      <div class="field"><label>Schedule Time</label><input class="input" id="ilTime" placeholder="Saturday 8:00 PM" required /></div>
      <div class="field"><label>Price ($ 0 for Free)</label><input class="input" type="number" id="ilPrice" value="0" min="0" step="any" required /></div>
      <button class="btn btn-success btn-block" type="submit">Submit Live Session</button>
    </form>
  `);
}

async function submitInstrLive(e) {
  e.preventDefault();
  const ref = db.ref('live_sessions').push();
  const price = safeNum(document.getElementById('ilPrice').value, 0);
  await ref.set({
    id: ref.key, title: document.getElementById('ilTitle').value.trim(),
    googleMeetLink: document.getElementById('ilMeet').value.trim(),
    startTime: document.getElementById('ilTime').value.trim(),
    price, isPaid: price > 0, instructor: state.user.name, instructorId: state.user.id, isApproved: false
  });
  closeModal(); showToast('Live session submitted for Admin review!');
}

function openInstructorWithdrawModal() {
  const bal = safeNum(state.user?.walletBalance, 0);
  if (bal < 1) return showToast('Minimum $1 balance required to withdraw.');
  const tax = bal * 0.20, net = bal - tax;
  openModal('Request Payout', `
    <div class="card" style="background:#FFF8E1;margin-bottom:12px;font-size:13px;">
      Gross Balance: <strong>$${bal.toFixed(2)}</strong> • 20% Fee: <strong>$${tax.toFixed(2)}</strong> • Net Payout: <strong>$${net.toFixed(2)}</strong>
    </div>
    <form onsubmit="submitInstrWithdraw(event, ${bal}, ${tax}, ${net})">
      <div class="field"><label>Payment Method (e.g. Bank / PayPal / Crypto / Local Wallet)</label><input class="input" id="wdBank" required /></div>
      <div class="field"><label>Account Title</label><input class="input" id="wdName" required /></div>
      <div class="field"><label>Account Number / IBAN / Wallet Address</label><input class="input" id="wdNum" required /></div>
      <div class="field"><label>ID / CNIC Number</label><input class="input" id="wdCnic" required /></div>
      <button class="btn btn-primary btn-block" type="submit">Submit Withdrawal Request</button>
    </form>
  `);
}

async function submitInstrWithdraw(e, bal, tax, net) {
  e.preventDefault();
  const ref = db.ref('withdrawals').push();
  await ref.set({
    id: ref.key, instructorId: state.user.id, instructorName: state.user.name,
    amount: bal, taxAmount: tax, netAmount: net,
    bankName: document.getElementById('wdBank').value.trim(),
    accountName: document.getElementById('wdName').value.trim(),
    accountNumber: document.getElementById('wdNum').value.trim(),
    cnic: document.getElementById('wdCnic').value.trim(),
    status: 'Pending', timestamp: Date.now()
  });
  await db.ref('users/' + state.user.id + '/walletBalance').set(0);
  closeModal(); showToast('Withdrawal request submitted!');
}

// =========================================================================
// 13. MAIN RENDER ROUTER
// =========================================================================
function render() {
  document.querySelectorAll('#desktopNav button, .drawer-item').forEach(b => {
    const tab = b.getAttribute('data-tab');
    if (!tab) return;
    const active = (state.route === tab) ||
      (tab === 'home' && ['course','quiz','mock_tests','jobs','notices','faculty','community'].includes(state.route)) ||
      (tab === 'profile' && state.route === 'instructor_dash');
    b.classList.toggle('active', active);
  });

  switch (state.route) {
    case 'home': renderHome(); break;
    case 'library': renderLibrary(); break;
    case 'live': renderLive(); break;
    case 'tools': renderTools(); break;
    case 'rewards': renderRewards(); break;
    case 'profile': renderProfile(); break;
    case 'course': renderCourseDetail(state.routeParam); break;
    case 'quiz': renderQuizScreen(); break;
    case 'mock_tests': renderMockTests(); break;
    case 'jobs': renderJobs(); break;
    case 'notices': renderNotices(); break;
    case 'faculty': renderFaculty(); break;
    case 'community': renderCommunity(); break;
    case 'instructor_dash': renderInstructorDash(); break;
    default: renderHome();
  }
}

// Initialize on page load
initPublicListeners();
render();
