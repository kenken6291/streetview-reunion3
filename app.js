/* =============================================
   あの場所の今 — メインアプリケーションロジック
   ============================================= */

'use strict';

// -----------------------------------------------
// グローバル変数
// -----------------------------------------------
let map;          // Google Maps インスタンス
let panorama;     // StreetView パノラマ
let geocoder;     // ジオコーダー
let autocomplete; // 場所オートコンプリート
let marker;       // 現在地マーカー

/** 現在表示中の場所 */
let currentLocation = null;

/** お気に入りリスト（localStorage から読み込み） */
let favorites = [];

const STORAGE_KEY = 'streetview-reunion-favorites';

// -----------------------------------------------
// Google Maps API 初期化コールバック
// -----------------------------------------------
function initApp() {
  geocoder     = new google.maps.Geocoder();

  const defaultPos = { lat: 35.6762, lng: 139.6503 }; // 東京

  // ---- 地図初期化 ----
  map = new google.maps.Map(document.getElementById('map'), {
    center:            defaultPos,
    zoom:              14,
    mapTypeControl:    false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl:       true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP
    }
  });

  // ---- StreetView パノラマ初期化 ----
  panorama = new google.maps.StreetViewPanorama(
    document.getElementById('street-view'),
    {
      position:            defaultPos,
      pov:                 { heading: 34, pitch: 10 },
      visible:             false,
      addressControl:      true,
      linksControl:        true,
      panControl:          true,
      enableCloseButton:   false,
      fullscreenControl:   false
    }
  );
  map.setStreetView(panorama);

  // ---- Places オートコンプリート ----
  autocomplete = new google.maps.places.Autocomplete(
    document.getElementById('search-input'),
    { types: ['geocode', 'establishment'] }
  );
  autocomplete.addListener('place_changed', onPlaceChanged);

  // ---- イベントリスナー ----
  document.getElementById('search-btn').addEventListener('click', searchLocation);
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchLocation();
  });
  document.getElementById('add-favorite-btn').addEventListener('click', addToFavorites);
  document.getElementById('clear-all-btn').addEventListener('click', clearAllFavorites);

  // ---- localStorage からお気に入りを復元 ----
  loadFavorites();
  renderFavorites();
}

// -----------------------------------------------
// 検索処理
// -----------------------------------------------

/** 検索ボタン押下 or Enter キー */
function searchLocation() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) {
    showToast('住所またはキーワードを入力してください', 'warn');
    return;
  }

  setSearchLoading(true);

  geocoder.geocode({ address: query }, (results, status) => {
    setSearchLoading(false);
    if (status === google.maps.GeocoderStatus.OK) {
      const place = results[0];
      updateView(place.geometry.location, place.formatted_address);
    } else {
      showToast('場所が見つかりませんでした。別のキーワードを試してください。', 'error');
    }
  });
}

/** オートコンプリートで場所が選択されたとき */
function onPlaceChanged() {
  const place = autocomplete.getPlace();
  if (place.geometry && place.geometry.location) {
    updateView(place.geometry.location, place.formatted_address || place.name);
  }
}

// -----------------------------------------------
// 地図 & StreetView 更新
// -----------------------------------------------

/**
 * 指定した位置に地図とStreetViewを移動する
 * @param {google.maps.LatLng} latLng
 * @param {string} address
 */
function updateView(latLng, address) {
  // 地図センター & マーカー
  map.setCenter(latLng);
  map.setZoom(15);

  if (marker) marker.setMap(null);
  marker = new google.maps.Marker({
    position: latLng,
    map:      map,
    title:    address,
    animation: google.maps.Animation.DROP
  });

  // 現在地情報を保存
  currentLocation = {
    lat:     latLng.lat(),
    lng:     latLng.lng(),
    address: address
  };

  // 住所バーを更新
  document.getElementById('current-address').textContent = address;

  // StreetView の利用可能チェック
  const svService = new google.maps.StreetViewService();
  svService.getPanorama(
    { location: latLng, radius: 100, source: google.maps.StreetViewSource.OUTDOOR },
    (data, svStatus) => {
      const mapPlaceholder = document.getElementById('map-placeholder');
      const svPlaceholder  = document.getElementById('street-view-placeholder');

      // 地図プレースホルダーを隠す
      if (mapPlaceholder) mapPlaceholder.style.display = 'none';

      if (svStatus === google.maps.StreetViewStatus.OK) {
        panorama.setPosition(latLng);
        panorama.setVisible(true);
        svPlaceholder.style.display = 'none';
      } else {
        panorama.setVisible(false);
        svPlaceholder.style.display   = 'flex';
        svPlaceholder.innerHTML = `
          <span>😔</span>
          <p>この場所にはストリートビューがありません</p>
          <small>別の住所をお試しください</small>
        `;
      }
    }
  );

  // お気に入り追加ボタンを有効化
  document.getElementById('add-favorite-btn').disabled   = false;
  document.getElementById('add-favorite-btn').textContent = '♡ お気に入りに追加';
}

// -----------------------------------------------
// お気に入り機能
// -----------------------------------------------

