# Test Cases for Venue Group Removal

## Setup
1. Open the browser console (F12)
2. Navigate to Cleaner Routes page
3. Look for console logs with 🔵 (info) and 🔴 (errors)

---

## Test Case 1: Remove Last Venue Group (Edge Case)
**Goal:** Test the edge case where you have exactly 1 venue and 1 venue group

### Steps:
1. **Setup:**
   - Create a route with exactly 1 venue and 1 venue group
   - Note: You can drag "Pferdeklinik - (029)" as venue
   - Note: You can drag "Group ABC" as the group

2. **Action:**
   - Drag "Group ABC" from the driver assignment to "VENUES GROUP" area
   - Watch the console for logs

3. **Expected Console Output:**
   ```
   🔵 ========== GROUP DRAG REMOVAL START ==========
   🔵 Driver: { name, id, userId, vlUserId }
   🔵 Dragged Group: { id, groupId, name }
   🔵 Current assignedVenues: [array]
   🔵 Venue IDs in dragged group: [array]
   🔵 Filtering out group: Group ABC
   🔵 Remaining venues after filtering: []
   🔵 Total items remaining: 0
   🔵 Updating local state - removing group and venues
   🔵 Fetching current route for userId: xxx
   🔵 Current route from API: { routeId, routeName, venueGroupsInfo, currentVenuesCount }
   🔵 Preparing route update: { venueGroupsBefore: 1, venueGroupsAfter: 0, venuesDataLength: 0 }
   🔵 Sending route UPDATE payload: { ... }
   🔵 Route update response: { ok: true, status: 200, ... }
   🔵 Route update successful, now updating venue group
   ...
   🔵 ========== GROUP DRAG REMOVAL COMPLETE ==========
   ```

4. **Expected Behavior:**
   - ✅ "Group ABC" disappears from driver assignment
   - ✅ Remaining venue remains assigned
   - ✅ Route is empty (no venues, no groups)
   - ✅ Success message: "Last group removed. Route now empty for [driver name] (Cleaner)"

---

## Test Case 2: Remove Group with Multiple Venues
**Goal:** Test removing a group when there are other items

### Steps:
1. **Setup:**
   - Create a route with:
     - 2 individual venues
     - 1 venue group containing 2 venues

2. **Action:**
   - Drag the venue group to "VENUES GROUP" area
   - Watch the console

3. **Expected Console Output:**
   ```
   🔵 ========== GROUP DRAG REMOVAL START ==========
   🔵 Remaining venues after filtering: [array with 2 venues]
   🔵 Total items remaining: 2
   🔵 Preparing route update: { venueGroupsBefore: 1, venueGroupsAfter: 0, venuesDataLength: 2 }
   ...
   ```

4. **Expected Behavior:**
   - ✅ Group disappears from driver assignment
   - ✅ 2 remaining venues stay assigned
   - ✅ Success message: "Group '[name]' removed from [driver name]'s (Cleaner) route"

---

## Test Case 3: Remove Last Venue (Edge Case)
**Goal:** Test removing the last venue when there's still a group

### Steps:
1. **Setup:**
   - Create a route with:
     - 1 venue
     - 1 venue group

2. **Action:**
   - Drag the last venue from driver assignment to "VENUES LIST" area
   - Watch the console for logs starting with 🔵

3. **Expected Console Output:**
   ```
   🔵 ========== VENUE DRAG REMOVAL START ==========  (look for different emoji)
   🔵 Remaining venues: []
   🔵 Sending route UPDATE payload with empty venues array
   ...
   ```

4. **Expected Behavior:**
   - ✅ Venue disappears from driver
   - ✅ Group remains assigned
   - ✅ Route still has group but no venues

---

## What to Look For in Console Logs

### Success Indicators:
- 🔵 Logs show "Route update response: { ok: true }"
- 🔵 Logs show "Venue group updated successfully"
- 🔵 Logs show "GROUP DRAG REMOVAL COMPLETE"
- No 🔴 error logs

### Failure Indicators:
- 🔴 "Route update FAILED"
- 🔴 "Error updating venue group"
- 🔴 "Failed to update route"

### Key Data Points:
1. **venueGroupsBefore vs venueGroupsAfter** - Should decrease by 1
2. **remainingVenues.length** - Should show correct count
3. **venuesDataLength** - Should match remaining venues
4. **updatePayload** - Should have correct filteredGroups and venuesData

---

## Debugging Checklist

If removal doesn't work, check console for:

1. ✅ **State updates**: "Updating local state - removing group and venues"
2. ✅ **Filter logic**: "Filtering out group: [name]"
3. ✅ **Remaining count**: "Total items remaining: X" (should be 0 for edge case)
4. ✅ **Route payload**: Check if `venueGroupsInfo` is empty array `[]`
5. ✅ **Venues payload**: Check if `venues` is empty array `[]`
6. ✅ **API response**: "Route update response: { ok: true }"
7. ✅ **Final state**: "GROUP DRAG REMOVAL COMPLETE"

---

## Common Issues to Watch For

### Issue 1: Group Still Showing After Drag
**Symptom:** UI shows group still assigned after drag
**Check:** Look for "Route update response" - is `ok: true`?
**Check:** Look for "GROUP DRAG REMOVAL COMPLETE" log
**Check:** Browser might need refresh

### Issue 2: API Error
**Symptom:** 🔴 "Failed to update route"
**Check:** Network tab in browser DevTools
**Check:** API response status (should be 200)
**Check:** Look at API request payload - is it correct?

### Issue 3: Local State Not Updating
**Symptom:** UI doesn't reflect the change
**Check:** Look for "Updating local state" log
**Check:** Check if `setDrivers` is being called
**Check:** React DevTools - inspect drivers state

---

## Quick Test Command
Open console and run this in the page:
```javascript
console.log('Current drivers:', JSON.stringify(drivers, null, 2));
```
This will show you the current state of all drivers and their assigned venues.


