# CodeBlocker Dashboard

A modern, responsive React dashboard built with **Shadcn UI**, **Tailwind CSS**, and **TypeScript**. Features analytics dashboard, user profile management, and billing/subscription pages.

## ✨ Features

### 📊 Analytics Dashboard

- **Interactive Charts**: Revenue overview, user engagement metrics using Recharts
- **Key Performance Indicators**: Revenue, active users, conversion rates, growth metrics
- **Multi-tab Analytics**: Performance tracking, audience demographics, activity reports
- **Real-time Data Visualization**: Bar charts, line charts, pie charts

### 👤 Profile Management

- **Comprehensive User Profile**: Personal information, professional details, bio
- **Editable Interface**: Toggle edit mode for seamless profile updates
- **Security Settings**: Password management, 2FA, connected devices
- **Notification Preferences**: Email, push, SMS notification controls
- **Account Preferences**: Language, timezone, theme settings

### 💳 Billing & Subscriptions

- **Subscription Management**: Current plan overview, usage tracking, plan upgrades
- **Multiple Pricing Tiers**: Starter ($9), Professional ($29), Enterprise ($99)
- **Payment Methods**: Credit card management, default payment settings
- **Invoice History**: Downloadable invoices, payment tracking, export functionality
- **Usage Analytics**: Storage, projects, and feature usage monitoring

## 🛠 Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS with Shadcn UI components
- **Routing**: React Router DOM
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **UI Components**: Radix UI primitives

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Modern web browser

### Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

3. **Build for Production**

   ```bash
   npm run build
   ```

4. **Preview Production Build**
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   └── Layout.tsx          # Main application layout
├── pages/
│   ├── Dashboard.tsx       # Analytics dashboard
│   ├── Profile.tsx         # User profile management
│   └── Billing.tsx         # Billing and subscriptions
├── lib/
│   └── utils.ts           # Utility functions
├── App.tsx                # Main app component
├── main.tsx              # Application entry point
└── index.css             # Global styles
```

## 🎨 Customization

### Adding New Components

1. Create component files in `src/components/ui/`
2. Follow Shadcn UI patterns for consistency
3. Import and use in your pages

### Styling

- Modify `src/index.css` for global styles
- Update `tailwind.config.js` for theme customization
- Use CSS variables for consistent theming

### Data Integration

- Replace mock data in pages with API calls
- Add state management (Redux/Zustand) for complex apps
- Implement authentication and user sessions

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 Responsive Design

The dashboard is fully responsive and works on:

- **Desktop**: Full sidebar navigation, expanded charts
- **Tablet**: Collapsible navigation, optimized layouts
- **Mobile**: Mobile-first design, touch-friendly interfaces

## 🌟 Key Features

### Dashboard Page

- Revenue and user analytics
- Interactive charts and graphs
- Performance metrics
- Audience insights

### Profile Page

- Editable user information
- Security management
- Notification settings
- Account preferences

### Billing Page

- Subscription plans comparison
- Payment method management
- Invoice history
- Usage tracking

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For questions and support, please [open an issue](https://github.com/username/codeblocker-dashboard/issues) on GitHub.

---

Built with ❤️ using Shadcn UI and React
