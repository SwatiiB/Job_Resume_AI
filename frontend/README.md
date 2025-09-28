# Resume Refresh Platform - Frontend

A modern, responsive React.js frontend for the AI-Powered Resume Refresh & Job Portal Platform with beautiful UI, smooth animations, and comprehensive candidate dashboard.

## 🚀 Features

### Core Dashboard Features

1. **Candidate Dashboard** - Complete candidate experience
   - Profile overview with completion tracking
   - Resume upload and AI analysis
   - AI-powered job recommendations
   - Notifications panel with real-time updates
   - Career analytics and insights

2. **Modern UI/UX** - Professional and intuitive design
   - Orange/yellow theme with gradients
   - Responsive grid layouts
   - Smooth animations with Framer Motion
   - Mobile-first responsive design
   - Accessibility-focused components

3. **AI Integration** - Seamless AI-powered features
   - Real-time job matching with scores
   - Resume ATS compatibility analysis
   - Interactive improvement suggestions
   - Skills gap analysis
   - Career growth insights

## 🛠️ Tech Stack

### Core Technologies
- **React 18** - Latest React with concurrent features
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Production-ready motion library

### UI & Visualization
- **Lucide React** - Beautiful, customizable icons
- **Recharts** - Responsive charts and data visualization
- **React Hook Form** - Performant forms with easy validation
- **React Dropzone** - Drag and drop file uploads

### State Management & API
- **React Query** - Powerful data synchronization
- **Axios** - HTTP client with interceptors
- **js-cookie** - Cookie management
- **React Hot Toast** - Beautiful notifications

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── candidate/
│   │       ├── CandidateDashboard.jsx    # Main dashboard layout
│   │       ├── DashboardHeader.jsx       # Top navigation bar
│   │       ├── ProfileOverview.jsx       # Profile completion & stats
│   │       ├── ResumeUpload.jsx         # Resume management & analysis
│   │       ├── JobRecommendations.jsx   # AI job matching
│   │       ├── NotificationsPanel.jsx   # Notifications & preferences
│   │       └── Analytics.jsx            # Career analytics & charts
│   ├── contexts/
│   │   └── AuthContext.jsx              # Authentication state management
│   ├── services/
│   │   └── api.js                       # API service layer
│   ├── utils/
│   │   ├── cn.js                        # Class name utility
│   │   └── formatters.js                # Data formatting utilities
│   ├── App.jsx                          # Main app component
│   ├── main.jsx                         # App entry point
│   └── index.css                        # Global styles & Tailwind
├── package.json                         # Dependencies & scripts
├── vite.config.js                       # Vite configuration
├── tailwind.config.js                   # Tailwind customization
└── postcss.config.js                    # PostCSS configuration
```

## 🎨 Design System

### Color Palette

```javascript
// Primary (Orange)
primary: {
  50: '#fff7ed',   // Light background
  500: '#f97316',  // Main orange
  600: '#ea580c',  // Hover state
  900: '#7c2d12',  // Dark text
}

// Secondary (Yellow)
secondary: {
  50: '#fefce8',   // Light background
  400: '#facc15',  // Main yellow
  500: '#eab308',  // Hover state
  900: '#713f12',  // Dark text
}

// Accent (Blue)
accent: {
  50: '#f0f9ff',   // Light background
  500: '#0ea5e9',  // Main blue
  600: '#0284c7',  // Hover state
}
```

### Component Classes

```css
/* Cards */
.dashboard-card          /* Base card styling */
.card-hover             /* Hover effects */

/* Buttons */
.btn                    /* Base button */
.btn-primary            /* Orange gradient */
.btn-secondary          /* Gray */
.btn-success            /* Green */
.btn-outline            /* Outlined variant */

/* Progress */
.progress               /* Progress container */
.progress-bar           /* Animated progress fill */