/** 現在の場所をお気に入りに追加 */
function addToFavorites() {
  if (!currentLocation) return;

  const year = document.getElementById('year-input').value.trim();
  const memo = document.getElementById('memo-input').value.trim();

  // 重複チェック（同緯度経度）
  const isDuplicate = favorites.some(
    (f) => Math.abs(f.lat - currentLocation.lat) < 0.0001 &&
           Math.abs(f.lng - currentLocation.lng) < 0.0001
  );
  if (isDuplicate) {
    showToast('この場所はすでにお気に入りに追加されています', 'warn');
    return;
  }

  const item = {
    id:      Date.now(),
    address: currentLocation.address,
    lat:     currentLocation.lat,
    lng:     currentLocation.lng,
    year:    year,
    memo:    memo,
    savedAt: new Date().toLocaleDateString('ja-JP')
  };

  favorites.unshift(item);
  saveFavorites();
  renderFavorites();

  // ボタンのフィードバック
  const btn = document.getElementById('add-favorite-btn');
  btn.textContent = '✓ 追加しました！';
  btn.style.background = '#059669';
  setTimeout(() => {
    btn.textContent   = '♡ お気に入りに追加';
    btn.style.background = '';
  }, 2000);

  showToast('お気に入りに追加しました 💛', 'success');
}

/** お気に入りを画面に描画 */
function renderFavorites() {
  const list = document.getElementById('favorites-list');

  if (favorites.length === 0) {
    list.innerHTML = '<p class="empty-msg">まだお気に入りはありません。<br>場所を検索して追加してみましょう！</p>';
    return;
  }

  list.innerHTML = favorites.map((fav) => `
    <div class="favorite-item" data-id="${fav.id}">
      <div class="fav-header">
        <span class="fav-address">${escapeHtml(fav.address)}</span>
        <button class="btn btn-danger" onclick="deleteFavorite(${fav.id})" title="削除">×</button>
      </div>
      ${fav.year ? `<span class="fav-year">📅 ${escapeHtml(fav.year)}年</span>` : ''}
      ${fav.memo ? `<p class="fav-memo">💭 ${escapeHtml(fav.memo)}</p>` : ''}
      <p class="fav-saved">保存日: ${fav.savedAt}</p>
      <div class="fav-actions">
        <button class="fav-goto" onclick="gotoFavorite(${fav.id})">📍 この場所を見る</button>
      </div>
    </div>
  `).join('');
}

/** お気に入りの場所に移動 */
function gotoFavorite(id) {
  const fav = favorites.find((f) => f.id === id);
  if (!fav) return;

  const latLng = new google.maps.LatLng(fav.lat, fav.lng);
  updateView(latLng, fav.address);

  // フォームを復元
  document.getElementById('search-input').value = fav.address;
  document.getElementById('year-input').value   = fav.year || '';
  document.getElementById('memo-input').value   = fav.memo || '';

  // スクロール（モバイル）
  document.querySelector('.view-area').scrollIntoView({ behavior: 'smooth' });
}

/** 1件削除 */
function deleteFavorite(id) {
  favorites = favorites.filter((f) => f.id !== id);
  saveFavorites();
  renderFavorites();
  showToast('削除しました', 'info');
}

/** すべて削除 */
function clearAllFavorites() {
  if (favorites.length === 0) return;
  if (!confirm('お気に入りをすべて削除しますか？')) return;
  favorites = [];
  saveFavorites();
  renderFavorites();
  showToast('すべて削除しました', 'info');
}

// -----------------------------------------------
// localStorage 操作
// -----------------------------------------------

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    favorites = raw ? JSON.parse(raw) : [];
  } catch (e) {
    favorites = [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.warn('localStorage への保存に失敗しました:', e);
  }
}

// -----------------------------------------------
// ユーティリティ
// -----------------------------------------------

/**
 * XSS対策：HTML特殊文字をエスケープ
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** 検索ボタンのローディング表示切り替え */
function setSearchLoading(isLoading) {
  const btn = document.getElementById('search-btn');
  btn.textContent  = isLoading ? '⏳' : '🔍';
  btn.disabled     = isLoading;
}

/**
 * トースト通知
 * @param {string} message
 * @param {'success'|'error'|'warn'|'info'} type
 */
function showToast(message, type = 'info') {
  // 既存のトーストを除去
  const existing = document.getElementById('toast-msg');
  if (existing) existing.remove();

  const colors = {
    success: '#10b981',
    error:   '#ef4444',
    warn:    '#f59e0b',
    info:    '#3b82f6'
  };

  const toast = document.createElement('div');
  toast.id = 'toast-msg';
  Object.assign(toast.style, {
    position:    'fixed',
    bottom:      '1.5rem',
    left:        '50%',
    transform:   'translateX(-50%)',
    background:  colors[type] || colors.info,
    color:       '#fff',
    padding:     '0.65rem 1.4rem',
    borderRadius: '999px',
    boxShadow:   '0 4px 16px rgba(0,0,0,0.18)',
    fontSize:    '0.875rem',
    fontWeight:  '600',
    zIndex:      '9999',
    whiteSpace:  'nowrap',
    animation:   'fadeInUp 0.25s ease'
  });
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// トーストアニメーション用スタイルを動的に挿入
(function injectToastAnimation() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateX(-50%) translateY(12px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);
})();