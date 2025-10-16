# SabPaisa Reports - Frontend UI

React TypeScript frontend application for SabPaisa Payment Gateway Reports System.

## Features

- Real-time dashboard with live metrics
- Transaction management and search
- Settlement processing
- Refund and chargeback management
- Advanced analytics with interactive charts
- Report generation (Excel, CSV, PDF)
- Dark mode support
- Role-based access control (Admin/Merchant)

## Tech Stack

- React 18
- TypeScript
- Material-UI (MUI)
- Recharts for analytics
- Axios for API calls
- React Router for navigation

## Prerequisites

- Node.js 16+
- npm 8+

## Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your API URL
REACT_APP_API_URL=http://localhost:8000/api/v1
```

## Development

```bash
# Start development server
npm start

# Application will run on http://localhost:3000
```

## Build for Production

```bash
# Create optimized production build
npm run build

# Build output will be in /build directory
```

## Environment Variables

Create a `.env` file with:

```env
REACT_APP_API_URL=http://your-api-server:8000/api/v1
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
│   ├── admin/         # Admin-specific pages
│   ├── merchant/      # Merchant-specific pages
│   ├── transactions/  # Transaction management
│   ├── settlements/   # Settlement, Refund, Chargeback
│   ├── analytics/     # Analytics dashboards
│   └── reports/       # Report generation
├── services/          # API services
├── contexts/          # React contexts
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
└── types/             # TypeScript definitions
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (one-way operation)

## Features by Role

### Admin
- View all merchant transactions
- Generate system-wide reports
- Access all analytics
- Manage settlements for all merchants
- Process refunds and chargebacks

### Merchant
- View own transactions only
- Generate merchant-specific reports
- Access own analytics
- View own settlements
- Initiate refund requests

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - SabPaisa Payment Gateway

## Related Repositories

- Backend API: https://github.com/sPPraveenGangwar/sabpaisa-report-api
