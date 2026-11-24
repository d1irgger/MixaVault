'use strict';

/* ---------- DOM ---------- */

const $ = (selector, root = document) => root.querySelector(selector);
const app = $('#app');
const splash = $('#splash');
const splashStatus = $('#splashStatus');
const retryBtn = $('#retryBtn');
const nav = $('#nav');
const main = $('#main');
const list = $('#list');
const empty = $('#empty');
const emptyTitle = $('#emptyTitle');
const emptyText = $('#emptyText');
const emptyAdd = $('#emptyAdd');
const countLabel = $('#count');
const search = $('#search');
const clearSearch = $('#clearSearch');
const addBtn = $('#addBtn');
const navAddBtn = $('#navAddBtn');
const tabVault = $('#tabVault');
const tabImport = $('#tabImport');
const tabSettings = $('#tabSettings');
const scrim = $('#scrim');
const sheet = $('#sheet');
const sheetTitle = $('#sheetTitle');
const sheetClose = $('#sheetClose');
const sheetBody = $('#sheetBody');
const alertLayer = $('#alertLayer');
const alertTitle = $('#alertTitle');
const alertMessage = $('#alertMessage');
const alertCancel = $('#alertCancel');
const alertOk = $('#alertOk');
const passwordLayer = $('#passwordLayer');
const passwordTitle = $('#passwordTitle');
const passwordMessage = $('#passwordMessage');
const passwordInput = $('#passwordInput');
const passwordConfirm = $('#passwordConfirm');
const passwordError = $('#passwordError');
const passwordCancel = $('#passwordCancel');
const passwordOk = $('#passwordOk');
const toast = $('#toast');
const toastIcon = $('#toastIcon');
const toastTitle = $('#toastTitle');
const toastDetail = $('#toastDetail');
const listFooter = $('.list-footer');

const state = {
  accounts: [],
  openId: null,
  query: '',
  sheet: null,
  alertOpen: false,
  alertResolve: null,
  passwordOpen: false,
  passwordResolve: null
};

const diagnostics = [];
const nativeConsoleError = console.error.bind(console);

function diag(category, message) {
  const time = new Date().toISOString();
  diagnostics.push(`[${time}] ${category}: ${message}`);
  if (diagnostics.length > 300) diagnostics.shift();
}

console.error = (...args) => {
  diag('console', args.map(value => String(value)).join(' '));
  nativeConsoleError(...args);
};

window.addEventListener('error', event => {
  diag('js', `${event.message} @ ${event.filename}:${event.lineno}:${event.colno}`);
});

window.addEventListener('unhandledrejection', event => {
  diag('promise', String(event.reason));
});

let collator;

/* ---------- Static icons ---------- */

