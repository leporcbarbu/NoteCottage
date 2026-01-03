# PWA Testing Guide

## Testing the Progressive Web App functionality

### Desktop Testing (Chrome/Edge)

1. **Open NoteCottage**
   - Navigate to http://localhost:3000
   - Login to your account

2. **Check Service Worker Registration**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for: "Service Worker registered successfully"
   - Check for any errors

3. **Verify Manifest**
   - In DevTools, go to "Application" tab
   - Click "Manifest" in left sidebar
   - Verify:
     - Name: "NoteCottage"
     - Theme color: #8B6F47
     - Icons appear (192px and 512px)

4. **Test Offline Mode**
   - In DevTools "Application" tab → "Service Workers"
   - Check "Offline" checkbox
   - Refresh the page
   - App should still load from cache
   - Previously viewed notes should be accessible

5. **Install as App (Desktop PWA)**
   - Look for install icon in address bar (⊕ or install icon)
   - Click to install
   - App opens in standalone window (no browser UI)
   - Check Start Menu/Applications - NoteCottage should be listed

### Mobile Testing (Android Chrome)

1. **Open on Mobile**
   - Navigate to http://YOUR_IP:3000 (use your computer's IP on local network)
   - Or deploy to production server

2. **Add to Home Screen**
   - Tap menu (⋮)
   - Select "Add to Home Screen" or "Install app"
   - Confirm installation
   - Icon appears on home screen

3. **Launch from Home Screen**
   - Tap NoteCottage icon
   - App opens full-screen (no browser chrome)
   - Should see splash screen with cottage colors
   - Status bar matches theme color

4. **Test Offline**
   - Open a few notes
   - Enable airplane mode
   - Open app from home screen
   - Previously viewed notes should load
   - Can view cached content

### iOS Testing (Safari)

1. **Open on iPhone/iPad**
   - Navigate to http://YOUR_IP:3000 in Safari

2. **Add to Home Screen**
   - Tap Share button (square with arrow)
   - Scroll and tap "Add to Home Screen"
   - Edit name if desired
   - Tap "Add"

3. **Launch**
   - Tap NoteCottage icon on home screen
   - Opens in standalone mode
   - Note: iOS has limited service worker support
   - Offline may not work as well as Android

### What to Look For

**Working correctly:**
- ✅ "Service Worker registered successfully" in console
- ✅ Manifest loads with correct theme colors
- ✅ Icons display in manifest inspector
- ✅ App can be installed/added to home screen
- ✅ Standalone window (no browser UI)
- ✅ Previously viewed pages load offline
- ✅ Theme color appears in status bar (mobile)

**Common Issues:**

**"Service Worker registration failed"**
- Check console for detailed error
- Ensure HTTPS (or localhost for testing)
- Clear browser cache and reload

**Icons don't appear:**
- Check public/images/icon-192.png exists
- Verify file paths in manifest.json
- Hard refresh (Ctrl+Shift+R)

**Offline mode not working:**
- Service worker needs time to cache
- Navigate to several pages first
- Check DevTools → Application → Cache Storage
- Verify cached files appear

**Can't install app:**
- Not all browsers support installation
- Chrome/Edge: Best support
- Firefox: Limited PWA support
- Safari iOS: "Add to Home Screen" instead

### Cache Management

**Clear service worker cache:**
```javascript
// In DevTools Console:
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

**Unregister service worker:**
```javascript
// In DevTools Console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
```

### Production Testing

When deployed to production (HTTPS):
1. Service worker works on all pages (not just localhost)
2. Better offline support
3. Can be installed on any device
4. Push notifications possible (future feature)

### Known Limitations

- **Service Worker Scope:** Only works on same origin
- **Cache Size:** Browser may limit cache size
- **iOS Safari:** Limited service worker features
- **Offline Saves:** Saves are queued, sync when back online (future enhancement)

### Future Enhancements

- [ ] Push notifications
- [ ] Background sync (save notes offline, sync when online)
- [ ] Offline indicator in UI
- [ ] Cache management UI (clear cache button)
- [ ] Update notification ("New version available")
