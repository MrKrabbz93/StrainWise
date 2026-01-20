# Follow-Up Strategy: The "Nudge" Flow 📨

**Goal:** Convert non-responders without being annoying.
**Cadence:** Day 0 (Initial) -> Day 3 (Nudge) -> Day 7 (Breakup)

---

## Step 1: The "Value Add" Nudge (Day 3)
*Send this 3 days after the initial outreach if no response.*

**Subject:** Quick stats for {Business Name} 📊

**Body:**
Hi {Name},

I didn't hear back, but I checked our analytics for **{City}**.

In the last 30 days, we've seen significant search volume for specific medical cultivars in your area. Patients are looking, but your listing on StrainWise remains "Unverified," so we can't confidently direct them to you.

**Verify your profile (takes 2 mins):**
[Link to {Business Name} Profile]

It's free traffic for your shop. Worth a click?

Best,
The StrainWise Team

---

## Step 2: The "Soft Close" Breakup (Day 7)
*Send this 7 days after the Nudge. Remove pressure.*

**Subject:** One last thing re: {Business Name}

**Body:**
Hi {Name},

I assume you're busy running the shop, so I won't flood your inbox.

I'll leave your listing as "Unverified" for now. Our AI will continue to update it based on public data periodically. If you ever want to take control of your menu and branding, the link is always open:

[Link to {Business Name} Profile]

Best of luck with the business!

Cheers,
The StrainWise Team

---

## ⚡ Response Handling Cheat Sheet

**If they say "YES" / "Interested":**
*   **Action:** Reply immediately with the direct link to the `ClaimBusinessModal` on their specific page.
*   **Script:** "Awesome! Here is the direct link to claim {Business Name}: [Link]. Once you submit, I'll approve it instantly."

**If they ask "How much?":**
*   **Action:** Use the FAQ message.
*   **Script:** "It's 100% free for the standard verified listing. We just want accurate data for patients."

**If they say "Remove me":**
*   **Action:** Delete row from database immediately.
*   **Script:** "Done. I've removed {Business Name} from our directory. Sorry for the disturbance."