const ICONS = {
  chevron: '<svg viewBox="0 0 24 24"><path d="m9 5.5 6.5 6.5L9 18.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2.8 12s3.3-6.2 9.2-6.2S21.2 12 21.2 12s-3.3 6.2-9.2 6.2S2.8 12 2.8 12Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.7" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24"><path d="M4 4.5 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M9.9 6.2A9.8 9.8 0 0 1 12 5.8c5.9 0 9.2 6.2 9.2 6.2a17 17 0 0 1-2.5 3.2M14.5 17.6c-.8.3-1.6.5-2.5.5-5.9 0-9.2-6.2-9.2-6.2a17.8 17.8 0 0 1 3.5-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.2 10.3a2.7 2.7 0 0 0 3.6 3.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15.5 5.5h-8A2.5 2.5 0 0 0 5 8v8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="m4.5 19.5.9-4.3L16.8 3.8a1.8 1.8 0 0 1 2.5 0l.9.9a1.8 1.8 0 0 1 0 2.5L8.8 18.6l-4.3.9Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m14.7 5.9 3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4.5 7h15M9 7V4.8c0-.7.6-1.3 1.3-1.3h3.4c.7 0 1.3.6 1.3 1.3V7M6.2 7l.8 12.1c0 .9.8 1.6 1.7 1.6h6.6c.9 0 1.7-.7 1.7-1.6L17.8 7M10 10.8v6.4M14 10.8v6.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  file: '<svg viewBox="0 0 24 24"><path d="M13 3.5H7.8A2.3 2.3 0 0 0 5.5 5.8v12.4a2.3 2.3 0 0 0 2.3 2.3h8.4a2.3 2.3 0 0 0 2.3-2.3V8.5L13 3.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M13 3.8V8.5h4.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

function icon(name, size = 18) {
  const span = document.createElement('span');
  span.className = 'icon';
  span.innerHTML = ICONS[name] || '';
  const svg = span.firstElementChild;
  if (svg) {
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('aria-hidden', 'true');
  }
  return span;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function makeButton(className, label) {
  const node = el('button', className, label);
  node.type = 'button';
  return node;
}

/* ---------- Bridge / preview data ---------- */

const bridge = window.AndroidVault;
const APP_VERSION = bridge && typeof bridge.getVersion === 'function'
  ? bridge.getVersion()
  : '0.9.2';

/* ---------- Language / copy ---------- */

function detectAppLanguage() {
  try {
    const forced = new URLSearchParams(location.search).get('lang');
    if (forced === 'zh' || forced === 'en') return forced;
    const fromAndroid = bridge && typeof bridge.getLanguage === 'function'
      ? bridge.getLanguage()
      : '';
    const raw = fromAndroid || navigator.language || 'en';
    return String(raw).toLowerCase().startsWith('zh') ? 'zh' : 'en';
  } catch (_) {
    return String(navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }
}

const LANG = detectAppLanguage();
collator = new Intl.Collator(LANG === 'zh' ? 'zh-Hans-CN' : 'en', {
  sensitivity: 'base',
  numeric: true
});

const MESSAGES = {
  zh: {
    appName: '密匣',
    opening: '正在打开…',
    retry: '重试',
    accounts: '账户',
    addAccount: '添加账户',
    search: '搜索',
    searchAccounts: '搜索账户',
    clearSearch: '清除搜索',
    bottomNav: '底部导航',
    emptyTitle: '暂无账户',
    emptyText: '添加账户，或从文件导入。',
    footer: '数据仅存储在此设备 · 轻点卡片查看密码',
    tabAccounts: '账户',
    tabImport: '导入',
    tabSettings: '设置',
    cancel: '取消',
    done: '完成',
    delete: '删除',
    noResults: '未找到账户',
    tryAnother: '请尝试其他关键词。',
    noUsername: '无用户名',
    password: '密码',
    showPassword: '显示密码',
    hidePassword: '隐藏密码',
    copy: '拷贝',
    copied: '已拷贝',
    copiedToast: '密码已拷贝',
    copyFailed: '无法拷贝',
    account: '账号',
    url: '网址',
    note: '备注',
    edit: '编辑',
    deleteTitle: '删除“{title}”？',
    deleteMessage: '此操作无法撤销。',
    deleteFailed: '无法删除',
    deleted: '已删除账户',
    editAccount: '编辑账户',
    addAccountTitle: '添加账户',
    name: '名称',
    namePlaceholder: '例如：Apple ID',
    usernamePlaceholder: '例如：name@icloud.com',
    passwordPlaceholder: '输入或生成密码',
    urlPlaceholder: 'https://',
    optional: '可选',
    generate: '生成',
    saveChanges: '保存',
    errorName: '请输入名称。',
    errorPassword: '请输入密码，或轻点“生成”。',
    saveFailed: '无法保存',
    saved: '已保存',
    added: '已添加账户',
    importTitle: '导入账户',
    importHelp: '支持 JSON、CSV、TXT、Markdown、HTML，也支持加密备份 <code>.mixa</code>。CSV 第一行可使用表头 <code>title,username,password,url,note</code>。',
    chooseFile: '选择笔记或数据文件',
    noFile: '未选择文件',
    importPlaceholder: '直接粘贴 JSON、CSV、TXT、Markdown 或 HTML，例如：\n[\n  {"title":"示例","password":"123456"}\n]',
    importAction: '导入',
    aiAnalyze: 'AI 识别',
    aiAnalyzing: '正在识别…',
    aiNoResult: '未识别到账户',
    aiFailed: 'AI 识别失败',
    aiUnavailable: '当前设备不支持本地 AI',
    fileTooLarge: '文件大小不能超过 2 MB。',
    fileReadFailed: '无法读取文件。',
    noImportItems: '未找到可导入的账户。',
    importFailed: '无法导入',
    importEmpty: '请粘贴内容或选择文件。',
    jsonParseFailed: 'JSON 格式无效，请检查后重试。',
    jsonNoArray: 'JSON 中未找到账户列表。',
    csvNoData: 'CSV 文件中没有数据。',
    csvNoPassword: 'CSV 表头缺少密码列。',
    csvNoRows: '未找到包含密码的账户。',
    settingsTitle: '设置',
    storageLocation: '存储位置',
    appPrivate: 'App 私有目录',
    file: '文件',
    encryptedBackup: '加密备份',
    backupPasswordTitle: '加密备份',
    exportBackupTitle: '导出加密备份',
    exportBackupMessage: '设置一个至少 8 位的备份密码。恢复时必须输入同一密码。',
    decryptBackupTitle: '解密备份',
    decryptBackupMessage: '输入这份备份的密码。',
    backupPassword: '备份密码',
    backupPasswordHint: '至少 8 位',
    confirmPassword: '确认密码',
    passwordRequired: '请输入密码',
    passwordTooShort: '密码至少 {n} 位',
    passwordMismatch: '两次输入的密码不一致',
    continueAction: '继续',
    decryptAction: '解密',
    backupExported: '加密备份已保存',
    backupExportFailed: '加密备份保存失败',
    backupDecryptFailed: '密码错误或文件损坏',
    encryptionOn: '加密备份已开启',
    encryptionOff: '加密备份已关闭',
    backupNeedsAndroid10: '加密备份需要 Android 10 或更高版本',
    encryptionNote: '加密只作用于导出的备份，本地数据仍为明文。',    version: '版本',
    about: '关于',
    openLinkFailed: '无法打开链接',
    settingsFoot: '所有数据均以明文 JSON 存储在此设备。卸载 App 或清除数据将删除全部账户。',
    exportTitle: '导出 JSON 文件',
    exportMessage: '导出文件为明文，请妥善保管。',
    exportAction: '导出',
    exported: '明文 JSON 已保存',
    exportFailed: '明文 JSON 保存失败',
    diagnostics: '诊断日志',
    logExported: '诊断日志已保存',
    logExportFailed: '诊断日志保存失败',
    readFailed: '无法载入账户',
    cannotOpen: '无法打开密码库',
    cannotRead: '无法载入账户列表',
    unknownAction: '未知操作',
    localServiceFailed: '本地服务连接失败',
    untitled: '未命名'
  },
  en: {
    appName: 'Mixa Vault',
    opening: 'Opening…',
    retry: 'Try Again',
    accounts: 'Accounts',
    addAccount: 'Add Account',
    search: 'Search',
    searchAccounts: 'Search accounts',
    clearSearch: 'Clear search',
    bottomNav: 'Bottom navigation',
    emptyTitle: 'No Accounts',
    emptyText: 'Add an account or import one from a file.',
    footer: 'Stored on this device · Tap a card to view its password',
    tabAccounts: 'Accounts',
    tabImport: 'Import',
    tabSettings: 'Settings',
    cancel: 'Cancel',
    done: 'Done',
    delete: 'Delete',
    noResults: 'No Accounts Found',
    tryAnother: 'Try another search.',
    noUsername: 'No username',
    password: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    copy: 'Copy',
    copied: 'Copied',
    copiedToast: 'Password copied',
    copyFailed: 'Couldn’t Copy',
    account: 'Username',
    url: 'Website',
    note: 'Note',
    edit: 'Edit',
    deleteTitle: 'Delete “{title}”?',
    deleteMessage: 'This action can’t be undone.',
    deleteFailed: 'Couldn’t Delete',
    deleted: 'Account Deleted',
    editAccount: 'Edit Account',
    addAccountTitle: 'Add Account',
    name: 'Name',
    namePlaceholder: 'e.g. Apple ID',
    usernamePlaceholder: 'e.g. name@icloud.com',
    passwordPlaceholder: 'Enter password',
    urlPlaceholder: 'https://',
    optional: 'Optional',
    generate: 'Generate',
    saveChanges: 'Save',
    errorName: 'Enter a name.',
    errorPassword: 'Enter a password, or tap Generate.',
    saveFailed: 'Couldn’t Save',
    saved: 'Saved',
    added: 'Account Added',
    importTitle: 'Import Accounts',
    importHelp: 'Supports JSON, CSV, TXT, Markdown, HTML, and encrypted <code>.mixa</code> backups. The first CSV row can contain the header <code>title,username,password,url,note</code>.',
    chooseFile: 'Choose Note or Data File',
    noFile: 'No File Selected',
    importPlaceholder: 'Paste JSON, CSV, TXT, Markdown, or HTML, for example:\n[\n  {"title":"Example","password":"123456"}\n]',
    importAction: 'Import',
    aiAnalyze: 'Analyze with AI',
    aiAnalyzing: 'Analyzing…',
    aiNoResult: 'No accounts found',
    aiFailed: 'AI analysis failed',
    aiUnavailable: 'On-device AI is unavailable',
    fileTooLarge: 'The file can’t be larger than 2 MB.',
    fileReadFailed: 'Couldn’t Read the File',
    noImportItems: 'No accounts were found to import.',
    importFailed: 'Couldn’t Import',
    importEmpty: 'Paste content or choose a file.',
    jsonParseFailed: 'The JSON isn’t valid.',
    jsonNoArray: 'No account list was found in the JSON.',
    csvNoData: 'The CSV file doesn’t contain any data.',
    csvNoPassword: 'The CSV header is missing a password column.',
    csvNoRows: 'No accounts with a password were found.',
    settingsTitle: 'Settings',
    storageLocation: 'Storage',
    appPrivate: 'On This Device',
    file: 'File',
    encryptedBackup: 'Encrypted Backup',
    backupPasswordTitle: 'Encrypted Backup',
    exportBackupTitle: 'Export Encrypted Backup',
    exportBackupMessage: 'Set a backup password of at least 8 characters. You will need the same password to restore.',
    decryptBackupTitle: 'Decrypt Backup',
    decryptBackupMessage: 'Enter the password for this backup.',
    backupPassword: 'Backup Password',
    backupPasswordHint: 'At least 8 characters',
    confirmPassword: 'Confirm Password',
    passwordRequired: 'Enter a password',
    passwordTooShort: 'Use at least {n} characters',
    passwordMismatch: 'Passwords do not match',
    continueAction: 'Continue',
    decryptAction: 'Decrypt',
    backupExported: 'Encrypted Backup Saved',
    backupExportFailed: 'Couldn’t Save Encrypted Backup',
    backupDecryptFailed: 'Wrong password or damaged file',
    encryptionOn: 'Encrypted Backup On',
    encryptionOff: 'Encrypted Backup Off',
    backupNeedsAndroid10: 'Encrypted backup requires Android 10 or later',
    encryptionNote: 'Encryption applies to exported backups only. Local data stays plaintext.',
    version: 'Version',
    about: 'About',
    openLinkFailed: 'Couldn’t Open Link',
    settingsFoot: 'All data is stored as plain JSON on this device. Deleting the app or clearing its data will remove all accounts.',
    exportTitle: 'Export JSON File',
    exportMessage: 'The exported file isn’t encrypted. Keep it somewhere safe.',
    exportAction: 'Export',
    exported: 'Plain JSON Saved',
    exportFailed: 'Couldn’t Save Plain JSON',
    diagnostics: 'Diagnostics',
    logExported: 'Diagnostics Saved',
    logExportFailed: 'Couldn’t Save Diagnostics',
    readFailed: 'Couldn’t Load Accounts',
    cannotOpen: 'Couldn’t Open the Vault',
    cannotRead: 'Couldn’t Load the Account List',
    unknownAction: 'Unknown action',
    localServiceFailed: 'Local service unavailable',
    untitled: 'Untitled'
  }
};

const COPY = MESSAGES[LANG];

const ERROR_MESSAGES = {
  '密码不能为空': 'Password is required.',
  '账户不存在，请刷新后重试': 'Account not found. Refresh and try again.',
  '账户不存在': 'Account not found.',
  '数据文件损坏，无法读取': 'The data file is corrupted.',
  '数据文件格式不正确': 'The data file has an invalid format.',
  '保存失败，请检查存储空间': 'Couldn’t save. Check available storage.',
  '没有可导入的数据': 'There is nothing to import.',
  '单次最多导入 5000 条': 'You can import up to 5000 accounts at a time.',
  '请求格式错误': 'Invalid request.',
  '未知操作': 'Unknown action.',
  '操作失败，请重试': 'Something went wrong. Try again.'
};

function localizeError(message) {
  if (LANG === 'zh') return message;
  return ERROR_MESSAGES[message] || message;
}

function t(key, vars = {}) {
  const value = COPY[key] !== undefined ? COPY[key] : key;
  return String(value).replace(/\{(\w+)\}/g, (_, name) =>
    vars[name] !== undefined ? String(vars[name]) : ''
  );
}

const countAccounts = n =>
  LANG === 'zh' ? `${n} 个账户` : `${n} account${n === 1 ? '' : 's'}`;

const countResults = n =>
  LANG === 'zh' ? `${n} 个结果` : `${n} result${n === 1 ? '' : 's'}`;

const settingsCount = n => LANG === 'zh' ? `${n} 个` : String(n);

function importMessage(added, skipped, invalid) {
  const separator = LANG === 'zh' ? '，' : ', ';
  const parts = [];

  if (added > 0) {
    parts.push(
      LANG === 'zh'
        ? `已导入 ${added} 个账户`
        : `Imported ${added} Account${added === 1 ? '' : 's'}`
    );
  } else {
    parts.push(LANG === 'zh' ? '未添加账户' : 'No Accounts Added');
  }

  if (skipped > 0) {
    parts.push(
      LANG === 'zh'
        ? `已跳过 ${skipped} 个重复项`
        : `Skipped ${skipped} Duplicate${skipped === 1 ? '' : 's'}`
    );
  }

  if (invalid > 0) {
    parts.push(LANG === 'zh' ? `${invalid} 条无效` : `${invalid} Invalid`);
  }

  return parts.join(separator);
}

function applyI18n() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
  document.title = t('appName');

  document.querySelectorAll('[data-i18n]').forEach(node => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(node => {
    node.setAttribute('aria-label', t(node.dataset.i18nAria));
  });
}

applyI18n();

/* ---------- Color scheme ---------- */

const themeMeta = document.querySelector('meta[name="theme-color"]');
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function applyThemeColor() {
  if (themeMeta) themeMeta.content = darkQuery.matches ? '#000000' : '#F2F2F7';
}

window.__applyTheme = applyThemeColor;
applyThemeColor();
if (typeof darkQuery.addEventListener === 'function') {
  darkQuery.addEventListener('change', applyThemeColor);
}

/* ---------- Preview data ---------- */

const DEMO_ACCOUNTS = [
  {
    title: 'Apple ID',
    username: 'mixa@icloud.com',
    password: 'Mixa!Demo#2026',
    url: 'https://appleid.apple.com',
    note: LANG === 'zh' ? '双重认证已开启' : 'Two-factor authentication enabled'
  },
  {
    title: 'GitHub',
    username: 'mixa-dev',
    password: 'gh_Demo_9xK2!pQ7',
    url: 'https://github.com',
    note: LANG === 'zh' ? '个人访问令牌另存' : 'Personal access token stored separately'
  },
  {
    title: 'Google',
    username: 'mixa@gmail.com',
    password: 'G00gle-Demo-42',
    url: '',
    note: ''
  },
  {
    title: 'Notion',
    username: 'mixa@outlook.com',
    password: 'N0tion!Demo',
    url: 'https://notion.so',
    note: LANG === 'zh' ? '团队空间' : 'Team workspace'
  },
  {
    title: LANG === 'zh' ? '招商银行' : 'China Merchants Bank',
    username: LANG === 'zh' ? '尾号 8821' : 'Ending 8821',
    password: 'Demo-8821',
    url: '',
    note: LANG === 'zh' ? '仅用于示例' : 'Sample only'
  },
  {
    title: 'Netflix',
    username: 'family@mixa.me',
    password: 'N3tflix-Demo',
    url: 'https://netflix.com',
    note: ''
  }
];

const params = new URLSearchParams(location.search);
const mock = {
  accounts: params.has('empty') ? [] : DEMO_ACCOUNTS.map((item, index) => ({
    ...item,
    id: `demo-${index}`,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }))
};

function uid() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function mockCall(action, payload) {
  if (action === 'status') {
    return { ok: true, count: mock.accounts.length, storage: 'preview', path: LANG === 'zh' ? '浏览器预览：不写入磁盘' : 'Browser preview: no disk writes' };
  }
  if (action === 'list') {
    return {
      ok: true,
      accounts: sortAccounts(mock.accounts.map(item => ({ ...item }))),
      count: mock.accounts.length
    };
  }
  if (action === 'save') {
    const now = Date.now();
    const existing = payload.id ? mock.accounts.find(item => item.id === payload.id) : null;
    if (existing) {
      Object.assign(existing, {
        title: payload.title,
        username: payload.username,
        password: payload.password,
        url: payload.url,
        note: payload.note,
        updatedAt: now
      });
      return { ok: true, account: { ...existing }, count: mock.accounts.length };
    }
    const account = {
      id: uid(),
      title: payload.title,
      username: payload.username,
      password: payload.password,
      url: payload.url,
      note: payload.note,
      createdAt: now,
      updatedAt: now
    };
    mock.accounts.push(account);
    return { ok: true, account: { ...account }, count: mock.accounts.length };
  }
  if (action === 'delete') {
    mock.accounts = mock.accounts.filter(item => item.id !== payload.id);
    return { ok: true, count: mock.accounts.length };
  }
  if (action === 'import') {
    const seen = new Set(mock.accounts.map(item => `${item.title}\u0000${item.username}`));
    let added = 0;
    let skipped = 0;
    for (const item of payload.items || []) {
      if (!item.password) continue;
      const key = `${item.title || item.username || t('untitled')}\u0000${item.username || ''}`;
      if (seen.has(key)) {
        skipped += 1;
        continue;
      }
      seen.add(key);
      mock.accounts.push({
        id: uid(),
        title: item.title || item.username || t('untitled'),
        username: item.username || '',
        password: item.password,
        url: item.url || '',
        note: item.note || '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      added += 1;
    }
    return { ok: true, added, skipped, invalid: 0, count: mock.accounts.length };
  }
  return { ok: false, error: t('unknownAction') };
}

function api(action, payload = {}) {
  try {
    if (bridge && typeof bridge.call === 'function') {
      const raw = bridge.call(action, JSON.stringify(payload));
      const result = JSON.parse(raw);
      if (!result.ok && result.error) {
        result.error = localizeError(result.error);
        diag('api', `${action}: ${result.error}`);
      }
      return result;
    }
    return mockCall(action, payload);
  } catch (error) {
    console.error(error);
    return { ok: false, error: t('localServiceFailed') };
  }
}

function haptic() {
  try {
    if (bridge && typeof bridge.haptic === 'function') bridge.haptic();
  } catch (_) {
    /* no-op */
  }
}

function setNativeOverlay() {
  try {
    if (bridge && typeof bridge.setOverlayOpen === 'function') {
      bridge.setOverlayOpen(Boolean(
        state.sheet !== null || state.alertOpen || state.passwordOpen
      ));
    }
  } catch (_) {
    /* no-op */
  }
}

/* ---------- Utilities ---------- */

function sortAccounts(items) {
  return [...items].sort((a, b) =>
    collator.compare(a.title || '', b.title || '') ||
    collator.compare(a.username || '', b.username || '')
  );
}

function avatarColors(title) {
  const palette = [
    ['#FF9F0A', '#FF6B00'],
    ['#5E5CE6', '#3634A3'],
    ['#30B0C7', '#0071A4'],
    ['#FF375F', '#D70036'],
    ['#34C759', '#1E8E3E'],
    ['#AF52DE', '#7D2AA8'],
    ['#64D2FF', '#0A84FF'],
    ['#FFD60A', '#F5A300'],
    ['#8E8E93', '#5A5A5F'],
    ['#FF6482', '#C9184A']
  ];
  let hash = 0;
  for (const char of String(title || '?')) {
    hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  }
  return palette[hash % palette.length];
}

function firstChar(title) {
  const chars = Array.from(String(title || '?').trim());
  return chars.length ? chars[0].toUpperCase() : '?';
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.classList.toggle('busy', busy);
}

let toastTimer = 0;
let lastBackupPath = '';
let lastLogPath = '';
let lastPlainPath = '';
function showToast(message, options = {}) {
  toastTitle.textContent = message;
  toastDetail.textContent = options.detail || '';
  toastDetail.hidden = !options.detail;
  toast.classList.toggle('error', Boolean(options.error));

  toastIcon.hidden = !options.icon;
  if (options.icon) {
    toastIcon.replaceChildren(icon(options.icon, 18));
  } else {
    toastIcon.replaceChildren();
  }

  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(
    () => toast.classList.remove('show'),
    options.duration || 2200
  );
}

function copyText(value, button) {
  let copied = true;
  try {
    if (bridge && typeof bridge.copyText === 'function') {
      bridge.copyText(value);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    } else {
      copied = false;
    }
  } catch (_) {
    copied = false;
  }

  if (!copied) {
    showToast(t('copyFailed'));
    return;
  }

  haptic();
  showToast(t('copiedToast'));
  if (button) {
    const original = button.textContent;
    button.textContent = t('copied');
    setTimeout(() => {
      if (button.isConnected) button.textContent = original;
    }, 1400);
  }
}

/* ---------- Render list ---------- */

function render() {
  const query = state.query.trim().toLocaleLowerCase();
  const filtered = state.accounts.filter(account => {
    if (!query) return true;
    return [account.title, account.username, account.url, account.note]
      .join('\n')
      .toLocaleLowerCase()
      .includes(query);
  });

  list.replaceChildren();

  for (const account of filtered) {
    list.appendChild(accountCard(account));
  }

  const emptyNow = filtered.length === 0;
  empty.hidden = !emptyNow;
  listFooter.hidden = false;

  if (emptyNow) {
    if (query) {
      emptyTitle.textContent = t('noResults');
      emptyText.textContent = t('tryAnother');
      emptyAdd.hidden = true;
    } else {
      emptyTitle.textContent = t('emptyTitle');
      emptyText.textContent = t('emptyText');
      emptyAdd.hidden = false;
    }
  }

  countLabel.textContent = query
    ? countResults(filtered.length)
    : countAccounts(state.accounts.length);

  updateNav();
}

function updateNav() {
  nav.classList.toggle('scrolled', main.scrollTop > 24);
}

function accountCard(account) {
  const card = el('article', 'card');
  card.dataset.id = account.id;

  const trigger = makeButton('card-main');
  trigger.setAttribute('aria-expanded', 'false');

  const avatar = el('span', 'avatar', firstChar(account.title));
  const colors = avatarColors(account.title);
  avatar.style.setProperty('--a', colors[0]);
  avatar.style.setProperty('--b', colors[1]);

  const meta = el('span', 'card-meta');
  meta.appendChild(el('span', 'card-title', account.title));
  meta.appendChild(el('span', 'card-sub', account.username || t('noUsername')));

  const chevron = el('span', 'chevron');
  chevron.appendChild(icon('chevron', 18));

  trigger.append(avatar, meta, chevron);

  const detail = el('div', 'detail');
  const inner = el('div', 'detail-inner');
  detail.appendChild(inner);

  card.append(trigger, detail);
  return card;
}

function findCard(id) {
  return Array.from(list.children).find(card => card.dataset.id === id) || null;
}

function findAccount(id) {
  return state.accounts.find(account => account.id === id) || null;
}

function openCard(card, account) {
  const trigger = $('.card-main', card);
  const inner = $('.detail-inner', card);
  trigger.setAttribute('aria-expanded', 'true');
  card.classList.add('open');
  clearTimeout(card._clearDetail);
  if (!inner.dataset.built) {
    buildDetail(account, inner);
    inner.dataset.built = '1';
  }
}

function closeCard(card) {
  const trigger = $('.card-main', card);
  const inner = $('.detail-inner', card);
  trigger.setAttribute('aria-expanded', 'false');
  card.classList.remove('open');
  clearTimeout(card._clearDetail);
  card._clearDetail = setTimeout(() => {
    if (card.classList.contains('open')) return;
    inner.replaceChildren();
    delete inner.dataset.built;
  }, 420);
}

function toggleCard(id) {
  const card = findCard(id);
  if (!card) return;

  haptic();

  if (state.openId === id) {
    closeCard(card);
    state.openId = null;
    return;
  }

  if (state.openId) {
    const previous = findCard(state.openId);
    if (previous) closeCard(previous);
  }

  const account = findAccount(id);
  if (!account) return;
  state.openId = id;
  openCard(card, account);
}

function buildDetail(account, inner) {
  const content = el('div', 'detail-content');

  const secret = el('div', 'secret');
  secret.appendChild(el('div', 'secret-label', t('password')));

  const secretRow = el('div', 'secret-row');
  const password = el('code', 'pwd masked', account.password);

  const peek = makeButton('icon-btn');
  peek.dataset.act = 'peek';
  peek.setAttribute('aria-label', t('showPassword'));
  peek.appendChild(icon('eyeOff', 19));

  const copy = makeButton('copy-word', t('copy'));
  copy.dataset.act = 'copy';

  secretRow.append(password, peek, copy);
  secret.appendChild(secretRow);
  content.appendChild(secret);

  if (account.url) addInfoRow(content, t('url'), account.url);
  if (account.note) addInfoRow(content, t('note'), account.note, true);

  const actions = el('div', 'card-actions');

  const edit = makeButton('card-action');
  edit.dataset.act = 'edit';
  edit.append(icon('edit', 17), document.createTextNode(t('edit')));

  const remove = makeButton('card-action danger');
  remove.dataset.act = 'delete';
  remove.append(icon('trash', 16), document.createTextNode(t('delete')));

  actions.append(edit, remove);
  content.appendChild(actions);
  inner.replaceChildren(content);
}

function addInfoRow(parent, label, value, multiline = false) {
  const row = el('div', 'info-row');
  const valueNode = el('div', multiline ? 'info-value multiline' : 'info-value', value);
  row.append(el('div', 'info-label', label), valueNode);
  parent.appendChild(row);
}

/* ---------- Card interactions ---------- */

list.addEventListener('click', event => {
  const card = event.target.closest('.card');
  if (!card) return;

  const action = event.target.closest('[data-act]');
  if (action) {
    event.stopPropagation();
    handleCardAction(action.dataset.act, card.dataset.id, action);
    return;
  }

  if (event.target.closest('.card-main')) {
    toggleCard(card.dataset.id);
  }
});

function handleCardAction(action, id, button) {
  const account = findAccount(id);
  if (!account) return;

  if (action === 'copy') {
    copyText(account.password, button);
    return;
  }

  if (action === 'peek') {
    const card = findCard(id);
    const password = card ? $('.pwd', card) : null;
    if (!password) return;
    const masked = password.classList.toggle('masked');
    button.replaceChildren(icon(masked ? 'eyeOff' : 'eye', 19));
    button.setAttribute('aria-label', masked ? t('showPassword') : t('hidePassword'));
    haptic();
    return;
  }

  if (action === 'edit') {
    openAccountSheet(account);
    return;
  }

  if (action === 'delete') {
    deleteAccount(account);
  }
}

async function deleteAccount(account) {
  const confirmed = await confirmAlert(
    t('deleteTitle', { title: account.title }),
    t('deleteMessage'),
    t('delete'),
    true
  );
  if (!confirmed) return;

  const result = api('delete', { id: account.id });
  if (!result.ok) {
    showToast(result.error || t('deleteFailed'));
    return;
  }

  state.accounts = state.accounts.filter(item => item.id !== account.id);
  state.openId = null;
  render();
  haptic();
  showToast(t('deleted'));
}

/* ---------- Search / navigation ---------- */

search.addEventListener('input', () => {
  state.query = search.value;
  state.openId = null;
  clearSearch.hidden = search.value.length === 0;
  render();
});

clearSearch.addEventListener('click', () => {
  search.value = '';
  state.query = '';
  state.openId = null;
  clearSearch.hidden = true;
  render();
  search.focus();
});

main.addEventListener('scroll', updateNav, { passive: true });

tabVault.addEventListener('click', () => {
  if (main.scrollTop > 0) {
    main.scrollTo({ top: 0, behavior: 'smooth' });
  }
  haptic();
});

tabImport.addEventListener('click', openImportSheet);
tabSettings.addEventListener('click', openSettingsSheet);
addBtn.addEventListener('click', () => openAccountSheet());
navAddBtn.addEventListener('click', () => openAccountSheet());
emptyAdd.addEventListener('click', () => openAccountSheet());

/* ---------- Sheet ---------- */

function prepareSheet(title, closeLabel = t('cancel')) {
  sheetTitle.textContent = title;
  sheetClose.textContent = closeLabel;
  sheetBody.replaceChildren();
  sheetBody.scrollTop = 0;
  sheet.classList.add('show');
  sheet.setAttribute('aria-hidden', 'false');
  scrim.classList.add('show');
  setNativeOverlay();
  haptic();
}

function closeSheet() {
  if (state.sheet === null) return;
  state.sheet = null;
  sheet.classList.remove('show');
  sheet.setAttribute('aria-hidden', 'true');
  scrim.classList.remove('show');
  setNativeOverlay();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  setTimeout(() => {
    if (state.sheet === null) sheetBody.replaceChildren();
  }, 430);
}

sheetClose.addEventListener('click', closeSheet);
scrim.addEventListener('click', closeSheet);

/* ---------- Add / edit account ---------- */

function openAccountSheet(account = null) {
  state.sheet = 'account';
  prepareSheet(account ? t('editAccount') : t('addAccountTitle'));

  const editing = Boolean(account);
  const form = el('form', 'sheet-form');
  form.noValidate = true;

  const group = el('div', 'form-group');

  const titleInput = el('input');
  titleInput.type = 'text';
  titleInput.placeholder = t('namePlaceholder');
  titleInput.maxLength = 120;
  titleInput.autocomplete = 'off';
  titleInput.spellcheck = false;
  titleInput.value = editing ? account.title : '';
  group.appendChild(fieldRow(t('name'), titleInput, t('name')));

  const usernameInput = el('input');
  usernameInput.type = 'text';
  usernameInput.placeholder = t('usernamePlaceholder');
  usernameInput.maxLength = 200;
  usernameInput.autocomplete = 'off';
  usernameInput.spellcheck = false;
  usernameInput.value = editing ? account.username : '';
  group.appendChild(fieldRow(t('account'), usernameInput, t('account')));

  const passwordInput = el('input');
  passwordInput.type = 'password';
  passwordInput.classList.add('pw-font');
  passwordInput.placeholder = t('passwordPlaceholder');
  passwordInput.maxLength = 1024;
  passwordInput.autocomplete = 'off';
  passwordInput.spellcheck = false;
  passwordInput.value = editing ? account.password : '';

  const passwordControl = el('span', 'field-control');
  const peek = makeButton('icon-btn');
  peek.setAttribute('aria-label', t('showPassword'));
  peek.appendChild(icon('eyeOff', 19));

  const generate = makeButton('field-action', t('generate'));

  passwordControl.append(passwordInput, peek, generate);

  const passwordRow = el('div', 'field');
  passwordRow.append(el('span', 'field-label', t('password')), passwordControl);
  group.appendChild(passwordRow);

  peek.addEventListener('click', () => {
    const visible = passwordInput.type === 'text';
    passwordInput.type = visible ? 'password' : 'text';
    peek.replaceChildren(icon(visible ? 'eyeOff' : 'eye', 19));
    peek.setAttribute('aria-label', visible ? t('showPassword') : t('hidePassword'));
    haptic();
  });

  generate.addEventListener('click', () => {
    passwordInput.value = randomPassword();
    passwordInput.type = 'text';
    peek.replaceChildren(icon('eye', 19));
    peek.setAttribute('aria-label', t('hidePassword'));
    haptic();
  });

  const urlInput = el('input');
  urlInput.type = 'text';
  urlInput.inputMode = 'url';
  urlInput.placeholder = t('urlPlaceholder');
  urlInput.maxLength = 500;
  urlInput.autocomplete = 'off';
  urlInput.spellcheck = false;
  urlInput.value = editing ? account.url : '';
  group.appendChild(fieldRow(t('url'), urlInput, t('url')));

  const noteGroup = el('div', 'form-group');
  const noteBlock = el('div', 'field-block');
  noteBlock.appendChild(el('span', 'block-label', t('note')));
  const noteInput = el('textarea');
  noteInput.rows = 3;
  noteInput.placeholder = t('optional');
  noteInput.maxLength = 4000;
  noteInput.value = editing ? account.note : '';
  noteBlock.appendChild(noteInput);
  noteGroup.appendChild(noteBlock);

  const error = el('p', 'form-error');

  const submit = makeButton('primary', editing ? t('saveChanges') : t('addAccount'));
  submit.type = 'submit';

  form.append(group, noteGroup, error, submit);

  form.addEventListener('submit', event => {
    event.preventDefault();
    error.textContent = '';

    const title = titleInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const url = urlInput.value.trim();
    const note = noteInput.value.trim();

    if (!title) {
      error.textContent = t('errorName');
      titleInput.focus();
      return;
    }
    if (!password) {
      error.textContent = t('errorPassword');
      passwordInput.focus();
      return;
    }

    setBusy(submit, true);
    setTimeout(() => {
      const result = api('save', {
        id: editing ? account.id : '',
        title,
        username,
        password,
        url,
        note
      });

      if (!result.ok) {
        setBusy(submit, false);
        error.textContent = result.error || t('saveFailed');
        error.scrollIntoView({ block: 'nearest' });
        return;
      }

      state.openId = null;
      refreshAccounts();
      closeSheet();
      haptic();
      showToast(editing ? t('saved') : t('added'));
    }, 30);
  });

  sheetBody.appendChild(form);
}

function fieldRow(label, input, ariaLabel) {
  const row = el('div', 'field');
  const control = el('span', 'field-control');
  input.setAttribute('aria-label', ariaLabel);
  control.appendChild(input);
  row.append(el('span', 'field-label', label), control);
  return row;
}

function randomPassword() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const bytes = new Uint8Array(20);
  if (window.crypto && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, byte => characters[byte % characters.length]).join('');
}

/* ---------- Import ---------- */

function openImportSheet() {
  state.sheet = 'import';
  prepareSheet(t('importTitle'));

  const note = el('p', 'sheet-note');
  note.innerHTML = t('importHelp');
  sheetBody.appendChild(note);

  const fileInput = el('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,.csv,.txt,.md,.markdown,.html,.htm,.mixa,application/json,text/csv,text/plain,text/markdown,text/html';
  fileInput.hidden = true;

  const filePick = makeButton('file-pick');
  const fileIcon = el('span', 'file-pick-icon');
  fileIcon.appendChild(icon('file', 19));
  const fileText = el('span', 'file-pick-text');
  fileText.appendChild(el('span', 'file-pick-title', t('chooseFile')));
  const fileName = el('span', 'file-pick-name', t('noFile'));
  fileText.appendChild(fileName);
  const fileChevron = el('span', 'settings-chevron');
  fileChevron.appendChild(icon('chevron', 17));
  filePick.append(fileIcon, fileText, fileChevron);

  const textarea = el('textarea', 'import-text');
  textarea.placeholder = t('importPlaceholder');

  const error = el('p', 'form-error');
  const submit = makeButton('primary', t('importAction'));
  submit.type = 'button';

  const aiSupported = Boolean(
    bridge &&
    typeof bridge.aiAvailable === 'function' &&
    bridge.aiAvailable()
  );
  let aiButton = null;
  if (aiSupported) {
    aiButton = makeButton('secondary', t('aiAnalyze'));
    aiButton.type = 'button';
    aiButton.addEventListener('click', () => {
      runNeedleImport(textarea, error, aiButton, submit);
    });
  }

  filePick.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      error.textContent = t('fileTooLarge');
      fileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const source = String(reader.result || '');
      fileName.textContent = file.name;
      error.textContent = '';

      if (source.trim().startsWith(BACKUP_MAGIC + ':')) {
        const password = await promptPassword({
          title: t('decryptBackupTitle'),
          message: t('decryptBackupMessage'),
          okText: t('decryptAction')
        });
        if (password === null) return;

        let data;
        try {
          data = JSON.parse(await decryptBackup(source, password));
        } catch (_) {
          error.textContent = t('backupDecryptFailed');
          return;
        }

        const sourceAccounts = Array.isArray(data && data.accounts)
          ? data.accounts
          : (Array.isArray(data && data.items) ? data.items : []);
        const items = sourceAccounts.map(normalizeJsonAccount).filter(Boolean);
        if (!items.length) {
          error.textContent = t('noImportItems');
          return;
        }

        const result = api('import', { items });
        if (!result.ok) {
          error.textContent = result.error || t('importFailed');
          return;
        }

        refreshAccounts();
        closeSheet();
        haptic();
        showToast(importMessage(result.added, result.skipped, result.invalid));
        return;
      }

      textarea.value = source;
    };
    reader.onerror = () => {
      error.textContent = t('fileReadFailed');
    };
    reader.readAsText(file, 'utf-8');
    fileInput.value = '';
  });

  submit.addEventListener('click', () => {
    error.textContent = '';
    let items;
    try {
      items = parseImport(textarea.value);
    } catch (parseError) {
      error.textContent = parseError.message;
      return;
    }

    if (!items.length) {
      error.textContent = t('noImportItems');
      return;
    }

    setBusy(submit, true);
    setTimeout(() => {
      const result = api('import', { items });
      if (!result.ok) {
        setBusy(submit, false);
        error.textContent = result.error || t('importFailed');
        return;
      }

      refreshAccounts();
      closeSheet();
      haptic();

      showToast(importMessage(result.added, result.skipped, result.invalid));
    }, 30);
  });

  sheetBody.append(fileInput, filePick, textarea, error);
  if (aiButton) sheetBody.appendChild(aiButton);
  sheetBody.appendChild(submit);
}

function runNeedleImport(textarea, error, aiButton, submit) {
  const source = textarea.value.trim();
  if (!source) {
    error.textContent = t('importEmpty');
    return;
  }

  error.textContent = '';
  aiButton.textContent = t('aiAnalyzing');
  setBusy(aiButton, true);
  submit.disabled = true;

  setTimeout(() => {
    let items;
    try {
      const raw = bridge.analyzeText(source);
      items = needleItems(raw);
    } catch (analysisError) {
      setBusy(aiButton, false);
      aiButton.textContent = t('aiAnalyze');
      submit.disabled = false;
      error.textContent = analysisError.message || t('aiFailed');
      return;
    }

    if (!items.length) {
      setBusy(aiButton, false);
      aiButton.textContent = t('aiAnalyze');
      submit.disabled = false;
      error.textContent = t('aiNoResult');
      return;
    }

    const result = api('import', { items });
    if (!result.ok) {
      setBusy(aiButton, false);
      aiButton.textContent = t('aiAnalyze');
      submit.disabled = false;
      error.textContent = result.error || t('importFailed');
      return;
    }

    refreshAccounts();
    closeSheet();
    haptic();
    showToast(importMessage(result.added, result.skipped, result.invalid));
  }, 30);
}

function needleItems(raw) {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_) {
    const start = raw.indexOf('{') >= 0 ? raw.indexOf('{') : raw.indexOf('[');
    if (start < 0) throw new Error(t('aiFailed'));
    payload = JSON.parse(raw.slice(start));
  }

  if (payload && payload.ok === false) {
    throw new Error(payload.error === 'AI engine unavailable'
      ? t('aiUnavailable')
      : (payload.error || t('aiFailed')));
  }

  const responses = Array.isArray(payload.responses) ? payload.responses : [payload];
  const items = [];

  for (const response of responses) {
    let data = response;
    if (typeof response === 'string') {
      try {
        data = JSON.parse(response);
      } catch (_) {
        continue;
      }
    }
    if (!data || data.ok === false) continue;

    const calls = data.function_calls || data.functionCalls || [];
    const args = (calls[0] && (calls[0].arguments || calls[0].args)) || data.arguments || {};
    const accounts = args.accounts || data.accounts || (Array.isArray(data) ? data : []);

    for (const account of accounts) {
      const normalized = normalizeJsonAccount(account);
      if (normalized) items.push(normalized);
    }
  }

  return items;
}

function parseImport(text) {
  const source = String(text || '').trim();
  if (!source) throw new Error(t('importEmpty'));

  if (source.startsWith('[') || source.startsWith('{')) {
    let data;
    try {
      data = JSON.parse(source);
    } catch (_) {
      throw new Error(t('jsonParseFailed'));
    }

    let items = null;
    if (Array.isArray(data)) {
      items = data;
    } else if (data && Array.isArray(data.accounts)) {
      items = data.accounts;
    } else if (data && Array.isArray(data.items)) {
      items = data.items;
    } else if (data && typeof data === 'object') {
      items = [data];
    }

    if (!Array.isArray(items)) throw new Error(t('jsonNoArray'));
    return items.map(normalizeJsonAccount).filter(Boolean);
  }

  if (looksLikeHtml(source)) {
    const htmlItems = parseHtmlAccounts(source);
    if (htmlItems.length) return htmlItems;
  }

  const markdownRows = markdownTableRows(source);
  if (markdownRows) {
    const tableItems = accountsFromTable(markdownRows);
    if (tableItems.length) return tableItems;
  }

  if (looksLikeCsv(source)) {
    return parseCsvAccounts(source);
  }

  return parseTextAccounts(source);
}

function looksLikeHtml(text) {
  return /<(?:!doctype|html|body|table|div|p|br|h[1-6]|li|section|article)\b/i.test(text);
}

function looksLikeCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return false;

  const header = rows[0].map(normalizeHeader);
  const aliases = Object.values(CSV_HEADERS).flat();
  const matches = aliases.filter(alias => header.includes(alias)).length;
  if (matches >= 2) return true;

  const firstLine = text.split(/\r?\n/, 1)[0];
  return rows.every(row => row.length >= 3) && /[,\t]/.test(firstLine);
}

