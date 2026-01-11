# Autosave Feature Documentation

## Overview

NoteCottage now includes an intelligent autosave system that automatically saves your notes as you type, providing peace of mind and a seamless editing experience.

## How It Works

### Automatic Saving
- **Trigger**: Saves automatically **2 seconds** after you stop typing
- **Debounced**: Timer resets with each keystroke, preventing excessive saves while you're actively typing
- **Smart Detection**: Only saves when content actually changes
- **Existing Notes Only**: Autosave only works for notes that have already been saved (with a title)

### Visual Feedback

The save status is displayed in the **center of the status bar** at the bottom of the editor:

1. **"Unsaved changes"** (Yellow badge)
   - Appears immediately when you start typing
   - Indicates that autosave is scheduled

2. **"Saving..."** (Blue badge)
   - Shows when the note is being saved to the database
   - Brief flash while the save operation completes

3. **"All changes saved"** (Green badge)
   - Confirms your changes are safely stored
   - Appears after successful save

### New Notes

For **new notes** (without a title):
- Autosave is **disabled** until you manually save with a title
- This prevents creating untitled or incomplete notes
- Use the "Save" button or `Ctrl/Cmd + S` to save the first time
- After initial save, autosave activates automatically

## Technical Implementation

### Key Features

1. **Debouncing** (2-second delay)
   - Prevents rapid-fire API calls while typing
   - Reduces server load and database writes
   - Configurable via `AUTOSAVE_DELAY` constant (default: 2000ms)

2. **Content Change Detection**
   - Compares current content with last saved version
   - Skips save if no changes detected
   - Prevents unnecessary database operations

3. **Preview Mode Handling**
   - Autosave disabled when in preview mode
   - Prevents saves while viewing rendered markdown

4. **Concurrent Save Protection**
   - Prevents multiple simultaneous save operations
   - Uses `isAutoSaving` flag to avoid race conditions

5. **Timestamp Updates**
   - Updates the note's "Last edited" timestamp in real-time
   - Refreshes sidebar timestamp without full reload
   - Maintains accurate modification times

6. **Tag Synchronization**
   - Automatically reloads tags after autosave
   - Ensures new hashtags appear in tag list immediately
   - Keeps tag counts accurate

### Code Structure

**State Variables** (app.js:100-104)
```javascript
let autosaveTimeout = null;           // Debounce timer
let hasUnsavedChanges = false;        // Track unsaved state
let isAutoSaving = false;             // Prevent concurrent saves
const AUTOSAVE_DELAY = 2000;          // 2 seconds
```

**Core Functions**
- `scheduleAutosave()` - Debounces and schedules save
- `autoSave()` - Performs the actual save operation
- `updateSaveStatus()` - Updates visual indicator
- `cancelAutosave()` - Clears pending autosave

**Integration Points**
- `noteContent` input event listener triggers autosave
- `saveCurrentNote()` cancels pending autosave (manual save takes priority)
- `loadNote()` resets autosave state
- `createNewNote()` disables autosave for new notes

## User Experience

### Benefits

✅ **Never lose work** - Changes saved automatically every 2 seconds
✅ **Clear feedback** - Always know your save status
✅ **Non-intrusive** - Saves in background without interrupting workflow
✅ **Manual override** - `Ctrl/Cmd + S` still works anytime
✅ **Smart behavior** - Only saves when needed

### Interaction with Manual Save

The manual save button (`Ctrl/Cmd + S`) and autosave work together:
- Manual save **cancels** any pending autosave
- Manual save **takes priority** over autosave
- Both update the same save status indicator
- "Saved!" flash message appears for manual saves

## Customization

To change the autosave delay, modify the constant in `app.js`:

```javascript
const AUTOSAVE_DELAY = 3000; // 3 seconds instead of 2
```

**Recommended range**: 1000-5000ms (1-5 seconds)
- **Too short** (< 1s): Excessive server requests
- **Too long** (> 5s): Risk of data loss increases

## CSS Styling

### Save Status Indicator

Located in `style.css:704-739`:

```css
.save-status {
    font-size: 12px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 12px;
    transition: all 0.3s ease;
}

.save-status.saving {
    color: var(--primary-color);      /* Blue */
    background-color: rgba(52, 152, 219, 0.1);
}

.save-status.saved {
    color: var(--success-color);      /* Green */
    background-color: rgba(46, 204, 113, 0.1);
}

.save-status.unsaved {
    color: var(--warning-color);      /* Yellow */
    background-color: rgba(241, 196, 15, 0.1);
}
```

### Dark Mode Support

Colors automatically adjust in dark mode with brighter, more visible variants.

## Edge Cases Handled

✅ **Empty content** - Doesn't autosave empty notes
✅ **No changes** - Skips save if content unchanged
✅ **Network errors** - Shows "Unsaved changes" on failure
✅ **Rapid switching** - Cancels autosave when switching notes
✅ **New note creation** - Disables autosave until first manual save
✅ **Preview mode** - Autosave paused while viewing preview

## Performance Considerations

### Optimizations

1. **Debouncing**: Reduces API calls by 90%+ during active typing
2. **Change Detection**: Prevents unnecessary database writes
3. **Minimal Reloading**: Updates only timestamp, not full sidebar
4. **Single Request**: Tags reload combined with save operation

### Network Impact

- **Without autosave**: 1 request per manual save (user dependent)
- **With autosave**: ~1 request per 2 seconds of active editing
- **Typical editing**: 10-30 saves per hour (versus 1-5 manual saves)

The increased requests are negligible for a local/single-user application and provide significant UX benefits.

## Browser Compatibility

✅ **Modern browsers**: Chrome, Firefox, Safari, Edge (all recent versions)
✅ **ES6 features**: Async/await, arrow functions, template literals
✅ **CSS**: CSS custom properties (variables), flexbox
✅ **localStorage**: Status and theme persistence

## Testing Autosave

To verify autosave is working:

1. **Open an existing note**
2. **Start typing** - Status should show "Unsaved changes" (yellow)
3. **Stop typing for 2 seconds** - Status should change to "Saving..." then "All changes saved" (green)
4. **Check timestamp** - "Last edited" should update
5. **Reload page** - Changes should persist

## Troubleshooting

### Autosave Not Working?

1. **Check console** for JavaScript errors
2. **Verify note has been saved** at least once (has a title)
3. **Ensure you're in edit mode**, not preview mode
4. **Check network tab** for failed API requests
5. **Verify server is running** and responding

### Save Status Not Showing?

1. **Check HTML element** exists: `<span id="saveStatus">`
2. **Verify CSS is loaded** for `.save-status` class
3. **Check browser console** for errors
4. **Refresh page** to reload styles

## Future Enhancements

Potential improvements for consideration:

- **Configurable delay** in settings/preferences
- **Offline queueing** for network-resilient saves
- **Conflict resolution** for concurrent edits (multi-device)
- **Save history** with version snapshots
- **Undo/redo** integration with autosave points

---

*Autosave feature implemented: December 27, 2024*