/* Badges */
.badge                  /* Base badge */
.badge-primary          /* Orange badge */
.match-score-excellent  /* Green for 80%+ */
.match-score-good       /* Orange for 60-79% */
.match-score-fair       /* Yellow for 40-59% */
.match-score-poor       /* Red for <40% */
```

### Typography Scale

```css
.text-responsive-sm     /* Responsive small text */
.text-responsive-base   /* Responsive body text */
.text-responsive-lg     /* Responsive large text */
.text-responsive-xl     /* Responsive extra large */
.text-responsive-2xl    /* Responsive heading */
```

## 🏗️ Component Architecture

### Dashboard Layout

```
CandidateDashboard
├── Sidebar Navigation
│   ├── User Profile Summary
│   ├── Navigation Menu
│   └── Settings Link
├── DashboardHeader
│   ├── Mobile Menu Button
│   ├── Search Bar
│   ├── Notifications Dropdown
│   └── User Menu Dropdown
└── Main Content Area
    ├── Section Header
    └── Active Component
        ├── ProfileOverview
        ├── ResumeUpload
        ├── JobRecommendations
        ├── NotificationsPanel
        └── Analytics
```

### State Management

```javascript
// Authentication Context
const { user, isAuthenticated, login, logout } = useAuth();

// React Query for API state
const { data, isLoading, error, refetch } = useQuery(
  'query-key',
  apiFunction,
  options
);

// Local component state
const [activeSection, setActiveSection] = useState('overview');
```

## 📱 Responsive Design

### Breakpoints

- **Mobile**: `< 640px` - Single column layout
- **Tablet**: `640px - 1024px` - Two column layout
- **Desktop**: `1024px+` - Full multi-column layout

### Mobile Optimizations

- **Collapsible sidebar** with overlay
- **Touch-friendly buttons** (44px minimum)
- **Optimized spacing** for small screens
- **Readable typography** at all sizes
- **Swipe gestures** for navigation

### Responsive Components

```jsx
// Grid that adapts to screen size
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

// Responsive text sizing
<h1 className="text-responsive-2xl">

// Mobile-hidden elements
<div className="hidden md:block">

// Mobile-only elements
<div className="md:hidden">
```

## 🎭 Animations & Interactions

### Framer Motion Patterns

```jsx
// Page transitions
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Staggered children
const containerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Hover effects
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
```

### Animation Types

- **Page Transitions** - Smooth section changes
- **Card Animations** - Staggered reveal on load
- **Hover Effects** - Scale and color transitions
- **Progress Bars** - Animated progress fills
- **Loading States** - Skeleton and spinner animations

## 🔌 API Integration

### Service Layer

```javascript
// Centralized API calls
import { usersAPI, jobsAPI, resumesAPI, aiAPI } from '../services/api';

// React Query integration
const { data: profile } = useQuery('profile', usersAPI.getProfile);

// Mutations for updates
const updateMutation = useMutation(usersAPI.updateProfile);
```

### Error Handling

```javascript
// Global error interceptor
api.interceptors.response.use(
  response => response,
  error => {
    // Handle different error types
    if (error.response?.status === 401) {
      // Handle authentication
    }
    return Promise.reject(error);
  }
);

// Component-level error handling
const { data, error, isError } = useQuery(
  'data-key',
  apiFunction,
  {
    onError: (error) => {
      toast.error(handleAPIError(error));
    }
  }
);
```

### Loading States

```jsx
// Query loading states
{isLoading ? (
  <div className="loading-pulse h-20 rounded-lg" />
) : (
  <ComponentContent data={data} />
)}

// Mutation loading states
<button disabled={mutation.isLoading} className="btn btn-primary">
  {mutation.isLoading ? (
    <div className="loading-spinner w-4 h-4 mr-2" />
  ) : (
    <Icon className="w-4 h-4 mr-2" />
  )}
  {mutation.isLoading ? 'Saving...' : 'Save'}