function normalizeNoteText(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/^---\n[\s\S]*?\n---\n?/, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 $2')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

function htmlToText(doc) {
  const out = [];
  const blockTags = /^(P|DIV|LI|TR|H[1-6]|SECTION|ARTICLE|BLOCKQUOTE|PRE|BR)$/i;

  const walk = node => {
    if (node.nodeType === Node.TEXT_NODE) {
      out.push(node.nodeValue || '');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const block = blockTags.test(node.tagName);
    if (block) out.push('\n');
    node.childNodes.forEach(walk);
    if (block) out.push('\n');
  };

  if (doc.body) walk(doc.body);
  return out.join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseHtmlAccounts(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, noscript').forEach(node => node.remove());

  const items = [];
  doc.querySelectorAll('table').forEach(table => {
    const rows = Array.from(table.rows).map(row =>
      Array.from(row.cells).map(cell => cell.textContent.trim())
    );
    items.push(...accountsFromTable(rows));
  });

  if (items.length) return items;
  const text = htmlToText(doc).replace(
    /\n\s*\n(?=(?:账号|帐号|用户名|密码|网址|链接|备注|title|username|password|url|note)\s*[:：])/gi,
    '\n'
  );
  return parseTextAccounts(text);
}

function markdownTableRows(text) {
  const lines = String(text || '').split(/\r?\n/);
  const start = lines.findIndex(line => /^\s*\|/.test(line));
  if (start < 0) return null;

  const rows = [];
  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) break;
    const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
    if (cells.every(cell => /^:?-{2,}:?$/.test(cell))) continue;
    rows.push(cells);
  }

  return rows.length >= 2 ? rows : null;
}

function accountsFromTable(rows) {
  if (!rows || rows.length < 2) return [];

  const header = rows[0].map(normalizeHeader);
  const columns = {};
  for (const [field, aliases] of Object.entries(CSV_HEADERS)) {
    const index = header.findIndex(cell => aliases.includes(cell));
    if (index >= 0) columns[field] = index;
  }

  const hasHeader = Object.keys(columns).length >= 2;
  if (hasHeader && columns.password === undefined) return [];
  if (!hasHeader && rows[0].length < 3) return [];

  const start = hasHeader ? 1 : 0;
  const fixed = { title: 0, username: 1, password: 2, url: 3, note: 4 };
  const items = [];

  for (let i = start; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || !row.some(cell => String(cell).trim())) continue;
    const read = field => {
      const index = hasHeader ? columns[field] : fixed[field];
      return index === undefined ? '' : String(row[index] || '');
    };
    const item = {
      title: read('title').trim(),
      username: read('username').trim(),
      password: read('password'),
      url: read('url').trim(),
      note: read('note').trim()
    };
    if (!item.title) item.title = item.username || t('untitled');
    if (item.password) items.push(item);
  }

  return items;
}

