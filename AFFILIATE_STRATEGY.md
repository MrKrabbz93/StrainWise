# Cannabis Affiliate Strategy for StrainWise

Transform StrainWise from a reference tool into a revenue-generating platform by integrating targeted affiliate partnerships.

## 🏆 Top Recommendation: "The Grower's Path"
Since your app features a "Strain Archives" with deep genetic info, the most natural high-conversion upsell is **Seeds**. Users researching a strain often dream of growing it.

### 1. Seed Banks (High Commission: 15-25%)
*   **ILGM (I Love Growing Marijuana)**: Huge catalog, very reliable affiliate program.
*   **Seedsman**: Global shipping, vast genetics library.
*   **Homegrown Cannabis Co**: Great educational content connection.
*   **Integration Point**: Add a **"Grow This Strain"** button on every `StrainCard` in the Archives.
    *   *Logic:* User views "Blue Dream" -> Click "Buy Seeds" -> Redirects to ILGM "Blue Dream" page via affiliate link.

### 2. Hardware & Tech (Mid Commission: 10-15%)
*   **PAX / Storz & Bickel (via Vapor.com)**: Premium devices match your app's "Connoisseur" persona.
*   **G-Pen**: Good for mainstream appeal.
*   **Integration Point**:
    *   **Consultant Recommendation**: When users ask for "discreet usage" or "healthy consumption", the AI suggests a vaporizer with a direct purchase link.
    *   **"Lab" Context**: "Best enjoyed with a dry herb vaporizer to taste the terpenes."

### 3. CBD & Wellness (Recurring Revenue: 20-30%)
*   **CBDPure / CBDfx**: High converting for the "medical/anxiety" user base.
*   **Integration Point**:
    *   **Consultant Recommendation**: If a user says "I want relief but no high", the Consultant explicitly recommends strict CBD products.

### 4. Localized Growth (Niche Markets)
*   **Thailand (Medical Tourism)**:
    *   **Partners**: Weed Street, Dr Green, OG Canna (Pot Passport).
    *   **Strategy**: Use high-value discount codes (30-50% off) to drive users to local dispensaries.
    *   **Monetization**: Charge dispensaries for appearing in the "Verified" map category once traffic is proven.
*   **Australia (Clinic Referral)**:
    *   **Partners**: Alternaleaf ($20 Patient Credit), Polln (Clinician Referral).
    *   **Strategy**: "Get your script cheaper" - direct users to clinics that offer first-time consult discounts.

### 5. B2B Whales (SaaS)
*   **Partners**: Blaze POS (40% Recurring), Dutchie ($500/Lead).
*   **Strategy**: Pitch these to the 600+ dispensaries in your database during the B2B Outreach Campaign.
*   **Integration Point**: "StrainWise is proud to partner with [Blaze/Dutchie] to modernize your dispensary operations."

### 6. Embedded Commerce (Advanced)
*   **Katalys**: A platform specifically for cannabis/hemp affiliate management that offers embedded commerce tools.
    *   *Benefit:* Allows a more "native" shopping experience inside the app compared to raw links.

## 🚀 Implementation Roadmap

### Phase 1: Soft Integration (The "Verified Partner" Badge)
*   [ ] Register for **ILGM** and **Impact Radius** (for hardware brands).
*   [ ] Add a `affiliate_link` column to the `strains` database table.
*   [ ] Update `StrainCard.jsx`: If `affiliate_link` exists, show a "🧬 Buy Genetics" button.

### Phase 2: AI Consultant Training
*   [ ] Update the System Prompt in `gemini.js`.
*   [ ] Instruction: "If the user asks about growing or buying seeds, strictly recommend our partner [Partner Name] and provide this link: [Link]."

### Phase 3: "Deals" Section
*   [ ] Create a new main navigation item: **Deals**.
*   [ ] List rotating weeky discounts from partners (e.g., "420 Sale: 20% off all Seeds").

## ⚠️ Compliance Note
*   Always disclose affiliate links (e.g., "StrainWise earns a commission...").
*   Ensure partners ship to your target user's region (ILGM is great for USA).
*   App Store Review: Apple/Google are strict about *selling* cannabis. Affiliate links for *seeds* (often sold as souvenirs) or *hardware* are generally safer, but "Buy Weed" links will get the app banned. Stick to Genetics (Seeds), CBD, and Accessories.
