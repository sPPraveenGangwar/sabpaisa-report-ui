# Screenshot Guide for SabPaisa Presentation

## Overview
This guide will help you capture all necessary screenshots for the enhanced presentation.

## Prerequisites
1. Start the React application: `npm start`
2. The app should open at `http://localhost:3000`
3. Have credentials ready for both Admin and Merchant login
4. Use a screenshot tool (Windows: Snipping Tool, Mac: Cmd+Shift+4, Linux: Screenshot utility)

## Screenshot Checklist

### 1. LOGIN PAGE
**Filename**: `01_login_page.png`
**URL**: `http://localhost:3000/login`
**What to capture**:
- Full login page
- Both login tabs visible (Username / Login Master ID)
- SabPaisa logo at top
- Password field with visibility toggle
- Remember me checkbox
- Demo buttons at bottom
- Modern gradient background

**Tips**:
- Make sure the page is fully loaded
- Capture at 1920x1080 resolution if possible
- Show the "Welcome Back" heading clearly

---

### 2. MERCHANT DASHBOARD
**Filename**: `02_merchant_dashboard.png`
**URL**: `http://localhost:3000/merchant/dashboard`
**Login as**: Merchant user
**What to capture**:
- All 4 KPI cards (Today's Revenue, Total Transactions, Success Rate, Pending Settlements)
- Weekly Sales Trend area chart
- Payment Methods donut chart with legend
- Recent Transactions section (at least 5 transactions visible)
- Quick Actions section
- Settlement Status progress bar

**Tips**:
- Scroll to show as much as possible in one screenshot
- Make sure charts are rendered with data
- If no data, use demo/test data
- Capture when dashboard shows meaningful numbers

---

### 3. ADMIN DASHBOARD
**Filename**: `03_admin_dashboard.png`
**URL**: `http://localhost:3000/admin/dashboard`
**Login as**: Admin user
**What to capture**:
- Same as merchant dashboard
- But showing admin-specific features
- Note the "Admin Portal" text in header

**Tips**:
- Show the QwikForms menu item in sidebar
- Show different metrics if admin has access to aggregated data

---

### 4. SIDEBAR NAVIGATION (Expanded)
**Filename**: `04_sidebar_expanded.png`
**URL**: Any dashboard page
**What to capture**:
- Full sidebar in expanded state (280px width)
- SabPaisa logo and branding
- User profile section with role badge
- All menu items visible
- Transactions menu expanded showing sub-items
- Settlements menu with badges (Refunds: 5, Chargebacks: 2)
- Highlight current active menu item

**Tips**:
- Expand the Transactions menu
- Show the user profile section at top
- Make sure role badge is visible (ADMIN or MERCHANT)

---

### 5. SIDEBAR NAVIGATION (Collapsed)
**Filename**: `05_sidebar_collapsed.png`
**URL**: Any dashboard page
**What to capture**:
- Collapsed sidebar (80px width)
- Only icons visible
- Show tooltip when hovering over an icon (if possible)

**Tips**:
- Click the collapse button to shrink sidebar
- Icons should be centered and clearly visible

---

### 6. TRANSACTION LIST - FULL VIEW
**Filename**: `06_transaction_list.png`
**URL**: `http://localhost:3000/transactions/all`
**What to capture**:
- Summary cards at top (Total Amount, Successful, Failed, Pending)
- Filter panel expanded
- Data grid with at least 10 rows visible
- Multiple columns showing:
  - Transaction ID
  - Client info
  - Dates
  - Status chips (different colors)
  - Payment mode chips with icons
  - Amounts
  - Payee details
- Pagination controls at bottom

**Tips**:
- Apply some filters to show functionality
- Make sure different status colors are visible (green, red, orange)
- Show different payment modes (UPI, Card, Net Banking)
- Scroll to show more columns if needed

---

### 7. TRANSACTION LIST - FILTERS EXPANDED
**Filename**: `07_transaction_filters.png`
**URL**: `http://localhost:3000/transactions/all`
**What to capture**:
- Close-up of the filter panel
- Date range pickers
- Payment mode multi-select with chips
- Status multi-select
- Amount range inputs
- Search field
- Clear Filters button

**Tips**:
- Apply multiple filters to show chips
- Show the dropdown open for payment modes or status
- Highlight that multiple values can be selected

---

### 8. SETTLEMENT LIST - FULL VIEW
**Filename**: `08_settlement_list.png`
**URL**: `http://localhost:3000/settlements/settled`
**What to capture**:
- All 5 summary cards (Total Settled, Pending, Total Amount, Avg TAT, Today's Settlements)
- Quick filter buttons (Today, Last 7 Days, Last 30 Days, Last 90 Days)
- Filter section with date range and settlement status
- Tabs (All Settlements, Pending, Completed, Failed)
- Data grid with settlement-specific columns:
  - Settlement Date (highlighted chips)
  - Settlement Amount (bold primary color)
  - Convenience Charges
  - EP Charges
  - GST
  - Settlement Status with icons
  - UTR Number
- View mode toggle (List/Grid)

**Tips**:
- Show data with mixed settlement statuses
- Make sure UTR numbers are visible
- Show the settlement date chips in green
- Capture when "Today" or recent date is selected

---

### 9. ANALYTICS DASHBOARD - OVERVIEW
**Filename**: `09_analytics_overview.png`
**URL**: `http://localhost:3000/analytics/overview`
**What to capture**:
- Multiple chart types:
  - Transaction trends line chart
  - Volume analysis bar chart
  - Success vs Failed stacked bar chart
  - Revenue tracking area chart
- Date range selector
- Filters applied
- Export options

**Tips**:
- Show charts with actual data (use demo data if needed)
- Make sure all charts are fully rendered
- Show colorful, visually appealing charts
- Capture when date range shows meaningful data

---

### 10. ANALYTICS - PAYMENT MODE ANALYTICS
**Filename**: `10_analytics_payment_modes.png`
**URL**: `http://localhost:3000/analytics/payment-modes`
**What to capture**:
- Payment mode distribution chart (pie/donut)
- Performance comparison bar chart
- Trend analysis line chart
- Success rates by mode chart
- Legend showing different payment modes

**Tips**:
- Show diverse payment mode data (UPI, Card, Net Banking, Wallet)
- Make sure colors are distinct and vibrant
- Show percentage or amount labels on charts

---

### 11. REPORT GENERATION
**Filename**: `11_report_generation.png`
**URL**: `http://localhost:3000/reports/generate`
**What to capture**:
- Report type cards:
  - Transaction Report
  - Settlement Report
  - Reconciliation Report
  - Analytics Report
- Parameter selection form:
  - Date range
  - Client code filter (if admin)
  - Payment mode filter
  - Status filter
  - Format selection (CSV, Excel, PDF, Text)
- Generate Report button
- Recent Reports History section below

**Tips**:
- Show one report card selected/highlighted
- Display the form with parameters filled in
- Show recent reports list with download links
- Capture the format selection dropdown

---

### 12. REPORT HISTORY
**Filename**: `12_report_history.png`
**URL**: `http://localhost:3000/reports/history`
**What to capture**:
- List of previously generated reports
- Columns: Report Name, Type, Generated Date, Parameters, Status, Download
- Different report statuses (Generated, Processing, Failed)
- Download buttons/links

**Tips**:
- Show variety of report types
- Include reports with different statuses
- Show timestamp/date clearly

---

### 13. QWIKFORMS - TRANSACTIONS (Admin Only)
**Filename**: `13_qwikforms_transactions.png`
**URL**: `http://localhost:3000/qwikforms/transactions`
**Login as**: Admin user
**What to capture**:
- QwikForms menu item highlighted in sidebar
- QwikForms transaction list
- Form-specific columns
- Similar layout to regular transactions but with form data

**Tips**:
- Make sure QwikForms menu is visible in sidebar
- Show that it's a separate section
- Highlight form submission data

---

### 14. QWIKFORMS - NAVIGATION
**Filename**: `14_qwikforms_menu.png`
**URL**: Any page (Admin logged in)
**What to capture**:
- Sidebar with QwikForms menu expanded
- Sub-menu items:
  - Transactions
  - Settlements
  - Analytics
  - Reports
- Show role badge as ADMIN

**Tips**:
- Expand the QwikForms menu
- Show all 4 sub-items
- Highlight that it's admin-only

---

### 15. MOBILE VIEW - DASHBOARD
**Filename**: `15_mobile_dashboard.png`
**URL**: `http://localhost:3000/merchant/dashboard`
**What to capture**:
- Resize browser to mobile width (375px or iPhone size)
- Hamburger menu visible
- KPI cards stacked vertically
- Charts responsive and visible
- Navigation drawer overlay (if possible)

**Tips**:
- Use browser dev tools to resize to mobile
- Show hamburger menu in header
- Capture when drawer is open (if possible, take two screenshots)
- Show touch-friendly button sizes

---

### 16. MOBILE VIEW - TRANSACTION LIST
**Filename**: `16_mobile_transactions.png`
**URL**: `http://localhost:3000/transactions/all`
**What to capture**:
- Mobile view of transaction list
- Horizontal scroll on data grid
- Stacked filter inputs
- Responsive summary cards

**Tips**:
- Show how data grid adapts to mobile
- Show filter panel in mobile view
- Demonstrate responsive design

---

### 17. DARK MODE - DASHBOARD
**Filename**: `17_dark_mode_dashboard.png`
**URL**: `http://localhost:3000/merchant/dashboard`
**What to capture**:
- Dashboard in dark theme
- Theme toggle button in header (moon/sun icon)
- Dark background with light text
- Charts with dark-friendly colors
- Card components with dark styling

**Tips**:
- Click the theme toggle in header
- Make sure all elements are visible in dark mode
- Show contrast between elements
- Capture when theme is fully applied

---

### 18. DARK MODE - TRANSACTION LIST
**Filename**: `18_dark_mode_transactions.png`
**URL**: `http://localhost:3000/transactions/all`
**What to capture**:
- Transaction list in dark theme
- Data grid with dark styling
- Filter panel in dark mode
- Status chips and payment mode indicators

**Tips**:
- Show that dark mode applies to all components
- Ensure readability in dark theme

---

### 19. USER PROFILE MENU
**Filename**: `19_user_profile_menu.png`
**URL**: Any page
**What to capture**:
- Click on user avatar in top-right
- Profile menu dropdown showing:
  - Profile option
  - Settings option
  - Logout option
- User name and role visible

**Tips**:
- Take screenshot with menu open
- Show all menu items clearly
- Highlight user info at top

---

### 20. NOTIFICATIONS PANEL (If available)
**Filename**: `20_notifications.png`
**URL**: Any page
**What to capture**:
- Click on notification bell icon
- Notification dropdown/panel
- List of notifications with badges
- Different notification types

**Tips**:
- If notifications are available, capture the panel
- Show badge count on bell icon

---

### 21. LOADING STATES
**Filename**: `21_loading_states.png`
**What to capture**:
- Data grid with loading skeleton
- Progress bars
- Spinner indicators
- Linear progress at top of page

**Tips**:
- Capture during page load or data fetch
- Show skeleton loaders if implemented
- Can be a composite of different loading states

---

### 22. ERROR STATES
**Filename**: `22_error_states.png`
**What to capture**:
- Error toast notification
- Error message in form
- API error display
- Retry button

**Tips**:
- Trigger an error (disconnect internet, wrong API call)
- Capture error message clearly
- Show retry or dismiss options

---

### 23. EXPORT DIALOG (If available)
**Filename**: `23_export_dialog.png`
**URL**: Transaction or Settlement list
**What to capture**:
- Click Export button
- Export dialog/modal showing:
  - Format selection (Excel, CSV, PDF)
  - Column selection (if available)
  - Export progress
  - Download link

**Tips**:
- Capture the export options clearly
- Show format selection buttons/dropdown

---

### 24. SETTINGS PAGE (If available)
**Filename**: `24_settings.png`
**URL**: `http://localhost:3000/settings`
**What to capture**:
- Settings page layout
- Configuration options
- User preferences
- Theme settings

**Tips**:
- Show available settings clearly
- Capture all sections

---

### 25. PROFILE PAGE (If available)
**Filename**: `25_profile.png`
**URL**: `http://localhost:3000/profile`
**What to capture**:
- User profile information
- Edit profile form
- Account details
- Profile picture/avatar

**Tips**:
- Show user information fields
- Capture edit functionality if available

---

## Screenshot Organization

After capturing all screenshots:

1. **Rename files** according to the filename convention above
2. **Create a folder** named `presentation_screenshots`
3. **Review each screenshot** for clarity and content
4. **Crop if necessary** to remove unnecessary UI elements
5. **Ensure consistent resolution** (preferably 1920x1080 or 1280x720)

## Inserting Screenshots into PowerPoint

1. Open `SabPaisa_Enhanced_Presentation.pptx`
2. Find slides with gray placeholder rectangles
3. For each placeholder slide:
   - Right-click on the gray rectangle
   - Delete the placeholder shape
   - Insert → Picture → Select corresponding screenshot
   - Resize and position to fit the slide nicely
   - Maintain aspect ratio
4. Review all slides to ensure screenshots are clear and aligned

## Optional: Create GIFs for Demo

For even better presentation impact, consider creating short GIF animations:

1. **Filter Application** - Show clicking filters and data updating
2. **Theme Toggle** - Show switching from light to dark mode
3. **Navigation** - Show clicking through menu items
4. **Export Process** - Show clicking export and download

Tools:
- Windows: ScreenToGif
- Mac: Gifox, Kap
- Linux: Peek

## Presentation Tips

1. **High Resolution**: Capture at least 1920x1080 for crisp display
2. **No Personal Data**: Use demo/test data, no real user information
3. **Consistent State**: Keep similar time/date across screenshots
4. **Full Page**: Capture entire viewport, not just portions
5. **Clean UI**: Close unnecessary browser tabs/bookmarks bar
6. **Multiple Browsers**: Test on Chrome, Firefox, Safari if needed

## Final Checklist

- [ ] All 25 screenshots captured
- [ ] Screenshots renamed according to convention
- [ ] Screenshots reviewed for quality
- [ ] Personal/sensitive data removed
- [ ] Screenshots inserted into PowerPoint
- [ ] Slides reviewed for alignment and clarity
- [ ] Presentation tested in slideshow mode
- [ ] Backup copy created

## Troubleshooting

**If app won't start:**
```bash
npm install
npm start
```

**If no data displays:**
- Check API connection
- Use demo/mock data
- Check browser console for errors

**If screenshots are blurry:**
- Use native screenshot tools
- Capture at higher resolution
- Don't zoom browser too much

**If colors look off:**
- Check monitor color calibration
- Use sRGB color space
- Review in PowerPoint before finalizing

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify API is running
3. Clear browser cache and reload
4. Try different browser
5. Check network connectivity

Good luck with your presentation! 🎉