function parseTextAccounts(text) {
  const normalized = normalizeNoteText(text);
  const blocks = normalized
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .filter(Boolean);

  const labelRe = /(标题|名称|平台|应用|服务|账号|帐号|用户名|用户|登录名|邮箱|密码|口令|网址|链接|地址|备注|说明|title|name|username|user|account|login|email|password|pass|pwd|url|website|link|notes|note|remark)\s*[:：]\s*/gi;
  const fieldForLabel = {
    '标题': 'title', '名称': 'title', '平台': 'title', '应用': 'title', '服务': 'title',
    title: 'title', name: 'title',
    '账号': 'username', '帐号': 'username', '用户名': 'username', '用户': 'username',
    '登录名': 'username', '邮箱': 'username',
    account: 'username', username: 'username', user: 'username', login: 'username', email: 'username',
    '密码': 'password', '口令': 'password', password: 'password', pass: 'password', pwd: 'password',
    '网址': 'url', '链接': 'url', '地址': 'url', url: 'url', website: 'url', link: 'url',
    '备注': 'note', '说明': 'note', note: 'note', notes: 'note', remark: 'note'
  };

  const items = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    if (!lines.length) continue;

    const fields = { title: '', username: '', password: '', url: '', note: '' };
    const unlabeled = [];

    for (const line of lines) {
      if (/^[-=]{3,}$/.test(line)) continue;
      const matches = Array.from(line.matchAll(labelRe));
      if (matches.length) {
        for (let i = 0; i < matches.length; i += 1) {
          const field = fieldForLabel[normalizeHeader(matches[i][1])];
          if (!field) continue;
          const start = matches[i].index + matches[i][0].length;
          const end = i + 1 < matches.length ? matches[i + 1].index : line.length;
          const value = line.slice(start, end).trim().replace(/^[,，;；|]+|[,，;；|]+$/g, '');
          if (value && !fields[field]) fields[field] = value;
        }
        continue;
      }

      if (/^https?:\/\//i.test(line) && !fields.url) {
        fields.url = line;
        continue;
      }
      unlabeled.push(line);
    }

    const parts = !fields.password && unlabeled.length === 1
      ? unlabeled[0].split(/\s*[|｜\t]\s*/).filter(Boolean)
      : [];

    if (parts.length >= 3) {
      fields.title = fields.title || parts[0];
      fields.username = fields.username || parts[1];
      fields.password = parts[2];
      if (parts[3]) fields.url = fields.url || parts[3];
      unlabeled.length = 0;
    }

    if (!fields.title && unlabeled.length) fields.title = unlabeled.shift();

    if (!fields.password && unlabeled.length) {
      if (unlabeled.length >= 2 && !fields.username) fields.username = unlabeled.shift();
      if (unlabeled.length) fields.password = unlabeled.shift();
    }

    if (unlabeled.length && !fields.note) {
      fields.note = unlabeled.join(' ');
    }

    if (!fields.password) continue;
    if (!fields.title) {
      if (fields.username) fields.title = fields.username;
      else if (fields.url) fields.title = fields.url.replace(/^https?:\/\//i, '').split('/')[0];
      else fields.title = t('untitled');
    }
    items.push(fields);
  }

  if (!items.length) throw new Error(t('noImportItems'));
  return items;
}