</button>
```

## 📊 Dashboard Sections

### 1. Profile Overview
- **Profile completion** with animated progress bar
- **Quick stats** (skills count, experience, last updated)
- **Completion suggestions** with actionable items
- **Skills and experience** preview
- **Quick action buttons** for common tasks

### 2. Resume Upload & Analysis
- **Drag & drop upload** with progress tracking
- **Resume list** with version management
- **AI analysis results** with ATS scores
- **Improvement suggestions** from AI
- **Download and sharing** capabilities

### 3. Job Recommendations
- **AI-powered job matching** with percentage scores
- **Advanced filtering** (location, type, salary, match score)
- **Job cards** with company info and requirements
- **Skills matching** visualization
- **One-click apply** functionality

### 4. Notifications Panel
- **Real-time notifications** with read/unread states
- **Notification types** (job matches, reminders, updates)
- **Preference management** for notification types
- **AMP email integration** placeholder
- **Notification statistics** and engagement tracking

### 5. Analytics & Insights
- **Application funnel** charts (applications → interviews → offers)
- **Skills coverage** analysis vs market demand
- **Job match distribution** pie charts
- **Profile performance** over time
- **Career goals** tracking with progress bars

## 🎯 Key Features

### AI-Powered Features
- **Smart job matching** with detailed breakdown scores
- **Resume optimization** suggestions with priority levels
- **Skills gap analysis** compared to market demand
- **Career growth insights** with actionable recommendations

### Interactive Elements
- **Drag & drop** file uploads with progress
- **Real-time search** and filtering
- **Expandable cards** with detailed information
- **Interactive charts** with hover tooltips
- **Modal dialogs** for detailed views

### User Experience
- **Smooth animations** for all interactions
- **Loading states** for better perceived performance
- **Error boundaries** with graceful fallbacks
- **Toast notifications** for user feedback
- **Keyboard navigation** support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend API running on port 5000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Resume Refresh Platform
VITE_APP_VERSION=1.0.0
```

### Development

```bash
# Start with hot reload
npm run dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📱 Mobile Experience

### Mobile-First Design
- **Collapsible sidebar** with smooth animations
- **Touch-optimized** buttons and interactions
- **Responsive grids** that adapt to screen size
- **Mobile navigation** with floating action button

### Performance Optimizations
- **Code splitting** by route and component
- **Lazy loading** for non-critical components
- **Image optimization** with proper sizing
- **Bundle analysis** and size optimization

## 🎨 Customization

### Theme Customization

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        // Custom orange shades
      },
      secondary: {
        // Custom yellow shades
      }
    }
  }
}
```

### Component Customization

```jsx
// Override default styles
<Component className={cn("default-classes", customClasses)} />

// Custom variants
const customVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};
```

## 🧪 Testing

### Component Testing
```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Testing Utilities
```javascript
// Mock API responses
const mockProfile = {
  firstName: 'John',
  lastName: 'Doe',
  profileCompletion: 85,
  skills: ['JavaScript', 'React', 'Node.js']
};

// Test component with providers
<QueryClientProvider client={testQueryClient}>
  <AuthProvider>
    <Component />
  </AuthProvider>
</QueryClientProvider>
```

## 🚀 Production Deployment

### Build Optimization
```bash
# Production build
npm run build

# Analyze bundle
npm run analyze
```

### Environment Setup
```bash
# Production environment variables
VITE_API_URL=https://api.resumerefresh.com
VITE_APP_ENV=production
```

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

## 🔮 Future Enhancements

### Planned Features
1. **Real-time chat** with recruiters
2. **Video interview** scheduling
3. **Portfolio showcase** for candidates
4. **Advanced analytics** with ML insights
5. **Mobile app** with React Native

### Component Library
1. **Reusable UI components** extraction
2. **Storybook** documentation
3. **Design tokens** standardization
4. **Component testing** automation

## 📞 Support

### Development
- Check console for errors and warnings
- Use React DevTools for component debugging
- Monitor network requests in browser DevTools

### Common Issues
1. **API connection errors** - Check backend server status
2. **Authentication issues** - Verify token storage
3. **Build errors** - Check dependency versions
4. **Styling issues** - Verify Tailwind configuration

## 📄 License

This frontend is part of the Resume Refresh Platform and follows the same licensing terms.

---

## 🎯 Quick Start Example

```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { usersAPI } from '../services/api';

const ExampleComponent = () => {
  const { data: profile, isLoading } = useQuery('profile', usersAPI.getProfile);

  if (isLoading) {
    return <div className="loading-pulse h-20 rounded-lg" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-card"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Welcome, {profile?.firstName}!
      </h3>
      <p className="text-gray-600">
        Your profile is {profile?.profileCompletion}% complete.
      </p>
    </motion.div>
  );
};
```

The frontend provides a complete, production-ready candidate experience with beautiful UI, smooth animations, and comprehensive functionality!