function normalizeJsonAccount(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const read = keys => {
    for (const key of keys) {
      if (raw[key] !== undefined && raw[key] !== null && String(raw[key]).length > 0) {
        return String(raw[key]);
      }
    }
    return '';
  };

  const account = {
    title: read(['title', 'name', '名称', '标题', '应用', 'app', 'site']),
    username: read(['username', 'user', 'account', 'login', 'email', '账号', '用户名', '邮箱', '登录名']),
    password: read(['password', 'pass', 'pwd', '密码']),
    url: read(['url', 'website', 'link', '网址', '链接']),
    note: read(['note', 'notes', 'remark', '备注', '说明'])
  };

  if (!account.title && !account.username && !account.password) return null;
  if (!account.title) account.title = account.username || t('untitled');
  return account;
}

const CSV_HEADERS = {
  title: ['title', 'name', '名称', '标题', '应用', 'app', 'site', '网站'],
  username: ['username', 'user', 'account', 'login', 'email', '账号', '用户名', '邮箱', '登录名'],
  password: ['password', 'pass', 'pwd', '密码'],
  url: ['url', 'website', 'link', '网址', '链接'],
  note: ['note', 'notes', 'remark', '备注', '说明']
};

function normalizeHeader(value) {
  return String(value || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function parseCsvAccounts(text) {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error(t('csvNoData'));

  const header = rows[0].map(normalizeHeader);
  const columns = {};

  for (const [field, aliases] of Object.entries(CSV_HEADERS)) {
    const index = header.findIndex(cell => aliases.includes(cell));
    if (index >= 0) columns[field] = index;
  }

  const hasHeader = Object.keys(columns).length >= 2;
  const start = hasHeader ? 1 : 0;

  if (hasHeader && columns.password === undefined) {
    throw new Error(t('csvNoPassword'));
  }

  const items = [];
  for (let i = start; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row.some(cell => String(cell).trim())) continue;

    const item = hasHeader
      ? {
          title: columns.title !== undefined ? row[columns.title] : '',
          username: columns.username !== undefined ? row[columns.username] : '',
          password: columns.password !== undefined ? row[columns.password] : '',
          url: columns.url !== undefined ? row[columns.url] : '',
          note: columns.note !== undefined ? row[columns.note] : ''
        }
      : {
          title: row[0],
          username: row[1],
          password: row[2],
          url: row[3],
          note: row[4]
        };

    for (const key of Object.keys(item)) {
      if (key !== 'password') item[key] = String(item[key] || '').trim();
      else item[key] = String(item[key] || '');
    }
    if (!item.title) item.title = item.username || t('untitled');
    if (item.password) items.push(item);
  }

  if (!items.length) throw new Error(t('csvNoRows'));
  return items;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char === '\r') {
      if (text[i + 1] !== '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      }
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter(cells => cells.some(cell => String(cell).trim() !== ''));
}

/* ---------- Settings ---------- */

const BACKUP_FLAG_KEY = 'mixa.backup.encrypted';
const BACKUP_MAGIC = 'MIXA1';
const BACKUP_ITERATIONS = 210000;

function backupEnabled() {
  try {
    return localStorage.getItem(BACKUP_FLAG_KEY) === '1';
  } catch (_) {
    return false;
  }
}

function setBackupEnabled(enabled) {
  try {
    localStorage.setItem(BACKUP_FLAG_KEY, enabled ? '1' : '0');
  } catch (_) {
    /* no-op */
  }
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveBackupKey(password, salt) {
  if (!window.crypto || !crypto.subtle) {
    throw new Error(t('backupNeedsAndroid10'));
  }
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: BACKUP_ITERATIONS,
      hash: 'SHA-256'
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptBackup(text, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveBackupKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(text)
  );
  return [
    BACKUP_MAGIC,
    bytesToBase64(salt),
    bytesToBase64(iv),
    bytesToBase64(new Uint8Array(encrypted))
  ].join(':');
}

async function decryptBackup(payload, password) {
  const parts = String(payload || '').trim().split(':');
  if (parts.length !== 4 || parts[0] !== BACKUP_MAGIC) {
    throw new Error(t('backupDecryptFailed'));
  }

  const salt = base64ToBytes(parts[1]);
  const iv = base64ToBytes(parts[2]);
  const encrypted = base64ToBytes(parts[3]);
  const key = await deriveBackupKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  return new TextDecoder().decode(decrypted);
}

async function exportVault() {
  const encrypted = backupEnabled();

  if (!encrypted) {
    const confirmed = await confirmAlert(
      t('exportTitle'),
      t('exportMessage'),
      t('exportAction'),
      false
    );
    if (!confirmed) return;
  }

  const payload = {
    version: 1,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    accounts: state.accounts.map(account => ({
      title: account.title,
      username: account.username,
      password: account.password,
      url: account.url,
      note: account.note
    }))
  };
  const text = JSON.stringify(payload, null, 2);
  const date = new Date().toISOString().slice(0, 10);

  if (encrypted) {
    const password = await promptPassword({
      title: t('exportBackupTitle'),
      message: t('exportBackupMessage'),
      okText: t('exportAction'),
      confirm: true,
      placeholder: t('backupPasswordHint'),
      minLength: 8
    });
    if (password === null) return;

    let encryptedText;
    try {
      encryptedText = await encryptBackup(text, password);
    } catch (error) {
      showToast(error.message || t('backupExportFailed'));
      return;
    }

    const fileName = `mixa-vault-backup-${date}-${new Date()
      .toISOString()
      .slice(11, 19)
      .replace(/:/g, '')}.mixa`;
    lastBackupPath = `Download/MixaVault/backups/${fileName}`;
    if (bridge && typeof bridge.exportBackup === 'function') {
      try {
        bridge.exportBackup(fileName, encryptedText);
      } catch (_) {
        showToast(t('backupExportFailed'));
      }
      return;
    }

    try {
      const blob = new Blob([encryptedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(t('backupExported'), {
        detail: lastBackupPath,
        icon: 'check'
      });
    } catch (_) {
      showToast(t('backupExportFailed'));
    }
    return;
  }

  const fileName = `mixa-vault-${date}.json`;
  lastPlainPath = `Download/MixaVault/${fileName}`;

  if (bridge && typeof bridge.exportPlainJson === 'function') {
    try {
      bridge.exportPlainJson(fileName, text);
    } catch (_) {
      showToast(t('exportFailed'), { error: true });
    }
    return;
  }

  try {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(t('exported'), {
      detail: lastPlainPath,
      icon: 'check'
    });
  } catch (_) {
    showToast(t('exportFailed'), { error: true });
  }
}

window.__onBackupExportResult = ok => {
  if (ok === null || ok === undefined) return;
  if (ok) {
    showToast(t('backupExported'), {
      detail: lastBackupPath,
      icon: 'check'
    });
  } else {
    showToast(t('backupExportFailed'), { error: true });
  }
};

window.__onExportResult = ok => {
  if (ok === null || ok === undefined) return;
  showToast(ok ? t('exported') : t('exportFailed'), { error: !ok });
};

window.__onPlainExportResult = ok => {
  if (ok === null || ok === undefined) return;
  if (ok) {
    showToast(t('exported'), {
      detail: lastPlainPath,
      icon: 'check'
    });
  } else {
    showToast(t('exportFailed'), { error: true });
  }
};

function exportDiagnostics() {
  const python = api('diagnostics');
  const pythonLog = python && python.ok ? String(python.text || '') : '';
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const header = [
    'Mixa Vault Diagnostics',
    `version: ${APP_VERSION}`,
    `time: ${now.toISOString()}`,
    `language: ${LANG}`,
    `theme: ${darkQuery.matches ? 'dark' : 'light'}`,
    `accounts: ${state.accounts.length}`,
    `screen: ${window.screen.width}x${window.screen.height}`,
    `userAgent: ${navigator.userAgent}`,
    ''
  ].join('\n');
  const text = [
    header,
    '--- UI log ---',
    diagnostics.join('\n') || '(empty)',
    '',
    '--- Python log ---',
    pythonLog || '(empty)',
    ''
  ].join('\n');
  const fileName = `mixa-vault-diagnostics-${timestamp}.txt`;
  lastLogPath = `Download/${fileName}`;

  if (bridge && typeof bridge.exportLog === 'function') {
    try {
      bridge.exportLog(fileName, text);
    } catch (_) {
      showToast(t('logExportFailed'), { error: true });
    }
    return;
  }

  try {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(t('logExported'), {
      detail: lastLogPath,
      icon: 'check'
    });
  } catch (_) {
    showToast(t('logExportFailed'), { error: true });
  }
}

window.__onLogExportResult = ok => {
  if (ok === null || ok === undefined) return;
  if (ok) {
    showToast(t('logExported'), {
      detail: lastLogPath,
      icon: 'check'
    });
  } else {
    showToast(t('logExportFailed'), { error: true });
  }
};

function openGithub() {
  const url = 'https://github.com/d1irgger';
  if (bridge && typeof bridge.openUrl === 'function') {
    try {
      bridge.openUrl(url);
    } catch (_) {
      showToast(t('openLinkFailed'));
    }
    return;
  }
  window.open(url, '_blank', 'noopener');
}

function openSettingsSheet() {
  state.sheet = 'settings';
  prepareSheet(t('settingsTitle'), t('done'));

  const status = api('status');
  const total = status.ok ? status.count : state.accounts.length;

  const general = el('div', 'settings-group');
  general.appendChild(settingsRow(t('accounts'), settingsCount(total)));
  general.appendChild(settingsRow(t('storageLocation'), t('appPrivate')));
  const fileRow = settingsLinkRow(
    t('file'),
    backupEnabled() ? 'vault.mixa' : 'vault.json',
    exportVault
  );
  const fileValue = $('.settings-value', fileRow);
  general.appendChild(fileRow);

  const security = el('div', 'settings-group');
  const encryptionRow = settingsSwitchRow(
    t('encryptedBackup'),
    backupEnabled(),
    enabled => {
      setBackupEnabled(enabled);
      if (fileValue) fileValue.textContent = enabled ? 'vault.mixa' : 'vault.json';
      showToast(t(enabled ? 'encryptionOn' : 'encryptionOff'));
    }
  );
  security.appendChild(encryptionRow);

  const encryptionNote = el('p', 'settings-note');
  encryptionNote.textContent = t('encryptionNote');

  const about = el('div', 'settings-group');
  about.appendChild(settingsRow(t('version'), APP_VERSION));
  about.appendChild(settingsLinkRow(t('about'), 'GitHub', openGithub, true));

  const diagnosticGroup = el('div', 'settings-group');
  diagnosticGroup.appendChild(settingsLinkRow(
    t('diagnostics'),
    t('exportAction'),
    exportDiagnostics,
    true
  ));

  const foot = el('p', 'settings-foot');
  foot.textContent = t('settingsFoot');

  sheetBody.append(general, security, encryptionNote, about, diagnosticGroup, foot);
}

function settingsRow(label, value) {
  const row = el('div', 'settings-row', label);
  row.appendChild(el('span', 'settings-value', value));
  return row;
}

function settingsLinkRow(label, value, onClick, accent = false) {
  const row = makeButton('settings-row settings-link');
  row.append(el('span', 'settings-row-label', label));
  row.appendChild(el('span', accent ? 'settings-value accent' : 'settings-value', value));
  row.addEventListener('click', onClick);
  return row;
}

function settingsSwitchRow(label, checked, onChange) {
  const row = el('div', 'settings-row', label);
  const toggle = makeButton(checked ? 'switch on' : 'switch');
  toggle.type = 'button';
  toggle.setAttribute('role', 'switch');
  toggle.setAttribute('aria-checked', checked ? 'true' : 'false');
  toggle.addEventListener('click', () => {
    const next = !toggle.classList.contains('on');
    toggle.classList.toggle('on', next);
    toggle.setAttribute('aria-checked', next ? 'true' : 'false');
    onChange(next);
  });
  row.appendChild(toggle);
  return row;
}

/* ---------- Alert ---------- */

function confirmAlert(title, message, okText = t('delete'), danger = true) {
  return new Promise(resolve => {
    state.alertOpen = true;
    state.alertResolve = resolve;

    alertTitle.textContent = title;
    alertMessage.textContent = message;
    alertOk.textContent = okText;
    alertOk.classList.toggle('alert-danger', danger);

    alertLayer.classList.add('show');
    alertLayer.setAttribute('aria-hidden', 'false');
    setNativeOverlay();
    haptic();
  });
}

function settleAlert(value) {
  if (!state.alertOpen) return;
  state.alertOpen = false;
  alertLayer.classList.remove('show');
  alertLayer.setAttribute('aria-hidden', 'true');
  setNativeOverlay();

  const resolve = state.alertResolve;
  state.alertResolve = null;
  if (resolve) resolve(value);
}

alertCancel.addEventListener('click', () => settleAlert(false));
alertOk.addEventListener('click', () => settleAlert(true));

function promptPassword(options = {}) {
  return new Promise(resolve => {
    state.passwordOpen = true;
    state.passwordResolve = resolve;

    passwordTitle.textContent = options.title || t('backupPasswordTitle');
    passwordMessage.textContent = options.message || '';
    passwordOk.textContent = options.okText || t('continueAction');
    passwordInput.value = '';
    passwordConfirm.value = '';
    passwordError.textContent = '';
    passwordConfirm.hidden = !options.confirm;
    passwordInput.placeholder = options.placeholder || t('backupPassword');
    passwordConfirm.placeholder = t('confirmPassword');
    passwordInput.minLength = options.minLength || 0;

    passwordLayer.classList.add('show');
    passwordLayer.setAttribute('aria-hidden', 'false');
    setNativeOverlay();
    haptic();
    setTimeout(() => passwordInput.focus(), 120);
  });
}

function settlePassword(value) {
  if (!state.passwordOpen) return;
  state.passwordOpen = false;
  passwordLayer.classList.remove('show');
  passwordLayer.setAttribute('aria-hidden', 'true');
  setNativeOverlay();

  const resolve = state.passwordResolve;
  state.passwordResolve = null;
  if (resolve) resolve(value);
}

function submitPassword() {
  const value = passwordInput.value;
  const minimum = Number(passwordInput.minLength) || 0;
  passwordError.textContent = '';

  if (!value) {
    passwordError.textContent = t('passwordRequired');
    return;
  }
  if (minimum && value.length < minimum) {
    passwordError.textContent = t('passwordTooShort').replace('{n}', minimum);
    return;
  }
  if (!passwordConfirm.hidden && value !== passwordConfirm.value) {
    passwordError.textContent = t('passwordMismatch');
    return;
  }

  settlePassword(value);
}

passwordCancel.addEventListener('click', () => settlePassword(null));
passwordOk.addEventListener('click', submitPassword);
passwordInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitPassword();
  }
});
passwordConfirm.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitPassword();
  }
});

/* ---------- Data ---------- */

function refreshAccounts() {
  const result = api('list');
  if (!result.ok) {
    showToast(result.error || t('readFailed'));
    return false;
  }
  state.accounts = sortAccounts(result.accounts || []);
  render();
  return true;
}

/* ---------- Back / escape ---------- */

window.closeTopOverlay = function closeTopOverlay() {
  if (state.passwordOpen) {
    settlePassword(null);
    return true;
  }
  if (state.alertOpen) {
    settleAlert(false);
    return true;
  }
  if (state.sheet !== null) {
    closeSheet();
    return true;
  }
  return false;
};

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') window.closeTopOverlay();
});

/* ---------- Startup ---------- */

function boot() {
  retryBtn.hidden = true;
  splashStatus.textContent = t('opening');
  diag('app', `boot ${APP_VERSION}`);

  const status = api('status');
  if (!status.ok) {
    splashStatus.textContent = status.error || t('cannotOpen');
    retryBtn.hidden = false;
    return;
  }

  if (!refreshAccounts()) {
    splashStatus.textContent = t('cannotRead');
    retryBtn.hidden = false;
    return;
  }

  requestAnimationFrame(() => {
    app.classList.add('ready');
    app.setAttribute('aria-hidden', 'false');
    splash.classList.add('hide');
  });

  const previewSheet = params.get('sheet');
  if (!bridge && previewSheet) {
    setTimeout(() => {
      if (previewSheet === 'add') openAccountSheet();
      else if (previewSheet === 'import') openImportSheet();
      else if (previewSheet === 'settings') openSettingsSheet();
    }, 450);
  }
}

retryBtn.addEventListener('click', boot);
boot();
